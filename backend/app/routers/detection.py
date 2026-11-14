"""
Krishi Drishti - Leaf Disease Detection & ML Router (P13).
Handles image upload for TFLite inference and model information metadata.
"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.core.errors import BadRequestError
from app.routers.auth import get_current_active_user
from app.schemas.detection import DiseaseDetectionResponse, ModelInfoResponse
from app.services.detection_service import DetectionService
from app.ml.classifier import get_model_info

router = APIRouter(tags=["Disease Detection & ML"])


@router.post(
    "/detect-disease",
    response_model=DiseaseDetectionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Detect leaf disease from photo using MobileNetV2 TFLite",
    description=(
        "Upload a leaf photograph (JPEG/PNG/WebP, max 5MB). "
        "Runs on-device quantized TFLite inference, matches symptoms & treatments, "
        "checks confidence threshold (<0.70), detects crop mismatch, and stores a disease report."
    )
)
async def detect_disease(
    file: Optional[UploadFile] = File(None, description="Leaf photograph file"),
    image: Optional[UploadFile] = File(None, description="Leaf photograph file (alias)"),
    crop: str = Form(..., description="Crop name (e.g. Tomato, Potato) or crop UUID"),
    farm_id: Optional[uuid.UUID] = Form(None, description="Optional farm ID to associate with report"),
    latitude: Optional[float] = Form(None, description="Optional latitude coordinate"),
    longitude: Optional[float] = Form(None, description="Optional longitude coordinate"),
    explain: bool = Form(False, description="Generate plain-language explanation"),
    lang: str = Form("hi", description="Language for explanation (hi or en)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    upload_file = file or image
    if not upload_file:
        raise BadRequestError("Leaf image file is required (pass in 'file' or 'image').")
    file_bytes = await upload_file.read()
    return DetectionService.detect_leaf_disease(
        db=db,
        user=current_user,
        file_bytes=file_bytes,
        original_filename=upload_file.filename or "leaf.jpg",
        crop_identifier=crop,
        farm_id=farm_id,
        latitude=latitude,
        longitude=longitude,
        explain=explain,
        lang=lang,
    )


@router.get(
    "/ml/model-info",
    response_model=ModelInfoResponse,
    summary="Get active ML model metadata and configuration",
    description="Returns model architecture, input resolution, classes count, quantization, and threshold."
)
def model_info():
    return get_model_info()
