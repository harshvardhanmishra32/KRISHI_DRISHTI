import uuid
from sqlalchemy import String, Float, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


class Crop(Base):
    __tablename__ = "crops"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    scientific_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    season: Mapped[str] = mapped_column(String(50), nullable=False)
    ideal_soil_type: Mapped[str] = mapped_column(String(100), nullable=False)
    water_requirement_mm: Mapped[float | None] = mapped_column(Float, nullable=True)
    ideal_ph_min: Mapped[float | None] = mapped_column(Float, nullable=True)
    ideal_ph_max: Mapped[float | None] = mapped_column(Float, nullable=True)
    typical_npk: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Relationships
    diseases: Mapped[list["Disease"]] = relationship(
        "Disease",
        back_populates="crop",
        cascade="all, delete-orphan"
    )
    disease_reports: Mapped[list["DiseaseReport"]] = relationship(
        "DiseaseReport",
        back_populates="crop"
    )
    expenses: Mapped[list["Expense"]] = relationship(
        "Expense",
        back_populates="crop"
    )
    market_prices: Mapped[list["MarketPrice"]] = relationship(
        "MarketPrice",
        back_populates="crop",
        cascade="all, delete-orphan"
    )


class Disease(Base):
    __tablename__ = "diseases"

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
    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    causal_organism: Mapped[str | None] = mapped_column(String(100), nullable=True)
    symptoms: Mapped[str] = mapped_column(Text, nullable=False)
    severity_level: Mapped[str] = mapped_column(String(50), default="medium", nullable=False)
    model_class_name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)

    # Relationships
    crop: Mapped["Crop"] = relationship("Crop", back_populates="diseases")
    treatments: Mapped[list["Treatment"]] = relationship(
        "Treatment",
        back_populates="disease",
        cascade="all, delete-orphan"
    )
    disease_reports: Mapped[list["DiseaseReport"]] = relationship(
        "DiseaseReport",
        back_populates="disease"
    )
    outbreak_alerts: Mapped[list["OutbreakAlert"]] = relationship(
        "OutbreakAlert",
        back_populates="disease"
    )


class Treatment(Base):
    __tablename__ = "treatments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    disease_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("diseases.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    fertilizer_recommendation: Mapped[str | None] = mapped_column(Text, nullable=True)
    pesticide_recommendation: Mapped[str | None] = mapped_column(Text, nullable=True)
    organic_option: Mapped[str | None] = mapped_column(Text, nullable=True)
    dosage: Mapped[str | None] = mapped_column(Text, nullable=True)
    application_method: Mapped[str | None] = mapped_column(Text, nullable=True)
    safety_note: Mapped[str] = mapped_column(
        Text,
        default="Follow the product label and confirm the dose with your local agriculture officer or Krishi Vigyan Kendra before spraying.",
        nullable=False
    )

    # Relationships
    disease: Mapped["Disease"] = relationship("Disease", back_populates="treatments")
