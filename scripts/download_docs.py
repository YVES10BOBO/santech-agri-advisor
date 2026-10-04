"""Downloads the knowledge documents listed in data/raw/metadata.csv.

PDFs are not stored in git (size and licences), so after cloning run, from the project root:
    python scripts/download_docs.py
Files that already exist are skipped. Then run scripts/ingest.py.
"""
import csv
import sys
from pathlib import Path

import httpx

RAW = Path(__file__).resolve().parents[1] / "data" / "raw"


def main() -> None:
    with (RAW / "metadata.csv").open(encoding="utf-8") as f:
        rows = [r for r in csv.DictReader(f) if r.get("filename") and r.get("url")]
    ok = failed = 0
    with httpx.Client(follow_redirects=True, timeout=120,
                      headers={"User-Agent": "Mozilla/5.0"}) as client:
        for r in rows:
            target = RAW / (r.get("folder") or "general") / r["filename"]
            if target.exists():
                continue
            try:
                resp = client.get(r["url"])
                resp.raise_for_status()
                if not resp.content.startswith(b"%PDF") and target.suffix == ".pdf":
                    raise ValueError("response is not a PDF")
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(resp.content)
                ok += 1
                print(f"OK    {target.relative_to(RAW)}")
            except Exception as exc:
                failed += 1
                print(f"FAIL  {r['filename']}: {exc}")
    print(f"\nDone. Downloaded {ok}, failed {failed}.")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
