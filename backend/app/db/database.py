"""PostgreSQL (Supabase) connection pool with pgvector support."""
import logging
from typing import Optional

from pgvector.psycopg import register_vector
from psycopg_pool import ConnectionPool

from app.config import get_settings

log = logging.getLogger(__name__)
_pool: Optional[ConnectionPool] = None


def init_pool() -> Optional[ConnectionPool]:
    """Open the pool. Returns None when DATABASE_URL is empty or unreachable."""
    global _pool
    url = get_settings().database_url
    if not url:
        log.warning("DATABASE_URL not set: running without database "
                    "(no retrieval, in-memory sessions, file logs).")
        return None
    try:
        _pool = ConnectionPool(
            url,
            min_size=1,
            max_size=5,
            # prepare_threshold=None is required for Supabase's transaction pooler.
            kwargs={"autocommit": True, "prepare_threshold": None},
            configure=register_vector,
            open=True,
        )
        _pool.wait(timeout=15)
        log.info("Database pool ready.")
    except Exception:
        log.exception("Could not connect to the database; continuing without it.")
        _pool = None
    return _pool


def get_pool() -> Optional[ConnectionPool]:
    return _pool


def close_pool() -> None:
    global _pool
    if _pool is not None:
        _pool.close()
        _pool = None


def database_status() -> str:
    if not get_settings().database_url:
        return "not_configured"
    if _pool is None:
        return "error"
    try:
        with _pool.connection() as conn:
            conn.execute("SELECT 1")
        return "connected"
    except Exception:
        return "error"
