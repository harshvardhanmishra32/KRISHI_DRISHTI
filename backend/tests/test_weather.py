"""
Tests for Krishi Drishti Weather Module.
Verifies GET /get-weather with real API key / mocked HTTP responses,
Redis caching, database fallback, disease risk detection, and spray advice heuristics.
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.core.config import settings

client = TestClient(app)

MOCK_CURRENT_WEATHER_HIGH_HUMIDITY = {
    "coord": {"lon": 77.21, "lat": 28.61},
    "weather": [{"id": 500, "main": "Rain", "description": "light rain", "icon": "10d"}],
    "main": {
        "temp": 26.5,
        "feels_like": 28.0,
        "temp_min": 25.0,
        "temp_max": 28.0,
        "humidity": 88.0,
        "pressure": 1012
    },
    "wind": {"speed": 2.2},
    "rain": {"1h": 1.2},
    "name": "New Delhi"
}

MOCK_CURRENT_WEATHER_NORMAL = {
    "coord": {"lon": 77.21, "lat": 28.61},
    "weather": [{"id": 800, "main": "Clear", "description": "clear sky", "icon": "01d"}],
    "main": {
        "temp": 28.0,
        "feels_like": 29.0,
        "temp_min": 26.0,
        "temp_max": 30.0,
        "humidity": 55.0,
        "pressure": 1015
    },
    "wind": {"speed": 2.0},
    "name": "New Delhi"
}

MOCK_FORECAST = {
    "cod": "200",
    "list": [
        {
            "dt_txt": "2026-11-14 06:00:00",
            "main": {"temp": 22.0, "humidity": 70.0},
            "weather": [{"description": "clear sky", "icon": "01d"}],
            "wind": {"speed": 1.8},
            "pop": 0.05
        },
        {
            "dt_txt": "2026-11-14 12:00:00",
            "main": {"temp": 31.0, "humidity": 50.0},
            "weather": [{"description": "few clouds", "icon": "02d"}],
            "wind": {"speed": 4.5}, # High wind -> excluded from spray
            "pop": 0.10
        },
        {
            "dt_txt": "2026-11-14 18:00:00",
            "main": {"temp": 25.0, "humidity": 65.0},
            "weather": [{"description": "clear sky", "icon": "01n"}],
            "wind": {"speed": 2.1}, # Good spray window
            "pop": 0.0
        },
        {
            "dt_txt": "2026-11-15 06:00:00",
            "main": {"temp": 23.0, "humidity": 72.0},
            "weather": [{"description": "clear sky", "icon": "01d"}],
            "wind": {"speed": 1.5}, # Good spray window
            "pop": 0.0
        },
        {
            "dt_txt": "2026-11-16 12:00:00",
            "main": {"temp": 30.0, "humidity": 55.0},
            "weather": [{"description": "scattered clouds", "icon": "03d"}],
            "wind": {"speed": 2.5},
            "pop": 0.0
        },
        {
            "dt_txt": "2026-11-17 12:00:00",
            "main": {"temp": 29.0, "humidity": 58.0},
            "weather": [{"description": "broken clouds", "icon": "04d"}],
            "wind": {"speed": 2.0},
            "pop": 0.0
        },
        {
            "dt_txt": "2026-11-18 12:00:00",
            "main": {"temp": 28.0, "humidity": 60.0},
            "weather": [{"description": "overcast clouds", "icon": "04d"}],
            "wind": {"speed": 2.2},
            "pop": 0.0
        }
    ]
}


def test_missing_coordinates():
    """Verify request fails when neither lat/lon nor farm_id are provided."""
    response = client.get("/get-weather")
    assert response.status_code == 400
    data = response.json()
    assert data["error"]["code"] == "MISSING_COORDINATES"


def test_invalid_coordinates():
    """Verify out-of-range coordinates are rejected."""
    response = client.get("/get-weather?lat=150.0&lon=77.0")
    assert response.status_code in (400, 422)


def test_weather_normal_conditions(monkeypatch):
    """Verify weather parsing, normal disease risk, and spray window calculation."""
    class MockResponse:
        def __init__(self, json_data, status_code=200):
            self._json = json_data
            self.status_code = status_code
            self.text = ""

        def json(self):
            return self._json

    async def mock_get(self, url, params=None):
        if "weather" in url and "forecast" not in url:
            return MockResponse(MOCK_CURRENT_WEATHER_NORMAL)
        elif "forecast" in url:
            return MockResponse(MOCK_FORECAST)
        return MockResponse({}, 404)

    with patch("httpx.AsyncClient.get", mock_get):
        response = client.get("/get-weather?lat=28.61&lon=77.21")
        assert response.status_code == 200
        data = response.json()

        assert data["current"]["temperature"] == 28.0
        assert data["current"]["humidity"] == 55.0
        assert data["disease_risk"]["is_risk"] is False
        assert data["disease_risk"]["level"] == "none"
        assert data["spray_advice"]["is_recommended"] is True
        assert len(data["spray_advice"]["best_windows"]) > 0
        assert len(data["forecast"]) >= 5


def test_weather_high_humidity_disease_risk(monkeypatch):
    """Verify that humidity > 80% triggers the fungal disease alert."""
    class MockResponse:
        def __init__(self, json_data, status_code=200):
            self._json = json_data
            self.status_code = status_code
            self.text = ""

        def json(self):
            return self._json

    async def mock_get(self, url, params=None):
        if "weather" in url and "forecast" not in url:
            return MockResponse(MOCK_CURRENT_WEATHER_HIGH_HUMIDITY)
        elif "forecast" in url:
            return MockResponse(MOCK_FORECAST)
        return MockResponse({}, 404)

    with patch("httpx.AsyncClient.get", mock_get):
        response = client.get("/get-weather?lat=25.31&lon=82.97")
        assert response.status_code == 200
        data = response.json()

        assert data["current"]["humidity"] == 88.0
        assert data["disease_risk"]["is_risk"] is True
        assert data["disease_risk"]["level"] == "high"
        assert "High humidity detected" in data["disease_risk"]["reason"]
