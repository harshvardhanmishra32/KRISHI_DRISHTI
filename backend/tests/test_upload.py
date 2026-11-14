import io
import pytest
from PIL import Image
from app.main import app
from app.routers.auth import get_current_user


@pytest.fixture(autouse=True)
def authenticated_uploads():
    previous = app.dependency_overrides.get(get_current_user)
    app.dependency_overrides[get_current_user] = lambda: object()
    yield
    if previous is None:
        app.dependency_overrides.pop(get_current_user, None)
    else:
        app.dependency_overrides[get_current_user] = previous


def create_test_image(format="JPEG", size=(500, 500), color=(0, 128, 0)) -> bytes:
    """Helper to generate an in-memory image bytes."""
    buf = io.BytesIO()
    img = Image.new("RGB", size, color=color)
    img.save(buf, format=format)
    return buf.getvalue()


def test_upload_requires_auth(client):
    app.dependency_overrides.pop(get_current_user, None)
    response = client.post(
        "/api/v1/upload",
        files={"file": ("leaf.jpg", create_test_image(), "image/jpeg")}
    )
    assert response.status_code == 401


def test_upload_valid_image(client):
    """Uploading a valid PNG or JPEG should succeed, resize if needed, and return 201."""
    # Create 1600x1200 image (exceeds max dimension 1280px)
    image_bytes = create_test_image(format="PNG", size=(1600, 1200), color=(34, 139, 34))

    response = client.post(
        "/api/v1/upload",
        files={"file": ("healthy_leaf.png", image_bytes, "image/png")}
    )

    assert response.status_code == 201
    data = response.json()
    assert data["format"] == "JPEG"
    assert data["width"] == 1280
    assert data["height"] == 960  # Aspect ratio preserved: 1200 * (1280 / 1600)
    assert data["filename"].endswith(".jpg")
    assert "/uploads/" in data["url"]


def test_upload_unique_filenames_no_overwrite(client):
    """Two uploads must generate distinct random UUID filenames and not collide."""
    img_bytes = create_test_image(format="JPEG", size=(100, 100))

    res1 = client.post("/api/v1/upload", files={"file": ("test.jpg", img_bytes, "image/jpeg")})
    res2 = client.post("/api/v1/upload", files={"file": ("test.jpg", img_bytes, "image/jpeg")})

    assert res1.status_code == 201
    assert res2.status_code == 201
    assert res1.json()["filename"] != res2.json()["filename"]


def test_upload_corrupt_file_rejected(client):
    """A fake text file renamed to .jpg must fail Pillow verification with 400 Bad Request."""
    fake_image_bytes = b"This is just a text file with pretending image header."

    response = client.post(
        "/api/v1/upload",
        files={"file": ("fake_leaf.jpg", fake_image_bytes, "image/jpeg")}
    )

    assert response.status_code == 400
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "CORRUPT_IMAGE"
    assert "not a valid" in data["error"]["message"].lower() or "corrupt" in data["error"]["message"].lower()


def test_upload_unsupported_media_type(client):
    """Uploading an unsupported image type (e.g. GIF) must return 415 Unsupported Media Type."""
    buf = io.BytesIO()
    img = Image.new("RGB", (50, 50), color="blue")
    img.save(buf, format="GIF")
    gif_bytes = buf.getvalue()

    response = client.post(
        "/api/v1/upload",
        files={"file": ("animation.gif", gif_bytes, "image/gif")}
    )

    assert response.status_code == 415
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "UNSUPPORTED_MEDIA_TYPE"


def test_upload_file_too_large(client):
    """An image exceeding 5 MB must return 413 Payload Too Large."""
    # 5.5 MB dummy byte array
    oversized_bytes = b"0" * (6 * 1024 * 1024)

    response = client.post(
        "/api/v1/upload",
        files={"file": ("huge_photo.jpg", oversized_bytes, "image/jpeg")}
    )

    assert response.status_code == 413
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "FILE_TOO_LARGE"
    assert "exceeds" in data["error"]["message"].lower()
