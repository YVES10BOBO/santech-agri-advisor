# API documentation

Base URL: provided to C4IR at onboarding. Interactive docs: `GET /docs`.

## Authentication
Send the access key in every request (all endpoints except `/health`, `/version` and the channel callbacks):
```
X-API-Key: <key provided by SAN TECH>
```

## POST /ask
Ask a farmer question in Kinyarwanda or English. Reuse `session_id` for follow-up questions.

Request:
```json
{
  "question": "Nakoresha ifumbire ingana iki ku birayi mu murima wanjye muto?",
  "language": "rw",
  "session_id": null
}
```
- `language` is optional (`rw` or `en`); it is detected when omitted.
- `channel` is optional: `api` (default) or `sms` for a short answer that fits a basic phone.
- `profile` is optional: the farmer's own farm details, so the answer fits what they have
  (rubric: constraint adherence, relevance and context). All fields are optional:
  ```json
  {"district": "Nyabihu", "farm_size_ha": 0.2, "crops": ["potato"],
   "irrigation": false, "livestock": true, "notes": "little money for fertilizer"}
  ```
  Personalised answers are never cached and carry the flag `profile`.

Response:
```json
{
  "request_id": "6f1c…",
  "session_id": "a2b9…",
  "answer": "…",
  "language": "rw",
  "crop": "potato",
  "dimension": "fertilizer_inputs",
  "sources": [
    {"title": "Guhinga neza ibirayi mu Rwanda", "source": "CIP / RAB", "url": "…", "similarity": 0.73},
    {"title": "Smart Fertilizer Recommendations for Potato in Rwanda (2024)", "source": "RAB / CGIAR", "url": "…", "similarity": 0.653}
  ],
  "model": "gemini-3.1-flash-lite",
  "system_version": "0.1.0",
  "prompt_version": "p-0.5.0",
  "latency_ms": 7404,
  "flags": ["query_translated"]
}
```
- `model` is the model that actually produced this answer (the main model or a fallback).
- `dimension` is one of the 8 C4IR advisory dimensions, when detected.
- `flags` explain how the answer was produced, e.g. `query_translated` (Kinyarwanda question
  also searched in English), `no_sources`, `ppe_note_added`, `retrieval_failed:*`, `fallback:*`.

Errors: `401` missing or wrong API key, `422` invalid request (e.g. empty question).

## POST /ask-image (photo of a sick plant)
`multipart/form-data`: `image` (JPEG/PNG/WebP, max 6 MB), optional `question`, `language`,
`session_id`, `profile` (the JSON above, as text). The vision model names the likely pest or
disease, then the normal grounded answer follows. The response is the `/ask` response plus
`photo`: `{is_plant, crop, problem, alternatives, confidence, symptoms}`.

## POST /transcribe (speech-to-text, optional voice layer)
`multipart/form-data`: `audio` (WAV), `language` (`rw` or `en`). Returns `{"text", "latency_ms"}`.

## POST /speak (text-to-speech, optional voice layer)
JSON `{"text": "...", "language": "rw"}`. Returns `audio/wav`; `503` if the voice service is down.

## GET /health
Readiness check before each benchmark run. `ready: true` means the system can answer.
```json
{"status": "ok", "ready": true, "llm_configured": true, "database": "connected", "system_version": "0.1.0"}
```

## GET /version
Returns the system, model, embedding model and prompt versions, so every score can be tied
to the exact version that produced it.

## Farmer channels (not part of the benchmark)
- `POST /channels/ussd`: Africa's Talking USSD callback (menu → question → answer by SMS).
- `POST /channels/sms`: Africa's Talking incoming SMS callback (answer by SMS).
Both require `?token=<CHANNEL_WEBHOOK_TOKEN>` when that setting is configured.

## Dashboards (not part of the benchmark)
- `GET /insights?days=30`: MINAGRI/RAB view: questions per day, by crop, topic, language and
  channel, pests found in photos, knowledge gaps, latest questions, field reports and
  escalations. Anonymous: no names or phone numbers.
- Extension officer tools (need migration `004_extension_tables.sql`):
  - `GET /extension/summary?officer=` · `GET /extension/records?officer=` · `POST /extension/records`
  - `GET /extension/escalations?officer=&status=` · `POST /extension/escalations`
  - `PATCH /extension/escalations/{id}` `{"status": "open|reviewing|resolved", "response": "..."}`
    (used by MINAGRI/RAB to reply)
  - `GET /extension/knowledge`: the documents in the knowledge base (refresher)
  Field records refuse phone or ID numbers (`422`); farmers are referred to by a code.
