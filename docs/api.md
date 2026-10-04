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
`language` is optional (`rw` or `en`); it is detected when omitted.

Response:
```json
{
  "request_id": "6f1c…",
  "session_id": "a2b9…",
  "answer": "…",
  "language": "rw",
  "crop": "potato",
  "dimension": "fertilizer_inputs",
  "sources": [{"title": "…", "source": "RAB", "url": null, "similarity": 0.71}],
  "model": "…",
  "system_version": "0.1.0",
  "prompt_version": "p-0.1.0",
  "latency_ms": 2140,
  "flags": []
}
```

## GET /health
Readiness check before each benchmark run. `ready: true` means the system can answer.

## GET /version
Returns the system, model, embedding model and prompt versions, so every score can be tied to the exact version that produced it.
