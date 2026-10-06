"""POST /ask-image - a farmer sends a photo of a sick plant (and optionally a question)."""
import dataclasses
import time
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import ValidationError

from app.ai import vision
from app.ai.language import detect_language
from app.ai.pipeline import answer_question
from app.core.security import verify_api_key
from app.schemas.ask import AskRequest, AskResponse, FarmerProfile, PhotoDiagnosis

router = APIRouter(tags=["advisory"])

# Used when the farmer sends only a photo, without words.
_DEFAULT_QUESTION = {
    "rw": "Iki gihingwa cyanjye kirwaye iki, kandi nakora iki?",
    "en": "What is wrong with my crop in this photo, and what should I do?",
}


@router.post("/ask-image", response_model=AskResponse,
             dependencies=[Depends(verify_api_key)])
def ask_image(image: UploadFile = File(..., description="JPEG, PNG or WebP photo, max 6 MB."),
              question: str = Form("", max_length=2000),
              language: Optional[str] = Form(None),
              session_id: Optional[str] = Form(None),
              profile: Optional[str] = Form(None, max_length=2000,
                                            description="FarmerProfile as JSON (optional).")
              ) -> AskResponse:
    if image.content_type not in vision.ALLOWED_TYPES:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                            "Send a JPEG, PNG or WebP photo.")
    data = image.file.read(vision.MAX_IMAGE_BYTES + 1)
    if len(data) > vision.MAX_IMAGE_BYTES:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "Photo is larger than 6 MB.")
    if not data:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "The photo is empty.")

    farm = None
    if profile:
        try:
            farm = FarmerProfile.model_validate_json(profile)
        except ValidationError:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Invalid profile.")
    question = question.strip()
    lang = language if language in ("rw", "en") else (detect_language(question) if question else "rw")
    start = time.perf_counter()
    diagnosis = vision.diagnose(data, image.content_type)
    vision_ms = int((time.perf_counter() - start) * 1000)

    res = answer_question(
        AskRequest(question=question or _DEFAULT_QUESTION[lang], language=lang,
                   session_id=session_id, profile=farm),
        photo_note=diagnosis.as_context(),
        photo_problem=diagnosis.problem if diagnosis.is_plant else None)
    res.photo = PhotoDiagnosis(**dataclasses.asdict(diagnosis))
    res.latency_ms += vision_ms
    return res
