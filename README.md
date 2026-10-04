# SAN TECH Agricultural Advisory System

Kinyarwanda-first AI advisory API for Rwandan smallholder farmers (maize, beans, Irish potatoes),
built for the C4IR AI Agricultural Advisory Solution Partner benchmark.

## Project layout
```
backend/     FastAPI API and the AI pipeline (what C4IR benchmarks)
database/    SQL migrations for Supabase (PostgreSQL + pgvector)
data/        Source documents (raw/<crop>/), glossary.csv, C4IR data later
scripts/     ingest.py, run_tests.py, compare_models.py
tests/       questions.csv, pytest tests, saved results
frontend/    Next.js web (chat demo now, dashboard later)
mobile/      Flutter app (later)
docs/        API, architecture, demo script
```

## Setup

### 1. Supabase database
1. Create a Supabase project.
2. In **SQL Editor**, run in order: `database/migrations/001_enable_pgvector.sql`,
   `002_knowledge_tables.sql`, `003_app_tables.sql`.
3. Copy the connection string (Project Settings → Database → Connection string → URI).

### 2. Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # then fill in OPENAI_API_KEY, DATABASE_URL, API_ACCESS_KEY
uvicorn app.main:app --reload
```
Open http://localhost:8000/docs and http://localhost:8000/health.

The API also runs **without** a database (no retrieval, in-memory sessions, file logs),
so you can test the LLM before Supabase is ready.

### 3. Knowledge base
1. Put documents in `data/raw/maize`, `beans`, `potato` or `general` (PDF, TXT, MD).
2. Optionally describe them in `data/raw/metadata.csv` (title, source, url, language).
3. From the project root: `python scripts/ingest.py`

PDFs are not stored in git. After cloning, run `python scripts/download_docs.py` to download
the documents listed in `data/raw/metadata.csv`.

### 4. Test answer quality
```bash
# from the project root, with the API running
export API_ACCESS_KEY=...           # Windows: set API_ACCESS_KEY=...
python scripts/run_tests.py
```
Results are saved in `tests/results/` with columns for agronomist scores.

Compare models on Kinyarwanda quality:
```bash
python scripts/compare_models.py --models <model-a> <model-b> --limit 10
```

### 5. Unit tests
```bash
pytest -q tests
```

### 6. Web chat (demo)
```bash
cd frontend/web
npm install
copy .env.example .env.local      # macOS/Linux: cp
npm run dev
```
Open http://localhost:3000 with the backend running on port 8000.

### Docker
```bash
docker compose up --build
```

## Build status
- [x] API: `/ask`, `/health`, `/version`, API key security
- [x] AI pipeline: language detection, context, memory, retrieval, guardrails, fallback
- [x] Supabase schema with pgvector
- [x] Ingestion, test runner, model comparison
- [ ] Collect knowledge documents and run ingestion
- [x] Next.js chat demo (`frontend/web`)
- [ ] Deploy (backend + frontend) and record the demo

## Review needed
- Kinyarwanda wording in `backend/app/core/cache.py`, `backend/app/ai/guardrails.py`,
  `data/glossary.csv` and `tests/questions.csv` must be reviewed by a native speaker.
- Expected answers and numbers must be validated by an agronomist.
