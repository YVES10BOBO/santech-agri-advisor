"""Send every test question to the running API and check the answers.

Usage (API running on localhost:8000):
    python scripts/run_tests.py
    python scripts/run_tests.py --url https://your-api.example.com --language rw

Checks per answer (case-insensitive), from tests/questions.csv:
  must_include: groups separated by ';' – every group must match;
                alternatives inside a group separated by '|'.
  must_avoid:   same format – no group may match.
Results are saved to tests/results/results_<timestamp>.csv for agronomist review.
"""
import argparse
import csv
import os
import sys
import time
from datetime import datetime
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[1]
QUESTIONS = ROOT / "tests" / "questions.csv"
RESULTS = ROOT / "tests" / "results"


def groups(spec: str) -> list[list[str]]:
    return [[alt.strip().lower() for alt in g.split("|") if alt.strip()]
            for g in spec.split(";") if g.strip()]


def check(answer: str, include: str, avoid: str) -> tuple[bool, list[str]]:
    text, problems = answer.lower(), []
    for g in groups(include):
        if not any(alt in text for alt in g):
            problems.append("missing: " + "|".join(g))
    for g in groups(avoid):
        if any(alt in text for alt in g):
            problems.append("contains: " + "|".join(g))
    return not problems, problems


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--url", default="http://localhost:8000")
    p.add_argument("--key", default=os.getenv("API_ACCESS_KEY", ""))
    p.add_argument("--language", choices=["rw", "en"], help="Only run one language.")
    p.add_argument("--limit", type=int, default=0)
    args = p.parse_args()

    with QUESTIONS.open(encoding="utf-8") as f:
        rows = [r for r in csv.DictReader(f)
                if not args.language or r["language"] == args.language]
    if args.limit:
        rows = rows[:args.limit]

    headers = {"X-API-Key": args.key} if args.key else {}
    RESULTS.mkdir(parents=True, exist_ok=True)
    out = RESULTS / f"results_{datetime.now():%Y%m%d_%H%M%S}.csv"
    passed, latencies, records = 0, [], []

    with httpx.Client(base_url=args.url, headers=headers, timeout=120) as client:
        try:
            health = client.get("/health").json()
            print(f"Health: {health}\n")
        except Exception as e:
            sys.exit(f"API not reachable at {args.url}: {e}")

        for r in rows:
            t0 = time.perf_counter()
            resp = client.post("/ask", json={"question": r["question"],
                                             "language": r["language"]})
            wall_ms = int((time.perf_counter() - t0) * 1000)
            if resp.status_code != 200:
                print(f"[ERROR] {r['id']}-{r['language']}: HTTP {resp.status_code} {resp.text[:200]}")
                records.append({**r, "answer": "", "ok": False,
                                "problems": f"HTTP {resp.status_code}"})
                continue
            data = resp.json()
            ok, problems = check(data["answer"], r["must_include"], r["must_avoid"])
            passed += ok
            latencies.append(wall_ms)
            print(f"[{'PASS' if ok else 'CHECK'}] {r['id']}-{r['language']} "
                  f"({r['crop']}/{r['dimension']}) {wall_ms} ms "
                  f"sources={len(data['sources'])} flags={data['flags']} "
                  f"{'; '.join(problems)}")
            records.append({**r, "answer": data["answer"], "ok": ok,
                            "problems": "; ".join(problems),
                            "detected_crop": data["crop"],
                            "detected_dimension": data["dimension"],
                            "sources": " | ".join(s["title"] for s in data["sources"]),
                            "flags": ",".join(data["flags"]),
                            "latency_ms": wall_ms,
                            "model": data["model"],
                            "prompt_version": data["prompt_version"],
                            "agronomist_score_1to5": "", "agronomist_notes": ""})

    extra = ["answer", "ok", "problems", "detected_crop", "detected_dimension", "sources",
             "flags", "latency_ms", "model", "prompt_version",
             "agronomist_score_1to5", "agronomist_notes"]
    fields = (list(rows[0].keys()) if rows else []) + extra
    with out.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields, restval="")
        w.writeheader()
        w.writerows(records)

    avg = sum(latencies) // len(latencies) if latencies else 0
    print(f"\nAutomatic checks passed: {passed}/{len(rows)} | average latency: {avg} ms")
    print(f"Results saved to {out} (add agronomist scores in the last columns).")


if __name__ == "__main__":
    main()
