import uuid
import datetime
from sqlalchemy import Float, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base


class WeatherCache(Base):
    __tablename__ = "weather_cache"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    lat_rounded: Mapped[float] = mapped_column(Float, nullable=False)
    lon_rounded: Mapped[float] = mapped_column(Float, nullable=False)
    temperature: Mapped[float] = mapped_column(Float, nullable=False)
    humidity: Mapped[float] = mapped_column(Float, nullable=False)
    rainfall_mm: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    forecast_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    fetched_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False
    )

    __table_args__ = (
        Index("idx_weather_cache_lat_lon", "lat_rounded", "lon_rounded"),
    )
