from fastapi import APIRouter, Depends, File, UploadFile, status
from app.schemas.upload import ImageUploadResponse
from app.services.upload_service import upload_service
from app.routers.auth import get_current_user
from app.core.rate_limit import rate_limit_uploads

router = APIRouter(prefix="/api/v1/upload", tags=["Uploads"])


@router.post(
    "",
    response_model=ImageUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Secure Image Upload",
    dependencies=[Depends(get_current_user), Depends(rate_limit_uploads)],
)
async def upload_image(file: UploadFile = File(...)):
    """
    Upload and sanitize an image for disease detection or farm profile.
    - Validates actual image file contents (JPEG, PNG, WebP)
    - Validates size <= 5 MB (returns 413 if exceeded)
    - Resizes to max dimension 1280px
    - Strips EXIF metadata
    - Re-encodes as clean JPEG
    - Saves under uploads/YYYY/MM/<uuid>.jpg
    """
    file_bytes = await file.read()
    result = upload_service.process_and_save_image(
        file_bytes=file_bytes,
        original_filename=file.filename or ""
    )
    return result
