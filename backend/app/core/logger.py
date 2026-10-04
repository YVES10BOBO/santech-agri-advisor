"""Application logging and per-request logs (database, or JSON-lines file fallback)."""
import json
import logging
from pathlib import Path

from app.config import BACKEND_DIR, get_settings
from app.db import crud
from app.db.database import get_pool

log = logging.getLogger("requests")


def setup_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )


def log_request(rec: dict) -> None:
    log.info("request_id=%s lang=%s crop=%s dim=%s latency_ms=%s status=%s flags=%s",
             rec["request_id"], rec["language"], rec["crop"], rec["dimension"],
             rec["latency_ms"], rec["status"], ",".join(rec["flags"]))
    if get_pool() is not None:
        try:
            crud.insert_request_log(rec)
            return
        except Exception:
            log.exception("Could not write request log to database; writing to file.")
    path = Path(get_settings().log_file)
    if not path.is_absolute():
        path = BACKEND_DIR / path
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(rec, ensure_ascii=False, default=str) + "\n")
