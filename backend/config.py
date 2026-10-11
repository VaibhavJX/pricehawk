"""
config.py — Application settings loaded from environment variables.
Uses pydantic-settings for type-safe configuration with .env file support.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """All application configuration, loaded from environment / .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ─── Database ─────────────────────────────────────────────────────────────
    mongodb_uri: str = "mongodb://localhost:27017"
    database_name: str = "pricehawk"

    # ─── Auth / Security ──────────────────────────────────────────────────────
    secret_key: str = "insecure-default-change-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    # ─── SendGrid ─────────────────────────────────────────────────────────────
    sendgrid_api_key: str = ""

    # ─── Telegram ─────────────────────────────────────────────────────────────
    telegram_bot_token: str = ""

    # ─── Web Push (VAPID) ─────────────────────────────────────────────────────
    vapid_private_key: str = ""
    vapid_public_key: str = ""
    vapid_claims_email: str = "admin@pricehawk.app"

    # ─── Frontend ─────────────────────────────────────────────────────────────
    frontend_url: str = "http://localhost:5173"


@lru_cache()
def get_settings() -> Settings:
    """Return a cached Settings instance (instantiated once per process)."""
    return Settings()
