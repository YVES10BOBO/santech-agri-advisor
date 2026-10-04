"""LLM client for chat completions and embeddings.

Works with any OpenAI-compatible API (OpenAI, Google Gemini, a self-hosted open model)
by setting LLM_BASE_URL in backend/.env.
"""
import logging
from contextvars import ContextVar
from typing import Optional

from openai import InternalServerError, OpenAI, RateLimitError

from app.config import get_settings

log = logging.getLogger(__name__)

_client: Optional[OpenAI] = None
# Model that produced the most recent chat answer in this request (may be a fallback model).
_last_model: ContextVar[Optional[str]] = ContextVar("last_model", default=None)


def get_client() -> OpenAI:
    global _client
    if _client is None:
        s = get_settings()
        if not s.llm_api_key:
            raise RuntimeError("LLM_API_KEY is not set.")
        _client = OpenAI(api_key=s.llm_api_key, base_url=s.llm_base_url or None,
                         timeout=s.llm_timeout_seconds, max_retries=1)
    return _client


def chat(messages: list[dict], model: Optional[str] = None,
         reasoning_effort: Optional[str] = None) -> str:
    """Asks the main model; if it is overloaded or out of quota, tries the fallback models."""
    s = get_settings()
    models = [model] if model else [s.llm_model, *s.fallback_model_list]
    effort = reasoning_effort or s.llm_reasoning_effort
    for i, name in enumerate(models):
        kwargs = {"model": name, "messages": messages}
        if s.llm_temperature >= 0:
            kwargs["temperature"] = s.llm_temperature
        if effort:
            kwargs["reasoning_effort"] = effort
        try:
            resp = get_client().chat.completions.create(**kwargs)
            _last_model.set(name)
            return (resp.choices[0].message.content or "").strip()
        except (RateLimitError, InternalServerError) as exc:
            if i == len(models) - 1:
                raise
            log.warning("Model %s unavailable (%s); trying %s.",
                        name, type(exc).__name__, models[i + 1])
    return ""


def last_model() -> str:
    """The model that actually answered the last chat call (main or fallback)."""
    return _last_model.get() or get_settings().llm_model


_TRANSLATE_PROMPT = (
    "Translate this Kinyarwanda farming question into English for a document search. "
    "Keep crop, pest, disease and product names. Reply with the English text only.")


def translate_to_english(text: str) -> str:
    """Short, fast translation used only to search English documents."""
    s = get_settings()
    return chat([{"role": "system", "content": _TRANSLATE_PROMPT},
                 {"role": "user", "content": text}],
                reasoning_effort=s.llm_translate_reasoning_effort or None).strip()


def embed(texts: list[str]) -> list[list[float]]:
    s = get_settings()
    # Ask for exactly EMBEDDING_DIM values so any embedding model fits the vector column.
    resp = get_client().embeddings.create(model=s.llm_embedding_model, input=texts,
                                          dimensions=s.embedding_dim)
    return [d.embedding for d in resp.data]
