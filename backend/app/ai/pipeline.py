"""Orchestrates the full answer pipeline for one farmer question.

question → language → context → history → retrieval → LLM → guardrails → log
"""
import logging
import time
import uuid

from app.ai import guardrails, llm, memory, retriever
from app.ai.context import extract_context
from app.ai.language import detect_language, find_glossary_terms
from app.ai.prompts import PROMPT_VERSION, build_messages
from app.config import get_settings
from app.core.cache import answer_cache, fallback_answer
from app.core.logger import log_request
from app.db.database import get_pool
from app.db.models import RetrievedChunk
from app.schemas.ask import AskRequest, AskResponse, Source

log = logging.getLogger(__name__)


def _to_sources(chunks: list[RetrievedChunk]) -> list[Source]:
    seen, sources = set(), []
    for c in chunks:
        if c.title not in seen:
            seen.add(c.title)
            sources.append(Source(title=c.title, source=c.source, url=c.url,
                                  similarity=round(c.similarity, 3)))
    return sources


def _valid_uuid(value: str | None) -> str:
    try:
        return str(uuid.UUID(value)) if value else str(uuid.uuid4())
    except ValueError:
        return str(uuid.uuid4())


def answer_question(req: AskRequest) -> AskResponse:
    s = get_settings()
    start = time.perf_counter()
    request_id = str(uuid.uuid4())
    session_id = _valid_uuid(req.session_id)
    question = req.question.strip()

    language = req.language or detect_language(question)
    history = memory.get_history(session_id)

    # Follow-ups like "And how much?" inherit crop/topic from the previous question.
    previous = next((m["content"] for m in reversed(history) if m["role"] == "user"), "")
    ctx = extract_context(question)
    if previous:
        prev_ctx = extract_context(previous)
        ctx.crop = ctx.crop or prev_ctx.crop
        ctx.dimension = ctx.dimension or prev_ctx.dimension
        ctx.season = ctx.season or prev_ctx.season
    retrieval_query = f"{previous}\n{question}" if previous else question

    chunks: list[RetrievedChunk] = []
    flags: list[str] = []
    status = "ok"

    try:
        cached = None if history else answer_cache.get(question, language)
        if cached:
            answer, sources = cached
            flags.append("cache_hit")
        else:
            if get_pool() is not None:
                embedding = llm.embed([retrieval_query])[0]
                chunks = retriever.retrieve(embedding, ctx.crop)
            messages = build_messages(question, language, ctx, chunks, history,
                                      find_glossary_terms(question))
            raw = llm.chat(messages)
            if not raw:
                raise RuntimeError("Empty answer from LLM.")
            answer, guard_flags = guardrails.check(raw, language, has_sources=bool(chunks))
            flags.extend(guard_flags)
            sources = _to_sources(chunks)
            if not history:
                answer_cache.put(question, language, (answer, sources))
    except Exception as exc:
        log.exception("Pipeline failed; returning fallback answer.")
        status = "fallback"
        flags.append(f"fallback:{type(exc).__name__}")
        answer = fallback_answer(language, chunks)
        sources = _to_sources(chunks)

    memory.save_turn(session_id, question, answer, language)
    latency_ms = int((time.perf_counter() - start) * 1000)

    log_request({
        "request_id": request_id, "session_id": session_id, "question": question,
        "answer": answer, "language": language, "crop": ctx.crop,
        "dimension": ctx.dimension, "model": s.openai_model,
        "system_version": s.system_version, "prompt_version": PROMPT_VERSION,
        "latency_ms": latency_ms, "retrieved_chunk_ids": [c.id for c in chunks],
        "flags": flags, "status": status,
    })

    return AskResponse(
        request_id=request_id, session_id=session_id, answer=answer, language=language,
        crop=ctx.crop, dimension=ctx.dimension, sources=sources, model=s.openai_model,
        system_version=s.system_version, prompt_version=PROMPT_VERSION,
        latency_ms=latency_ms, flags=flags,
    )
