"""Sends a test SMS through Africa's Talking (sandbox: it appears in the online simulator).

Usage, from the project root (backend server does not need to be running):
    python scripts/send_test_sms.py +250787461999
    python scripts/send_test_sms.py +250787461999 --ask "Nkongwa yateye ibigori byanjye, nakora iki?"

--ask runs the full AI pipeline (as for a real farmer SMS) and sends the short answer.
Open https://simulator.africastalking.com with the same number BEFORE running this:
the simulator only shows messages that arrive while it is open.
"""
import argparse
import logging
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.channels.common import answer_by_sms, send_sms  # noqa: E402
from app.config import get_settings  # noqa: E402
from app.db.database import close_pool, init_pool  # noqa: E402


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("phone", help="Phone number with country code, e.g. +250787461999")
    p.add_argument("--ask", help="A farmer question: the AI answer is sent by SMS.")
    p.add_argument("--language", choices=["rw", "en"], help="Answer language (default: detected).")
    args = p.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    for noisy in ("httpx", "pypdf", "openai"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    if not args.phone.startswith("+"):
        sys.exit("Use the international format, e.g. +250787461999")
    if not get_settings().at_api_key:
        sys.exit("AT_API_KEY is empty in backend/.env")

    if args.ask:
        init_pool()
        try:
            ok = answer_by_sms(args.phone, args.ask, args.language)
        finally:
            close_pool()
    else:
        ok = send_sms(args.phone, "Muraho! Iki ni igerageza rya SAN TECH Umujyanama w'Ubuhinzi. "
                                  "Test SMS from SAN TECH Farm Advisor.")
    if not ok:
        sys.exit("SMS was NOT accepted by Africa's Talking (see the error above).")
    print(f"Sent to {args.phone}. Check the simulator's Messages app.")


if __name__ == "__main__":
    main()
