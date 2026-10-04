"""Runs database/migrations/*.sql in order against DATABASE_URL (backend/.env).

Usage, from the project root:  python scripts/migrate.py
The migrations use IF NOT EXISTS, so running this again is safe.
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
    files = sorted((ROOT / "database" / "migrations").glob("*.sql"))
    with psycopg.connect(url, prepare_threshold=None) as conn:
        for f in files:
            print(f"Running {f.name} ...")
            conn.execute(f.read_text(encoding="utf-8"))
            conn.commit()
        tables = conn.execute(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema = 'public' ORDER BY table_name").fetchall()
    print("Done. Tables:", ", ".join(t[0] for t in tables))


if __name__ == "__main__":
    main()
