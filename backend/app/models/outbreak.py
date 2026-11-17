import datetime
import enum
import uuid
from typing import TYPE_CHECKING

from geoalchemy2 import Geography
from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.crop import Disease


class AlertLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class AlertStatus(str, enum.Enum):
    ACTIVE = "active"
    RESOLVED = "resolved"


class OutbreakAlert(Base):
    __tablename__ = "outbreak_alerts"

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
    state: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    district: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    centroid: Mapped[Geography | None] = mapped_column(
        Geography(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=True
    )
    report_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    alert_level: Mapped[AlertLevel] = mapped_column(
        Enum(AlertLevel, name="alert_level_enum", values_callable=lambda x: [e.value for e in x]),
        default=AlertLevel.MEDIUM,
        nullable=False
    )
    status: Mapped[AlertStatus] = mapped_column(
        Enum(AlertStatus, name="alert_status_enum", values_callable=lambda x: [e.value for e in x]),
        default=AlertStatus.ACTIVE,
        nullable=False
    )
    window_start: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    window_end: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.UTC),
        nullable=False
    )

    # Relationships
    disease: Mapped["Disease"] = relationship("Disease", back_populates="outbreak_alerts")
