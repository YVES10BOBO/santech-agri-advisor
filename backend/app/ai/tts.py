"""Text-to-speech: reads an answer aloud (Kinyarwanda or English) as a WAV file.

Uses Gemini's speech generation (native API: the OpenAI-compatible endpoint has no TTS).
Recent results are cached in memory, so replaying an answer is instant and free.
"""
import base64
import hashlib
import io
import wave
from collections import OrderedDict
from threading import Lock

import httpx

from app.config import get_settings

MAX_CHARS = 2500
_SAMPLE_RATE = 24000          # Gemini TTS returns 24 kHz, 16-bit, mono PCM
_CACHE_ITEMS = 50
_cache: "OrderedDict[str, bytes]" = OrderedDict()
_lock = Lock()


def _pcm_to_wav(pcm: bytes) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(_SAMPLE_RATE)
        w.writeframes(pcm)
    return buf.getvalue()


def synthesize(text: str) -> bytes:
    """Returns WAV audio for the text. Raises httpx.HTTPError if the TTS service fails."""
    s = get_settings()
    key = hashlib.sha256(f"{s.tts_model}|{s.tts_voice}|{text}".encode()).hexdigest()
    with _lock:
        if key in _cache:
            _cache.move_to_end(key)
            return _cache[key]

    r = httpx.post(
        f"{s.tts_base_url}/models/{s.tts_model}:generateContent",
        params={"key": s.tts_api_key or s.llm_api_key},
        timeout=90,
        json={
            "contents": [{"parts": [{"text": text}]}],
            "generationConfig": {
                "responseModalities": ["AUDIO"],
                "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": s.tts_voice}}},
            },
        },
    )
    r.raise_for_status()
    part = r.json()["candidates"][0]["content"]["parts"][0]["inlineData"]
    wav = _pcm_to_wav(base64.b64decode(part["data"]))

    with _lock:
        _cache[key] = wav
        while len(_cache) > _CACHE_ITEMS:
            _cache.popitem(last=False)
    return wav
