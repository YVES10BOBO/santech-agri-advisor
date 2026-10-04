"""Post-generation safety checks. Adds safety notes; never removes advice."""
import re

_CHEMICAL = re.compile(
    r"\b(pesticide|insecticide|fungicide|herbicide|chemical|spray|umuti|imiti|"
    r"gutera umuti|kwica udukoko)", re.I)
_PPE = re.compile(r"\b(glove|mask|protective|uturindantoki|agapfukamunwa|ikingira)", re.I)
_LABEL = re.compile(r"\b(label|ikirango|igicupa|ipaki)", re.I)
_DOSE = re.compile(
    r"\b\d+([.,]\d+)?\s*(ml|g|cc|l)\b\s*(/|per|ku|kuri)\s*\d*\s*"
    r"(l|litre|liter|litiro|pump|knapsack|bomba)\b", re.I)
_REFERRAL = re.compile(r"(extension|agronomist|agronome|umujyanama)", re.I)

# NOTE: Kinyarwanda wording below must be reviewed by a native speaker.
_NOTES = {
    "ppe": {
        "en": "Safety: when using any chemical, wear gloves and a mask, keep children and "
              "animals away, follow the dose on the product label, and do not harvest "
              "before the waiting period written on the label.",
        "rw": "Umutekano: igihe ukoresha umuti uwo ari wo wose, wambare uturindantoki "
              "n'agapfukamunwa, ugumishe abana n'amatungo kure, ukurikize igipimo "
              "cyanditse ku gicupa cy'umuti, kandi ntusarure mbere y'igihe cyanditse ku gicupa.",
    },
    "label": {
        "en": "Always check the exact dose on the product label before use.",
        "rw": "Buri gihe banza urebe igipimo nyacyo cyanditse ku gicupa cy'umuti mbere yo kuwukoresha.",
    },
    "referral": {
        "en": "If you are not sure, ask your extension officer or sector agronomist.",
        "rw": "Niba utizeye neza, baza umujyanama w'ubuhinzi cyangwa agronome w'umurenge wawe.",
    },
}


def check(answer: str, language: str, has_sources: bool) -> tuple[str, list[str]]:
    flags: list[str] = []
    lang = language if language in ("rw", "en") else "en"
    additions: list[str] = []

    mentions_chemical = bool(_CHEMICAL.search(answer))
    if mentions_chemical and not _PPE.search(answer):
        additions.append(_NOTES["ppe"][lang])
        flags.append("ppe_note_added")
    if _DOSE.search(answer) and not _LABEL.search(answer):
        if "ppe_note_added" not in flags:
            additions.append(_NOTES["label"][lang])
        flags.append("unverified_dose")
    if not has_sources:
        flags.append("no_sources")
        if not _REFERRAL.search(answer):
            additions.append(_NOTES["referral"][lang])

    if additions:
        answer = answer.rstrip() + "\n\n" + "\n".join(additions)
    return answer, flags
