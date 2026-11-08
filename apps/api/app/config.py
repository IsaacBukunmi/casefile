from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Reads environment variables, falling back to apps/api/.env.
    # Field names match variable names case-insensitively: database_url <- DATABASE_URL.
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    cors_origins: list[str] = ["http://localhost:5173"]

    clerk_issuer: str
    clerk_jwt_key: str
    clerk_authorized_parties: list[str] = ["http://localhost:5173"]
    allowed_origin_regex: str | None = None

    # The seed's two sample firms, mapped to real Clerk organization IDs so that signing in to
    # one of those orgs shows its sample matters. The defaults keep tests self-contained.
    seed_harlow_org_id: str = "org_harlow"
    seed_northgate_org_id: str = "org_northgate"

    @field_validator("clerk_jwt_key")
    @classmethod
    def restore_newlines(cls, value: str) -> str:
        # Env vars are single lines, so the PEM key's line breaks are written as "\n".
        return value.replace("\\n", "\n")


@lru_cache
def get_settings() -> Settings:
    # Read the environment once, then reuse the same object for the life of the process.
    return Settings()
