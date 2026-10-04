from fastapi.testclient import TestClient

from app.ai import llm
from app.channels import common
from app.config import get_settings
from app.main import app

PHONE = "+250788000111"


def _ussd(client, text):
    return client.post("/channels/ussd", data={"sessionId": "s1", "serviceCode": "*384#",
                                               "phoneNumber": PHONE, "text": text})


def test_ussd_menu_flow(monkeypatch):
    sent = []
    monkeypatch.setattr(common, "send_sms", lambda phone, msg: sent.append((phone, msg)))
    monkeypatch.setattr(llm, "chat", lambda messages, model=None:
                        "Spray in the evening, wear gloves, follow the label.")
    with TestClient(app) as client:
        assert _ussd(client, "").text.startswith("CON")
        assert "Andika" in _ussd(client, "1").text
        r = _ussd(client, "1*Nkongwa yibasiye ibigori byanjye, nakora iki?")
        assert r.text.startswith("END")
        assert "invalid" in _ussd(client, "9").text.lower()
    assert sent and sent[0][0] == PHONE and "gloves" in sent[0][1]


def test_sms_question_uses_short_channel(monkeypatch):
    sent, prompts = [], []

    def fake_chat(messages, model=None):
        prompts.append(messages[0]["content"])
        return "Plant maize at the start of Season A rains."
    monkeypatch.setattr(llm, "chat", fake_chat)
    monkeypatch.setattr(common, "send_sms", lambda phone, msg: sent.append((phone, msg)))
    with TestClient(app) as client:
        r = client.post("/channels/sms", data={"from": PHONE, "to": "12345",
                                               "text": "When should I plant maize?"})
    assert r.status_code == 200
    assert "CHANNEL: SMS" in prompts[0]
    assert sent[0][0] == PHONE


def test_webhook_token_required_when_set():
    settings = get_settings()
    original = settings.channel_webhook_token
    settings.channel_webhook_token = "secret"
    try:
        with TestClient(app) as client:
            assert _ussd(client, "").status_code == 401
            r = client.post("/channels/ussd?token=secret",
                            data={"phoneNumber": PHONE, "text": ""})
            assert r.status_code == 200
    finally:
        settings.channel_webhook_token = original
