"""JWT login, token rotation, and logout endpoints for the private admin interface."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AdminUser, AuditEvent, RefreshToken
from app.schemas import AdminLoginRequest, AdminProfile, RefreshRequest, TokenResponse
from app.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_admin,
    hash_token_identifier,
    verify_password,
)

router = APIRouter(prefix="/admin/auth", tags=["admin authentication"])


def _tokens_for(admin: AdminUser, db: Session) -> TokenResponse:
    access_token = create_access_token(admin.id)
    refresh_token, jti, expires_at = create_refresh_token(admin.id)
    db.add(RefreshToken(jti_hash=hash_token_identifier(jti), admin_id=admin.id, expires_at=expires_at))
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=15 * 60,
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: AdminLoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    admin = db.scalar(select(AdminUser).where(AdminUser.email == str(payload.email).lower()))
    if admin is None or not admin.is_active or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    admin.last_login_at = datetime.now(timezone.utc)
    db.add(AuditEvent(admin_id=admin.id, action="admin_logged_in"))
    tokens = _tokens_for(admin, db)
    db.commit()
    return tokens


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)) -> TokenResponse:
    decoded = decode_token(payload.refresh_token, "refresh")
    token = db.scalar(select(RefreshToken).where(RefreshToken.jti_hash == hash_token_identifier(str(decoded["jti"]))))
    now = datetime.now(timezone.utc)
    if token is None or token.revoked_at is not None or token.expires_at <= now:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    admin = db.get(AdminUser, str(decoded["sub"]))
    if admin is None or not admin.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    token.revoked_at = now
    tokens = _tokens_for(admin, db)
    db.add(AuditEvent(admin_id=admin.id, action="admin_refreshed_token"))
    db.commit()
    return tokens


@router.post("/logout")
def logout(payload: RefreshRequest, db: Session = Depends(get_db), admin: AdminUser = Depends(get_current_admin)) -> dict[str, bool]:
    decoded = decode_token(payload.refresh_token, "refresh")
    if str(decoded["sub"]) != admin.id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    token = db.scalar(select(RefreshToken).where(RefreshToken.jti_hash == hash_token_identifier(str(decoded["jti"]))))
    if token is not None:
        token.revoked_at = datetime.now(timezone.utc)
    db.add(AuditEvent(admin_id=admin.id, action="admin_logged_out"))
    db.commit()
    return {"success": True}


@router.get("/me", response_model=AdminProfile)
def me(admin: AdminUser = Depends(get_current_admin)) -> AdminUser:
    return admin
