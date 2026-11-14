"""
Unit and Integration Tests for Disease Detection & ML Classifier (P13, P19).
"""

import io
import uuid
from PIL import Image
from unittest.mock import patch
from app.models.user import User, UserRole
from app.models.crop import Crop, Disease, Treatment
from app.models.report import DiseaseReport
from app.routers.auth import get_current_user
from app.main import app


def get_mock_farmer():
    from app.db.session import SessionLocal
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.phone == "9999900001").first()
        if not user:
            user = User(
                id=uuid.uuid4(),
                name="Ramesh Kumar",
                phone="9999900001",
                password_hash="hashed",
                preferred_language="hi",
                role=UserRole.FARMER,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        return user
    finally:
        db.close()


def create_dummy_leaf_image_bytes():
    """Generates a small valid RGB JPEG in memory."""
    img = Image.new("RGB", (224, 224), color=(34, 139, 34))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_get_model_info(client):
    """GET /ml/model-info should return valid metadata and class list."""
    res = client.get("/ml/model-info")
    assert res.status_code == 200
    data = res.json()
    assert "model_architecture" in data
    assert data["num_classes"] == 13
    assert data["low_confidence_threshold"] == 0.70
    assert "Tomato" in data["supported_crops"]
    assert "Potato" in data["supported_crops"]


def test_detect_disease_success(client):
    """POST /detect-disease should run inference, match DB, and return report."""
    app.dependency_overrides[get_current_user] = get_mock_farmer
    try:
        leaf_bytes = create_dummy_leaf_image_bytes()
        files = {"file": ("test_leaf.jpg", leaf_bytes, "image/jpeg")}
        data = {"crop": "Tomato"}

        # Mock predict_disease to return predictable output
        mock_pred = (
            "tomato_early_blight",
            0.92,
            [
                {"class_name": "tomato_early_blight", "confidence": 0.92},
                {"class_name": "tomato_late_blight", "confidence": 0.05},
                {"class_name": "tomato_healthy", "confidence": 0.03},
            ],
            12.5,
        )

        with patch("app.services.detection_service.predict_disease", return_value=mock_pred):
            res = client.post("/detect-disease", files=files, data=data)

        assert res.status_code == 201
        res_data = res.json()
        assert res_data["crop"] == "Tomato"
        assert res_data["confidence"] == 0.92
        assert res_data["low_confidence"] is False
        assert res_data["crop_mismatch"] is False
        assert len(res_data["top3"]) == 3
        assert "disclaimer" in res_data
        assert "Confirm diagnosis" in res_data["disclaimer"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_detect_disease_low_confidence_flagged(client):
    """Low confidence (<0.70) must set low_confidence=True and add caution note."""
    app.dependency_overrides[get_current_user] = get_mock_farmer
    try:
        leaf_bytes = create_dummy_leaf_image_bytes()
        files = {"file": ("shoe_or_nonleaf.jpg", leaf_bytes, "image/jpeg")}
        data = {"crop": "Tomato"}

        # Simulate low confidence prediction (e.g. shoe photo)
        mock_pred = (
            "tomato_early_blight",
            0.45,
            [
                {"class_name": "tomato_early_blight", "confidence": 0.45},
                {"class_name": "tomato_target_spot", "confidence": 0.35},
                {"class_name": "tomato_healthy", "confidence": 0.20},
            ],
            10.2,
        )

        with patch("app.services.detection_service.predict_disease", return_value=mock_pred):
            res = client.post("/detect-disease", files=files, data=data)

        assert res.status_code == 201
        res_data = res.json()
        assert res_data["low_confidence"] is True
        assert res_data["note"] is not None
        assert "clear leaf" in res_data["note"].lower()
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_detect_disease_crop_mismatch(client):
    """If farmer chose Potato but model predicts Tomato disease, crop_mismatch=True."""
    app.dependency_overrides[get_current_user] = get_mock_farmer
    try:
        leaf_bytes = create_dummy_leaf_image_bytes()
        files = {"file": ("mismatched.jpg", leaf_bytes, "image/jpeg")}
        data = {"crop": "Potato"}  # Farmer chose Potato

        # Model detects Tomato disease
        mock_pred = (
            "tomato_early_blight",
            0.88,
            [
                {"class_name": "tomato_early_blight", "confidence": 0.88},
                {"class_name": "potato_early_blight", "confidence": 0.08},
                {"class_name": "tomato_healthy", "confidence": 0.04},
            ],
            11.0,
        )

        with patch("app.services.detection_service.predict_disease", return_value=mock_pred):
            res = client.post("/detect-disease", files=files, data=data)

        assert res.status_code == 201
        res_data = res.json()
        assert res_data["crop_mismatch"] is True
        assert res_data["note"] is not None
        assert "Tomato" in res_data["note"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_detect_disease_plain_explanation_hindi(client):
    """explain=true&lang=hi should return an advisory explanation in Hindi (P19)."""
    app.dependency_overrides[get_current_user] = get_mock_farmer
    try:
        leaf_bytes = create_dummy_leaf_image_bytes()
        files = {"file": ("hindi_test.jpg", leaf_bytes, "image/jpeg")}
        data = {"crop": "Tomato", "explain": "true", "lang": "hi"}

        mock_pred = (
            "tomato_early_blight",
            0.94,
            [{"class_name": "tomato_early_blight", "confidence": 0.94}],
            9.8,
        )

        with patch("app.services.detection_service.predict_disease", return_value=mock_pred):
            res = client.post("/detect-disease", files=files, data=data)

        assert res.status_code == 201
        res_data = res.json()
        assert res_data["plain_explanation"] is not None
        assert len(res_data["plain_explanation"]) > 10
        # Check Hindi agricultural words
        assert any(word in res_data["plain_explanation"] for word in ["फसल", "कृषि", "सटीकता", "लक्षण"])
    finally:
        app.dependency_overrides.pop(get_current_user, None)
