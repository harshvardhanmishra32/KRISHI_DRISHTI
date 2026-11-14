import uuid
import datetime
import enum
from sqlalchemy import String, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


class UserRole(str, enum.Enum):
    FARMER = "farmer"
    OFFICER = "officer"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str] = mapped_column(String(15), unique=True, index=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    preferred_language: Mapped[str] = mapped_column(String(10), default="hi", nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role_enum", values_callable=lambda x: [e.value for e in x]),
        default=UserRole.FARMER,
        nullable=False
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False
    )

    # Relationships
    farms: Mapped[list["Farm"]] = relationship(
        "Farm",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    disease_reports: Mapped[list["DiseaseReport"]] = relationship(
        "DiseaseReport",
        back_populates="user"
    )
    expenses: Mapped[list["Expense"]] = relationship(
        "Expense",
        back_populates="user"
    )
    voice_queries: Mapped[list["VoiceQuery"]] = relationship(
        "VoiceQuery",
        back_populates="user"
    )
