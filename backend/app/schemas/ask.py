"""Request/response models for /ask."""
from typing import Literal, Optional

from pydantic import BaseModel, Field

Language = Literal["rw", "en"]
# "sms" asks for a short answer that fits a feature phone (also used after USSD).
Channel = Literal["api", "web", "sms"]


class FarmerProfile(BaseModel):
    """What the farmer told us about their farm, so advice fits what they have."""
    district: Optional[str] = Field(None, max_length=40)
    farm_size_ha: Optional[float] = Field(None, gt=0, le=100)
    crops: list[Literal["maize", "beans", "potato"]] = Field(default_factory=list, max_length=3)
    irrigation: Optional[bool] = None
    livestock: Optional[bool] = Field(None, description="Keeps cows, goats or chickens (manure).")
    notes: Optional[str] = Field(None, max_length=200,
                                 description="Anything else, e.g. 'hillside, no money for fertilizer'.")

    def is_empty(self) -> bool:
        return not any([self.district, self.farm_size_ha, self.crops,
                        self.irrigation is not None, self.livestock is not None, self.notes])


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000,
                          description="Farmer question in Kinyarwanda or English.")
    language: Optional[Language] = Field(
        None, description="'rw' or 'en'. If omitted, the language is detected.")
    session_id: Optional[str] = Field(
        None, description="Reuse to ask follow-up questions in the same conversation.")
    channel: Channel = Field(
        "api", description="'sms' returns a short answer for feature phones.")
    profile: Optional[FarmerProfile] = Field(
        None, description="Optional farm details; answers are fitted to them.")


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
