# Channels (after submission)

Handlers that connect farmer channels to the same `answer_question()` pipeline:

- `ussd.py` – USSD menus via a telecom gateway (e.g. Africa's Talking)
- `sms.py` – SMS questions and short answers
- `ivr.py` – voice calls (needs Kinyarwanda speech-to-text and text-to-speech)
- `whatsapp.py` – WhatsApp Business Cloud API, including pest photos

Each handler converts the channel message into an `AskRequest`,
calls the pipeline, and formats the answer for the channel (e.g. 160-character SMS).
