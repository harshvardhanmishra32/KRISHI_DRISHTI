"""Initial migration for Krishi Drishti 12 tables

Revision ID: 0001_initial
Revises: 
Create Date: 2026-11-13 11:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import geoalchemy2

# revision identifiers, used by Alembic.
revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Enable PostGIS Extension
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis;")

    # 2. Table: users
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("phone", sa.String(length=15), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("preferred_language", sa.String(length=10), server_default="hi", nullable=False),
        sa.Column(
            "role",
            sa.Enum("farmer", "officer", "admin", name="user_role_enum"),
            server_default="farmer",
            nullable=False
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_users_phone", "users", ["phone"], unique=True)

    # 3. Table: farms
    op.create_table(
        "farms",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("farm_name", sa.String(length=100), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column(
            "location",
            geoalchemy2.types.Geography(geometry_type="POINT", srid=4326, from_text="ST_GeogFromText", name="geography", spatial_index=False),
            nullable=False
        ),
        sa.Column("area_acres", sa.Float(), nullable=False),
        sa.Column("state", sa.String(length=100), nullable=False),
        sa.Column("district", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_farms_user_id", "farms", ["user_id"])
    op.create_index("ix_farms_state", "farms", ["state"])
    op.create_index("ix_farms_district", "farms", ["district"])
    op.create_index("idx_farms_location", "farms", ["location"], postgresql_using="gist")

    # 4. Table: crops
    op.create_table(
        "crops",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("scientific_name", sa.String(length=150), nullable=True),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("season", sa.String(length=50), nullable=False),
        sa.Column("ideal_soil_type", sa.String(length=100), nullable=False),
        sa.Column("water_requirement_mm", sa.Float(), nullable=True),
        sa.Column("ideal_ph_min", sa.Float(), nullable=True),
        sa.Column("ideal_ph_max", sa.Float(), nullable=True),
        sa.Column("typical_npk", sa.String(length=50), nullable=True),
    )
    op.create_index("ix_crops_name", "crops", ["name"], unique=True)

    # 5. Table: diseases
    op.create_table(
        "diseases",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("crop_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("crops.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("causal_organism", sa.String(length=100), nullable=True),
        sa.Column("symptoms", sa.Text(), nullable=False),
        sa.Column("severity_level", sa.String(length=50), server_default="medium", nullable=False),
        sa.Column("model_class_name", sa.String(length=100), nullable=False),
    )
    op.create_index("ix_diseases_crop_id", "diseases", ["crop_id"])
    op.create_index("ix_diseases_name", "diseases", ["name"])
    op.create_index("ix_diseases_model_class_name", "diseases", ["model_class_name"], unique=True)

    # 6. Table: treatments
    op.create_table(
        "treatments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("disease_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("diseases.id", ondelete="CASCADE"), nullable=False),
        sa.Column("fertilizer_recommendation", sa.Text(), nullable=True),
        sa.Column("pesticide_recommendation", sa.Text(), nullable=True),
        sa.Column("organic_option", sa.Text(), nullable=True),
        sa.Column("dosage", sa.Text(), nullable=True),
        sa.Column("application_method", sa.Text(), nullable=True),
        sa.Column("safety_note", sa.Text(), nullable=False),
    )
    op.create_index("ix_treatments_disease_id", "treatments", ["disease_id"])

    # 7. Table: disease_reports
    op.create_table(
        "disease_reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("farm_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("farms.id", ondelete="SET NULL"), nullable=True),
        sa.Column("crop_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("crops.id", ondelete="CASCADE"), nullable=False),
        sa.Column("disease_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("diseases.id", ondelete="SET NULL"), nullable=True),
        sa.Column("image_path", sa.String(length=500), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column(
            "detection_mode",
            sa.Enum("online", "offline", name="detection_mode_enum"),
            server_default="online",
            nullable=False
        ),
        sa.Column("is_simulated", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column(
            "location",
            geoalchemy2.types.Geography(geometry_type="POINT", srid=4326, from_text="ST_GeogFromText", name="geography", spatial_index=False),
            nullable=True
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_disease_reports_user_id", "disease_reports", ["user_id"])
    op.create_index("ix_disease_reports_farm_id", "disease_reports", ["farm_id"])
    op.create_index("ix_disease_reports_crop_id", "disease_reports", ["crop_id"])
    op.create_index("ix_disease_reports_disease_id", "disease_reports", ["disease_id"])
    op.create_index("ix_disease_reports_created_at", "disease_reports", ["created_at"])
    op.create_index("idx_disease_reports_location", "disease_reports", ["location"], postgresql_using="gist")

    # 8. Table: soil_records
    op.create_table(
        "soil_records",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("farm_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("farms.id", ondelete="CASCADE"), nullable=False),
        sa.Column("soil_type", sa.String(length=100), nullable=False),
        sa.Column("ph", sa.Float(), nullable=False),
        sa.Column("nitrogen", sa.Float(), nullable=False),
        sa.Column("phosphorus", sa.Float(), nullable=False),
        sa.Column("potassium", sa.Float(), nullable=False),
        sa.Column("organic_carbon", sa.Float(), nullable=True),
        sa.Column("test_date", sa.Date(), nullable=False),
        sa.Column(
            "source",
            sa.Enum("ai_estimate", "lab_test", name="soil_source_enum"),
            server_default="ai_estimate",
            nullable=False
        ),
    )
    op.create_index("ix_soil_records_farm_id", "soil_records", ["farm_id"])

    # 9. Table: expenses
    op.create_table(
        "expenses",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("farm_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("farms.id", ondelete="CASCADE"), nullable=False),
        sa.Column("crop_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("crops.id", ondelete="CASCADE"), nullable=False),
        sa.Column(
            "expense_type",
            sa.Enum("seed", "fertilizer", "pesticide", "labour", "irrigation", "other", name="expense_type_enum"),
            nullable=False
        ),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("expense_date", sa.Date(), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
    )
    op.create_index("ix_expenses_user_id", "expenses", ["user_id"])
    op.create_index("ix_expenses_farm_id", "expenses", ["farm_id"])
    op.create_index("ix_expenses_crop_id", "expenses", ["crop_id"])

    # 10. Table: market_prices
    op.create_table(
        "market_prices",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("crop_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("crops.id", ondelete="CASCADE"), nullable=False),
        sa.Column("mandi_name", sa.String(length=100), nullable=False),
        sa.Column("state", sa.String(length=100), nullable=False),
        sa.Column("district", sa.String(length=100), nullable=False),
        sa.Column("price_per_quintal", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("price_date", sa.Date(), nullable=False),
        sa.Column("fetched_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("crop_id", "mandi_name", "price_date", name="uq_crop_mandi_date")
    )
    op.create_index("ix_market_prices_crop_id", "market_prices", ["crop_id"])

    # 11. Table: weather_cache
    op.create_table(
        "weather_cache",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("lat_rounded", sa.Float(), nullable=False),
        sa.Column("lon_rounded", sa.Float(), nullable=False),
        sa.Column("temperature", sa.Float(), nullable=False),
        sa.Column("humidity", sa.Float(), nullable=False),
        sa.Column("rainfall_mm", sa.Float(), server_default="0.0", nullable=False),
        sa.Column("forecast_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("fetched_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("idx_weather_cache_lat_lon", "weather_cache", ["lat_rounded", "lon_rounded"])

    # 12. Table: outbreak_alerts
    op.create_table(
        "outbreak_alerts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("disease_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("diseases.id", ondelete="CASCADE"), nullable=False),
        sa.Column("state", sa.String(length=100), nullable=False),
        sa.Column("district", sa.String(length=100), nullable=False),
        sa.Column(
            "centroid",
            geoalchemy2.types.Geography(geometry_type="POINT", srid=4326, from_text="ST_GeogFromText", name="geography", spatial_index=False),
            nullable=True
        ),
        sa.Column("report_count", sa.Integer(), server_default="1", nullable=False),
        sa.Column(
            "alert_level",
            sa.Enum("low", "medium", "high", name="alert_level_enum"),
            server_default="medium",
            nullable=False
        ),
        sa.Column(
            "status",
            sa.Enum("active", "resolved", name="alert_status_enum"),
            server_default="active",
            nullable=False
        ),
        sa.Column("window_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("window_end", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_simulated", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_outbreak_alerts_disease_id", "outbreak_alerts", ["disease_id"])
    op.create_index("ix_outbreak_alerts_state", "outbreak_alerts", ["state"])
    op.create_index("ix_outbreak_alerts_district", "outbreak_alerts", ["district"])
    op.create_index("idx_outbreak_alerts_centroid", "outbreak_alerts", ["centroid"], postgresql_using="gist")

    # 13. Table: voice_queries
    op.create_table(
        "voice_queries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("query_text", sa.Text(), nullable=False),
        sa.Column("language", sa.String(length=10), server_default="hi", nullable=False),
        sa.Column("response_text", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_voice_queries_user_id", "voice_queries", ["user_id"])


def downgrade() -> None:
    # Drop tables in reverse topological order
    op.drop_table("voice_queries")
    op.drop_table("outbreak_alerts")
    op.drop_table("weather_cache")
    op.drop_table("market_prices")
    op.drop_table("expenses")
    op.drop_table("soil_records")
    op.drop_table("disease_reports")
    op.drop_table("treatments")
    op.drop_table("diseases")
    op.drop_table("crops")
    op.drop_table("farms")
    op.drop_table("users")

    # Drop enums
    op.execute("DROP TYPE IF EXISTS alert_status_enum;")
    op.execute("DROP TYPE IF EXISTS alert_level_enum;")
    op.execute("DROP TYPE IF EXISTS expense_type_enum;")
    op.execute("DROP TYPE IF EXISTS soil_source_enum;")
    op.execute("DROP TYPE IF EXISTS detection_mode_enum;")
    op.execute("DROP TYPE IF EXISTS user_role_enum;")
