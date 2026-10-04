"""Request/response models for /ask."""
from typing import Literal, Optional

from pydantic import BaseModel, Field

Language = Literal["rw", "en"]
# "sms" asks for a short answer that fits a feature phone (also used after USSD).
Channel = Literal["api", "web", "sms"]


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000,
                          description="Farmer question in Kinyarwanda or English.")
    language: Optional[Language] = Field(
        None, description="'rw' or 'en'. If omitted, the language is detected.")
    session_id: Optional[str] = Field(
        None, description="Reuse to ask follow-up questions in the same conversation.")
    channel: Channel = Field(
        "api", description="'sms' returns a short answer for feature phones.")


class Source(BaseModel):
    title: str
    source: Optional[str] = None
    url: Optional[str] = None
    similarity: float


class PhotoDiagnosis(BaseModel):
    """What the image check saw in the farmer's photo (automatic; may be wrong)."""
    is_plant: bool
    crop: Optional[str] = None
    problem: str
    alternatives: list[str] = []
    confidence: Literal["high", "medium", "low"]
    symptoms: str = ""


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
    photo: Optional[PhotoDiagnosis] = None
