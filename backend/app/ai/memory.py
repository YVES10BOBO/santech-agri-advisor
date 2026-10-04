"""Conversation history per session, so farmers can ask follow-up questions."""
import logging
from collections import defaultdict, deque

from app.config import get_settings
from app.db import crud
from app.db.database import get_pool

log = logging.getLogger(__name__)

# Fallback store when no database is configured (lost on restart).
_memory: dict[str, deque] = defaultdict(lambda: deque(maxlen=40))


def get_history(session_id: str) -> list[dict]:
    limit = get_settings().history_turns * 2
    if get_pool() is not None:
        try:
            return crud.get_history(session_id, limit)
        except Exception:
            log.exception("Could not read history from database.")
            return []
    return list(_memory[session_id])[-limit:]


def save_turn(session_id: str, question: str, answer: str, language: str) -> None:
    if get_pool() is not None:
        try:
            crud.ensure_session(session_id)
            crud.save_message(session_id, "user", question, language)
            crud.save_message(session_id, "assistant", answer, language)
            return
        except Exception:
            log.exception("Could not save history to database.")
    _memory[session_id].append({"role": "user", "content": question})
    _memory[session_id].append({"role": "assistant", "content": answer})
