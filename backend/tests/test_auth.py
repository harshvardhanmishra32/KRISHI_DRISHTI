import uuid
from unittest.mock import patch
from app.core.errors import AppException


def test_signup_invalid_phone_rejected(client):
    invalid_payload = {
        "name": "Invalid User",
        "phone": "12345",  # Invalid phone
        "password": "Password123"
    }
    response = client.post("/auth/signup", json=invalid_payload)
    assert response.status_code == 422
    assert "error" in response.json()
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_signup_short_password_rejected(client):
    short_pw_payload = {
        "name": "Invalid User",
        "phone": "9876543210",
        "password": "123"  # Less than 8 chars
    }
    response = client.post("/auth/signup", json=short_pw_payload)
    assert response.status_code == 422
    assert "error" in response.json()


def test_login_invalid_credentials_returns_401(client):
    invalid_error = AppException(
        code="INVALID_CREDENTIALS",
        message="Invalid phone number or password.",
        status_code=401
    )
    with patch("app.routers.auth.user_service.authenticate", side_effect=invalid_error):
        response = client.post(
            "/auth/login",
            json={"phone": "9999999999", "password": "WrongPassword123"}
        )
        assert response.status_code == 401
        data = response.json()
        assert data["error"]["code"] == "INVALID_CREDENTIALS"
        assert data["error"]["message"] == "Invalid phone number or password."


def test_auth_me_without_token_returns_401(client):
    response = client.get("/auth/me")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"


def test_auth_me_with_tampered_token_returns_401(client):
    headers = {"Authorization": "Bearer completely.fake.token"}
    response = client.get("/auth/me", headers=headers)
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"
