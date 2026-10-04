from fastapi.testclient import TestClient

from app.ai import llm
from app.ai.context import extract_context
from app.ai.language import detect_language
from app.config import get_settings
from app.main import app


def test_empty_question_rejected():
    with TestClient(app) as client:
        r = client.post("/ask", json={"question": ""})
    assert r.status_code == 422


def test_missing_api_key_rejected():
    settings = get_settings()
    original = settings.api_access_key
    settings.api_access_key = "test-key"
    try:
        with TestClient(app) as client:
            r = client.post("/ask", json={"question": "When should I plant maize?"})
            assert r.status_code == 401
    finally:
        settings.api_access_key = original


def test_ask_with_mocked_llm(monkeypatch):
    monkeypatch.setattr(llm, "chat", lambda messages, model=None:
                        "Use NPK 17-17-17 at planting.\n1. Put it in the furrow.")
    with TestClient(app) as client:
        r = client.post("/ask", json={"question": "Fertilizer for my potatoes?",
                                      "language": "en"})
    assert r.status_code == 200
    body = r.json()
    assert "17-17-17" in body["answer"]
    assert body["crop"] == "potato"
    assert body["language"] == "en"


def test_fallback_when_llm_fails(monkeypatch):
    def boom(messages, model=None):
        raise RuntimeError("LLM down")
    monkeypatch.setattr(llm, "chat", boom)
    with TestClient(app) as client:
        r = client.post("/ask", json={"question": "Ni ryari nkwiye kubagara ibishyimbo byanjye?"})
    assert r.status_code == 200
    body = r.json()
    assert body["language"] == "rw"
    assert any(f.startswith("fallback") for f in body["flags"])


def test_language_and_context_detection():
    assert detect_language("Nakora iki ku bigori byanjye?") == "rw"
    assert detect_language("How do I store my maize?") == "en"
    ctx = extract_context("How do I store maize so it does not get weevils?")
    assert ctx.crop == "maize" and ctx.dimension == "post_harvest"
    assert extract_context("I protect my grain").dimension != "weather"
    assert extract_context("Nakoresha ifumbire ingana iki ku birayi?").crop == "potato"


def test_answers_even_when_retrieval_fails(monkeypatch):
    from app.ai import pipeline

    def no_quota(texts):
        raise RuntimeError("embedding quota reached")
    monkeypatch.setattr(pipeline, "get_pool", lambda: object())
    monkeypatch.setattr(llm, "embed", no_quota)
    monkeypatch.setattr(llm, "chat", lambda messages, model=None: "Plant beans at the start of the rains.")
    monkeypatch.setattr(pipeline.memory, "get_history", lambda session_id: [])
    monkeypatch.setattr(pipeline.memory, "save_turn", lambda *args: None)
    with TestClient(app) as client:
        r = client.post("/ask", json={"question": "When do I plant climbing beans?", "language": "en"})
    body = r.json()
    assert "Plant beans" in body["answer"]
    assert any(f.startswith("retrieval_failed") for f in body["flags"])


def test_kinyarwanda_question_is_also_searched_in_english(monkeypatch):
    from app.ai import pipeline, retriever

    searched = []
    monkeypatch.setattr(pipeline, "get_pool", lambda: object())
    monkeypatch.setattr(llm, "translate_to_english", lambda text: "How much fertilizer for potatoes?")
    monkeypatch.setattr(llm, "embed", lambda texts: [[0.0] for _ in texts])
    monkeypatch.setattr(retriever, "retrieve_many",
                        lambda embs, crop: searched.append((len(embs), crop)) or [])
    monkeypatch.setattr(llm, "chat", lambda messages, model=None, reasoning_effort=None: "Koresha NPK 17-17-17.")
    monkeypatch.setattr(pipeline.memory, "get_history", lambda session_id: [])
    monkeypatch.setattr(pipeline.memory, "save_turn", lambda *args: None)
    with TestClient(app) as client:
        r = client.post("/ask", json={"question": "Nakoresha ifumbire ingana iki?", "language": "rw"})
    body = r.json()
    assert searched == [(2, "potato")]          # Kinyarwanda + English; crop found via English
    assert "query_translated" in body["flags"] and body["crop"] == "potato"


def test_retrieve_many_takes_turns_between_languages(monkeypatch):
    from app.ai import retriever
    from app.db.models import RetrievedChunk

    def chunk(i, sim):
        return RetrievedChunk(id=i, content="", title=f"t{i}", source=None, url=None, similarity=sim)
    rw_hits = [chunk(1, 0.80), chunk(2, 0.79), chunk(3, 0.78)]
    en_hits = [chunk(4, 0.65), chunk(1, 0.64)]
    monkeypatch.setattr(retriever, "retrieve", lambda emb, crop: rw_hits if emb == "rw" else en_hits)
    ids = [c.id for c in retriever.retrieve_many(["rw", "en"], "potato")]
    assert ids == [1, 4, 2, 3]
