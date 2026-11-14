import uuid
from sqlalchemy.orm import Session
from fastapi import status

from app.models.user import User, UserRole
from app.schemas.auth import SignupRequest
from app.core.security import hash_password, verify_password
from app.core.errors import AppException, NotFoundError


class UserService:

    @staticmethod
    def get_by_phone(db: Session, phone: str) -> User | None:
        return db.query(User).filter(User.phone == phone).first()

    @staticmethod
    def get_by_id(db: Session, user_id: uuid.UUID) -> User:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise NotFoundError("User account not found.")
        return user

    @staticmethod
    def register_user(db: Session, user_in: SignupRequest, role: UserRole = UserRole.FARMER) -> User:
        # Check duplicate phone -> Return 409 Conflict
        existing = db.query(User).filter(User.phone == user_in.phone).first()
        if existing:
            raise AppException(
                code="PHONE_ALREADY_REGISTERED",
                message="A user with this mobile number is already registered.",
                status_code=status.HTTP_409_CONFLICT
            )

        hashed_pw = hash_password(user_in.password)
        new_user = User(
            name=user_in.name,
            phone=user_in.phone,
            email=user_in.email,
            password_hash=hashed_pw,
            preferred_language=user_in.preferred_language,
            role=role
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user

    @staticmethod
    def authenticate(db: Session, phone: str, password: str) -> User:
        # Generic error message to prevent account enumeration
        invalid_creds_error = AppException(
            code="INVALID_CREDENTIALS",
            message="Invalid phone number or password.",
            status_code=status.HTTP_401_UNAUTHORIZED
        )

        user = UserService.get_by_phone(db, phone)
        if not user:
            raise invalid_creds_error

        if not verify_password(password, str(user.password_hash)):
            raise invalid_creds_error

        return user


user_service = UserService()
