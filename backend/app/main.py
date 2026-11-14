import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.logging import logger
from app.core.errors import (
    AppException,
    create_error_response,
    app_exception_handler,
    http_exception_handler,
    validation_exception_handler,
    generic_exception_handler
)
from app.ml.classifier import load_classifier
from app.ml.stt import load_stt_model
from app.routers import (
    health,
    uploads,
    auth,
    farms,
    weather,
    detection,
    history,
    prices,
    soil,
    expenses,
    voice,
    outbreaks,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    logger.info(f"Starting {settings.PROJECT_NAME} in [{settings.ENVIRONMENT}] mode")
    # Ensure local upload directories exist
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "tts"), exist_ok=True)

    # Initialize TFLite leaf disease classifier once at startup
    try:
        load_classifier()
        logger.info("TFLite classifier loaded successfully.")
    except Exception as e:
        logger.warning(f"Could not initialize TFLite classifier at startup: {e}")

    # Initialize STT model if available
    try:
        load_stt_model(model_size="tiny")
    except Exception as e:
        logger.warning(f"STT model initialization note: {e}")

    yield
    logger.info(f"Shutting down {settings.PROJECT_NAME}")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for Krishi Drishti - AI-powered advisory system for Indian farmers.",
    version="1.0.0",
    lifespan=lifespan
)

# -----------------------------------------------------------------------------
# Security Headers & Request Body Size Middleware (P22)
# -----------------------------------------------------------------------------
MAX_REQUEST_BODY_BYTES = 10 * 1024 * 1024  # 10 MB maximum request size


@app.middleware("http")
async def security_and_size_middleware(request: Request, call_next):
    # Enforce request body size limit
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_REQUEST_BODY_BYTES:
        return create_error_response(
            code="REQUEST_TOO_LARGE",
            message=f"Request body exceeds maximum allowed size of {MAX_REQUEST_BODY_BYTES // (1024 * 1024)} MB.",
            status_code=413
        )

    response: Response = await call_next(request)

    # Harden with security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# -----------------------------------------------------------------------------
# CORS Middleware
# -----------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# Global Exception Handlers (Standardized JSON Error Format)
# -----------------------------------------------------------------------------
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# -----------------------------------------------------------------------------
# Static Files Mount for Local Uploads (Development)
# -----------------------------------------------------------------------------
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount(
    "/uploads",
    StaticFiles(directory=settings.UPLOAD_DIR),
    name="uploads"
)

# -----------------------------------------------------------------------------
# Feature Routers (P01 - P21)
# -----------------------------------------------------------------------------
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(farms.router)
app.include_router(uploads.router)
app.include_router(weather.router)
app.include_router(detection.router)
app.include_router(history.router)
app.include_router(prices.router)
app.include_router(soil.router)
app.include_router(expenses.router)
app.include_router(voice.router)
app.include_router(outbreaks.router)


@app.get("/", tags=["System"])
def root():
    """Root welcome endpoint providing basic API metadata."""
    return {
        "project": settings.PROJECT_NAME,
        "version": "1.0.0",
        "documentation": "/docs",
        "health_check": "/health"
    }
