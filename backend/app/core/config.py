"""Application settings."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = (
        "postgresql+psycopg://postgres:postgres@localhost:5432/college_bus"
    )
    secret_key: str = "replace-with-long-random-string"
    cors_origins: str = "http://localhost:3000"
    app_env: str = "development"


settings = Settings()
