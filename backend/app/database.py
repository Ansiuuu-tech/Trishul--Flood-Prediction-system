"""
SQLAlchemy engine/session management.
Works with SQLite (zero-config demo) or PostgreSQL (Docker Compose / Supabase)
depending on DATABASE_URL.
"""
from __future__ import annotations

from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings

settings = get_settings()

connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def session_scope() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def init_db() -> None:
    from app import models  # noqa: F401  (register models on Base.metadata)

    Base.metadata.create_all(bind=engine)
    # create_all does NOT alter existing tables; backfill any columns that the
    # OAuth/JWT phase added to an already-provisioned users table (e.g. the
    # SQLite demo DB created during an earlier run). Safe to run repeatedly.
    _ensure_users_oauth_columns()


_OAUTH_USER_COLUMNS = {
    "email": "TEXT",
    "full_name": "TEXT",
    "hashed_password": "TEXT",
    "oauth_provider": "TEXT",
    "oauth_id": "TEXT",
    "avatar_url": "TEXT",
    "home_zone_id": "TEXT",
}


def _ensure_users_oauth_columns() -> None:
    """Add OAuth/JWT columns to the users table if they are missing.

    Covers SQLite (local dev, where CREATE TABLE IF NOT EXISTS is a no-op on an
    existing table) and PostgreSQL (idempotent via introspection). Unique
    constraints are NOT added here; provision them via migrations SQL instead.
    """
    try:
        inspector = inspect(engine)
        table_names = inspector.get_table_names()
    except Exception:  # noqa: BLE001  (no tables yet, nothing to migrate)
        return

    if "users" not in table_names:
        return

    existing = {c["name"] for c in inspector.get_columns("users")}
    missing = [(name, ctype) for name, ctype in _OAUTH_USER_COLUMNS.items() if name not in existing]
    if not missing:
        return

    with engine.begin() as conn:
        for name, ctype in missing:
            try:
                conn.exec_driver_sql(f'ALTER TABLE users ADD COLUMN "{name}" {ctype}')
            except Exception:  # noqa: BLE001  (column may already exist / unsupported)
                # Non-fatal: best-effort migration. The SQL migration files
                # remain available for a clean provisioning run.
                pass
