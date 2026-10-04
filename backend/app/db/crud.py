"""All SQL used by the application and scripts."""
from typing import Optional

import numpy as np

from app.db.database import get_pool
from app.db.models import RetrievedChunk


# ---------- Retrieval ----------
def search_chunks(embedding: list[float], crop: Optional[str], top_k: int) -> list[RetrievedChunk]:
    pool = get_pool()
    if pool is None:
        return []
    emb = np.array(embedding, dtype=np.float32)
    sql = """
        SELECT c.id, c.content, d.title, d.source, d.url,
               1 - (c.embedding <=> %(emb)s) AS similarity
        FROM chunks c
        JOIN documents d ON d.id = c.document_id
        WHERE (%(crop)s::text IS NULL OR c.crop = %(crop)s OR c.crop = 'general')
        ORDER BY c.embedding <=> %(emb)s
        LIMIT %(k)s
    """
    with pool.connection() as conn:
        rows = conn.execute(sql, {"emb": emb, "crop": crop, "k": top_k}).fetchall()
    return [RetrievedChunk(id=r[0], content=r[1], title=r[2], source=r[3],
                           url=r[4], similarity=float(r[5])) for r in rows]


# ---------- Sessions & messages ----------
def ensure_session(session_id: str) -> None:
    pool = get_pool()
    with pool.connection() as conn:
        conn.execute(
            """INSERT INTO sessions (id) VALUES (%s)
               ON CONFLICT (id) DO UPDATE SET last_active = now()""",
            (session_id,),
        )


def save_message(session_id: str, role: str, content: str, language: str) -> None:
    pool = get_pool()
    with pool.connection() as conn:
        conn.execute(
            "INSERT INTO messages (session_id, role, content, language) VALUES (%s, %s, %s, %s)",
            (session_id, role, content, language),
        )


def get_history(session_id: str, limit: int) -> list[dict]:
    pool = get_pool()
    with pool.connection() as conn:
        rows = conn.execute(
            """SELECT role, content FROM (
                   SELECT role, content, created_at FROM messages
                   WHERE session_id = %s ORDER BY created_at DESC LIMIT %s
               ) t ORDER BY created_at ASC""",
            (session_id, limit),
        ).fetchall()
    return [{"role": r[0], "content": r[1]} for r in rows]


# ---------- Logs ----------
def insert_request_log(rec: dict) -> None:
    pool = get_pool()
    with pool.connection() as conn:
        conn.execute(
            """INSERT INTO request_logs
               (request_id, session_id, question, answer, language, crop, dimension,
                model, system_version, prompt_version, latency_ms,
                retrieved_chunk_ids, flags, status)
               VALUES (%(request_id)s, %(session_id)s, %(question)s, %(answer)s,
                       %(language)s, %(crop)s, %(dimension)s, %(model)s,
                       %(system_version)s, %(prompt_version)s, %(latency_ms)s,
                       %(retrieved_chunk_ids)s, %(flags)s, %(status)s)""",
            rec,
        )


# ---------- Ingestion ----------
def document_exists(file_hash: str) -> bool:
    pool = get_pool()
    with pool.connection() as conn:
        return conn.execute("SELECT 1 FROM documents WHERE file_hash = %s",
                            (file_hash,)).fetchone() is not None


def insert_document(title: str, source: Optional[str], url: Optional[str],
                    crop: str, language: str, file_hash: str) -> str:
    pool = get_pool()
    with pool.connection() as conn:
        row = conn.execute(
            """INSERT INTO documents (title, source, url, crop, language, file_hash)
               VALUES (%s, %s, %s, %s, %s, %s) RETURNING id""",
            (title, source, url, crop, language, file_hash),
        ).fetchone()
    return str(row[0])


def insert_chunks(document_id: str, crop: str, chunks: list[str],
                  embeddings: list[list[float]]) -> None:
    pool = get_pool()
    rows = [(document_id, i, text, crop, np.array(emb, dtype=np.float32))
            for i, (text, emb) in enumerate(zip(chunks, embeddings))]
    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.executemany(
                """INSERT INTO chunks (document_id, chunk_index, content, crop, embedding)
                   VALUES (%s, %s, %s, %s, %s)""",
                rows,
            )
