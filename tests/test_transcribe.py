from fastapi.testclient import TestClient

from app.ai import llm
from app.main import app

FAKE_WAV = b"RIFF" + b"\x00" * 100


def test_audio_is_transcribed(monkeypatch):
    seen = []

    def fake_chat(messages, model=None, reasoning_effort=None):
        seen.append(messages[0]["content"])
        return '"Ibirayi byanjye birwaye, nakora iki?"'
    monkeypatch.setattr(llm, "chat", fake_chat)
    with TestClient(app) as client:
        r = client.post("/transcribe", data={"language": "rw"},
                        files={"audio": ("q.wav", FAKE_WAV, "audio/wav")})
    assert r.status_code == 200
    assert r.json()["text"] == "Ibirayi byanjye birwaye, nakora iki?"
    audio_part = seen[0][1]
    assert audio_part["type"] == "input_audio" and audio_part["input_audio"]["format"] == "wav"


def test_unsupported_audio_format_is_rejected():
    with TestClient(app) as client:
        r = client.post("/transcribe", files={"audio": ("q.webm", b"x", "audio/webm")})
    assert r.status_code == 415


def test_speak_returns_wav(monkeypatch):
    from app.ai import tts
    monkeypatch.setattr(tts, "synthesize", lambda text: tts._pcm_to_wav(b"\x00\x00" * 2400))
    with TestClient(app) as client:
        r = client.post("/speak", json={"text": "Muraho, tera ibishyimbo ubu."})
    assert r.status_code == 200 and r.headers["content-type"] == "audio/wav"
    assert r.content[:4] == b"RIFF"


def test_speak_reports_unavailable_voice(monkeypatch):
    import httpx

    from app.ai import tts

    def down(text):
        raise httpx.ConnectError("no network")
    monkeypatch.setattr(tts, "synthesize", down)
    with TestClient(app) as client:
        r = client.post("/speak", json={"text": "Muraho"})
    assert r.status_code == 503
