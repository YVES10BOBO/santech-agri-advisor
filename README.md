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
Create a Supabase project, put its connection string in `DATABASE_URL`, then run all migrations
(including `004_extension_tables.sql` for the extension officer tools):
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

### One-click start (Windows)
`start-all.bat` starts the API and the web chat in their own windows; `stop-all.bat` stops them.

## What we built (summary)

| Area | What it does | Where |
|---|---|---|
| Secure API | `/ask`, `/ask-image`, `/transcribe`, `/speak`, `/insights`, `/extension/*`, `/health`, `/version`; `X-API-Key`; model + prompt version (`p-0.5.0`) on every answer | `backend/app/api/` |
| AI pipeline | Language detection, crop/topic/season extraction, conversation memory, Kinyarwanda question translated to English before search, bilingual retrieval, answer cache, automatic fallback models, answers without documents if search fails (flagged) | `backend/app/ai/pipeline.py` |
| Grounding + safety | Answers built only from retrieved excerpts with sources; markdown removed; PPE, label and "ask your umurenge agronomist" notes added automatically; short notes for SMS | `prompts.py`, `guardrails.py` |
| Knowledge base | 17 Rwanda-focused documents ingested (RAB, MINAGRI, CGIAR, CIP, FAO, CIAT...; 4 more listed, not yet ingested) in Supabase pgvector, plus a Kinyarwanda glossary | `data/`, `scripts/ingest.py` |
| Photo diagnosis | Farmer sends a photo; vision model names the likely pest/disease, then the normal grounded answer follows | `vision.py`, `/ask-image` |
| Voice | Speech-to-text (Kinyarwanda/English) with a mic button; text-to-speech "listen" button on every answer | `speech.py`, `tts.py` |
| USSD + SMS | Feature-phone menu (Kinyarwanda/English), answer delivered by SMS (Africa's Talking sandbox) | `backend/app/channels/` |
| Web chat | Kinyarwanda/English, chat history sidebar, photo and mic buttons, Imigongo design | `frontend/web/` |
| Farmer page ("My farm") | `/farmer`: farm profile (district, size, crops, irrigation, livestock, notes) kept on the phone and sent with every question so answers fit the farm; questions for the current season; inputs & market question; USSD/SMS reminders | `FarmerDashboard.tsx`, `lib/profile.ts`, `prompts.py` |
| Extension officer page | `/extension`: digital field records, escalation of recurring issues to MINAGRI/RAB (with their reply), photo second opinion, knowledge refresher (AI chat + document list). No farmer phone numbers stored | `ExtensionDashboard.tsx`, `backend/app/api/extension.py` |
| MINAGRI/RAB Insights | `/insights`: questions per day, by crop/topic/language/channel, pests found in photos, knowledge gaps, field reports by topic and district, escalations they can reply to and resolve, latest questions. No names or phone numbers | `InsightsDashboard.tsx`, `backend/app/db/insights.py` |
| Benchmark | 50 questions (3 crops x 8 topics, English + Kinyarwanda) with scorecard and CSV for agronomist scoring | `scripts/run_tests.py`, `tests/questions.csv` |
| Tests | 28 pytest tests, no network or database needed | `tests/` |

## Build status
- [x] Secure API with versioning, fallbacks and request logging
- [x] Kinyarwanda-first grounded RAG pipeline with safety guardrails
- [x] Knowledge base (17 documents ingested) + glossary
- [x] Web chat with history, photo and voice
- [x] Photo-based pest and disease identification
- [x] Kinyarwanda voice (speech-to-text, text-to-speech)
- [x] USSD + SMS channels (Africa's Talking sandbox)
- [x] Dashboards for all three C4IR user groups: farmer (My farm), extension officer, MINAGRI/RAB
- [x] Personalised answers from the farmer's profile
- [x] Mini benchmark with English/Kinyarwanda scorecard
- [ ] Full 50-question benchmark run with working embeddings
- [ ] SMS shortcode callback (incoming SMS) in Africa's Talking
- [ ] Rwanda hosting (local data centre, Law No. 058/2021 data residency)
- [x] Logins for extension officers and MINAGRI/RAB (accounts in the `AUTH_USERS` setting; farmers never log in)
- [ ] Per-user accounts managed in the database, password reset
- [ ] Weather alerts and real input/market data (roadmap)
- [ ] Input & market access use case (roadmap)
- [ ] Flutter mobile app (planned)

## Known limitations
- Free Gemini tier: 1,000 embeddings per day. When it runs out, answers come without document
  search and are flagged `retrieval_failed`. Fix: paid Google billing or a local embedding model.
  The free tier must not be used for C4IR private data.
- Insights figures currently include our own test and benchmark questions (pilot data).
- Fertilizer and manure quantities in answers must be checked by an agronomist (one test answer
  gave a manure rate that looks about 10x too low).
- Demo photos in `docs/demo-photos/` are from Wikimedia Commons; credit them when shown.

## Review needed
- Kinyarwanda wording (UI strings, USSD menu, safety notes, `tests/questions.csv`) must be
  reviewed by a native speaker.
- Expected answers and numbers must be validated by an agronomist.
- Rotate the Gemini key and the webhook token after the demo.
