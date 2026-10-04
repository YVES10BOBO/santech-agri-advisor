"""Orchestrates the full answer pipeline for one farmer question.

question → language → context → history → retrieval → LLM → guardrails → log
"""
import logging
import time
import uuid
from typing import Optional

from app.ai import guardrails, llm, memory, retriever
from app.ai.context import QuestionContext, extract_context
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


def _search(query: str, language: str, ctx: QuestionContext,
            flags: list[str]) -> list[RetrievedChunk]:
    """Knowledge search. Kinyarwanda questions are searched in Kinyarwanda and in English
    (most documents are English); the English text also helps detect crop and topic."""
    queries = [query]
    if language == "rw" and get_settings().translate_queries:
        try:
            english = llm.translate_to_english(query)
        except Exception:
            log.exception("Query translation failed; searching in Kinyarwanda only.")
            english = ""
        if english:
            queries.append(english)
            flags.append("query_translated")
            en_ctx = extract_context(english)
            ctx.crop = ctx.crop or en_ctx.crop
            ctx.dimension = ctx.dimension or en_ctx.dimension
            ctx.season = ctx.season or en_ctx.season
    return retriever.retrieve_many(llm.embed(queries), ctx.crop)


def answer_question(req: AskRequest, photo_note: Optional[str] = None) -> AskResponse:
    """photo_note: the photo diagnosis text when the farmer sent a photo (see vision.py)."""
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
    if photo_note:
        # The photo tells us the crop and problem; it also guides the document search.
        photo_ctx = extract_context(photo_note)
        ctx.crop = photo_ctx.crop or ctx.crop
        ctx.dimension = "pest_disease"
        retrieval_query = f"{question}\n{photo_note}"
    model_question = f"{question}\n\n{photo_note}" if photo_note else question

    chunks: list[RetrievedChunk] = []
    flags: list[str] = [] if req.channel == "api" else [f"channel:{req.channel}"]
    if photo_note:
        flags.append("photo")
    status = "ok"
    answered_by = s.llm_model
    # Short SMS answers are cached separately from full answers.
    cache_lang = f"{language}-sms" if req.channel == "sms" else language
    history_answer = None

    try:
        # Photo answers are never cached: the same words can come with different photos.
        cached = None if history or photo_note else answer_cache.get(question, cache_lang)
        if cached:
            answer, sources = cached
            flags.append("cache_hit")
        else:
            if get_pool() is not None:
                try:
                    chunks = _search(retrieval_query, language, ctx, flags)
                except Exception as exc:
                    # Search failing (e.g. embedding quota) should not block the answer.
                    log.exception("Retrieval failed; answering without knowledge excerpts.")
                    flags.append(f"retrieval_failed:{type(exc).__name__}")
            messages = build_messages(model_question, language, ctx, chunks, history,
                                      find_glossary_terms(question), req.channel)
            raw = llm.chat(messages)
            answered_by = llm.last_model()
            if not raw:
                raise RuntimeError("Empty answer from LLM.")
            answer, guard_flags = guardrails.check(raw, language, has_sources=bool(chunks),
                                                   channel=req.channel)
            # Memory keeps the answer without the added safety/referral notes; otherwise
            # the model copies those notes into every later answer of the conversation.
            history_answer = guardrails.strip_markdown(raw)
            flags.extend(guard_flags)
            sources = _to_sources(chunks)
            if not history and not photo_note:
                answer_cache.put(question, cache_lang, (answer, sources))
    except Exception as exc:
        log.exception("Pipeline failed; returning fallback answer.")
        status = "fallback"
        flags.append(f"fallback:{type(exc).__name__}")
        answer = fallback_answer(language, chunks)
        sources = _to_sources(chunks)

    memory.save_turn(session_id, model_question, history_answer or answer, language)
    latency_ms = int((time.perf_counter() - start) * 1000)

    log_request({
        "request_id": request_id, "session_id": session_id, "question": question,
        "answer": answer, "language": language, "crop": ctx.crop,
        "dimension": ctx.dimension, "model": answered_by,
        "system_version": s.system_version, "prompt_version": PROMPT_VERSION,
        "latency_ms": latency_ms, "retrieved_chunk_ids": [c.id for c in chunks],
        "flags": flags, "status": status,
    })

    return AskResponse(
        request_id=request_id, session_id=session_id, answer=answer, language=language,
        crop=ctx.crop, dimension=ctx.dimension, sources=sources, model=answered_by,
        system_version=s.system_version, prompt_version=PROMPT_VERSION,
        latency_ms=latency_ms, flags=flags,
    )
