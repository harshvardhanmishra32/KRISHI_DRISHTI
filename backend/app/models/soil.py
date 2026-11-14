import uuid
import datetime
import enum
from sqlalchemy import String, Float, DateTime, Date, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


class SoilSource(str, enum.Enum):
    AI_ESTIMATE = "ai_estimate"
    LAB_TEST = "lab_test"


class SoilRecord(Base):
    __tablename__ = "soil_records"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    farm_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    soil_type: Mapped[str] = mapped_column(String(100), nullable=False)
    ph: Mapped[float] = mapped_column(Float, nullable=False)
    nitrogen: Mapped[float] = mapped_column(Float, nullable=False)
    phosphorus: Mapped[float] = mapped_column(Float, nullable=False)
    potassium: Mapped[float] = mapped_column(Float, nullable=False)
    organic_carbon: Mapped[float | None] = mapped_column(Float, nullable=True)
    test_date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    source: Mapped[SoilSource] = mapped_column(
        Enum(SoilSource, name="soil_source_enum", values_callable=lambda x: [e.value for e in x]),
        default=SoilSource.AI_ESTIMATE,
        nullable=False
    )

    # Relationships
    farm: Mapped["Farm"] = relationship("Farm", back_populates="soil_records")
