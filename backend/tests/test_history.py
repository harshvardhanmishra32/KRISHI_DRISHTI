"""
Unit and Integration Tests for Disease History, Reference Endpoints & Admin Stats (P14).
"""

import uuid
from unittest.mock import patch
from app.models.user import User, UserRole
from app.routers.auth import get_current_user
from app.main import app


def get_mock_farmer():
    return User(
        id=uuid.uuid4(),
        name="Kisan Singh",
        phone="9876543211",
        password_hash="fake",
        preferred_language="hi",
        role=UserRole.FARMER,
    )


def get_mock_officer():
    return User(
        id=uuid.uuid4(),
        name="Officer Verma",
        phone="9876543212",
        password_hash="fake",
        preferred_language="en",
        role=UserRole.OFFICER,
    )


def test_list_crops(client):
    """GET /crops returns the list of all seeded crops."""
    res = client.get("/crops")
    assert res.status_code == 200
    crops = res.json()
    assert isinstance(crops, list)
    assert len(crops) >= 10
    crop_names = [c["name"].lower() for c in crops]
    assert "tomato" in crop_names
    assert "potato" in crop_names
    assert "wheat" in crop_names


def test_list_diseases(client):
    """GET /diseases returns plant diseases with model class names."""
    res = client.get("/diseases")
    assert res.status_code == 200
    diseases = res.json()
    assert len(diseases) >= 13
    assert any(d["model_class_name"] == "tomato_early_blight" for d in diseases)


def test_disease_history_pagination(client):
    """GET /disease-history should return items, total, limit, and offset."""
    app.dependency_overrides[get_current_user] = get_mock_farmer
    try:
        res = client.get("/disease-history?limit=5&offset=0")
        assert res.status_code == 200
        data = res.json()
        assert "items" in data
        assert "total" in data
        assert data["limit"] == 5
        assert data["offset"] == 0
        assert isinstance(data["items"], list)
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_disease_report_ownership_404(client):
    """A farmer attempting to view a report that doesn't exist or isn't theirs gets 404."""
    app.dependency_overrides[get_current_user] = get_mock_farmer
    try:
        random_id = uuid.uuid4()
        res = client.get(f"/disease-reports/{random_id}")
        assert res.status_code == 404
        assert res.json()["error"]["code"] == "NOT_FOUND"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_admin_stats_farmer_forbidden_403(client):
    """A farmer calling /admin/disease-stats must receive HTTP 403 Forbidden."""
    app.dependency_overrides[get_current_user] = get_mock_farmer
    try:
        res = client.get("/admin/disease-stats")
        assert res.status_code == 403
        data = res.json()
        assert data["error"]["code"] == "FORBIDDEN"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_admin_stats_officer_allowed_200(client):
    """An agricultural officer calling /admin/disease-stats receives epidemiology data."""
    app.dependency_overrides[get_current_user] = get_mock_officer
    try:
        res = client.get("/admin/disease-stats?days=30")
        assert res.status_code == 200
        data = res.json()
        assert "total_reports" in data
        assert "stats" in data
        assert data["period_days"] == 30
    finally:
        app.dependency_overrides.pop(get_current_user, None)
