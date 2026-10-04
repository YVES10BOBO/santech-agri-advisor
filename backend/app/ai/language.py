"""Language detection (Kinyarwanda / English) and agricultural glossary lookup."""
import csv
import logging
import re
from functools import lru_cache
from pathlib import Path

from app.config import get_settings

log = logging.getLogger(__name__)

# Frequent Kinyarwanda function words and farming words.
_RW_WORDS = {
    "ni", "nte", "iki", "ibiki", "ryari", "he", "gute", "ese", "kandi", "cyangwa",
    "mu", "ku", "kuri", "na", "nka", "ngo", "ariko", "niba", "none", "ubu",
    "nakora", "nkore", "nkwiye", "nabika", "nabona", "nakoresha", "byanjye",
    "bwanjye", "yanjye", "wanjye", "zanjye", "rwanjye", "cyanjye",
    "ibigori", "ibishyimbo", "ibirayi", "ifumbire", "imbuto", "imvura", "ubutaka",
    "umurima", "gutera", "kubagara", "indwara", "ibyonnyi", "nkongwa", "imungu",
    "igihembwe", "ihinga", "amababi", "umuti", "imiti", "amazi", "isoko",
}
_EN_WORDS = {
    "the", "what", "how", "when", "where", "why", "which", "my", "is", "are",
    "should", "can", "do", "does", "and", "or", "of", "to", "in", "on", "for",
    "with", "i", "it", "this", "that", "much", "many", "use", "plant", "crop",
}
_RW_APOSTROPHE = re.compile(r"\b(y|n|by|bw|cy|ry|rw|z|w|k|nk)'", re.I)


def detect_language(text: str) -> str:
    """Return 'rw' or 'en' using simple word statistics."""
    tokens = re.findall(r"[a-zA-Z']+", text.lower())
    rw = sum(1 for t in tokens if t.strip("'") in _RW_WORDS)
    en = sum(1 for t in tokens if t.strip("'") in _EN_WORDS)
    rw += len(_RW_APOSTROPHE.findall(text))
    return "rw" if rw > en else "en"


@lru_cache
def load_glossary() -> list[tuple[str, str]]:
    path = Path(get_settings().glossary_path)
    if not path.exists():
        log.warning("Glossary not found at %s", path)
        return []
    with path.open(encoding="utf-8") as f:
        return [(row["kinyarwanda"].strip(), row["english"].strip())
                for row in csv.DictReader(f)
                if row.get("kinyarwanda") and row.get("english")]


def find_glossary_terms(text: str, limit: int = 12) -> list[tuple[str, str]]:
    """Glossary pairs whose Kinyarwanda or English term appears in the text."""
    t = text.lower()
    hits = [(rw, en) for rw, en in load_glossary()
            if rw.lower() in t or re.search(rf"\b{re.escape(en.lower())}\b", t)]
    return hits[:limit]
