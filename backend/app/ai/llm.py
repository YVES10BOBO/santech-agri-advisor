"""LLM client for chat completions and embeddings.

Works with any OpenAI-compatible API (OpenAI, Google Gemini, a self-hosted open model)
by setting LLM_BASE_URL in backend/.env.
"""
from typing import Optional

from openai import OpenAI

from app.config import get_settings

_client: Optional[OpenAI] = None


def get_client() -> OpenAI:
    global _client
    if _client is None:
        s = get_settings()
        if not s.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is not set.")
        _client = OpenAI(api_key=s.openai_api_key, base_url=s.llm_base_url or None,
                         timeout=s.llm_timeout_seconds, max_retries=2)
    return _client


def chat(messages: list[dict], model: Optional[str] = None) -> str:
    s = get_settings()
    kwargs = {"model": model or s.openai_model, "messages": messages}
    if s.llm_temperature >= 0:
        kwargs["temperature"] = s.llm_temperature
    if s.llm_reasoning_effort:
        kwargs["reasoning_effort"] = s.llm_reasoning_effort
    resp = get_client().chat.completions.create(**kwargs)
    return (resp.choices[0].message.content or "").strip()


def embed(texts: list[str]) -> list[list[float]]:
    s = get_settings()
    # Ask for exactly EMBEDDING_DIM values so any embedding model fits the vector column.
    resp = get_client().embeddings.create(model=s.openai_embedding_model, input=texts,
                                          dimensions=s.embedding_dim)
    return [d.embedding for d in resp.data]
