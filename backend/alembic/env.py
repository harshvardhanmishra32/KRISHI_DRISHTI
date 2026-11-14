import os
import sys
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.db.session import Base
# Import all models to register them on Base.metadata
import app.models  # noqa: F401
import geoalchemy2  # noqa: F401
try:
    from geoalchemy2 import alembic_helpers
except ImportError:
    alembic_helpers = None

# Alembic Config object
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set database URL dynamically from app settings (.env)
config.set_main_option("sqlalchemy.url", settings.get_database_url())

# Target metadata for autogenerate
target_metadata = Base.metadata

# Ignore PostGIS internal tables and spatial metadata tables
IGNORED_TABLES = {
    "spatial_ref_sys",
    "geometry_columns",
    "geography_columns",
    "raster_columns",
    "raster_overviews",
}


def include_object(object, name, type_, reflected, compare_to):
    """
    Excludes PostGIS system tables and internal objects from Alembic autogenerate.
    """
    if type_ == "table" and name in IGNORED_TABLES:
        return False
    return True


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_object=include_object,
        process_revision_directives=(
            alembic_helpers.writer if alembic_helpers else None
        ),
        render_item=(
            alembic_helpers.render_item if alembic_helpers else None
        ),
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            include_object=include_object,
            process_revision_directives=(
                alembic_helpers.writer if alembic_helpers else None
            ),
            render_item=(
                alembic_helpers.render_item if alembic_helpers else None
            ),
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
