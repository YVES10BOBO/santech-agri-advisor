"""Application settings, loaded from backend/.env."""
from functools import lru_cache
from pathlib import Path

from pydantic import AliasChoices, Field
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

    # LLM: any OpenAI-compatible API (OpenAI, Google Gemini, a self-hosted open model).
    # The old OPENAI_* names are still accepted so existing .env files keep working.
    llm_api_key: str = Field("", validation_alias=AliasChoices("LLM_API_KEY", "OPENAI_API_KEY"))
    llm_base_url: str = ""                       # empty = OpenAI
    llm_model: str = Field("gpt-4.1-mini", validation_alias=AliasChoices("LLM_MODEL", "OPENAI_MODEL"))
    # Comma-separated models tried in order when the main one is overloaded or out of quota.
    llm_fallback_models: str = ""
    llm_embedding_model: str = Field(
        "text-embedding-3-small",
        validation_alias=AliasChoices("LLM_EMBEDDING_MODEL", "OPENAI_EMBEDDING_MODEL"))
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
    # Kinyarwanda questions are also searched in English, because most documents are
    # in English and a Kinyarwanda query mostly matches Kinyarwanda text only.
    translate_queries: bool = True
    llm_translate_reasoning_effort: str = "none"
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
    def fallback_model_list(self) -> list[str]:
        return [m.strip() for m in self.llm_fallback_models.split(",") if m.strip()]

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
