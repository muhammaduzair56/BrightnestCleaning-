"""SQLAlchemy engine and request-scoped database sessions for Neon PostgreSQL."""
from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings

settings = get_settings()

# Neon can scale to zero. pool_pre_ping validates an idle connection before reuse.
engine = create_engine(
    settings.sqlalchemy_database_url,
    pool_pre_ping=True,
    pool_recycle=240,
    pool_size=5,
    max_overflow=5,
    pool_timeout=30,
    future=True,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


class Base(DeclarativeBase):
    """Base class for all BrightNest database models."""


def get_db() -> Generator[Session, None, None]:
    """Provide a transaction-scoped session and always release it after the request."""
    session = SessionLocal()
    try:
        yield session
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
