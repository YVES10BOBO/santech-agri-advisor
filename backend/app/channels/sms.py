"""Incoming SMS (Africa's Talking callback): the farmer texts a question, the answer comes back by SMS.

Language is detected from the message. The same phone number keeps one conversation,
so follow-up questions work. Gateway sends form fields: from, to, text, date, id.
"""
from fastapi import APIRouter, BackgroundTasks, Depends, Form, Response

from app.channels.common import answer_by_sms, verify_webhook_token

router = APIRouter(prefix="/channels", tags=["channels"])


@router.post("/sms", dependencies=[Depends(verify_webhook_token)])
def incoming_sms(background: BackgroundTasks,
                 sender: str = Form(..., alias="from"), text: str = Form("")) -> Response:
    if text.strip():
        background.add_task(answer_by_sms, sender, text.strip(), None)
    return Response(status_code=200)
