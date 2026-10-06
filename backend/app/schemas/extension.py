"""Request models for the extension officer tools."""
from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator

Crop = Literal["maize", "beans", "potato", "other"]
Dimension = Literal["fertilizer_inputs", "seeds_planting", "pest_disease", "weeds",
                    "soil_water_fertility", "post_harvest", "weather", "government_programs",
                    "livestock", "market_access", "other"]


def _no_phone_number(value: Optional[str]) -> Optional[str]:
    # Farmers are referred to by a code or first name; phone numbers are personal data.
    if value and sum(ch.isdigit() for ch in value) >= 9:
        raise ValueError("Do not store phone numbers or ID numbers; use a farmer code.")
    return value


class FieldRecordIn(BaseModel):
    officer: str = Field(..., min_length=2, max_length=60)
    farmer_ref: Optional[str] = Field(None, max_length=40,
                                      description="Farmer code or first name, no phone number.")
    district: Optional[str] = Field(None, max_length=40)
    sector: Optional[str] = Field(None, max_length=40)
    crop: Optional[Crop] = None
    dimension: Optional[Dimension] = None
    problem: str = Field(..., min_length=3, max_length=1000)
    advice: Optional[str] = Field(None, max_length=2000)
    follow_up_date: Optional[date] = None

    _check_ref = field_validator("farmer_ref")(_no_phone_number)


class EscalationIn(BaseModel):
    officer: str = Field(..., min_length=2, max_length=60)
    district: Optional[str] = Field(None, max_length=40)
    sector: Optional[str] = Field(None, max_length=40)
    crop: Optional[Crop] = None
    dimension: Optional[Dimension] = None
    issue: str = Field(..., min_length=5, max_length=1500)
    farmers_affected: Optional[int] = Field(None, ge=0, le=1_000_000)
    severity: Literal["low", "medium", "high"] = "medium"


class EscalationUpdate(BaseModel):
    status: Literal["open", "reviewing", "resolved"]
    response: Optional[str] = Field(None, max_length=1500,
                                    description="Reply from MINAGRI/RAB to the officer.")
