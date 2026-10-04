# Architecture

```
Channels (web chat now; USSD, SMS, IVR, WhatsApp, Flutter app later)
        │
        ▼
FastAPI backend ── X-API-Key security ── request logging (version, latency)
        │
        ▼
AI pipeline ("the brain")
  1. Language detection (Kinyarwanda / English) + agricultural glossary
  2. Context extraction (crop, advisory dimension, season)
  3. Conversation memory (follow-up questions)
  4. Retrieval from the knowledge base (pgvector, crop-filtered)
  5. Answer generation (OpenAI LLM) with a farmer-advice structure
  6. Safety guardrails (chemical safety, unverified doses, referral)
  7. Fallback to knowledge-base excerpts if the LLM is unavailable
        │
        ▼
Supabase PostgreSQL + pgvector
  documents · chunks (embeddings) · sessions · messages · request_logs
```

## Design choices
- **LLM + RAG, no training from scratch**: answers are grounded in RAB, MINAGRI and research documents, and new local data (C4IR augmentation) is added in hours by re-running ingestion.
- **One brain, many channels**: every channel calls the same pipeline, so answers stay consistent.
- **Standard PostgreSQL only**: the database can move to Rwanda-hosted infrastructure without code changes.
- **Versioned prompts and logs**: each answer records system, model and prompt version.

## Roadmap
1. Now: text advisory API in Kinyarwanda and English, web demo.
2. After shortlisting: C4IR data integration, admin dashboard (Next.js), pest image recognition, Kinyarwanda voice.
3. RFP stage: USSD/SMS/IVR/WhatsApp, Flutter app, alerts, Rwanda hosting, fine-tuned open model.
