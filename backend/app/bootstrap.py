"""Create the initial BrightNest administrator from deployment-only secrets when configured."""
from __future__ import annotations

import logging

from sqlalchemy import select

from app.config import get_settings
from app.database import SessionLocal
from app.models import AdminUser, AuditEvent, UserRole
from app.security import hash_password

logger = logging.getLogger("brightnest.bootstrap")


def bootstrap_admin() -> None:
    settings = get_settings()
    if settings.bootstrap_admin_email is None or settings.bootstrap_admin_password is None:
        logger.info("Admin bootstrap skipped because bootstrap credentials are not configured")
        return
    session = SessionLocal()
    try:
        email = str(settings.bootstrap_admin_email).lower()
        existing = session.scalar(select(AdminUser).where(AdminUser.email == email))
        if existing is not None:
            logger.info("Admin bootstrap found existing account")
            return
        password = settings.bootstrap_admin_password.get_secret_value()
        if len(password) < 12:
            raise RuntimeError("BOOTSTRAP_ADMIN_PASSWORD must contain at least 12 characters")
        admin = AdminUser(email=email, password_hash=hash_password(password), role=UserRole.ADMIN)
        session.add(admin)
        session.flush()
        session.add(AuditEvent(admin_id=admin.id, action="admin_bootstrapped"))
        session.commit()
        logger.info("Initial private administrator created")
    except Exception:
        session.rollback()
        logger.exception("Admin bootstrap failed")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    bootstrap_admin()
