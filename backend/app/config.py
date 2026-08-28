"""
HimalayaShield backend configuration.
Reads from environment variables (.env). Falls back to safe local defaults
so the demo runs with zero external services (no Supabase, no paid alerting).
"""
from __future__ import annotations

import os
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- Core ---
    APP_NAME: str = "HimalayaShield"
    DEMO_MODE: bool = True
    ENVIRONMENT: str = "development"

    # --- Database ---
    # Defaults to local SQLite so the whole stack runs with zero setup.
    # Set DATABASE_URL to a postgres:// / postgresql+psycopg2:// URL (Docker
    # Compose or Supabase) to use PostgreSQL instead.
    DATABASE_URL: str = "sqlite:///./himalayashield.db"

    # --- Supabase (optional) ---
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # --- CORS ---
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    # --- Alerting (optional; falls back to demo-mode delivery) ---
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_ID: str = ""
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    ALERT_EMAIL: str = ""
    ALERT_COOLDOWN_SECONDS: int = 120

    # --- Simulation ---
    SIMULATION_INTERVAL_SECONDS: float = 2.0

    # --- Risk model ---
    MODEL_VERSION: str = "risk-fusion-v1.0.0-demo"
    STALE_READING_SECONDS: int = 900  # 15 minutes -> data-quality warning

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def telegram_configured(self) -> bool:
        return bool(self.TELEGRAM_BOT_TOKEN and self.TELEGRAM_CHAT_ID)

    @property
    def email_configured(self) -> bool:
        return bool(self.SMTP_HOST and self.SMTP_USERNAME and self.SMTP_PASSWORD and self.ALERT_EMAIL)


@lru_cache
def get_settings() -> Settings:
    return Settings()
