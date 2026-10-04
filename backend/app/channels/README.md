# Farmer channels

Every channel calls the same `answer_question()` pipeline as the `/ask` API,
so answers stay consistent across channels.

| Channel | File | Status |
|---|---|---|
| USSD (any phone, no internet) | `ussd.py` → `POST /channels/ussd` | Working (Africa's Talking) |
| SMS (any phone) | `sms.py` → `POST /channels/sms` | Working (Africa's Talking) |
| Voice / IVR | `ivr.py` | Planned: needs Kinyarwanda speech-to-text and text-to-speech |
| WhatsApp | `whatsapp.py` | Planned: WhatsApp Business Cloud API, including pest photos |

USSD flow: dial code → choose language → type question → short answer arrives by SMS
(a USSD session times out before the AI answers). SMS answers use `channel="sms"`,
which asks the model for an answer under about 400 characters.

## Africa's Talking setup
1. Create an account at https://account.africastalking.com and open the **Sandbox** app.
2. Settings → API key: copy it into `AT_API_KEY` in `backend/.env` (keep `AT_USERNAME=sandbox`).
3. USSD → Create channel: callback `https://<backend-url>/channels/ussd?token=<CHANNEL_WEBHOOK_TOKEN>`.
4. SMS → Shortcodes → Create: callback `https://<backend-url>/channels/sms?token=<CHANNEL_WEBHOOK_TOKEN>`.
5. Test with the phone simulator: https://simulator.africastalking.com
