"""Mini benchmark: send every test question to the running API and score the answers.

Usage (API running on localhost:8000):
    python scripts/run_tests.py
    python scripts/run_tests.py --language rw --limit 10 --delay 4
    python scripts/run_tests.py --url https://your-api.example.com --key <API key>

Checks per answer (case-insensitive), from tests/questions.csv:
  must_include: groups separated by ';' - every group must match;
                alternatives inside a group separated by '|'.
  must_avoid:   same format - no group may match.
It also measures, per language: answered without fallback, sources found, crop and topic
detected correctly, answer length and latency - so English and Kinyarwanda can be compared
the way the C4IR benchmark compares them.

Outputs in tests/results/:
  results_<timestamp>.csv  every answer, with empty columns for agronomist scores (1-5)
  summary_<timestamp>.md   the scorecard
"""
import argparse
import csv
import sys
import time
from collections import defaultdict
from datetime import datetime
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[1]
QUESTIONS = ROOT / "tests" / "questions.csv"
RESULTS = ROOT / "tests" / "results"
MAX_WORDS = 180          # target length in the system prompt


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


def default_key() -> str:
    """The API key from backend/.env, so the script works without extra arguments."""
    sys.path.insert(0, str(ROOT / "backend"))
    try:
        from app.config import get_settings
        return get_settings().api_access_key
    except Exception:
        return ""


def pct(part: int, whole: int) -> str:
    return f"{100 * part // whole}%" if whole else "-"


def scorecard(records: list[dict]) -> str:
    by_lang: dict[str, list[dict]] = defaultdict(list)
    for r in records:
        by_lang[r["language"]].append(r)
    langs = [lang for lang in ("en", "rw") if lang in by_lang]
    names = {"en": "English", "rw": "Kinyarwanda"}

    def row(label: str, fn) -> str:
        return f"| {label} | " + " | ".join(fn(by_lang[lang]) for lang in langs) + " |"

    def answered(rs):
        return [r for r in rs if r.get("status") == "ok"]

    def farming(rs):
        return [r for r in rs if r["dimension"] != "off_topic"]

    def detect(rs, field, expected_field):
        scored = [r for r in rs if r[expected_field] not in ("general", "none", "off_topic")]
        good = sum(1 for r in scored if r.get(field) == r[expected_field])
        return f"{pct(good, len(scored))} ({good}/{len(scored)})"

    def avg(rs, field):
        vals = [int(r[field]) for r in answered(rs) if r.get(field) not in ("", None)]
        return str(sum(vals) // len(vals)) if vals else "-"

    lines = [
        f"# Mini benchmark - {datetime.now():%Y-%m-%d %H:%M}",
        "",
        f"Model: {records[0].get('model', '?')} | prompt: {records[0].get('prompt_version', '?')}"
        if records else "",
        "",
        "| Metric | " + " | ".join(names[lang] for lang in langs) + " |",
        "|---|" + "---|" * len(langs),
        row("Questions", lambda rs: str(len(rs))),
        row("Answered (no fallback)", lambda rs: f"{pct(len(answered(rs)), len(rs))} ({len(answered(rs))}/{len(rs)})"),
        row("Automatic checks passed", lambda rs: f"{pct(sum(r['ok'] for r in rs), len(rs))} ({sum(r['ok'] for r in rs)}/{len(rs)})"),
        row("Sources found (farming questions)", lambda rs: f"{pct(sum(1 for r in farming(rs) if r.get('sources')), len(farming(rs)))}"),
        row("Crop detected correctly", lambda rs: detect(rs, "detected_crop", "crop")),
        row("Topic detected correctly", lambda rs: detect(rs, "detected_dimension", "dimension")),
        row("Average answer length (words)", lambda rs: avg(rs, "words")),
        row(f"Answers over {MAX_WORDS} words", lambda rs: str(sum(1 for r in answered(rs) if int(r.get("words") or 0) > MAX_WORDS))),
        row("Average latency (ms)", lambda rs: avg(rs, "latency_ms")),
        "",
        "## Automatic checks by topic",
        "",
        "| Topic | " + " | ".join(names[lang] for lang in langs) + " |",
        "|---|" + "---|" * len(langs),
    ]
    dims = sorted({r["dimension"] for r in records})
    for d in dims:
        lines.append(row(d.replace("_", " "), lambda rs, d=d: (
            lambda sel: f"{sum(r['ok'] for r in sel)}/{len(sel)}")([r for r in rs if r["dimension"] == d])))
    failed = [r for r in records if not r["ok"]]
    if failed:
        lines += ["", "## Answers to review", ""]
        lines += [f"- {r['id']}-{r['language']} ({r['crop']}/{r['dimension']}): {r['problems']}"
                  for r in failed]
    lines += ["", "Automatic checks only look for key words. Expert agronomist scoring on the "
              "C4IR rubric (safety, accuracy, completeness, ...) is done in the results CSV."]
    return "\n".join(lines) + "\n"


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--url", default="http://localhost:8000")
    p.add_argument("--key", default=None, help="API key (default: API_ACCESS_KEY in backend/.env)")
    p.add_argument("--language", choices=["rw", "en"], help="Only run one language.")
    p.add_argument("--limit", type=int, default=0, help="Only the first N questions.")
    p.add_argument("--delay", type=float, default=2.0,
                   help="Seconds between questions (free-tier rate limits).")
    args = p.parse_args()
    key = default_key() if args.key is None else args.key

    with QUESTIONS.open(encoding="utf-8") as f:
        rows = [r for r in csv.DictReader(f)
                if not args.language or r["language"] == args.language]
    if args.limit:
        rows = rows[:args.limit]

    headers = {"X-API-Key": key} if key else {}
    RESULTS.mkdir(parents=True, exist_ok=True)
    stamp = f"{datetime.now():%Y%m%d_%H%M%S}"
    records: list[dict] = []

    with httpx.Client(base_url=args.url, headers=headers, timeout=180) as client:
        try:
            print(f"Health: {client.get('/health').json()}\n")
        except Exception as e:
            sys.exit(f"API not reachable at {args.url}: {e}")

        for i, r in enumerate(rows):
            if i and args.delay:
                time.sleep(args.delay)
            t0 = time.perf_counter()
            try:
                resp = client.post("/ask", json={"question": r["question"],
                                                 "language": r["language"]})
            except httpx.HTTPError as e:
                resp = None
                error = type(e).__name__
            wall_ms = int((time.perf_counter() - t0) * 1000)
            if resp is None or resp.status_code != 200:
                error = f"HTTP {resp.status_code}" if resp is not None else error
                print(f"[ERROR] {r['id']}-{r['language']}: {error}")
                records.append({**r, "ok": False, "status": "error", "problems": error})
                continue
            data = resp.json()
            fallback = any(f.startswith("fallback") for f in data["flags"])
            ok, problems = check(data["answer"], r["must_include"], r["must_avoid"])
            ok = ok and not fallback
            if fallback:
                problems.insert(0, "fallback answer")
            if any(f.startswith("retrieval_failed") for f in data["flags"]):
                ok = False
                problems.insert(0, "document search failed (embedding quota?)")
            words = len(data["answer"].split())
            print(f"[{'PASS' if ok else 'CHECK'}] {r['id']}-{r['language']} "
                  f"({r['crop']}/{r['dimension']}) {wall_ms} ms {words} words "
                  f"sources={len(data['sources'])} {'; '.join(problems)}", flush=True)
            records.append({**r, "answer": data["answer"], "ok": ok,
                            "status": "fallback" if fallback else "ok",
                            "problems": "; ".join(problems),
                            "detected_crop": data["crop"] or "",
                            "detected_dimension": data["dimension"] or "",
                            "sources": " | ".join(s["title"] for s in data["sources"]),
                            "flags": ",".join(data["flags"]),
                            "words": words, "latency_ms": wall_ms,
                            "model": data["model"], "prompt_version": data["prompt_version"],
                            "agronomist_score_1to5": "", "agronomist_notes": ""})

    extra = ["answer", "ok", "status", "problems", "detected_crop", "detected_dimension",
             "sources", "flags", "words", "latency_ms", "model", "prompt_version",
             "agronomist_score_1to5", "agronomist_notes"]
    fields = (list(rows[0].keys()) if rows else []) + extra
    out = RESULTS / f"results_{stamp}.csv"
    with out.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields, restval="")
        w.writeheader()
        w.writerows(records)

    summary = scorecard(records)
    summary_path = RESULTS / f"summary_{stamp}.md"
    summary_path.write_text(summary, encoding="utf-8")
    print("\n" + summary)
    print(f"Answers: {out}\nScorecard: {summary_path}")


if __name__ == "__main__":
    main()
