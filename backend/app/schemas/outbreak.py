"""
Pydantic Schemas for Outbreak Detection & Alerts (P21).
"""

import uuid
import datetime
from typing import List, Optional
from pydantic import BaseModel


class OutbreakAlertResponse(BaseModel):
    id: uuid.UUID
    disease_id: uuid.UUID
    disease_name: str
    crop_name: str
    state: str
    district: str
    centroid_lat: float
    centroid_lon: float
    report_count: int
    alert_level: str
    status: str
    window_start: datetime.datetime
    window_end: datetime.datetime
    is_simulated: bool
    created_at: datetime.datetime


class OutbreakCheckResponse(BaseModel):
    alerts_created: int
    alerts_updated: int
    alerts_resolved: int
    execution_time_ms: float
    message: str
