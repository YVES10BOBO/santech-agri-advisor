# SAN TECH Agricultural Advisory System

Kinyarwanda-first AI advisory for Rwandan smallholder farmers (maize, beans, Irish potatoes),
built for the C4IR AI Agricultural Advisory Solution Partner benchmark.

One AI "brain" behind a secure API, used by every channel: the `/ask` API (what C4IR benchmarks),
a web chat, and USSD/SMS for feature phones.

## Project layout
```
backend/     FastAPI API, AI pipeline, USSD/SMS channels
database/    SQL migrations (PostgreSQL + pgvector, on Supabase)
data/        Knowledge documents (raw/<crop>/ + metadata.csv), glossary.csv, data/c4ir for C4IR data
scripts/     migrate, download_docs, ingest, kb_status, run_tests (mini benchmark), compare_models
tests/       pytest tests, questions.csv (benchmark questions), results/
frontend/    Next.js web chat (demo)
mobile/      Flutter app (planned)
docs/        API, architecture, demo script
```

## Setup (Windows PowerShell; on macOS/Linux use `source .venv/bin/activate` and `cp`)

### 1. Python environment
```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r backend\requirements.txt
copy backend\.env.example backend\.env      # then fill it in (see below)
```

`backend/.env` needs at least:
- `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`, `LLM_EMBEDDING_MODEL`: any OpenAI-compatible
  provider. Free option: Google Gemini (instructions inside `.env.example`).
- `DATABASE_URL`: Supabase **Session pooler** connection string.
- `API_ACCESS_KEY`: the key clients (C4IR) send in the `X-API-Key` header.

### 2. Database
Create a Supabase project, put its connection string in `DATABASE_URL`, then:
```powershell
python scripts\migrate.py
```

### 3. Knowledge base
```powershell
python scripts\download_docs.py     # downloads the PDFs listed in data/raw/metadata.csv
python scripts\ingest.py            # embeds them into pgvector (skips files already ingested)
python scripts\kb_status.py         # shows documents and chunks per crop
```
Ingestion waits automatically on rate limits and stops cleanly at a daily quota;
running it again continues where it stopped.

### 4. Run the API
```powershell
cd backend
uvicorn app.main:app --reload
```
Open http://localhost:8000/docs, http://localhost:8000/health and http://localhost:8000/version.

### 5. Web chat
```powershell
cd frontend\web
pnpm install
copy .env.example .env.local        # BACKEND_API_KEY = API_ACCESS_KEY from backend/.env
pnpm dev
```
Open http://localhost:3000.

### 6. Tests and mini benchmark
```powershell
python -m pytest tests -q           # unit tests (no network, no database)
python scripts\run_tests.py         # 50 questions (3 crops x 8 topics, English + Kinyarwanda)
```
The benchmark prints an English-vs-Kinyarwanda scorecard and saves
`tests/results/summary_<time>.md` plus a CSV with columns for agronomist scores.

### USSD and SMS
See [backend/app/channels/README.md](backend/app/channels/README.md) (Africa's Talking sandbox).

### Docker
```powershell
docker compose up --build
```

## Build status
- [x] Secure API: `/ask`, `/health`, `/version`, API key; model and prompt version on every answer
- [x] AI pipeline: language detection, crop/topic extraction, conversation memory,
      bilingual retrieval (Kinyarwanda + English), Rwanda season awareness, guardrails, fallbacks
- [x] Provider-independent LLM layer with automatic fallback models
- [x] Knowledge base: 17+ Rwanda-focused documents (RAB, CGIAR, CIP, FAO, CIAT...)
- [x] Web chat (Kinyarwanda / English)
- [x] USSD + SMS channels (Africa's Talking)
- [x] Mini benchmark with English/Kinyarwanda scorecard
- [ ] Photo-based pest and disease identification
- [ ] Kinyarwanda voice (speech-to-text, text-to-speech)
- [ ] Rwanda hosting

## Review needed
- Kinyarwanda wording (UI strings, USSD menu, safety notes, `tests/questions.csv`) must be
  reviewed by a native speaker.
- Expected answers and numbers must be validated by an agronomist.
