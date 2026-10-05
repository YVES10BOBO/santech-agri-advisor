"""POST /transcribe - turns a spoken farmer question into text (speech-to-text)."""
import time
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.ai import llm, speech
from app.core.security import verify_api_key

router = APIRouter(tags=["voice"])


class TranscribeResponse(BaseModel):
    text: str
    language: Optional[str]
    model: str
    latency_ms: int


@router.post("/transcribe", response_model=TranscribeResponse,
             dependencies=[Depends(verify_api_key)])
def transcribe(audio: UploadFile = File(..., description="WAV or MP3 recording, max 8 MB."),
               language: Optional[str] = Form(None)) -> TranscribeResponse:
    content_type = (audio.content_type or "").split(";")[0].strip().lower()
    audio_format = speech.ALLOWED_FORMATS.get(content_type)
    if audio_format is None:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Send a WAV or MP3 recording.")
    data = audio.file.read(speech.MAX_AUDIO_BYTES + 1)
    if len(data) > speech.MAX_AUDIO_BYTES:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "Recording is too long.")
    if not data:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "The recording is empty.")
    lang = language if language in ("rw", "en") else None
    start = time.perf_counter()
    text = speech.transcribe(data, audio_format, lang)
    return TranscribeResponse(text=text, language=lang, model=llm.last_model(),
                              latency_ms=int((time.perf_counter() - start) * 1000))
