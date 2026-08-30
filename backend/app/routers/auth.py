"""
Authentication helpers.

Exposes:
  POST /api/auth/demo-login  -> issues a JWT for one of the seeded demo users
  GET  /api/auth/me          -> returns the current user from the JWT
  GET  /api/auth/roles       -> lists the available demo roles

Real OAuth login is handled in app/routers/auth_oauth.py (Google + Facebook);
both flows funnel through the same JWT issued by app/auth_service.create_jwt_for_user.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth_service import create_jwt_for_user, get_current_user
from app.database import get_db
from app.models import User
from app.schemas import DemoLoginIn, LoginResponse, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])

ROLE_USERNAME = {
    "viewer": "viewer_demo",
    "operator": "operator_demo",
    "administrator": "admin_demo",
}


@router.post("/demo-login", response_model=LoginResponse)
def demo_login(payload: DemoLoginIn, db: Session = Depends(get_db)):
    username = ROLE_USERNAME[payload.role]
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Demo user not seeded")
    token = create_jwt_for_user(user)
    return LoginResponse(token=token, user=user)


@router.get("/me", response_model=UserOut)
def read_current_user(user: User = Depends(get_current_user)):
    """Resolve the authenticated user from the Bearer JWT."""
    return user


@router.get("/roles")
def list_roles():
    return {
        "roles": [
            {"role": "viewer", "description": "Can view dashboard, map, zones, alerts, and analytics."},
            {"role": "operator", "description": "Viewer permissions plus: acknowledge/resolve alerts, run simulations."},
            {"role": "administrator", "description": "Operator permissions plus: manage settings and alert channels."},
        ]
    }
