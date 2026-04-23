import secrets
import threading
from datetime import datetime, timedelta, timezone

from fastapi import Header, HTTPException, Request, status
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import get_settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
_attempts_lock = threading.Lock()
_login_attempts: dict[str, list[datetime]] = {}
_locked_until: dict[str, datetime] = {}


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(subject: str) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> str:
    settings = get_settings()
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
        username = payload.get("sub")
        if not username:
            raise credentials_exception
    except JWTError as exc:
        raise credentials_exception from exc
    return str(username)


def generate_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def get_current_admin(request: Request) -> str:
    settings = get_settings()
    access_cookie = request.cookies.get(settings.auth_cookie_name)
    token = access_cookie or request.headers.get("Authorization", "").replace("Bearer ", "").strip()
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return decode_access_token(token)


def validate_csrf(request: Request, csrf_header: str | None = Header(default=None, alias="X-CSRF-Token")) -> None:
    settings = get_settings()
    csrf_cookie = request.cookies.get(settings.csrf_cookie_name)
    if not csrf_header or not csrf_cookie or csrf_header != csrf_cookie:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CSRF token validation failed")


def _prune_old_attempts(key: str, now: datetime, window_seconds: int) -> None:
    attempts = _login_attempts.get(key, [])
    cutoff = now - timedelta(seconds=window_seconds)
    _login_attempts[key] = [item for item in attempts if item >= cutoff]


def check_login_allowed(key: str) -> None:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    with _attempts_lock:
        locked_until = _locked_until.get(key)
        if locked_until and locked_until > now:
            seconds_left = int((locked_until - now).total_seconds())
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many login attempts. Try again in {max(1, seconds_left)} seconds.",
            )
        _prune_old_attempts(key, now, settings.admin_login_window_seconds)


def register_login_failure(key: str) -> None:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    with _attempts_lock:
        _prune_old_attempts(key, now, settings.admin_login_window_seconds)
        attempts = _login_attempts.setdefault(key, [])
        attempts.append(now)
        if len(attempts) >= settings.admin_max_attempts:
            _locked_until[key] = now + timedelta(seconds=settings.admin_lockout_seconds)
            _login_attempts[key] = []


def register_login_success(key: str) -> None:
    with _attempts_lock:
        _login_attempts.pop(key, None)
        _locked_until.pop(key, None)
