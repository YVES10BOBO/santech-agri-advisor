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
