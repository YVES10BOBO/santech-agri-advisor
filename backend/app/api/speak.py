"""POST /speak - reads an answer aloud (text-to-speech), returns a WAV file."""
import logging

import httpx
from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field

from app.ai import tts
from app.core.security import verify_api_key

log = logging.getLogger(__name__)
router = APIRouter(tags=["voice"])


class SpeakRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=tts.MAX_CHARS)


@router.post("/speak", dependencies=[Depends(verify_api_key)],
             responses={200: {"content": {"audio/wav": {}}}})
def speak(req: SpeakRequest) -> Response:
    try:
        audio = tts.synthesize(req.text.strip())
    except (httpx.HTTPError, KeyError, IndexError, ValueError) as exc:
        log.exception("Text-to-speech failed.")
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE,
                            "Voice is not available right now.") from exc
    return Response(content=audio, media_type="audio/wav")
