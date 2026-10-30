from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Reads environment variables, falling back to apps/api/.env.
    # Field names match variable names case-insensitively: database_url <- DATABASE_URL.
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    cors_origins: list[str] = ["http://localhost:5173"]


@lru_cache
def get_settings() -> Settings:
    # Read the environment once, then reuse the same object for the life of the process.
    return Settings()
