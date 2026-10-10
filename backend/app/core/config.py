"""Application settings (Stage 1 scaffold)."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://USER:PASSWORD@localhost:5432/college_bus"
    secret_key: str = "replace-with-long-random-string"
    cors_origins: str = "http://localhost:3000"
    ml_service_url: str = "http://localhost:8001"
    ml_service_timeout_seconds: int = 2


settings = Settings()
