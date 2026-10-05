"""Speech-to-text: transcribes a farmer's spoken question (Kinyarwanda or English).

Uses the multimodal LLM (audio input). The transcript is shown to the farmer to check
before it is sent as a question, so a recognition mistake never silently becomes a
wrong answer.
"""
import base64
from typing import Optional

from app.ai import llm

ALLOWED_FORMATS = {"audio/wav": "wav", "audio/x-wav": "wav", "audio/wave": "wav",
                   "audio/mpeg": "mp3", "audio/mp3": "mp3"}
MAX_AUDIO_BYTES = 8 * 1024 * 1024        # about 4 minutes of 16 kHz mono WAV

_PROMPT = {
    "rw": ("Transcribe this audio exactly as spoken. The speaker is a Rwandan farmer asking "
           "a farming question, most likely in Kinyarwanda (sometimes mixed with English or "
           "French words). Use standard Kinyarwanda spelling. Do not translate, do not answer "
           "the question, do not add anything. If there is no clear speech, reply with "
           "nothing."),
    "en": ("Transcribe this audio exactly as spoken. The speaker is a farmer asking a farming "
           "question in English. Do not answer the question and do not add anything. If there "
           "is no clear speech, reply with nothing."),
}


def transcribe(audio: bytes, audio_format: str, language: Optional[str]) -> str:
    encoded = base64.b64encode(audio).decode("ascii")
    messages = [{"role": "user", "content": [
        {"type": "text", "text": _PROMPT.get(language or "rw", _PROMPT["rw"])},
        {"type": "input_audio", "input_audio": {"data": encoded, "format": audio_format}},
    ]}]
    return llm.chat(messages).strip().strip('"')
