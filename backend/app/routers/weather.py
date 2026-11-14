"""
FastAPI Router for Krishi Drishti Weather Module.
Provides GET /get-weather and GET /weather endpoints.
"""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.weather_service import WeatherService
from app.schemas.weather import WeatherResponse
from app.models.farm import Farm
from app.models.user import User
from app.routers.auth import get_optional_user
from app.core.errors import AppException, NotFoundError, UnauthorizedError

router = APIRouter(tags=["Weather"])


@router.get(
    "/get-weather",
    response_model=WeatherResponse,
    summary="Get Current Weather, 5-Day Forecast, Disease Risk & Spray Windows"
)
@router.get(
    "/weather",
    response_model=WeatherResponse,
    include_in_schema=False
)
async def get_weather(
    lat: Optional[float] = Query(None, description="Latitude (e.g. 28.6139)", ge=-90.0, le=90.0),
    lon: Optional[float] = Query(None, description="Longitude (e.g. 77.2090)", ge=-180.0, le=180.0),
    farm_id: Optional[UUID] = Query(None, description="Optional Farm UUID to fetch coordinates from"),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Fetches real-time weather, 5-day forecast, fungal disease risk alert, and safe spray windows.
    Data is cached in Redis for 30 minutes with fallback to persistent database cache if external API is unreachable.
    """
    target_lat = lat
    target_lon = lon

    # If farm_id provided, look up farm coordinates
    if farm_id is not None:
        if current_user is None:
            raise UnauthorizedError("Log in to retrieve weather for a registered farm.")
        farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
        if not farm:
            raise NotFoundError("Farm not found.")
        target_lat = farm.latitude
        target_lon = farm.longitude

    if target_lat is None or target_lon is None:
        raise AppException(
            "MISSING_COORDINATES",
            "Either lat & lon or a valid farm_id must be provided to retrieve weather.",
            400
        )

    service = WeatherService(db)
    return await service.get_weather(target_lat, target_lon)
