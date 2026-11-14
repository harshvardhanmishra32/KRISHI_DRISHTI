"""
Krishi Drishti - Disease History, Reference Data & Admin Epidemiology Stats (P14).
"""

import uuid
import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, Path, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.crop import Crop, Disease, Treatment
from app.models.farm import Farm
from app.models.report import DiseaseReport
from app.routers.auth import get_current_active_user
from app.core.errors import NotFoundError, ForbiddenError
from app.schemas.history import (
    DiseaseHistoryItem,
    DiseaseHistoryPagination,
    DiseaseReportDetailResponse,
    CropResponse,
    DiseaseListItem,
    DiseaseDetailResponse,
    AdminDiseaseStatsResponse,
    DiseaseStatItem,
)
from app.schemas.detection import DiseaseInfo, TreatmentInfo

router = APIRouter(tags=["Disease History & Reference"])


# -----------------------------------------------------------------------------
# 1. Disease History (Own reports only)
# -----------------------------------------------------------------------------
@router.get(
    "/disease-history",
    response_model=DiseaseHistoryPagination,
    summary="List past leaf disease scans with pagination",
    description="Returns the authenticated farmer's scans ordered newest first. Filterable by crop_id."
)
def get_disease_history(
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    offset: int = Query(0, ge=0, description="Offset index"),
    crop_id: Optional[uuid.UUID] = Query(None, description="Optional crop filter"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    query = db.query(DiseaseReport).filter(DiseaseReport.user_id == current_user.id)
    if crop_id:
        query = query.filter(DiseaseReport.crop_id == crop_id)

    total = query.count()
    reports = query.order_by(DiseaseReport.created_at.desc()).offset(offset).limit(limit).all()

    items = []
    for r in reports:
        crop_name = r.crop.name if r.crop else "Unknown"
        disease_name = r.disease.name if r.disease else "Healthy / Undetected"
        image_url = f"/uploads/{r.image_path}" if not r.image_path.startswith("/") else r.image_path
        items.append(
            DiseaseHistoryItem(
                id=r.id,
                crop_name=crop_name,
                disease_name=disease_name,
                confidence=r.confidence,
                image_url=image_url,
                created_at=r.created_at,
                farm_id=r.farm_id,
                latitude=r.latitude,
                longitude=r.longitude,
            )
        )

    return DiseaseHistoryPagination(items=items, total=total, limit=limit, offset=offset)


# -----------------------------------------------------------------------------
# 2. Disease Report Detail (Own report only)
# -----------------------------------------------------------------------------
@router.get(
    "/disease-reports/{id}",
    response_model=DiseaseReportDetailResponse,
    summary="Get detailed disease report by ID",
    description="Enforces strict ownership: farmers can only see their own reports (404 otherwise)."
)
def get_disease_report(
    id: uuid.UUID = Path(..., description="Report UUID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    report = (
        db.query(DiseaseReport)
        .filter(DiseaseReport.id == id, DiseaseReport.user_id == current_user.id)
        .first()
    )
    if not report:
        raise NotFoundError("Disease report not found.")

    crop_name = report.crop.name if report.crop else "Unknown"
    image_url = f"/uploads/{report.image_path}" if not report.image_path.startswith("/") else report.image_path

    disease_info = None
    treatments: List[TreatmentInfo] = []
    if report.disease:
        disease_info = DiseaseInfo(
            id=report.disease.id,
            name=report.disease.name,
            causal_organism=report.disease.causal_organism,
            symptoms=report.disease.symptoms,
            severity_level=report.disease.severity_level,
        )
        is_healthy = "healthy" in report.disease.name.lower() or "healthy" in report.disease.model_class_name.lower()
        if not is_healthy:
            db_treatments = db.query(Treatment).filter(Treatment.disease_id == report.disease.id).all()
            treatments = [
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

    return DiseaseReportDetailResponse(
        id=report.id,
        crop_name=crop_name,
        image_url=image_url,
        confidence=report.confidence,
        created_at=report.created_at,
        disease=disease_info,
        treatments=treatments,
        farm_id=report.farm_id,
        latitude=report.latitude,
        longitude=report.longitude,
    )


# -----------------------------------------------------------------------------
# 3. Crops Reference Endpoints
# -----------------------------------------------------------------------------
@router.get(
    "/crops",
    response_model=List[CropResponse],
    summary="List all crops supported in Krishi Drishti",
    description="Returns available crops with ideal soil, pH, and water parameters."
)
def list_crops(db: Session = Depends(get_db)):
    crops = db.query(Crop).order_by(Crop.name.asc()).all()
    return [
        CropResponse(
            id=c.id,
            name=c.name,
            scientific_name=c.scientific_name,
            category=c.category,
            season=c.season,
            ideal_soil_type=c.ideal_soil_type,
            water_requirement_mm=c.water_requirement_mm,
            ideal_ph_min=c.ideal_ph_min,
            ideal_ph_max=c.ideal_ph_max,
            typical_npk=c.typical_npk,
        )
        for c in crops
    ]


@router.get(
    "/crops/{id}",
    response_model=CropResponse,
    summary="Get crop details by ID",
)
def get_crop(
    id: uuid.UUID = Path(..., description="Crop UUID"),
    db: Session = Depends(get_db),
):
    crop = db.query(Crop).filter(Crop.id == id).first()
    if not crop:
        raise NotFoundError("Crop not found.")
    return CropResponse(
        id=crop.id,
        name=crop.name,
        scientific_name=crop.scientific_name,
        category=crop.category,
        season=crop.season,
        ideal_soil_type=crop.ideal_soil_type,
        water_requirement_mm=crop.water_requirement_mm,
        ideal_ph_min=crop.ideal_ph_min,
        ideal_ph_max=crop.ideal_ph_max,
        typical_npk=crop.typical_npk,
    )


# -----------------------------------------------------------------------------
# 4. Diseases Reference Endpoints
# -----------------------------------------------------------------------------
@router.get(
    "/diseases",
    response_model=List[DiseaseListItem],
    summary="List plant diseases with optional crop filter",
)
def list_diseases(
    crop_id: Optional[uuid.UUID] = Query(None, description="Optional crop filter"),
    db: Session = Depends(get_db),
):
    query = db.query(Disease)
    if crop_id:
        query = query.filter(Disease.crop_id == crop_id)
    diseases = query.order_by(Disease.name.asc()).all()
    return [
        DiseaseListItem(
            id=d.id,
            crop_id=d.crop_id,
            name=d.name,
            causal_organism=d.causal_organism,
            symptoms=d.symptoms,
            severity_level=d.severity_level,
            model_class_name=d.model_class_name,
        )
        for d in diseases
    ]


@router.get(
    "/diseases/{id}",
    response_model=DiseaseDetailResponse,
    summary="Get disease by ID with treatments",
)
def get_disease(
    id: uuid.UUID = Path(..., description="Disease UUID"),
    db: Session = Depends(get_db),
):
    disease = db.query(Disease).filter(Disease.id == id).first()
    if not disease:
        raise NotFoundError("Disease not found.")

    db_treatments = db.query(Treatment).filter(Treatment.disease_id == disease.id).all()
    treatments = [
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

    return DiseaseDetailResponse(
        id=disease.id,
        crop_id=disease.crop_id,
        name=disease.name,
        causal_organism=disease.causal_organism,
        symptoms=disease.symptoms,
        severity_level=disease.severity_level,
        model_class_name=disease.model_class_name,
        treatments=treatments,
    )


# -----------------------------------------------------------------------------
# 5. Admin Disease Stats (Officers and Admins Only)
# -----------------------------------------------------------------------------
@router.get(
    "/admin/disease-stats",
    response_model=AdminDiseaseStatsResponse,
    summary="Epidemiology statistics per disease (Agricultural Officers & Admins only)",
    description=(
        "Restricted to role=officer or admin. Aggregates disease occurrences without "
        "exposing farmer identities or farm locations."
    )
)
def get_admin_disease_stats(
    days: int = Query(30, ge=1, le=365, description="Lookback window in days"),
    state: Optional[str] = Query(None, description="Optional state filter"),
    district: Optional[str] = Query(None, description="Optional district filter"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in [UserRole.OFFICER, UserRole.ADMIN]:
        raise ForbiddenError("Only agricultural officers or administrators can access epidemiology statistics.")

    cutoff_date = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=days)

    query = (
        db.query(
            Disease.name.label("disease_name"),
            Crop.name.label("crop_name"),
            func.count(DiseaseReport.id).label("report_count")
        )
        .join(Crop, DiseaseReport.crop_id == Crop.id)
        .outerjoin(Disease, DiseaseReport.disease_id == Disease.id)
        .outerjoin(Farm, DiseaseReport.farm_id == Farm.id)
        .filter(DiseaseReport.created_at >= cutoff_date)
    )

    if state:
        query = query.filter(Farm.state.ilike(state.strip()))
    if district:
        query = query.filter(Farm.district.ilike(district.strip()))

    query = query.group_by(Disease.name, Crop.name).order_by(func.count(DiseaseReport.id).desc())
    results = query.all()

    stats_list = [
        DiseaseStatItem(
            disease_name=row.disease_name or "Healthy / Undetected",
            crop_name=row.crop_name,
            report_count=row.report_count,
        )
        for row in results
    ]

    total_reports = sum(item.report_count for item in stats_list)

    return AdminDiseaseStatsResponse(
        total_reports=total_reports,
        period_days=days,
        state=state,
        district=district,
        stats=stats_list,
    )
