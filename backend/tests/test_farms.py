import uuid
from unittest.mock import patch
from app.models.user import User, UserRole
from app.routers.auth import get_current_user
from app.main import app
from app.core.errors import NotFoundError


def get_mock_farmer():
    return User(
        id=uuid.uuid4(),
        name="Farmer Ram",
        phone="9876543210",
        password_hash="fake",
        preferred_language="hi",
        role=UserRole.FARMER
    )


def test_farm_coordinates_lat0_lon0_rejected(client):
    """A farm at lat 0, lon 0 must be rejected with a clear validation error."""
    app.dependency_overrides[get_current_user] = get_mock_farmer
    try:
        payload = {
            "farm_name": "Zero Farm",
            "latitude": 0.0,
            "longitude": 0.0,
            "area_acres": 2.5,
            "state": "Uttar Pradesh",
            "district": "Lucknow"
        }
        response = client.post("/farms", json=payload)
        assert response.status_code == 422
        data = response.json()
        assert "error" in data
        assert data["error"]["code"] == "VALIDATION_ERROR"
        assert "Null Island" in data["error"]["message"] or "outside India" in data["error"]["message"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_farm_coordinates_outside_india_rejected(client):
    """Coordinates clearly outside India (e.g. Europe) must be rejected."""
    app.dependency_overrides[get_current_user] = get_mock_farmer
    try:
        # London coordinates (51.5, -0.12)
        payload = {
            "farm_name": "London Farm",
            "latitude": 51.5074,
            "longitude": -0.1278,
            "area_acres": 5.0,
            "state": "Foreign",
            "district": "Foreign"
        }
        response = client.post("/farms", json=payload)
        assert response.status_code == 422
        assert "error" in response.json()
        assert "outside India" in response.json()["error"]["message"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_farmer_cannot_access_officer_admin_farms_endpoint(client):
    """Regular farmer cannot access /admin/farms (returns 403 Forbidden)."""
    app.dependency_overrides[get_current_user] = get_mock_farmer
    try:
        response = client.get("/admin/farms")
        assert response.status_code == 403
        assert response.json()["error"]["code"] == "FORBIDDEN"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_farm_ownership_isolation_returns_404(client):
    """
    User A cannot read, edit, or delete User B's farm.
    Must return 404 (not 403) so existence is never leaked.
    """
    from unittest.mock import MagicMock
    from app.db.session import get_db

    foreign_farm_id = uuid.uuid4()
    mock_db = MagicMock()
    app.dependency_overrides[get_current_user] = get_mock_farmer
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        with patch("app.routers.farms.farm_service.get_user_farm", side_effect=NotFoundError("Farm not found.")):
            # User A tries to GET User B's farm -> 404
            res_get = client.get(f"/farms/{foreign_farm_id}")
            assert res_get.status_code == 404
            assert res_get.json()["error"]["code"] == "NOT_FOUND"

        with patch("app.routers.farms.farm_service.update_farm", side_effect=NotFoundError("Farm not found.")):
            # User A tries to PUT User B's farm -> 404
            res_put = client.put(f"/farms/{foreign_farm_id}", json={"farm_name": "Hijacked Farm"})
            assert res_put.status_code == 404
            assert res_put.json()["error"]["code"] == "NOT_FOUND"

        with patch("app.routers.farms.farm_service.delete_farm", side_effect=NotFoundError("Farm not found.")):
            # User A tries to DELETE User B's farm -> 404
            res_del = client.delete(f"/farms/{foreign_farm_id}")
            assert res_del.status_code == 404
            assert res_del.json()["error"]["code"] == "NOT_FOUND"

    finally:
        app.dependency_overrides.pop(get_current_user, None)
        app.dependency_overrides.pop(get_db, None)
