"""Load documents from data/raw into the pgvector knowledge base.

Usage (from the project root, with backend/.env filled in):
    python scripts/ingest.py

Folder = crop:  data/raw/maize | beans | potato | general
Supported files: .pdf, .txt, .md
Optional data/raw/metadata.csv adds title, source (RAB, MINAGRI…), url and language
per filename. Files already ingested (same content hash) are skipped.
"""
import csv
import hashlib
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from openai import RateLimitError  # noqa: E402
from pypdf import PdfReader  # noqa: E402

from app.ai.llm import embed  # noqa: E402
from app.db import crud  # noqa: E402
from app.db.database import close_pool, init_pool  # noqa: E402

RAW = ROOT / "data" / "raw"
CROPS = {"maize", "beans", "potato", "general"}
CHUNK_WORDS = 220
OVERLAP_WORDS = 40
EMBED_BATCH = 50
RATE_LIMIT_WAIT_SECONDS = 65
MAX_RATE_LIMIT_RETRIES = 6


class DailyQuotaReached(Exception):
    pass


def embed_with_retry(texts: list[str]) -> list[list[float]]:
    """Waits and retries on per-minute rate limits (e.g. Gemini free tier)."""
    for _ in range(MAX_RATE_LIMIT_RETRIES):
        try:
            return embed(texts)
        except RateLimitError as exc:
            if "PerDay" in str(exc):
                raise DailyQuotaReached(str(exc)) from exc
            print(f"   rate limit reached, waiting {RATE_LIMIT_WAIT_SECONDS}s ...", flush=True)
            time.sleep(RATE_LIMIT_WAIT_SECONDS)
    return embed(texts)


def load_metadata() -> dict[str, dict]:
    path = RAW / "metadata.csv"
    if not path.exists():
        return {}
    with path.open(encoding="utf-8") as f:
        return {row["filename"]: row for row in csv.DictReader(f) if row.get("filename")}


def extract_text(path: Path) -> str:
    if path.suffix.lower() == ".pdf":
        reader = PdfReader(str(path))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
    else:
        text = path.read_text(encoding="utf-8", errors="ignore")
    text = re.sub(r"[ \t]+", " ", text)
    return re.sub(r"\n{3,}", "\n\n", text).strip()


def chunk_text(text: str) -> list[str]:
    words = text.split()
    chunks, step = [], CHUNK_WORDS - OVERLAP_WORDS
    for start in range(0, len(words), step):
        piece = " ".join(words[start:start + CHUNK_WORDS])
        if len(piece) > 80:
            chunks.append(piece)
        if start + CHUNK_WORDS >= len(words):
            break
    return chunks


def main() -> None:
    if init_pool() is None:
        sys.exit("Database not available. Check DATABASE_URL in backend/.env")
    meta = load_metadata()
    # Files listed in metadata.csv go first, in that order (put the most important first).
    order = {name: i for i, name in enumerate(meta)}
    files = sorted((p for p in RAW.rglob("*")
                    if p.is_file() and p.suffix.lower() in {".pdf", ".txt", ".md"}),
                   key=lambda p: (order.get(p.name, len(order)), str(p)))
    if not files:
        print(f"No documents found in {RAW}. Add PDFs/TXT/MD files to the crop folders.")
    added = skipped = 0
    try:
        for path in files:
            crop = path.relative_to(RAW).parts[0]
            if crop not in CROPS:
                print(f"SKIP {path.name}: folder '{crop}' is not one of {sorted(CROPS)}")
                continue
            file_hash = hashlib.sha256(path.read_bytes()).hexdigest()
            if crud.document_exists(file_hash):
                skipped += 1
                continue
            text = extract_text(path)
            chunks = chunk_text(text)
            if not chunks:
                print(f"SKIP {path.name}: no extractable text (scanned PDF?)")
                continue
            info = meta.get(path.name, {})
            print(f"... {crop}/{path.name}: {len(chunks)} chunks", flush=True)
            embeddings: list[list[float]] = []
            for i in range(0, len(chunks), EMBED_BATCH):
                embeddings.extend(embed_with_retry(chunks[i:i + EMBED_BATCH]))
            doc_id = crud.insert_document(
                title=info.get("title") or path.stem.replace("_", " ").strip(),
                source=info.get("source") or None,
                url=info.get("url") or None,
                crop=crop,
                language=info.get("language") or "en",
                file_hash=file_hash,
            )
            crud.insert_chunks(doc_id, crop, chunks, embeddings)
            added += 1
            print(f"ADDED {crop}/{path.name}: {len(chunks)} chunks")
    except DailyQuotaReached:
        print("\nDaily embedding quota reached. Documents saved so far are kept; "
              "run this script again tomorrow (or with a paid key) to add the rest.")
    finally:
        close_pool()
    print(f"\nDone. Added {added} documents, skipped {skipped} already ingested.")


if __name__ == "__main__":
    main()
