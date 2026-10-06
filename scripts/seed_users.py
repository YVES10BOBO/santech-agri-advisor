"""Creates the dashboard login accounts (extension officers, MINAGRI/RAB) with random passwords.

Farmers never log in, so they have no accounts. Accounts are not stored in the database:
they live in the AUTH_USERS setting of the web app (frontend/web/.env.local locally,
Vercel > Settings > Environment Variables online).

Usage, from the project root:
    python scripts/seed_users.py            # writes new accounts into frontend/web/.env.local
    python scripts/seed_users.py --print    # only prints them, changes nothing
    python scripts/seed_users.py --password "Demo2026@"   # same password for every account

Run it yourself: the passwords are printed only in your terminal. Running it again makes
new passwords (old ones stop working once the web app restarts or Vercel redeploys).
"""
import re
import secrets
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV_FILE = ROOT / "frontend" / "web" / ".env.local"

# username, role, who it is for. Change or add lines as needed.
ACCOUNTS = [
    ("officer.musanze", "extension", "Extension officer, Musanze (potato area)"),
    ("officer.nyagatare", "extension", "Extension officer, Nyagatare (maize area)"),
    ("officer.huye", "extension", "Extension officer, Huye (beans area)"),
    ("promoter.kayonza", "extension", "Farmer promoter, Kayonza"),
    ("rab", "minagri", "RAB (Rwanda Agriculture Board)"),
    ("minagri", "minagri", "MINAGRI (Ministry of Agriculture)"),
]


def password() -> str:
    # Letters and digits only: ":" and ";" would break the AUTH_USERS format.
    alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "-".join("".join(secrets.choice(alphabet) for _ in range(4)) for _ in range(3))


def set_line(text: str, key: str, value: str) -> str:
    line = f"{key}={value}"
    if re.search(rf"^{key}=.*$", text, flags=re.M):
        return re.sub(rf"^{key}=.*$", line.replace("\\", "\\\\"), text, flags=re.M)
    return text.rstrip("\n") + f"\n{line}\n"


def shared_password() -> str | None:
    """The --password value, if given: one password for every account (demo use)."""
    if "--password" not in sys.argv:
        return None
    i = sys.argv.index("--password")
    pw = sys.argv[i + 1] if i + 1 < len(sys.argv) else ""
    if len(pw) < 8 or ":" in pw or ";" in pw:
        sys.exit("--password needs at least 8 characters and no ':' or ';'.")
    return pw


def main() -> None:
    only_print = "--print" in sys.argv
    same = shared_password()
    creds = [(user, same or password(), role, note) for user, role, note in ACCOUNTS]
    auth_users = ";".join(f"{u}:{p}:{r}" for u, p, r, _ in creds)

    print("\nDashboard accounts (keep these private; send each person only their own):\n")
    print(f"  {'Username':<20} {'Password':<16} {'Opens':<12} For")
    for user, pw, role, note in creds:
        opens = "/extension" if role == "extension" else "/insights"
        print(f"  {user:<20} {pw:<16} {opens:<12} {note}")

    if only_print:
        print("\n--print: nothing was written.")
    else:
        text = ENV_FILE.read_text(encoding="utf-8") if ENV_FILE.exists() else ""
        if not re.search(r"^AUTH_SECRET=.{16,}$", text, flags=re.M):
            text = set_line(text, "AUTH_SECRET", secrets.token_urlsafe(32))
        text = set_line(text, "AUTH_USERS", auth_users)
        ENV_FILE.write_text(text, encoding="utf-8")
        print(f"\nWritten to {ENV_FILE.relative_to(ROOT)}. Restart the web app (pnpm dev) to use them.")

    print("\nFor Vercel: Settings > Environment Variables > AUTH_USERS (type Sensitive) = the AUTH_USERS")
    print("line in frontend/web/.env.local, then Deployments > Redeploy.\n")


if __name__ == "__main__":
    main()
