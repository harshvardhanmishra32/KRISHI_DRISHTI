from pydantic import BaseModel, Field


class ImageUploadResponse(BaseModel):
    """Schema representing successful image upload response."""
    url: str = Field(..., description="Public access URL for the uploaded image")
    filename: str = Field(..., description="Unique filename assigned to image")
    relative_path: str = Field(..., description="Relative storage path under uploads/")
    format: str = Field(default="JPEG", description="Standardized output format")
    width: int = Field(..., description="Width of processed image in pixels")
    height: int = Field(..., description="Height of processed image in pixels")
    size_bytes: int = Field(..., description="Size of saved image in bytes")
