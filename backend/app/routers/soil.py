"""
FastAPI Router for Soil Records & Crop Recommendations (P17).
Provides POST /soil-records, GET /soil-records, and GET /recommend-crops.
"""

import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.farm import Farm
from app.models.soil import SoilRecord
from app.routers.auth import get_current_active_user
from app.core.errors import NotFoundError, BadRequestError
from app.schemas.soil import (
    SoilRecordCreate,
    SoilRecordResponse,
    CropRecommendationResponse,
)
from app.services.crop_advisor import CropAdvisorService

router = APIRouter(tags=["Soil & Crop Recommendation"])


@router.post(
    "/soil-records",
    response_model=SoilRecordResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a soil test record for a farm",
    description="Records lab soil parameters (pH 3.5-9.5, N/P/K in kg/ha). AI estimate source is reserved."
)
def create_soil_record(
    soil_in: SoilRecordCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    # Verify farm ownership
    farm = db.query(Farm).filter(Farm.id == soil_in.farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise NotFoundError("Farm not found or does not belong to current user.")

    test_date = soil_in.test_date or datetime.date.today()

    record = SoilRecord(
        farm_id=soil_in.farm_id,
        soil_type=soil_in.soil_type,
        ph=soil_in.ph,
        nitrogen=soil_in.nitrogen,
        phosphorus=soil_in.phosphorus,
        potassium=soil_in.potassium,
        organic_carbon=soil_in.organic_carbon,
        test_date=test_date,
        source=soil_in.source,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return SoilRecordResponse(
        id=record.id,
        farm_id=record.farm_id,
        soil_type=record.soil_type,
        ph=record.ph,
        nitrogen=record.nitrogen,
        phosphorus=record.phosphorus,
        potassium=record.potassium,
        organic_carbon=record.organic_carbon,
        test_date=record.test_date,
        source=record.source,
    )


@router.get(
    "/soil-records",
    response_model=List[SoilRecordResponse],
    summary="List soil test records for a farm",
)
def list_soil_records(
    farm_id: uuid.UUID = Query(..., description="Farm UUID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise NotFoundError("Farm not found or does not belong to current user.")

    records = (
        db.query(SoilRecord)
        .filter(SoilRecord.farm_id == farm_id)
        .order_by(SoilRecord.test_date.desc())
        .all()
    )
    return [
        SoilRecordResponse(
            id=r.id,
            farm_id=r.farm_id,
            soil_type=r.soil_type,
            ph=r.ph,
            nitrogen=r.nitrogen,
            phosphorus=r.phosphorus,
            potassium=r.potassium,
            organic_carbon=r.organic_carbon,
            test_date=r.test_date,
            source=r.source,
        )
        for r in records
    ]


@router.get(
    "/recommend-crops",
    response_model=CropRecommendationResponse,
    summary="Get top 3 recommended crops for a farm based on soil & season",
    description="Combines agronomic rule engine with ML classifier for covered crops. Always includes cautionary guidance."
)
def recommend_crops(
    farm_id: uuid.UUID = Query(..., description="Farm UUID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise NotFoundError("Farm not found or does not belong to current user.")

    service = CropAdvisorService(db)
    return service.recommend_crops(farm_id)
