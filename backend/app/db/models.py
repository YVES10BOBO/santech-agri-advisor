"""Lightweight data structures returned by database queries."""
from dataclasses import dataclass
from typing import Optional


@dataclass
class RetrievedChunk:
    id: int
    content: str
    title: str
    source: Optional[str]
    url: Optional[str]
    similarity: float
