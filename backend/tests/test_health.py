from unittest.mock import patch


def test_health_check_healthy(client):
    """When both database and Redis are operational, health check should return 200."""
    with patch("app.routers.health.check_db_connection", return_value=(True, "Connected to PostgreSQL")):
        with patch("app.routers.health.check_redis_connection", return_value=(True, "PONG (Connected)")):
            response = client.get("/health")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"
            assert data["services"]["database"]["status"] == "up"
            assert data["services"]["redis"]["status"] == "up"
            assert "timestamp" in data


def test_health_check_database_down(client):
    """When database is down, health check should return 503 with degraded status."""
    with patch("app.routers.health.check_db_connection", return_value=(False, "Connection refused")):
        with patch("app.routers.health.check_redis_connection", return_value=(True, "PONG (Connected)")):
            response = client.get("/health")
            assert response.status_code == 503
            data = response.json()
            assert data["status"] == "degraded"
            assert data["services"]["database"]["status"] == "down"
            assert data["services"]["redis"]["status"] == "up"


def test_health_check_redis_down(client):
    """When Redis is down, health check should return 503 with degraded status."""
    with patch("app.routers.health.check_db_connection", return_value=(True, "Connected to PostgreSQL")):
        with patch("app.routers.health.check_redis_connection", return_value=(False, "Redis connection timeout")):
            response = client.get("/health")
            assert response.status_code == 503
            data = response.json()
            assert data["status"] == "degraded"
            assert data["services"]["database"]["status"] == "up"
            assert data["services"]["redis"]["status"] == "down"


def test_root_endpoint(client):
    """Verify root discovery endpoint works."""
    response = client.get("/")
    assert response.status_code == 200
    assert "Krishi Drishti API" in response.json()["project"]
