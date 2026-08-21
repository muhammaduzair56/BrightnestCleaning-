"""Secure runtime configuration for the BrightNest FastAPI service."""
from __future__ import annotations

from functools import lru_cache
from typing import Annotated, Literal

from pydantic import EmailStr, SecretStr, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict
from sqlalchemy.engine import make_url


class Settings(BaseSettings):
    """Load operational settings only from server-side environment variables."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)

    app_name: str = "BrightNest Booking API"
    app_env: Literal["development", "test", "production"] = "development"
    api_prefix: str = "/api/v1"
    database_url: str
    jwt_secret: SecretStr
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 15
    refresh_token_days: int = 7
    customer_magic_link_minutes: int = 30
    coverage_postcode_prefixes: Annotated[list[str], NoDecode] = ["B"]
    frontend_base_url: str = "http://localhost:5173"
    redis_url: str | None = None
    resend_api_key: SecretStr | None = None
    admin_notification_email: EmailStr
    email_from: str
    bootstrap_admin_email: EmailStr | None = None
    bootstrap_admin_password: SecretStr | None = None
    allowed_origins: Annotated[list[str], NoDecode] = ["http://localhost:5173"]
    trusted_hosts: Annotated[list[str], NoDecode] = ["localhost", "127.0.0.1", "testserver"]
    enable_docs: bool = False
    log_level: str = "INFO"

    @field_validator("allowed_origins", "trusted_hosts", "coverage_postcode_prefixes", mode="before")
    @classmethod
    def split_csv(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, list):
            return value
        return [item.strip() for item in value.split(",") if item.strip()]

    @property
    def sqlalchemy_database_url(self) -> str:
        """Use Psycopg with SQLAlchemy while preserving Neon SSL query parameters."""
        url = make_url(self.database_url)
        if url.drivername in {"postgresql", "postgres"}:
            url = url.set(drivername="postgresql+psycopg")
        return str(url)


@lru_cache
def get_settings() -> Settings:
    return Settings()
