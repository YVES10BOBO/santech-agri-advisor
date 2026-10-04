"""Retrieves relevant knowledge chunks from pgvector."""
from typing import Optional

from app.config import get_settings
from app.db import crud
from app.db.models import RetrievedChunk


def retrieve(question_embedding: list[float], crop: Optional[str]) -> list[RetrievedChunk]:
    s = get_settings()
    chunks = crud.search_chunks(question_embedding, crop, s.retrieval_top_k)
    if crop and len(chunks) < 2:
        # Too little crop-specific knowledge: search the whole knowledge base.
        chunks = crud.search_chunks(question_embedding, None, s.retrieval_top_k)
    return [c for c in chunks if c.similarity >= s.retrieval_min_similarity]
