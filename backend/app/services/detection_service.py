"""
Krishi Drishti - Disease Detection Service (P13).
Orchestrates secure image upload, TFLite inference, DB lookup, and report generation.
"""

import io
import uuid
from typing import Optional, List
from PIL import Image
from sqlalchemy.orm import Session
from geoalchemy2.elements import WKTElement

from app.core.config import settings
from app.core.logging import logger
from app.core.errors import NotFoundError, BadRequestError
from app.models.user import User
from app.models.farm import Farm
from app.models.crop import Crop, Disease, Treatment
from app.models.report import DiseaseReport, DetectionMode
from app.schemas.detection import (
    DiseaseDetectionResponse,
    DiseaseInfo,
    TreatmentInfo,
    Top3Prediction,
)
from app.services.upload_service import UploadService
from app.ml.classifier import predict_disease
from app.services.explainer import get_explainer


class DetectionService:

    @staticmethod
    def detect_leaf_disease(
        db: Session,
        user: User,
        file_bytes: bytes,
        original_filename: str,
        crop_identifier: str,  # UUID or crop name (e.g., "Tomato" or "tomato")
        farm_id: Optional[uuid.UUID] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        explain: bool = False,
        lang: str = "hi",
    ) -> DiseaseDetectionResponse:
        """
        Executes end-to-end leaf disease detection:
        1. Resolves crop by UUID or name
        2. Resolves optional farm and fallback coordinates
        3. Uploads image securely through UploadService (exif stripped, resized 1280px)
        4. Runs TFLite MobileNetV2 inference
        5. Matches predicted class to database Disease and Treatments
        6. Flags low confidence (< 0.70) or crop mismatch
        7. Persists disease report in PostgreSQL
        8. Returns formatted DiseaseDetectionResponse
        """
        # 1. Resolve Crop
        crop = None
        try:
            crop_uuid = uuid.UUID(crop_identifier)
            crop = db.query(Crop).filter(Crop.id == crop_uuid).first()
        except (ValueError, AttributeError):
            crop = db.query(Crop).filter(Crop.name.ilike(crop_identifier.strip())).first()

        if not crop:
            raise NotFoundError(f"Crop '{crop_identifier}' not found in database.")

        # 2. Resolve Farm and Coordinates
        farm = None
        if farm_id:
            farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == user.id).first()
            if not farm:
                raise NotFoundError(f"Farm with id '{farm_id}' not found for current user.")
            if latitude is None and longitude is None:
                latitude = farm.latitude
                longitude = farm.longitude

        # 3. Process & Save Image using UploadService
        uploader = UploadService()
        upload_result = uploader.process_and_save_image(
            file_bytes=file_bytes,
            original_filename=original_filename or "leaf.jpg"
        )
        saved_image_path = upload_result.get("relative_path") or upload_result.get("file_path", "leaf.jpg")
        image_url = upload_result.get("url", f"/uploads/{saved_image_path}")

        # 4. Open PIL Image for Inference
        with Image.open(io.BytesIO(file_bytes)) as pil_img:
            top_class_name, top_conf, top3_raw, inference_ms = predict_disease(pil_img)

        top3 = [
            Top3Prediction(class_name=item["class_name"], confidence=item["confidence"])
            for item in top3_raw
        ]

        # 5. Determine Crop Mismatch
        # Class names format: "tomato_early_blight", "potato_healthy", etc.
        predicted_crop_prefix = top_class_name.split("_")[0].lower()
        selected_crop_name = crop.name.lower()
        crop_mismatch = predicted_crop_prefix != selected_crop_name

        # 6. Check Low Confidence
        low_confidence = top_conf < settings.LOW_CONFIDENCE_THRESHOLD

        note = None
        if low_confidence:
            note = (
                "The photo may not be a clear leaf or the confidence is low. "
                "Please take a clear close-up of a single leaf under good daylight."
            )
        elif crop_mismatch:
            note = (
                f"Selected crop is '{crop.name}', but visual model detected signs of '{predicted_crop_prefix.capitalize()}'. "
                "Please verify the selected crop."
            )

        # 7. Query Disease & Treatments from Database
        disease = db.query(Disease).filter(Disease.model_class_name == top_class_name).first()

        # If disease row not found in DB, fallback gracefully
        if not disease:
            # Check if there is a disease with matching name
            display_name = top_class_name.replace("_", " ").title()
            disease = db.query(Disease).filter(Disease.name.ilike(display_name)).first()

        if not disease:
            # Fallback placeholder to never crash
            disease_info = DiseaseInfo(
                id=uuid.uuid4(),
                name=top_class_name.replace("_", " ").title(),
                causal_organism="Identified by ML",
                symptoms="Visual symptoms detected by AI classifier.",
                severity_level="low" if "healthy" in top_class_name else "medium",
            )
            disease_id = None
            treatments_list: List[TreatmentInfo] = []
        else:
            disease_info = DiseaseInfo(
                id=disease.id,
                name=disease.name,
                causal_organism=disease.causal_organism,
                symptoms=disease.symptoms,
                severity_level=disease.severity_level,
            )
            disease_id = disease.id

            is_healthy = "healthy" in top_class_name.lower() or "healthy" in disease.name.lower()
            if is_healthy:
                treatments_list = []
            else:
                db_treatments = db.query(Treatment).filter(Treatment.disease_id == disease.id).all()
                treatments_list = [
                    TreatmentInfo(
                        id=t.id,
                        fertilizer_recommendation=t.fertilizer_recommendation,
                        pesticide_recommendation=t.pesticide_recommendation,
                        organic_option=t.organic_option,
                        dosage=t.dosage,
                        application_method=t.application_method,
                        safety_note=t.safety_note,
                    )
                    for t in db_treatments
                ]

        # 8. PostGIS Geography Point if coordinates are available
        point_geom = None
        if latitude is not None and longitude is not None:
            point_geom = WKTElement(f"POINT({longitude} {latitude})", srid=4326)

        # 9. Persist DiseaseReport
        report = DiseaseReport(
            user_id=user.id,
            farm_id=farm.id if farm else None,
            crop_id=crop.id,
            disease_id=disease_id,
            image_path=saved_image_path,
            confidence=top_conf,
            detection_mode=DetectionMode.ONLINE,
            is_simulated=False,
            latitude=latitude,
            longitude=longitude,
            location=point_geom,
        )
        db.add(report)
        db.commit()
        db.refresh(report)

        plain_explanation = None
        if explain:
            explainer = get_explainer()
            payload = {
                "crop": crop.name,
                "disease_name": disease_info.name,
                "symptoms": disease_info.symptoms,
                "confidence": top_conf,
                "treatments": [t.model_dump() for t in treatments_list],
            }
            plain_explanation, backend_used = explainer.explain(payload, lang=lang)
            logger.info(f"Generated explanation using {backend_used}")

        return DiseaseDetectionResponse(
            report_id=report.id,
            crop=crop.name,
            image_url=image_url,
            disease=disease_info,
            confidence=top_conf,
            top3=top3,
            low_confidence=low_confidence,
            crop_mismatch=crop_mismatch,
            note=note,
            treatments=treatments_list,
            plain_explanation=plain_explanation,
            disclaimer=(
                "Suggestion only. Confirm diagnosis and chemical dosage with your local "
                "agriculture officer or Krishi Vigyan Kendra before application."
            ),
            inference_time_ms=round(inference_ms, 2),
        )
