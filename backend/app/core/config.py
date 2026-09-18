"""Application Configuration and Environment Settings."""

import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Supabase / PostgreSQL
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://hlyvnqjhjkhtesasowug.supabase.co")
    SUPABASE_SECRET_KEY: str = os.getenv("SUPABASE_SECRET_KEY", "")
    SUPABASE_PUBLISHABLE_KEY: Optional[str] = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")

    # Gemini AI
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # Telegram Bot
    TELEGRAM_BOT_TOKEN: Optional[str] = os.getenv("TELEGRAM_BOT_TOKEN", "")
    TELEGRAM_MOCK_MODE: bool = True
    ALERT_RECIPIENT_CHAT_IDS: str = "123456789,987654321"

    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "info"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def alert_chat_ids(self) -> List[str]:
        return [cid.strip() for cid in self.ALERT_RECIPIENT_CHAT_IDS.split(",") if cid.strip()]


settings = Settings()
