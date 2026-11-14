"""
Unit and Integration Tests for DBSCAN Outbreak Detection & Alerts (P21).
"""

import uuid
import numpy as np
from sklearn.cluster import DBSCAN
from unittest.mock import patch
from app.models.user import User, UserRole
from app.routers.auth import get_current_user
from app.services.outbreak import haversine_distance_km
from app.main import app


def get_mock_officer():
    return User(
        id=uuid.uuid4(),
        name="District Officer",
        phone="9876543215",
        password_hash="fake",
        preferred_language="en",
        role=UserRole.OFFICER,
    )


def test_haversine_formula_accuracy():
    """Haversine distance between Lucknow (26.85, 80.95) and Kanpur (26.45, 80.33) is ~80 km."""
    dist = haversine_distance_km(26.85, 80.95, 26.45, 80.33)
    assert 70.0 < dist < 90.0


def test_dbscan_clustering_synthetic_points():
    """Synthetic test: 6 tightly clustered points form a cluster; 1 distant point is marked noise (-1)."""
    # 6 points within 1-2 km of (26.85, 80.95)
    cluster_points = [
        [26.850, 80.950],
        [26.852, 80.951],
        [26.849, 80.948],
        [26.853, 80.952],
        [26.851, 80.949],
        [26.854, 80.950],
    ]
    # 1 outlier 150 km away
    outlier = [28.200, 82.500]

    all_coords = np.array(cluster_points + [outlier])
    all_coords_rad = np.radians(all_coords)

    eps_rad = 10.0 / 6371.0088  # 10 km in radians
    dbscan = DBSCAN(eps=eps_rad, min_samples=5, metric="haversine")
    labels = dbscan.fit_predict(all_coords_rad)

    # First 6 points should belong to cluster 0
    assert all(lbl == 0 for lbl in labels[:6])
    # The 7th point should be noise (-1)
    assert labels[6] == -1


def test_admin_run_outbreak_check_permission(client):
    """Calling POST /admin/run-outbreak-check as an officer should succeed."""
    app.dependency_overrides[get_current_user] = get_mock_officer
    try:
        res = client.post("/admin/run-outbreak-check?days=7&eps_km=10&min_samples=3")
        assert res.status_code == 200
        data = res.json()
        assert "alerts_created" in data
        assert "execution_time_ms" in data
    finally:
        app.dependency_overrides.pop(get_current_user, None)
