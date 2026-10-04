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

    # LLM (OpenAI or any OpenAI-compatible API, e.g. Google Gemini, self-hosted model)
    openai_api_key: str = ""
    llm_base_url: str = ""                       # empty = OpenAI
    openai_model: str = "gpt-4.1-mini"          # set to the model you selected
    openai_embedding_model: str = "text-embedding-3-small"
    embedding_dim: int = 1536                    # must match database/migrations/002
    llm_temperature: float = 0.2                 # set to -1 for models that reject temperature
    llm_timeout_seconds: float = 45.0
    # Thinking before answering: low | medium | high | none. Empty = provider default.
    # Lower is faster; Gemini 3.x default thinking can take ~30 s per answer.
    llm_reasoning_effort: str = ""

    # Database (Supabase PostgreSQL + pgvector). Empty = run without database.
    database_url: str = ""

    # Security: key C4IR must send in the X-API-Key header. Empty = open (dev only).
    api_access_key: str = ""

    # Retrieval
    retrieval_top_k: int = 5
    retrieval_min_similarity: float = 0.25

    # Conversation memory
    history_turns: int = 6

    # Farmer channels: USSD and SMS through Africa's Talking.
    # Empty AT_API_KEY = SMS replies are only written to the log (development).
    at_username: str = "sandbox"
    at_api_key: str = ""
    at_sender_id: str = ""                       # short code / sender name, if assigned
    # Secret added to the callback URLs as ?token=..., so only the gateway can call them.
    channel_webhook_token: str = ""

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
