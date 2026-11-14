import uuid
import datetime
import enum
from sqlalchemy import String, Float, Boolean, DateTime, ForeignKey, Enum, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geography
from app.db.session import Base


class DetectionMode(str, enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"


class DiseaseReport(Base):
    __tablename__ = "disease_reports"

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
    # Deleting a farm sets farm_id to NULL to preserve historical disease trends & epidemiology statistics
    farm_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("farms.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    crop_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("crops.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    disease_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("diseases.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    image_path: Mapped[str] = mapped_column(String(500), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    detection_mode: Mapped[DetectionMode] = mapped_column(
        Enum(DetectionMode, name="detection_mode_enum", values_callable=lambda x: [e.value for e in x]),
        default=DetectionMode.ONLINE,
        nullable=False
    )
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    location: Mapped[Geography | None] = mapped_column(
        Geography(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
        index=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="disease_reports")
    farm: Mapped["Farm"] = relationship("Farm", back_populates="disease_reports")
    crop: Mapped["Crop"] = relationship("Crop", back_populates="disease_reports")
    disease: Mapped["Disease"] = relationship("Disease", back_populates="disease_reports")
