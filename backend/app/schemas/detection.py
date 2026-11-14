"""
Pydantic Schemas for Krishi Drishti Disease Detection (P13).
"""

import uuid
from typing import List, Optional
from pydantic import BaseModel, Field


class Top3Prediction(BaseModel):
    class_name: str
    confidence: float


class DiseaseInfo(BaseModel):
    id: uuid.UUID
    name: str
    causal_organism: Optional[str] = None
    symptoms: str
    severity_level: str


class TreatmentInfo(BaseModel):
    id: uuid.UUID
    fertilizer_recommendation: Optional[str] = None
    pesticide_recommendation: Optional[str] = None
    organic_option: Optional[str] = None
    dosage: Optional[str] = None
    application_method: Optional[str] = None
    safety_note: str


class DiseaseDetectionResponse(BaseModel):
    report_id: uuid.UUID
    crop: str
    image_url: str
    disease: DiseaseInfo
    confidence: float
    top3: List[Top3Prediction]
    low_confidence: bool
    crop_mismatch: bool
    note: Optional[str] = None
    treatments: List[TreatmentInfo] = Field(default_factory=list)
    plain_explanation: Optional[str] = None
    disclaimer: str = (
        "Suggestion only. Confirm diagnosis and chemical dosage with your local "
        "agriculture officer or Krishi Vigyan Kendra before application."
    )
    inference_time_ms: float


class ModelInfoResponse(BaseModel):
    model_architecture: str
    model_version: str
    input_resolution: List[int]
    num_classes: int
    classes: List[str]
    low_confidence_threshold: float
    quantization: str
    supported_crops: List[str]
