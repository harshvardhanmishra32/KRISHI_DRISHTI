import logging
from typing import Any, Dict
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("krishi_drishti.errors")


def create_error_response(code: str, message: str, status_code: int) -> JSONResponse:
    """
    Standardizes every error response in the application to:
    {
        "error": {
            "code": "...",
            "message": "..."
        }
    }
    """
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "message": message
            }
        }
    )


class AppException(Exception):
    """Base application exception with standardized code and status."""
    def __init__(self, code: str, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code


class BadRequestError(AppException):
    def __init__(self, message: str = "Bad request"):
        super().__init__(code="BAD_REQUEST", message=message, status_code=status.HTTP_400_BAD_REQUEST)


class NotFoundError(AppException):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(code="NOT_FOUND", message=message, status_code=status.HTTP_404_NOT_FOUND)


class UnauthorizedError(AppException):
    def __init__(self, message: str = "Not authenticated"):
        super().__init__(code="UNAUTHORIZED", message=message, status_code=status.HTTP_401_UNAUTHORIZED)


class ForbiddenError(AppException):
    def __init__(self, message: str = "Permission denied"):
        super().__init__(code="FORBIDDEN", message=message, status_code=status.HTTP_403_FORBIDDEN)


# Upload specific errors (P06)
class FileTooLargeError(AppException):
    def __init__(self, max_size_mb: int = 5):
        super().__init__(
            code="FILE_TOO_LARGE",
            message=f"Uploaded image exceeds maximum allowable limit of {max_size_mb} MB.",
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
        )


class UnsupportedMediaTypeError(AppException):
    def __init__(self, message: str = "Unsupported media type. Only JPEG, PNG, and WebP are allowed."):
        super().__init__(
            code="UNSUPPORTED_MEDIA_TYPE",
            message=message,
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
        )


class CorruptImageError(AppException):
    def __init__(self, message: str = "Uploaded file is corrupt or not a valid readable image."):
        super().__init__(
            code="CORRUPT_IMAGE",
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST
        )


# Global FastAPI Exception Handlers
async def app_exception_handler(request: Request, exc: Any) -> JSONResponse:
    code = getattr(exc, "code", "APP_ERROR")
    message = getattr(exc, "message", str(exc))
    status_code = getattr(exc, "status_code", status.HTTP_400_BAD_REQUEST)
    logger.warning(f"AppException: [{code}] {message} - Path: {request.url.path}")
    return create_error_response(code=code, message=message, status_code=status_code)


async def http_exception_handler(request: Request, exc: Any) -> JSONResponse:
    status_code = getattr(exc, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
    code = "HTTP_ERROR"
    if status_code == 404:
        code = "NOT_FOUND"
    elif status_code == 401:
        code = "UNAUTHORIZED"
    elif status_code == 403:
        code = "FORBIDDEN"
    elif status_code == 400:
        code = "BAD_REQUEST"
    elif status_code == 413:
        code = "FILE_TOO_LARGE"
    elif status_code == 415:
        code = "UNSUPPORTED_MEDIA_TYPE"

    detail = getattr(exc, "detail", "An HTTP error occurred.")
    message = str(detail) if detail else "An HTTP error occurred."
    logger.warning(f"HTTPException: [{code}] {message} (Status: {status_code}) - Path: {request.url.path}")
    return create_error_response(code=code, message=message, status_code=status_code)


async def validation_exception_handler(request: Request, exc: Any) -> JSONResponse:
    # Summarize validation errors into a clean, human-readable string
    error_messages = []
    errors = getattr(exc, "errors", lambda: [])()
    for error in errors:
        loc = " -> ".join([str(x) for x in error.get("loc", []) if x != "body"])
        msg = error.get("msg", "Invalid value")
        error_messages.append(f"{loc}: {msg}" if loc else msg)

    summary_message = "; ".join(error_messages) if error_messages else "Request validation failed."
    logger.warning(f"ValidationError: {summary_message} - Path: {request.url.path}")
    return create_error_response(
        code="VALIDATION_ERROR",
        message=summary_message,
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    # Always log full traceback on server side, but return safe JSON to the client
    logger.exception(f"Unhandled exception while processing request {request.url.path}: {str(exc)}")
    return create_error_response(
        code="INTERNAL_SERVER_ERROR",
        message="An unexpected internal server error occurred. Please try again later.",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
