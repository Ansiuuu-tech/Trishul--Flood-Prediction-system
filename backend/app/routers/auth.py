"""
Demo authentication. Real credential-based auth is out of scope for this
hackathon prototype; instead, three demo-login buttons let the reviewer
switch role (Viewer / Operator / Administrator) to see role-gated UI.
No passwords, tokens are a simple opaque demo string only.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import DemoLoginIn, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])

ROLE_USERNAME = {
    "viewer": "viewer_demo",
    "operator": "operator_demo",
    "administrator": "admin_demo",
}


@router.post("/demo-login", response_model=UserOut)
def demo_login(payload: DemoLoginIn, db: Session = Depends(get_db)):
    username = ROLE_USERNAME[payload.role]
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Demo user not seeded")
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
