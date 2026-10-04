"""Compare OpenAI models on the test questions (no retrieval), side by side.

Usage:
    python scripts/compare_models.py --models gpt-4.1-mini gpt-4.1 --limit 10
Output: tests/results/model_comparison_<timestamp>.csv
Score each answer for Kinyarwanda quality, accuracy, safety and simplicity, then
choose the model with the smallest gap between its English and Kinyarwanda answers.
"""
import argparse
import csv
import sys
import time
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.ai.context import extract_context  # noqa: E402
from app.ai.language import find_glossary_terms  # noqa: E402
from app.ai.llm import chat  # noqa: E402
from app.ai.prompts import build_messages  # noqa: E402


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--models", nargs="+", required=True)
    p.add_argument("--limit", type=int, default=10)
    args = p.parse_args()

    with (ROOT / "tests" / "questions.csv").open(encoding="utf-8") as f:
        rows = list(csv.DictReader(f))[: args.limit]

    out_rows = []
    for r in rows:
        msgs = build_messages(r["question"], r["language"], extract_context(r["question"]),
                              [], [], find_glossary_terms(r["question"]))
        for model in args.models:
            t0 = time.perf_counter()
            try:
                answer = chat(msgs, model=model)
            except Exception as e:
                answer = f"ERROR: {e}"
            ms = int((time.perf_counter() - t0) * 1000)
            print(f"{r['id']}-{r['language']} {model}: {ms} ms")
            out_rows.append({"id": r["id"], "language": r["language"],
                             "question": r["question"], "model": model,
                             "latency_ms": ms, "answer": answer,
                             "kinyarwanda_quality_1to5": "", "accuracy_1to5": "",
                             "safety_1to5": "", "simplicity_1to5": ""})

    out = ROOT / "tests" / "results" / f"model_comparison_{datetime.now():%Y%m%d_%H%M%S}.csv"
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(out_rows[0].keys()))
        w.writeheader()
        w.writerows(out_rows)
    print(f"Saved {out}")


if __name__ == "__main__":
    main()
