"""
UrSkin — Auth utilities
- SHA-256 + salt password hashing  (no extra dependencies)
- Stateless HMAC-signed tokens     (30-day TTL, survive server restarts)
- Users stored in users.json
"""
import base64, hashlib, hmac, json, os, secrets, time
from typing import Optional

_DIR         = os.path.dirname(__file__)
_USERS_FILE  = os.path.join(_DIR, "users.json")
_SECRET_FILE = os.path.join(_DIR, ".auth_secret")


def _load_or_create_secret() -> str:
    if os.path.exists(_SECRET_FILE):
        return open(_SECRET_FILE, encoding="utf-8").read().strip()
    secret = secrets.token_hex(32)
    with open(_SECRET_FILE, "w", encoding="utf-8") as f:
        f.write(secret)
    return secret


_SECRET = _load_or_create_secret()
TOKEN_TTL = 30 * 24 * 3600  # 30 days


# ── Users DB ──────────────────────────────────────────────────────────────────

def load_users() -> dict:
    if not os.path.exists(_USERS_FILE):
        return {}
    try:
        return json.loads(open(_USERS_FILE, encoding="utf-8").read())
    except Exception:
        return {}


def save_users(users: dict) -> None:
    with open(_USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, ensure_ascii=False, indent=2)


# ── Password ──────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    h = hashlib.sha256(f"{salt}:{password}".encode("utf-8")).hexdigest()
    return f"{salt}:{h}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt, h = stored.split(":", 1)
        return secrets.compare_digest(
            hashlib.sha256(f"{salt}:{password}".encode("utf-8")).hexdigest(), h
        )
    except Exception:
        return False


# ── Tokens ────────────────────────────────────────────────────────────────────

def create_token(email: str) -> str:
    """Create a signed token: base64(email:timestamp:hmac32)"""
    data = f"{email}:{int(time.time())}"
    sig  = hmac.new(_SECRET.encode(), data.encode(), hashlib.sha256).hexdigest()[:32]
    return base64.urlsafe_b64encode(f"{data}:{sig}".encode()).decode().rstrip("=")


def decode_token(token: str) -> Optional[str]:
    """Returns email if token is valid + not expired, else None."""
    try:
        padded  = token + "=" * (-len(token) % 4)
        payload = base64.urlsafe_b64decode(padded.encode()).decode()
        # payload format: email:timestamp:sig32
        last    = payload.rfind(":")
        data, sig = payload[:last], payload[last + 1:]
        expected  = hmac.new(_SECRET.encode(), data.encode(), hashlib.sha256).hexdigest()[:32]
        if not secrets.compare_digest(sig, expected):
            return None
        second_last = data.rfind(":")
        email, ts   = data[:second_last], data[second_last + 1:]
        if time.time() - int(ts) > TOKEN_TTL:
            return None
        return email
    except Exception:
        return None
