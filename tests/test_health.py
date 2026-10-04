from fastapi.testclient import TestClient

from app.main import app


def test_health_returns_status():
    with TestClient(app) as client:
        r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] in ("ok", "degraded")
    assert "system_version" in body


def test_version_returns_versions():
    with TestClient(app) as client:
        r = client.get("/version")
    assert r.status_code == 200
    assert {"system_version", "model", "prompt_version"} <= r.json().keys()


def test_markdown_is_stripped_from_answers():
    from app.ai.guardrails import strip_markdown
    text = "## Inama\n1. **Nkongwa:** reba *amababi*.\n* Koresha __umuti__ wanditse."
    assert strip_markdown(text) == "Inama\n1. Nkongwa: reba amababi.\n- Koresha umuti wanditse."


def test_current_season_by_month():
    from app.ai.prompts import current_season
    assert current_season(10).startswith("Season A")
    assert current_season(1).startswith("Season A")
    assert current_season(3).startswith("Season B")
    assert current_season(8).startswith("the dry period")


def test_rules_and_excerpts_sent_as_one_system_message():
    from app.ai.context import QuestionContext
    from app.ai.prompts import build_messages
    msgs = build_messages("When do I plant beans?", "en", QuestionContext(), [], [], [])
    system = [m for m in msgs if m["role"] == "system"]
    assert len(system) == 1
    assert "SCOPE" in system[0]["content"] and "KNOWLEDGE EXCERPTS" in system[0]["content"]


def test_sms_answers_get_short_safety_note():
    from app.ai.guardrails import check
    long_answer, _ = check("Tera umuti ku bigori.", "rw", has_sources=True)
    sms_answer, flags = check("Tera umuti ku bigori.", "rw", has_sources=True, channel="sms")
    assert "ppe_note_added" in flags
    assert len(sms_answer) < len(long_answer) and "uturindantoki" in sms_answer
