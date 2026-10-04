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


def retrieve_many(embeddings: list[list[float]], crop: Optional[str]) -> list[RetrievedChunk]:
    """Searches with several versions of the question (e.g. Kinyarwanda and English).

    Results are taken in turns from each search: scores are not comparable across
    languages (Kinyarwanda text matching Kinyarwanda text always scores higher), so a
    plain sort would hide the English documents.
    """
    result_lists = [retrieve(emb, crop) for emb in embeddings]
    top_k = get_settings().retrieval_top_k
    merged: list[RetrievedChunk] = []
    seen: set[int] = set()
    for rank in range(max((len(r) for r in result_lists), default=0)):
        for results in result_lists:
            if rank < len(results) and results[rank].id not in seen:
                seen.add(results[rank].id)
                merged.append(results[rank])
    return merged[:top_k]
