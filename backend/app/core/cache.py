"""Answer cache for repeated questions, and fallback answers when the LLM fails."""
import re
from collections import OrderedDict
from threading import Lock
from typing import Optional

from app.db.models import RetrievedChunk


class AnswerCache:
    def __init__(self, max_items: int = 500):
        self._data: "OrderedDict[str, tuple]" = OrderedDict()
        self._max = max_items
        self._lock = Lock()

    @staticmethod
    def _key(question: str, language: str) -> str:
        q = re.sub(r"[^\w\s]", "", question.lower())
        return f"{language}:{' '.join(q.split())}"

    def get(self, question: str, language: str) -> Optional[tuple]:
        k = self._key(question, language)
        with self._lock:
            if k in self._data:
                self._data.move_to_end(k)
                return self._data[k]
        return None

    def put(self, question: str, language: str, value: tuple) -> None:
        k = self._key(question, language)
        with self._lock:
            self._data[k] = value
            self._data.move_to_end(k)
            while len(self._data) > self._max:
                self._data.popitem(last=False)


answer_cache = AnswerCache()

_FALLBACK = {
    "en": ("Sorry, the advisory service cannot give a full answer right now. "
           "Please try again shortly, or contact your extension officer or sector agronomist."),
    "rw": ("Mutwihanganire, ubu ntidushoboye kubaha igisubizo cyuzuye. "
           "Mwongere mugerageze mu kanya, cyangwa mubaze umujyanama w'ubuhinzi "
           "cyangwa agronome w'umurenge wanyu."),
}
_FROM_KB = {
    "en": "Here is related guidance from our knowledge base:",
    "rw": "Dore amakuru ajyanye n'ikibazo cyanyu tubitse:",
}


def fallback_answer(language: str, chunks: list[RetrievedChunk]) -> str:
    """Used when the LLM is unavailable: return the best knowledge excerpt, if any."""
    base = _FALLBACK.get(language, _FALLBACK["en"])
    if chunks:
        excerpt = chunks[0].content.strip()
        if len(excerpt) > 600:
            excerpt = excerpt[:600].rsplit(" ", 1)[0] + "…"
        return f"{_FROM_KB.get(language, _FROM_KB['en'])}\n\n{excerpt}\n\n{base}"
    return base
