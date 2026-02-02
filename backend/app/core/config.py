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

    # Ollama Configuration (Data Sovereignty - NO external APIs)
    ollama_host: str = "http://localhost:11434"
    ollama_model: str = "llama3.2:3b"
    ollama_timeout: int = 600  # 10 minutes for complex forensic analysis
    ollama_temperature: float = 0.1  # Low for forensic precision

    # Prompts Directory
    prompts_dir: str = "app/prompts"

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
