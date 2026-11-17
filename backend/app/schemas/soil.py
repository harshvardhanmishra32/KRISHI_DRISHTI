"""
Pydantic Schemas for Soil Records and Crop Recommendations (P17).
"""

import uuid
import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator

from app.models.soil import SoilSource


class SoilRecordCreate(BaseModel):
    farm_id: uuid.UUID
    soil_type: str
    ph: float = Field(..., ge=3.5, le=9.5, description="Soil pH must be between 3.5 and 9.5")
    nitrogen: float = Field(..., ge=0, description="Available Nitrogen in kg/ha (must be >= 0)")
    phosphorus: float = Field(..., ge=0, description="Available Phosphorus in kg/ha (must be >= 0)")
    potassium: float = Field(..., ge=0, description="Available Potassium in kg/ha (must be >= 0)")
    organic_carbon: Optional[float] = Field(None, ge=0, description="Organic Carbon percentage")
    test_date: Optional[datetime.date] = None
    source: SoilSource = SoilSource.LAB_TEST

    @field_validator("source")
    @classmethod
    def validate_source(cls, v):
        if v == SoilSource.AI_ESTIMATE:
            raise ValueError(
                "Photo-based soil estimation ('ai_estimate') is not yet implemented. "
                "Please submit laboratory test results with source='lab_test'."
            )
        return v


class SoilRecordResponse(BaseModel):
    id: uuid.UUID
    farm_id: uuid.UUID
    soil_type: str
    ph: float
    nitrogen: float
    phosphorus: float
    potassium: float
    organic_carbon: Optional[float] = None
    test_date: datetime.date
    source: SoilSource


class CropRecommendationItem(BaseModel):
    crop_name: str
    score: float = Field(..., ge=0, le=100)
    source: str  # "rule_engine", "ml_model", "hybrid"
    reasons: List[str]
    cautions: List[str]
    typical_npk: Optional[str] = None
    fertilizer_guidance: Optional[str] = None


class CropRecommendationResponse(BaseModel):
    farm_id: uuid.UUID
    season: str
    soil_record_id: Optional[uuid.UUID] = None
    recommendations: List[CropRecommendationItem]
    note: str = "Indicative only - confirm with a soil test (Soil Health Card or nearest lab)"
