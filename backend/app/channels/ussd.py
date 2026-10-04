"""USSD menu (Africa's Talking callback). Works on any phone, no internet needed.

Flow: dial code → choose language → type the question → answer arrives by SMS.
The answer is sent by SMS because a USSD session times out before the AI can reply.
Gateway sends form fields: sessionId, serviceCode, phoneNumber, text ("1*my question").
Reply text starting with "CON" keeps the session open, "END" closes it.
"""
from fastapi import APIRouter, BackgroundTasks, Depends, Form
from fastapi.responses import PlainTextResponse

from app.channels.common import answer_by_sms, verify_webhook_token

router = APIRouter(prefix="/channels", tags=["channels"])

# NOTE: Kinyarwanda wording below must be reviewed by a native speaker.
_WELCOME = ("CON Murakaza neza kuri SAN TECH Umujyanama w'Ubuhinzi\n"
            "Welcome to SAN TECH Farm Advisor\n"
            "1. Kinyarwanda\n2. English")
_ASK = {
    "rw": "CON Andika ikibazo cyawe ku buhinzi:",
    "en": "CON Type your farming question:",
}
_THANKS = {
    "rw": "END Murakoze! Igisubizo kiraza kuri SMS mu kanya gato.",
    "en": "END Thank you! The answer will reach you by SMS shortly.",
}
_INVALID = "END Ihitamo ritemewe / Invalid choice. Ongera ugerageze / Please try again."
_LANG = {"1": "rw", "2": "en"}


@router.post("/ussd", response_class=PlainTextResponse,
             dependencies=[Depends(verify_webhook_token)])
def ussd(background: BackgroundTasks,
         phoneNumber: str = Form(...), text: str = Form(""),
         sessionId: str = Form(""), serviceCode: str = Form("")) -> str:
    if not text:
        return _WELCOME
    choice, _, question = text.partition("*")
    language = _LANG.get(choice)
    if language is None:
        return _INVALID
    if not question.strip():
        return _ASK[language]
    background.add_task(answer_by_sms, phoneNumber, question.strip(), language)
    return _THANKS[language]
