"""Shared helpers for farmer channels (USSD, SMS)."""
import logging
import uuid
from typing import Optional

import httpx
from fastapi import HTTPException, Query, status

from app.ai.pipeline import answer_question
from app.config import get_settings
from app.schemas.ask import AskRequest

log = logging.getLogger(__name__)

_AT_SMS_URL = {
    "sandbox": "https://api.sandbox.africastalking.com/version1/messaging",
    "live": "https://api.africastalking.com/version1/messaging",
}
_SESSION_NAMESPACE = uuid.UUID("5d0c7e6a-3b1f-4f0e-9a51-2a7c1c1e5a10")


def verify_webhook_token(token: Optional[str] = Query(default=None)) -> None:
    expected = get_settings().channel_webhook_token
    if expected and token != expected:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")


def session_for_phone(phone: str) -> str:
    """Same phone number = same conversation, so SMS follow-up questions keep context."""
    return str(uuid.uuid5(_SESSION_NAMESPACE, phone.strip()))


def send_sms(phone: str, message: str) -> None:
    s = get_settings()
    if not s.at_api_key:
        log.info("SMS (not sent, AT_API_KEY empty) to %s: %s", phone, message)
        return
    data = {"username": s.at_username, "to": phone, "message": message}
    if s.at_sender_id:
        data["from"] = s.at_sender_id
    url = _AT_SMS_URL["sandbox" if s.at_username == "sandbox" else "live"]
    try:
        r = httpx.post(url, data=data, timeout=20,
                       headers={"apiKey": s.at_api_key, "Accept": "application/json"})
        r.raise_for_status()
    except httpx.HTTPError:
        log.exception("Sending SMS to %s failed.", phone)


def answer_by_sms(phone: str, question: str, language: Optional[str]) -> None:
    """Runs after the gateway has been answered: AI answer, then reply by SMS."""
    res = answer_question(AskRequest(question=question, language=language,
                                     session_id=session_for_phone(phone), channel="sms"))
    send_sms(phone, res.answer)
