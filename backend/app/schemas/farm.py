import uuid
import datetime
from typing import Optional
from pydantic import BaseModel, Field, model_validator, ConfigDict


def validate_india_coordinates(lat: float, lon: float):
    """
    Validates that latitude and longitude fall strictly within India's geographical boundaries.
    Mainland India spans approximately:
    Latitude: 6.0° N to 38.0° N
    Longitude: 68.0° E to 98.0° E
    """
    if lat == 0.0 and lon == 0.0:
        raise ValueError("Invalid coordinates (0.0, 0.0): Null Island is outside India.")
    if not (6.0 <= lat <= 38.0):
        raise ValueError(f"Latitude {lat}° is outside India's geographic range (6.0° N to 38.0° N).")
    if not (68.0 <= lon <= 98.0):
        raise ValueError(f"Longitude {lon}° is outside India's geographic range (68.0° E to 98.0° E).")


class FarmBase(BaseModel):
    farm_name: str = Field(..., min_length=2, max_length=100, description="Name or identifier of farm")
    latitude: float = Field(..., description="Latitude in decimal degrees (e.g. 26.8467)")
    longitude: float = Field(..., description="Longitude in decimal degrees (e.g. 80.9462)")
    area_acres: float = Field(..., gt=0, description="Farm area in acres")
    state: str = Field(..., min_length=2, max_length=100, description="Indian State")
    district: str = Field(..., min_length=2, max_length=100, description="District")

    @model_validator(mode="after")
    def check_coordinates(self):
        validate_india_coordinates(self.latitude, self.longitude)
        return self


class FarmCreate(FarmBase):
    pass


class FarmUpdate(BaseModel):
    farm_name: Optional[str] = Field(None, min_length=2, max_length=100)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    area_acres: Optional[float] = Field(None, gt=0)
    state: Optional[str] = None
    district: Optional[str] = None

    @model_validator(mode="after")
    def check_coords_if_present(self):
        if self.latitude is not None and self.longitude is not None:
            validate_india_coordinates(self.latitude, self.longitude)
        elif (self.latitude is not None and self.longitude is None) or (self.latitude is None and self.longitude is not None):
            raise ValueError("Both latitude and longitude must be provided together when updating coordinates.")
        return self


class FarmResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    farm_name: str
    latitude: float
    longitude: float
    area_acres: float
    state: str
    district: str
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class AdminFarmResponse(BaseModel):
    id: uuid.UUID
    owner_name: str
    # Note: No phone numbers exposed to officers/admins for farmer privacy
    farm_name: str
    latitude: float
    longitude: float
    area_acres: float
    state: str
    district: str
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)
