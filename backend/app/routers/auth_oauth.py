"""
OAuth login + callback routes for Google and Facebook.

Flow:
  GET /api/auth/google/login   -> redirects to provider consent screen
  GET /api/auth/google/callback -> provider redirects back here, we resolve
        the user, mint a JWT, and redirect the browser to
        {FRONTEND_URL}/auth/callback?token=<jwt>
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.auth_service import create_jwt_for_user, get_or_create_oauth_user
from app.config import get_settings
from app.database import get_db
from app.oauth import oauth

settings = get_settings()

router = APIRouter(prefix="/api/auth", tags=["oauth"])


@router.get("/google/login")
async def google_login(request: Request):
    if not (settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET):
        raise HTTPException(
            status_code=503,
            detail="Google OAuth is not configured. Set GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET in .env.",
        )
    redirect_uri = request.url_for("google_callback")
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback", name="google_callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
        userinfo = token.get("userinfo") or await oauth.google.get("userinfo").json()
    except Exception as exc:  # noqa: BLE001
        return RedirectResponse(
            f"{settings.FRONTEND_URL}/auth/callback?error={exc.__class__.__name__}",
            status_code=302,
        )

    user = get_or_create_oauth_user(
        db,
        provider="google",
        oauth_id=userinfo["sub"],
        email=userinfo.get("email"),
        full_name=userinfo.get("name", ""),
        avatar_url=userinfo.get("picture"),
    )
    jwt_token = create_jwt_for_user(user)
    return RedirectResponse(
        f"{settings.FRONTEND_URL}/auth/callback?token={jwt_token}",
        status_code=302,
    )


@router.get("/facebook/login")
async def facebook_login(request: Request):
    if not (settings.FACEBOOK_CLIENT_ID and settings.FACEBOOK_CLIENT_SECRET):
        raise HTTPException(
            status_code=503,
            detail="Facebook OAuth is not configured. Set FACEBOOK_CLIENT_ID/FACEBOOK_CLIENT_SECRET in .env.",
        )
    redirect_uri = request.url_for("facebook_callback")
    return await oauth.facebook.authorize_redirect(request, redirect_uri)


@router.get("/facebook/callback", name="facebook_callback")
async def facebook_callback(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.facebook.authorize_access_token(request)
        # Facebook does not return profile data in the token; fetch /me explicitly.
        resp = await oauth.facebook.get(
            "me?fields=id,name,email,picture", token=token
        )
        profile = resp.json()
    except Exception as exc:  # noqa: BLE001
        return RedirectResponse(
            f"{settings.FRONTEND_URL}/auth/callback?error={exc.__class__.__name__}",
            status_code=302,
        )

    email = profile.get("email")
    if not email:
        # Facebook may withhold the email; use a stable placeholder so the
        # account can still be created/linked without crashing.
        email = f"{profile['id']}@facebook.placeholder"

    picture_data = profile.get("picture") or {}
    avatar_url = picture_data.get("data", {}).get("url")

    user = get_or_create_oauth_user(
        db,
        provider="facebook",
        oauth_id=profile["id"],
        email=email,
        full_name=profile.get("name", ""),
        avatar_url=avatar_url,
    )
    jwt_token = create_jwt_for_user(user)
    return RedirectResponse(
        f"{settings.FRONTEND_URL}/auth/callback?token={jwt_token}",
        status_code=302,
    )
