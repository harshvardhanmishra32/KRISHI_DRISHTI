import os
import shutil
import pytest
from fastapi.testclient import TestClient

# Ensure test uploads folder
os.environ["UPLOAD_DIR"] = "test_uploads"

from app.main import app
from app.services.upload_service import upload_service, LocalStorage


@pytest.fixture(scope="session")
def client():
    """Provides a TestClient for FastAPI endpoints."""
    # Point upload service to a test upload directory
    test_dir = "test_uploads"
    upload_service.storage = LocalStorage(base_dir=test_dir)
    with TestClient(app) as test_client:
        yield test_client

    # Cleanup test uploads directory after tests finish
    if os.path.exists(test_dir):
        shutil.rmtree(test_dir, ignore_errors=True)
