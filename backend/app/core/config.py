from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """
    USALAMA Configuration Settings
    Loaded from environment variables and .env file
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Database Configuration
    database_url: str
    postgres_user: str = "usalama"
    postgres_password: str = "usalama_secret"
    postgres_db: str = "usalama_db"
    postgres_host: str = "localhost"
    postgres_port: int = 5432

    # Environment
    environment: str = "development"

    @property
    def is_development(self) -> bool:
        return self.environment == "development"


@lru_cache
def get_settings() -> Settings:
    """
    Cached settings instance.
    Returns the same Settings object on repeated calls.
    """
    return Settings()
