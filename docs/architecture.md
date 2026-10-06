# Architecture

```
Farmer channels                         C4IR benchmark
  Web chat (Next.js)                      POST /ask  (X-API-Key)
  USSD menu ─┐                            GET /health, GET /version
  SMS ───────┴─ Africa's Talking                │
        │                                       │
        ▼                                       ▼
FastAPI backend ── API key / webhook token ── request logging (model, prompt version, latency)
        │
        ▼
AI pipeline ("the brain", the same for every channel)
  1. Language detection (Kinyarwanda / English) + agricultural glossary
  2. Context extraction: crop, advisory dimension (the 8 C4IR topics), season
  3. Conversation memory (follow-up questions; per phone number for SMS)
  4. Bilingual retrieval: a Kinyarwanda question is also translated to English, both are
     searched in pgvector (crop-filtered) and the results are merged in turns
  5. Answer generation with one system prompt: scope rule, today's date and Rwandan season,
     farmer-friendly structure built on the 9 C4IR rubric criteria, safety rules
  6. Guardrails: plain text, chemical-safety note, unverified-dose check, referral
  7. Fallbacks: backup LLM models; answer without retrieval if search fails;
     knowledge excerpt + referral if no model is available
        │
        ▼
PostgreSQL + pgvector (Supabase today)
  documents · chunks (embeddings) · sessions · messages · request_logs
```

## Design choices
- **LLM + retrieval, no training from scratch.** Answers are grounded in RAB, MINAGRI, CGIAR,
  CIP and FAO documents. New local data (C4IR augmentation) is added by putting files in
  `data/` and running `scripts/ingest.py`: hours, not weeks.
- **Provider independent.** Any OpenAI-compatible model works (OpenAI, Google Gemini, or a
  self-hosted open model in Rwanda) by changing `LLM_BASE_URL` / `LLM_MODEL`. The model is
  chosen on measured Kinyarwanda quality, not vendor preference.
- **One brain, many channels.** Every channel calls the same pipeline, so answers stay
  consistent. Channels only change the format (e.g. short answers for SMS).
- **Measured, versioned quality.** Every answer records the model that actually answered,
  the prompt version and latency. `scripts/run_tests.py` scores English and Kinyarwanda side
  by side on 50 questions (3 crops x 8 topics).

## Security and data governance
- `/ask` requires an API key (`X-API-Key`); USSD/SMS callbacks require a secret token.
- Secrets live only in environment variables (`backend/.env`, never committed).
- Phone numbers are not stored in the database: SMS conversations use a pseudonymous
  session id derived from the number. (Application logs still show numbers when an SMS
  fails; log retention and masking are on the roadmap.)
- Logs keep questions and answers (no names) so MINAGRI/RAB can see what farmers ask.
- Standard PostgreSQL only, so data can move to Rwanda-hosted infrastructure without code
  changes, in line with Rwanda's data protection law (Law No. 058/2021).

## Roadmap
1. **Now:** text advisory API (Kinyarwanda + English), web chat, voice in/out, photo pest and
   disease identification, USSD/SMS, farm-profile personalisation, dashboards for farmers,
   extension officers and MINAGRI/RAB, mini benchmark.
2. **After shortlisting:** C4IR data integration and re-benchmark, agronomist and
   native-speaker review loop.
3. **RFP stage:** Rwanda hosting, self-hosted open model option, logins and roles,
   IVR and WhatsApp, offline-tolerant mobile app for extension officers, weather alerts,
   input and market data.
