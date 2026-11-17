import json
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application Settings managed by Pydantic Settings.
    Loads configurations from environment variables or .env file.
    """
    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Core Application
    PROJECT_NAME: str = "Krishi Drishti API"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "temporary_secret_key_for_initialization_minimum_32_chars"

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key_length(cls, v: str) -> str:
        if v and len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long for security.")
        return v

    # CORS
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, str) and v.startswith("["):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                pass
        return v if isinstance(v, list) else ["http://localhost:3000"]

    # PostgreSQL Database
    POSTGRES_USER: str = "krishi_user"
    POSTGRES_PASSWORD: str = "krishi_secure_password_123"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "krishi_db"
    DATABASE_URL: str = ""

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""
    REDIS_URL: str = ""

    # Uploads & Storage (P06)
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 5
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp"]
    MAX_IMAGE_DIMENSION: int = 1280

    # Weather Module (OpenWeatherMap)
    OPENWEATHER_API_KEY: str = ""
    WEATHER_CACHE_MINUTES: int = 30
    HIGH_HUMIDITY_DISEASE_THRESHOLD: float = 80.0
    SPRAY_MAX_WIND_SPEED: float = 3.0       # m/s
    SPRAY_MAX_RAIN_PROBABILITY: float = 20.0 # percent
    SPRAY_MAX_TEMPERATURE: float = 35.0     # Celsius

    # Gemini AI Chatbot / Advisor
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.1-flash-lite"

    # Live Mandi Prices (Data.gov.in Agmarknet API)
    DATAGOV_API_KEY: str = ""

    # Machine Learning / Disease Detection (P13)
    TFLITE_MODEL_PATH: str = "backend/app/ml/artifacts/model.tflite"
    CLASS_NAMES_PATH: str = "backend/app/ml/artifacts/class_names.json"
    LOW_CONFIDENCE_THRESHOLD: float = 0.70

    def get_database_url(self) -> str:
        """Returns the configured database URL or builds one from components."""
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    def get_redis_url(self) -> str:
        """Returns the configured Redis URL or builds one from components."""
        if self.REDIS_URL:
            return self.REDIS_URL
        auth = f":{self.REDIS_PASSWORD}@" if self.REDIS_PASSWORD else ""
        return f"redis://{auth}{self.REDIS_HOST}:{self.REDIS_PORT}/0"


settings = Settings()
