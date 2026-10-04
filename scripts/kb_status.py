"""Shows what is in the knowledge base (documents and chunks per crop).

Usage, from the project root:  python scripts/kb_status.py
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

import psycopg  # noqa: E402

from app.config import get_settings  # noqa: E402


def main() -> None:
    url = get_settings().database_url
    if not url:
        sys.exit("DATABASE_URL is empty in backend/.env")
    with psycopg.connect(url, prepare_threshold=None) as conn:
        rows = conn.execute(
            "SELECT d.crop, d.language, d.title, count(c.id) FROM documents d "
            "LEFT JOIN chunks c ON c.document_id = d.id "
            "GROUP BY d.id ORDER BY d.crop, d.title").fetchall()
        requests = conn.execute("SELECT count(*) FROM request_logs").fetchone()[0]
    for crop, lang, title, n in rows:
        print(f"{crop:8s} {lang:3s} {n:4d} chunks  {title}")
    print(f"\nTotal: {len(rows)} documents, {sum(r[3] for r in rows)} chunks. "
          f"Questions answered so far: {requests}")


if __name__ == "__main__":
    main()
