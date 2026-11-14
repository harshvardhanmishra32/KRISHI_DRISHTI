import logging
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

logger = logging.getLogger("krishi_drishti.db")

DATABASE_URL = settings.get_database_url()

# SQLAlchemy 2.0 Sync Engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a transactional database session per request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> tuple[bool, str]:
    """
    Tests direct database connection and checks if PostGIS extension is accessible.
    Returns (is_connected: bool, status_details: str).
    """
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1;"))
            result.scalar()
            # Try querying PostGIS version if available
            try:
                postgis_version = connection.execute(text("SELECT PostGIS_Version();")).scalar()
                return True, f"Connected to PostgreSQL (PostGIS: {postgis_version})"
            except Exception:
                return True, "Connected to PostgreSQL"
    except Exception as exc:
        logger.error(f"Database connection error: {exc}")
        return False, str(exc)
