from fastapi.testclient import TestClient

from app.ai import llm, vision
from app.main import app

FAKE_PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 100


def test_photo_is_diagnosed_then_answered(monkeypatch):
    prompts = []
    monkeypatch.setattr(vision, "diagnose", lambda data, mime: vision.PhotoDiagnosis(
        crop="maize", problem="fall armyworm", alternatives=["stem borer"],
        confidence="medium", symptoms="holes in young leaves"))

    def fake_chat(messages, model=None, reasoning_effort=None):
        prompts.append(messages[-1]["content"])
        return "Birashoboka ko ari nkongwa. Genzura amababi."
    monkeypatch.setattr(llm, "chat", fake_chat)
    with TestClient(app) as client:
        r = client.post("/ask-image", data={"language": "rw"},
                        files={"image": ("leaf.png", FAKE_PNG, "image/png")})
    assert r.status_code == 200
    body = r.json()
    assert body["photo"]["problem"] == "fall armyworm" and body["crop"] == "maize"
    assert body["dimension"] == "pest_disease" and "photo" in body["flags"]
    assert "PHOTO ANALYSIS" in prompts[0]          # the advisor model sees the diagnosis


def test_non_image_upload_is_rejected():
    with TestClient(app) as client:
        r = client.post("/ask-image", files={"image": ("notes.txt", b"hello", "text/plain")})
    assert r.status_code == 415


def test_diagnosis_json_is_parsed_from_model_text():
    d = vision._parse('```json\n{"is_plant": true, "crop": "potato", "problem": "late blight",'
                      ' "confidence": "HIGH", "symptoms": "dark wet patches"}\n```')
    assert d.crop == "potato" and d.problem == "late blight" and d.confidence == "high"
