"""
Pydantic Schemas for Disease History, Reference Endpoints, and Admin Stats (P14).
"""

import uuid
import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

from app.schemas.detection import DiseaseInfo, TreatmentInfo


class DiseaseHistoryItem(BaseModel):
    id: uuid.UUID
    crop_name: str
    disease_name: Optional[str] = None
    confidence: float
    image_url: str
    created_at: datetime.datetime
    farm_id: Optional[uuid.UUID] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class DiseaseHistoryPagination(BaseModel):
    items: List[DiseaseHistoryItem]
    total: int
    limit: int
    offset: int


class DiseaseReportDetailResponse(BaseModel):
    id: uuid.UUID
    crop_name: str
    image_url: str
    confidence: float
    created_at: datetime.datetime
    disease: Optional[DiseaseInfo] = None
    treatments: List[TreatmentInfo] = Field(default_factory=list)
    farm_id: Optional[uuid.UUID] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class CropResponse(BaseModel):
    id: uuid.UUID
    name: str
    scientific_name: Optional[str] = None
    category: str
    season: str
    ideal_soil_type: str
    water_requirement_mm: Optional[float] = None
    ideal_ph_min: Optional[float] = None
    ideal_ph_max: Optional[float] = None
    typical_npk: Optional[str] = None


class DiseaseListItem(BaseModel):
    id: uuid.UUID
    crop_id: uuid.UUID
    name: str
    causal_organism: Optional[str] = None
    symptoms: str
    severity_level: str
    model_class_name: str


class DiseaseDetailResponse(DiseaseListItem):
    treatments: List[TreatmentInfo] = Field(default_factory=list)


class DiseaseStatItem(BaseModel):
    disease_name: str
    crop_name: str
    report_count: int


class AdminDiseaseStatsResponse(BaseModel):
    total_reports: int
    period_days: int
    state: Optional[str] = None
    district: Optional[str] = None
    stats: List[DiseaseStatItem]
