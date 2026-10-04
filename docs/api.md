# API documentation

Base URL: provided to C4IR at onboarding. Interactive docs: `GET /docs`.

## Authentication
Send the access key in every `/ask` request:
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
  "prompt_version": "p-0.3.1",
  "latency_ms": 7404,
  "flags": ["query_translated"]
}
```
- `model` is the model that actually produced this answer (the main model or a fallback).
- `dimension` is one of the 8 C4IR advisory dimensions, when detected.
- `flags` explain how the answer was produced, e.g. `query_translated` (Kinyarwanda question
  also searched in English), `no_sources`, `ppe_note_added`, `retrieval_failed:*`, `fallback:*`.

Errors: `401` missing or wrong API key, `422` invalid request (e.g. empty question).

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
