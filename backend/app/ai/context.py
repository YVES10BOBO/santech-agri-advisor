"""Extracts crop, advisory dimension and season from a question (keyword based).

Keywords match at the start of a word, so "rot" does not match "protect"
and "rain" does not match "grain". Prefixes like "fertili" match "fertilizer".
"""
import re
from dataclasses import dataclass
from typing import Optional

CROPS = {
    # Kinyarwanda drops the first vowel after "ku", "mu", "nk'", etc.
    # ("ku birayi"), so both full forms and stems are listed.
    "maize": ["maize", "corn", "ibigori", "bigori", "ikigori", "kigori"],
    "beans": ["bean", "ibishyimbo", "bishyimbo", "igishyimbo", "gishyimbo"],
    "potato": ["potato", "ibirayi", "birayi", "ikirayi", "kirayi"],
}

# The eight advisory dimensions used in the C4IR benchmark.
DIMENSIONS = {
    "fertilizer_inputs": ["fertili", "dap", "urea", "npk", "17-17-17", "manure", "compost",
                          "ifumbire", "fumbire", "imborera", "mborera", "mvaruganda", "inyongeramusaruro"],
    "seeds_planting": ["seed", "planting", "sow", "variety", "spacing", "when to plant",
                       "imbuto", "mbuto", "gutera", "guhinga", "ubwoko"],
    "pest_disease": ["pest", "disease", "armyworm", "blight", "worm", "insect", "spots",
                     "rot", "wilt", "caterpillar", "holes", "indwara", "ibyonnyi",
                     "nkongwa", "udukoko", "ibibara", "kurwara", "imyobo"],
    "weeds": ["weed", "ibyatsi", "kubagara"],
    "soil_water_fertility": ["soil", "acid", "lime", "irrigat", "erosion", "fertility",
                             "ubutaka", "butaka", "ishwagara", "shwagara", "kuhira", "busharira", "isuri"],
    "post_harvest": ["harvest", "storage", "store", "drying", "weevil", "aflatoxin",
                     "gusarura", "kubika", "nabika", "guhunika", "kumisha", "imungu", "mungu"],
    "weather": ["rain", "drought", "weather", "forecast", "dry spell", "climate",
                "imvura", "mvura", "amapfa", "ikirere", "izuba"],
    "government_programs": ["subsid", "government", "nkunganire", "programme", "program",
                            "cooperative", "insurance", "leta", "gahunda", "koperative",
                            "ubwishingizi"],
}

SEASONS = {
    "A": ["season a", "igihembwe a", "igihembwe cy'ihinga a"],
    "B": ["season b", "igihembwe b", "igihembwe cy'ihinga b"],
    "C": ["season c", "igihembwe c", "igihembwe cy'ihinga c"],
}


@dataclass
class QuestionContext:
    crop: Optional[str] = None
    dimension: Optional[str] = None
    season: Optional[str] = None


def _best_match(text: str, table: dict[str, list[str]]) -> Optional[str]:
    scores = {key: sum(1 for kw in kws if re.search(r"\b" + re.escape(kw), text))
              for key, kws in table.items()}
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else None


def extract_context(question: str) -> QuestionContext:
    t = question.lower()
    return QuestionContext(
        crop=_best_match(t, CROPS),
        dimension=_best_match(t, DIMENSIONS),
        season=_best_match(t, SEASONS),
    )
