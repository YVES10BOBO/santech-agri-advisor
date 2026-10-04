"""Request/response models for /ask."""
from typing import Literal, Optional

from pydantic import BaseModel, Field

Language = Literal["rw", "en"]


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000,
                          description="Farmer question in Kinyarwanda or English.")
    language: Optional[Language] = Field(
        None, description="'rw' or 'en'. If omitted, the language is detected.")
    session_id: Optional[str] = Field(
        None, description="Reuse to ask follow-up questions in the same conversation.")


class Source(BaseModel):
    title: str
    source: Optional[str] = None
    url: Optional[str] = None
    similarity: float


class AskResponse(BaseModel):
    request_id: str
    session_id: str
    answer: str
    language: Language
    crop: Optional[str] = None
    dimension: Optional[str] = None
    sources: list[Source] = []
    model: str
    system_version: str
    prompt_version: str
    latency_ms: int
    flags: list[str] = []
