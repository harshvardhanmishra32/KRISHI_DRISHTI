import io
import os
import uuid
import datetime
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Tuple
from PIL import Image, UnidentifiedImageError

from app.core.config import settings
from app.core.errors import (
    FileTooLargeError,
    UnsupportedMediaTypeError,
    CorruptImageError,
    BadRequestError
)
from app.core.logging import logger

ALLOWED_PIL_FORMATS = {"JPEG", "PNG", "WEBP"}


# =============================================================================
# Storage Interface & Implementations
# =============================================================================

class BaseStorage(ABC):
    """Abstract Storage Interface for handling file persistence."""

    @abstractmethod
    def save(self, file_bytes: bytes, relative_path: str) -> str:
        """Saves file bytes to the storage backend and returns the public path or URL."""
        pass

    @abstractmethod
    def delete(self, relative_path: str) -> bool:
        """Deletes the file from storage. Returns True if deleted or False if not found."""
        pass


class LocalStorage(BaseStorage):
    """
    Local filesystem storage for local development.
    Saves files to the configured UPLOAD_DIR on disk.
    """

    def __init__(self, base_dir: str = settings.UPLOAD_DIR):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def save(self, file_bytes: bytes, relative_path: str) -> str:
        target_path = self.base_dir / relative_path
        target_path.parent.mkdir(parents=True, exist_ok=True)
        with open(target_path, "wb") as f:
            f.write(file_bytes)
        logger.info(f"File saved locally to {target_path}")
        # Public URL served by FastAPI static mount
        return f"/uploads/{relative_path}"

    def delete(self, relative_path: str) -> bool:
        target_path = self.base_dir / relative_path
        if target_path.exists():
            target_path.unlink()
            logger.info(f"File deleted from {target_path}")
            return True
        return False


class CloudinaryStorage(BaseStorage):
    """
    Cloudinary storage stub for production deployment.
    To be activated when deploying to cloud without persistent local disks.
    """

    def __init__(self, cloudinary_url: str = ""):
        self.cloudinary_url = cloudinary_url

    def save(self, file_bytes: bytes, relative_path: str) -> str:
        # In production:
        # import cloudinary.uploader
        # response = cloudinary.uploader.upload(file_bytes, public_id=relative_path)
        # return response.get("secure_url")
        raise NotImplementedError("Cloudinary storage is configured for production cloud deployment.")

    def delete(self, relative_path: str) -> bool:
        # In production:
        # import cloudinary.uploader
        # response = cloudinary.uploader.destroy(relative_path)
        # return response.get("result") == "ok"
        raise NotImplementedError("Cloudinary storage is configured for production cloud deployment.")


# =============================================================================
# Image Processing & Upload Service
# =============================================================================

class UploadService:
    """
    Secure Image Upload Service.
    - Validates real content using Pillow (JPEG, PNG, WebP)
    - Enforces maximum file size limit (5 MB)
    - Strips EXIF metadata for farmer privacy
    - Resizes longest side to 1280px maintaining aspect ratio
    - Re-encodes cleanly to standardized JPEG
    - Stores file under uploads/YYYY/MM/<random-uuid>.jpg
    """

    def __init__(self, storage: BaseStorage | None = None):
        self.storage = storage or LocalStorage()
        self.max_size_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        self.max_dimension = settings.MAX_IMAGE_DIMENSION

    def process_and_save_image(self, file_bytes: bytes, original_filename: str = "") -> dict:
        # 1. Size Validation (Max 5 MB)
        if len(file_bytes) > self.max_size_bytes:
            raise FileTooLargeError(max_size_mb=settings.MAX_UPLOAD_SIZE_MB)

        if len(file_bytes) == 0:
            raise BadRequestError("Uploaded file is empty.")

        # 2. Content Verification with Pillow (Real content, not just extension)
        try:
            image_stream = io.BytesIO(file_bytes)
            with Image.open(image_stream) as img:
                detected_format = img.format
                if not detected_format:
                    raise CorruptImageError("Could not determine image format.")

                if detected_format.upper() not in ALLOWED_PIL_FORMATS:
                    raise UnsupportedMediaTypeError(
                        f"Unsupported format '{detected_format}'. Only JPEG, PNG, and WebP are allowed."
                    )

                # Verify image integrity
                img.verify()

            # Re-open for actual processing (verify closes/invalidates the file handle)
            image_stream.seek(0)
            img = Image.open(image_stream)

            # 3. Strip EXIF data & Convert color space to RGB
            # Handling RGBA / Palette / Grayscale transparency gracefully
            if img.mode in ("RGBA", "LA", "P"):
                # Composite transparent images against a clean white background
                img = img.convert("RGBA")
                background = Image.new("RGBA", img.size, (255, 255, 255, 255))
                alpha_composite = Image.alpha_composite(background, img)
                processed_img = alpha_composite.convert("RGB")
            else:
                processed_img = img.convert("RGB")

            # 4. Resize if longest side exceeds max_dimension (1280px)
            width, height = processed_img.size
            longest_side = max(width, height)
            if longest_side > self.max_dimension:
                scale_ratio = self.max_dimension / float(longest_side)
                new_width = int(round(width * scale_ratio))
                new_height = int(round(height * scale_ratio))
                processed_img = processed_img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                logger.info(f"Resized image from {width}x{height} to {new_width}x{new_height}")

            # 5. Re-encode to clean JPEG into memory buffer (no EXIF metadata attached)
            output_buffer = io.BytesIO()
            processed_img.save(
                output_buffer,
                format="JPEG",
                quality=85,
                optimize=True
            )
            processed_bytes = output_buffer.getvalue()

        except UnidentifiedImageError:
            raise CorruptImageError("Uploaded file is not a valid or readable image.")
        except (IOError, SyntaxError) as e:
            raise CorruptImageError(f"Corrupt or malformed image: {str(e)}")

        # 6. Generate secure file path: uploads/YYYY/MM/<uuid>.jpg
        now = datetime.datetime.now(datetime.timezone.utc)
        subfolder = f"{now.year}/{now.month:02d}"
        random_filename = f"{uuid.uuid4().hex}.jpg"
        relative_path = f"{subfolder}/{random_filename}"

        # 7. Persist via Storage Interface
        saved_url = self.storage.save(processed_bytes, relative_path)

        return {
            "url": saved_url,
            "filename": random_filename,
            "relative_path": relative_path,
            "format": "JPEG",
            "width": processed_img.width,
            "height": processed_img.height,
            "size_bytes": len(processed_bytes)
        }


# Singleton instance of UploadService
upload_service = UploadService()
