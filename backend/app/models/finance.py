import uuid
import datetime
import enum
from decimal import Decimal
from sqlalchemy import String, Numeric, Date, DateTime, Text, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


class ExpenseType(str, enum.Enum):
    SEED = "seed"
    FERTILIZER = "fertilizer"
    PESTICIDE = "pesticide"
    LABOUR = "labour"
    IRRIGATION = "irrigation"
    OTHER = "other"


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    farm_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    crop_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("crops.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    expense_type: Mapped[ExpenseType] = mapped_column(
        Enum(ExpenseType, name="expense_type_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=False
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    expense_date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="expenses")
    farm: Mapped["Farm"] = relationship("Farm", back_populates="expenses")
    crop: Mapped["Crop"] = relationship("Crop", back_populates="expenses")


class MarketPrice(Base):
    __tablename__ = "market_prices"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    crop_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("crops.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    mandi_name: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    district: Mapped[str] = mapped_column(String(100), nullable=False)
    price_per_quintal: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    price_date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    fetched_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False
    )

    # Relationships
    crop: Mapped["Crop"] = relationship("Crop", back_populates="market_prices")

    __table_args__ = (
        UniqueConstraint("crop_id", "mandi_name", "price_date", name="uq_crop_mandi_date"),
    )
