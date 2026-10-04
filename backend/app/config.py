"""Application settings, loaded from backend/.env."""
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BACKEND_DIR.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env", env_file_encoding="utf-8", extra="ignore"
    )

    # System
    app_name: str = "SAN TECH Agricultural Advisory API"
    system_version: str = "0.1.0"
    environment: str = "development"

    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4.1-mini"          # set to the model you selected
    openai_embedding_model: str = "text-embedding-3-small"
    embedding_dim: int = 1536                    # must match database/migrations/002
    llm_temperature: float = 0.2                 # set to -1 for models that reject temperature
    llm_timeout_seconds: float = 45.0

    # Database (Supabase PostgreSQL + pgvector). Empty = run without database.
    database_url: str = ""

    # Security: key C4IR must send in the X-API-Key header. Empty = open (dev only).
    api_access_key: str = ""

    # Retrieval
    retrieval_top_k: int = 5
    retrieval_min_similarity: float = 0.25

    # Conversation memory
    history_turns: int = 6

    # Misc
    cors_origins: str = "http://localhost:3000"
    log_file: str = "logs/requests.jsonl"
    glossary_path: str = str(PROJECT_ROOT / "data" / "glossary.csv")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
