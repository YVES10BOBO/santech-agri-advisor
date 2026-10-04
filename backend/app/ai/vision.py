"""Photo diagnosis: a vision model describes a crop photo (crop, likely problem, symptoms).

The description is then answered by the normal pipeline (retrieval, Rwanda rules,
guardrails), so photo answers follow the same safety rules as text answers.
"""
import base64
import json
import logging
import re
from dataclasses import dataclass, field
from typing import Optional

from app.ai import llm

log = logging.getLogger(__name__)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_BYTES = 6 * 1024 * 1024

_PROMPT = """You are a plant health expert for smallholder farms in Rwanda
(mainly maize, beans and Irish potatoes). Look at the photo and reply with JSON only:
{"is_plant": true, "crop": "maize", "problem": "fall armyworm",
 "alternatives": ["stem borer"], "confidence": "medium",
 "symptoms": "ragged holes in young leaves and sawdust-like droppings in the whorl"}
Rules:
- "problem": the most likely pest, disease or nutrient deficiency, with its common English
  name; "healthy" if the plant looks healthy; "unclear" if the photo does not show enough.
- "confidence": high, medium or low. Use low when the photo is blurry, far away or the
  symptoms fit several causes.
- "is_plant": false if the photo does not show a crop or plant.
- Describe only what you can see. Do not guess the farmer's location or treatments."""


@dataclass
class PhotoDiagnosis:
    is_plant: bool = True
    crop: Optional[str] = None
    problem: str = "unclear"
    alternatives: list[str] = field(default_factory=list)
    confidence: str = "low"
    symptoms: str = ""

    def as_context(self) -> str:
        """Text given to the advisor model (and used for document search)."""
        alts = ", ".join(self.alternatives) or "none given"
        return (f"PHOTO ANALYSIS (automatic, may be wrong): crop: {self.crop or 'unknown'}; "
                f"most likely problem: {self.problem} (confidence: {self.confidence}); "
                f"other possible causes: {alts}; visible symptoms: {self.symptoms}")


def _parse(text: str) -> PhotoDiagnosis:
    match = re.search(r"\{.*\}", text, re.S)
    data = json.loads(match.group(0)) if match else {}
    confidence = str(data.get("confidence", "low")).lower()
    return PhotoDiagnosis(
        is_plant=bool(data.get("is_plant", True)),
        crop=(data.get("crop") or None),
        problem=str(data.get("problem") or "unclear"),
        alternatives=[str(a) for a in (data.get("alternatives") or [])][:3],
        confidence=confidence if confidence in ("high", "medium", "low") else "low",
        symptoms=str(data.get("symptoms") or ""),
    )


def diagnose(image: bytes, mime_type: str) -> PhotoDiagnosis:
    encoded = base64.b64encode(image).decode("ascii")
    messages = [{"role": "user", "content": [
        {"type": "text", "text": _PROMPT},
        {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{encoded}"}},
    ]}]
    raw = llm.chat(messages)
    try:
        return _parse(raw)
    except (ValueError, TypeError):
        log.warning("Could not parse photo diagnosis: %s", raw[:300])
        return PhotoDiagnosis(symptoms=raw[:300])
