"""
Pydantic Schemas for Krishi Drishti Weather Module.
Defines schemas for current weather, 5-day forecast, disease risk alerts, and spray windows.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class CurrentWeather(BaseModel):
    temperature: float = Field(..., description="Temperature in Celsius")
    feels_like: float = Field(..., description="Feels like temperature in Celsius")
    temp_min: float = Field(..., description="Minimum temperature in Celsius")
    temp_max: float = Field(..., description="Maximum temperature in Celsius")
    humidity: float = Field(..., description="Relative humidity percentage (0-100)")
    wind_speed: float = Field(..., description="Wind speed in meters per second")
    rainfall_mm: float = Field(default=0.0, description="Rainfall in millimeters over last 1-3 hours")
    description: str = Field(..., description="Weather description, e.g. 'scattered clouds'")
    icon: str = Field(..., description="OpenWeather icon code, e.g. '03d'")
    city_name: str = Field(default="Unknown", description="City / Region name")


class DailyForecast(BaseModel):
    date: str = Field(..., description="Date formatted as YYYY-MM-DD")
    day_name: str = Field(..., description="Day name, e.g. 'Monday'")
    temp_min: float = Field(..., description="Forecast minimum temperature in Celsius")
    temp_max: float = Field(..., description="Forecast maximum temperature in Celsius")
    humidity: float = Field(..., description="Average humidity percentage")
    rain_probability: float = Field(..., description="Probability of precipitation (0-100%)")
    rainfall_mm: float = Field(default=0.0, description="Estimated total rainfall in mm")
    description: str = Field(..., description="Dominant weather condition")
    icon: str = Field(..., description="Dominant weather icon")


class SprayWindow(BaseModel):
    date: str = Field(..., description="Date of suggested spray window (YYYY-MM-DD)")
    time_window: str = Field(..., description="Time window, e.g. '06:00 - 09:00'")
    temperature: float = Field(..., description="Forecast temperature (°C)")
    wind_speed: float = Field(..., description="Forecast wind speed (m/s)")
    rain_probability: float = Field(..., description="Rain probability (%)")
    reason: str = Field(..., description="Agricultural explanation of why window is suitable")


class SprayAdvice(BaseModel):
    is_recommended: bool = Field(..., description="Whether spraying is safe in the next 48 hours")
    summary: str = Field(..., description="Short summary for the farmer")
    best_windows: List[SprayWindow] = Field(default_factory=list, description="Top recommended spray slots")
    disclaimer: str = Field(
        default="Suggestion only. Confirm dose and timing with local agriculture officer.",
        description="Mandatory agricultural disclaimer"
    )


class DiseaseRiskAlert(BaseModel):
    is_risk: bool = Field(..., description="True if weather conditions promote fungal/bacterial spread")
    level: str = Field(..., description="'none', 'medium', or 'high'")
    reason: str = Field(..., description="Human-readable explanation, e.g. 'High humidity (>80%) promotes fungal blight'")


class WeatherResponse(BaseModel):
    coordinates: dict = Field(..., description="Latitude and Longitude of queried location")
    current: CurrentWeather
    forecast: List[DailyForecast]
    disease_risk: DiseaseRiskAlert
    spray_advice: SprayAdvice
    stale: bool = Field(default=False, description="True if response is served from fallback cache due to API unavailability")
    cached_at: Optional[str] = Field(default=None, description="ISO timestamp when weather data was fetched")
    message: str = Field(default="Live weather data fetched successfully", description="Informational message")
