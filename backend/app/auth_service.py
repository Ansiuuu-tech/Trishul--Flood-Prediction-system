"""
Shared auth helpers: OAuth user resolution and JWT session handling.
Used by both the OAuth callback routes and the demo-login / me endpoints so
there is a single code path for issuing + validating session tokens.
"""
from __future__ import annotations

import datetime as dt
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import User

settings = get_settings()


def get_or_create_oauth_user(
    db: Session,
    provider: str,
    oauth_id: str,
    email: Optional[str],
    full_name: str,
    avatar_url: Optional[str],
) -> User:
    """Find an existing user by (provider, oauth_id); link to an existing
    email/password account if the email matches; otherwise create a new one.
    """
    user = db.query(User).filter_by(oauth_provider=provider, oauth_id=oauth_id).first()
    if user:
        return user

    email_norm = (email or "").strip().lower() or None

    # An existing email/password account with the same email — link the OAuth
    # identity to it instead of creating a duplicate.
    if email_norm:
        existing = db.query(User).filter(User.email == email_norm).first()
        if existing:
            existing.oauth_provider = provider
            existing.oauth_id = oauth_id
            existing.avatar_url = existing.avatar_url or avatar_url
            db.commit()
            db.refresh(existing)
            return existing

    # Derive a stable username for OAuth-only accounts.
    base_username = f"{provider}_{oauth_id}"
    username = base_username
    counter = 1
    while db.query(User).filter(User.username == username).first():
        counter += 1
        username = f"{base_username}_{counter}"

    user = User(
        username=username,
        email=email_norm,
        full_name=full_name or email_norm or username,
        display_name=full_name or email_norm or username,
        hashed_password=None,
        oauth_provider=provider,
        oauth_id=oauth_id,
        avatar_url=avatar_url,
        is_demo_account=False,
        role="viewer",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_jwt_for_user(user: User) -> str:
    """Issue a signed JWT session token for an authenticated user."""
    now = dt.datetime.now(dt.timezone.utc)
    payload = {
        "sub": str(user.id),
        "username": user.username,
        "role": user.role,
        "iat": int(now.timestamp()),
        "exp": int((now + dt.timedelta(hours=settings.JWT_EXPIRY_HOURS)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.JWT_ALGORITHM)


def decode_jwt(token: str) -> dict:
    try:
        return jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.JWT_ALGORITHM],
            options={"require": ["exp", "sub"]},
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """FastAPI dependency: resolve the authenticated user from the Bearer JWT.
    Returns the User model instance or raises 401.
    """
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = auth_header[len("Bearer "):].strip()
    payload = decode_jwt(token)
    user = db.get(User, payload["sub"])
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
