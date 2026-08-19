"""Password hashing and signed JWT handling for BrightNest administrators."""
from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import AdminUser

settings = get_settings()
password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return password_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return password_context.verify(password, password_hash)


def _issue_token(subject: str, token_type: str, expires_delta: timedelta, jti: str | None = None) -> tuple[str, str]:
    token_id = jti or secrets.token_urlsafe(24)
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "type": token_type,
        "jti": token_id,
        "iat": now,
        "exp": now + expires_delta,
    }
    token = jwt.encode(payload, settings.jwt_secret.get_secret_value(), algorithm=settings.jwt_algorithm)
    return token, token_id


def create_access_token(admin_id: str) -> str:
    token, _ = _issue_token(admin_id, "access", timedelta(minutes=settings.access_token_minutes))
    return token


def create_refresh_token(admin_id: str) -> tuple[str, str, datetime]:
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_days)
    token, jti = _issue_token(admin_id, "refresh", timedelta(days=settings.refresh_token_days))
    return token, jti, expires_at


def hash_token_identifier(jti: str) -> str:
    return hashlib.sha256(jti.encode("utf-8")).hexdigest()


def decode_token(token: str, expected_type: str) -> dict[str, object]:
    try:
        payload = jwt.decode(token, settings.jwt_secret.get_secret_value(), algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired authentication token") from exc
    if payload.get("type") != expected_type or not payload.get("sub"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token")
    return payload


def get_current_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> AdminUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication is required")
    payload = decode_token(credentials.credentials, "access")
    admin = db.get(AdminUser, str(payload["sub"]))
    if admin is None or not admin.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication is required")
    return admin
