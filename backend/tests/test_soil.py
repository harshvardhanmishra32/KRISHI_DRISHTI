"""
Unit and Integration Tests for Soil Records & Crop Recommendation (P17).
"""

import uuid
from unittest.mock import patch
from app.models.user import User, UserRole
from app.models.farm import Farm
from app.routers.auth import get_current_user
from app.main import app


def get_mock_farmer():
    return User(
        id=uuid.uuid4(),
        name="Harish Patel",
        phone="9876543213",
        password_hash="fake",
        preferred_language="hi",
        role=UserRole.FARMER,
    )


def test_soil_record_ph_range_validation(client):
    """Submitting pH outside 3.5 - 9.5 (e.g. pH 12.0) must be rejected with 422."""
    app.dependency_overrides[get_current_user] = get_mock_farmer
    try:
        payload = {
            "farm_id": str(uuid.uuid4()),
            "soil_type": "Clay Loam",
            "ph": 12.0,  # Invalid: above 9.5
            "nitrogen": 120.0,
            "phosphorus": 45.0,
            "potassium": 150.0,
            "source": "lab_test",
        }
        res = client.post("/soil-records", json=payload)
        assert res.status_code == 422
        assert "error" in res.json()
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_soil_record_ai_estimate_rejected(client):
    """Submitting source='ai_estimate' must return clear message that photo estimation is not implemented."""
    app.dependency_overrides[get_current_user] = get_mock_farmer
    try:
        payload = {
            "farm_id": str(uuid.uuid4()),
            "soil_type": "Alluvial",
            "ph": 6.8,
            "nitrogen": 100.0,
            "phosphorus": 30.0,
            "potassium": 80.0,
            "source": "ai_estimate",
        }
        res = client.post("/soil-records", json=payload)
        assert res.status_code == 422
        assert "not yet implemented" in res.json()["error"]["message"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_recommend_crops_disclaimer_and_top3(client):
    """GET /recommend-crops must include top 3 recommendations and mandatory disclaimer."""
    farmer = get_mock_farmer()
    app.dependency_overrides[get_current_user] = lambda: farmer
    try:
        farm_id = uuid.uuid4()
        from app.schemas.soil import CropRecommendationResponse, CropRecommendationItem
        mock_response = CropRecommendationResponse(
            farm_id=farm_id,
            season="Rabi",
            recommendations=[
                CropRecommendationItem(crop_name="Wheat", score=88.5, source="hybrid", reasons=["Ideal season"], cautions=[]),
                CropRecommendationItem(crop_name="Chickpea", score=82.0, source="rule_engine", reasons=["Good pH"], cautions=[]),
                CropRecommendationItem(crop_name="Potato", score=76.0, source="rule_engine", reasons=["Suitable soil"], cautions=[]),
            ],
            note="Indicative only - confirm with a soil test (Soil Health Card or nearest lab)"
        )
        mock_farm = Farm(id=farm_id, user_id=farmer.id, farm_name="Test Farm", latitude=26.85, longitude=80.95, area_acres=3.0, state="UP", district="Lucknow")

        with patch("sqlalchemy.orm.Query.first", return_value=mock_farm):
            with patch("app.services.crop_advisor.CropAdvisorService.recommend_crops", return_value=mock_response):
                res = client.get(f"/recommend-crops?farm_id={farm_id}")

        assert res.status_code == 200
        data = res.json()
        assert "recommendations" in data
        assert len(data["recommendations"]) <= 3
        assert "note" in data
        assert "Indicative only - confirm with a soil test" in data["note"]
        # Check recommendation structure
        for rec in data["recommendations"]:
            assert "crop_name" in rec
            assert 0 <= rec["score"] <= 100
            assert "reasons" in rec
            assert len(rec["reasons"]) > 0
    finally:
        app.dependency_overrides.pop(get_current_user, None)
