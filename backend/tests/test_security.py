"""
Security Hardening, Rate Limiting & Header Verification Tests (P22).
"""

from unittest.mock import patch
from app.main import app
from app.core.rate_limit import _memory_windows


def test_security_headers_present(client):
    """Every HTTP response must carry core security headers."""
    res = client.get("/health")
    assert res.status_code == 200
    assert res.headers.get("x-content-type-options") == "nosniff"
    assert res.headers.get("x-frame-options") == "DENY"
    assert res.headers.get("x-xss-protection") == "1; mode=block"
    assert "max-age" in res.headers.get("strict-transport-security", "")


def test_payload_size_limit_rejection(client):
    """Sending a request with Content-Length header > 10MB must be rejected with HTTP 413."""
    headers = {"Content-Length": str(15 * 1024 * 1024)}  # 15 MB
    res = client.post("/auth/login", headers=headers, json={"phone": "9876543210", "password": "password"})
    assert res.status_code == 413
    assert res.json()["error"]["code"] == "REQUEST_TOO_LARGE"


def test_login_rate_limiting(client):
    """The 6th login attempt from the same IP within a minute should return HTTP 429."""
    from app.core.rate_limit import check_rate_limit
    from fastapi import Request
    from app.core.errors import AppException
    import pytest

    # Clear memory window for test
    _memory_windows.clear()

    # Mock request
    class MockRequest:
        headers = {}
        client = type("Client", (), {"host": "192.168.1.100"})()

    req = MockRequest()

    # 5 attempts should succeed without error
    for _ in range(5):
        check_rate_limit(req, "test_login", max_requests=5, window_seconds=60)

    # 6th attempt must raise 429
    with pytest.raises(AppException) as excinfo:
        check_rate_limit(req, "test_login", max_requests=5, window_seconds=60)

    assert excinfo.value.status_code == 429
    assert excinfo.value.code == "RATE_LIMIT_EXCEEDED"
