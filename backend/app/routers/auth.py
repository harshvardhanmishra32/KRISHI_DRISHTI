import uuid
from typing import Annotated
from fastapi import APIRouter, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import jwt

from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.auth import SignupRequest, LoginRequest, TokenResponse, UserResponse
from app.services.user_service import user_service
from app.core.security import create_access_token, decode_access_token
from app.core.errors import UnauthorizedError, ForbiddenError

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    db: Session = Depends(get_db)
) -> User:
    """
    FastAPI dependency extracting and validating the Bearer JWT token from the Authorization header.
    """
    if not credentials or not credentials.credentials:
        raise UnauthorizedError("Authentication token is missing. Please log in.")

    token = credentials.credentials
    try:
        payload = decode_access_token(token)
        user_id_str: str | None = payload.get("sub")
        if not user_id_str:
            raise UnauthorizedError("Invalid token claims: subject missing.")
        user_id = uuid.UUID(user_id_str)
    except (jwt.PyJWTError, ValueError):
        raise UnauthorizedError("Token is invalid, malformed, or has expired.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise UnauthorizedError("User linked to this token no longer exists.")
    return user


get_current_active_user = get_current_user


def get_optional_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    db: Session = Depends(get_db)
) -> User | None:
    if not credentials or not credentials.credentials:
        return None
    try:
        payload = decode_access_token(credentials.credentials)
        user_id_str: str | None = payload.get("sub")
        if not user_id_str:
            return None
        user_id = uuid.UUID(user_id_str)
        return db.query(User).filter(User.id == user_id).first()
    except Exception:
        return None


def require_role(*allowed_roles: str):
    """
    Factory dependency checking if current user possesses one of the allowed roles.
    Example: Depends(require_role("officer", "admin"))
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role_val = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
        if user_role_val not in allowed_roles:
            raise ForbiddenError(f"Access forbidden: required role in {list(allowed_roles)}.")
        return current_user
    return role_checker


@router.post(
    "/signup",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new Farmer account"
)
def signup(data: SignupRequest, db: Session = Depends(get_db)):
    """
    Registers a new farmer account with a valid 10-digit Indian phone number.
    Returns HTTP 409 if phone number is already registered.
    """
    user = user_service.register_user(db, data, role=UserRole.FARMER)
    return user


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Login with Phone & Password"
)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticates farmer or officer credentials.
    Returns JWT access token valid for 24 hours.
    """
    user = user_service.authenticate(db, data.phone, data.password)
    role_val = user.role.value if hasattr(user.role, "value") else str(user.role)
    token = create_access_token(
        subject=str(user.id),
        extra_claims={"role": role_val, "name": user.name}
    )
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get Current User Profile"
)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Retrieves the authenticated profile of the currently logged-in user.
    """
    return current_user
