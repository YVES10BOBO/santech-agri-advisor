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
_REFERRAL = re.compile(r"(extension|agronomist|agronome|umujyanama|umurenge)", re.I)

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
# Short versions for SMS, where every extra 160 characters is another paid message.
_SMS_NOTES = {
    "ppe": {
        "en": "Safety: gloves and mask, follow the label, keep children away.",
        "rw": "Umutekano: ambara uturindantoki n'agapfukamunwa, kurikiza igicupa, abana bajye kure.",
    },
    "label": {
        "en": "Check the dose on the label.",
        "rw": "Reba igipimo ku gicupa.",
    },
    "referral": {
        "en": "Ask your sector agronomist if unsure.",
        "rw": "Baza agronome w'umurenge niba utizeye.",
    },
}


_MD_EMPHASIS = re.compile(r"(\*\*|__)(.+?)\1")
_MD_ITALIC = re.compile(r"(?<![\w*])\*(?=\S)([^*\n]+?)(?<=\S)\*(?![\w*])")
_MD_HEADING = re.compile(r"^\s{0,3}#{1,6}\s*", re.M)
_MD_BULLET = re.compile(r"^(\s*)[*•]\s+", re.M)


def strip_markdown(text: str) -> str:
    """Plain text for farmers: SMS and simple screens show markdown as raw symbols."""
    text = _MD_EMPHASIS.sub(r"\2", text)
    text = _MD_ITALIC.sub(r"\1", text)
    text = _MD_HEADING.sub("", text)
    return _MD_BULLET.sub(r"\1- ", text)


def check(answer: str, language: str, has_sources: bool,
          channel: str = "api") -> tuple[str, list[str]]:
    answer = strip_markdown(answer)
    flags: list[str] = []
    lang = language if language in ("rw", "en") else "en"
    notes = _SMS_NOTES if channel == "sms" else _NOTES
    additions: list[str] = []

    mentions_chemical = bool(_CHEMICAL.search(answer))
    if mentions_chemical and not _PPE.search(answer):
        additions.append(notes["ppe"][lang])
        flags.append("ppe_note_added")
    if _DOSE.search(answer) and not _LABEL.search(answer):
        if "ppe_note_added" not in flags:
            additions.append(notes["label"][lang])
        flags.append("unverified_dose")
    if not has_sources:
        flags.append("no_sources")
        if not _REFERRAL.search(answer):
            additions.append(notes["referral"][lang])

    if additions:
        answer = answer.rstrip() + "\n\n" + "\n".join(additions)
    return answer, flags
