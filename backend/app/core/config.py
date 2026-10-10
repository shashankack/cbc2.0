"""Application settings."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = (
        "postgresql+pg8000://postgres:postgres@localhost:5432/college_bus"
    )
    secret_key: str = "replace-with-long-random-string"
    cors_origins: str = "http://localhost:3000"
    app_env: str = "development"
    otp_expiry_seconds: int = 300
    otp_max_attempts: int = 5
    otp_request_cooldown_seconds: int = 60
    session_cookie_name: str = "cbc_session"
    session_ttl_seconds: int = 604800
    bootstrap_operator_email: str = "operator@example.com"
    dns_verify_enabled: bool = False
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "noreply@example.com"


settings = Settings()
