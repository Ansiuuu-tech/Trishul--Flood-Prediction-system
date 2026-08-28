from __future__ import annotations

import datetime as dt

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Alert, Zone
from app.schemas import AlertActionIn, AlertOut
from app.ws_manager import manager

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("", response_model=list[AlertOut])
def list_alerts(status: str | None = None, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(Alert)
    if status:
        query = query.filter(Alert.status == status)
    return query.order_by(Alert.created_at.desc()).limit(limit).all()


@router.post("/{alert_id}/acknowledge", response_model=AlertOut)
async def acknowledge_alert(alert_id: str, payload: AlertActionIn, db: Session = Depends(get_db)):
    alert = db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert '{alert_id}' not found")
    if alert.status == "resolved":
        raise HTTPException(status_code=400, detail="Cannot acknowledge a resolved alert")
    alert.status = "acknowledged"
    alert.acknowledged_by = payload.actor
    alert.acknowledged_at = dt.datetime.now(dt.timezone.utc)
    db.commit()
    db.refresh(alert)
    await manager.broadcast("alert_updated", {"id": alert.id, "status": alert.status})
    return alert


@router.post("/{alert_id}/resolve", response_model=AlertOut)
async def resolve_alert(alert_id: str, payload: AlertActionIn, db: Session = Depends(get_db)):
    alert = db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert '{alert_id}' not found")
    alert.status = "resolved"
    alert.resolved_at = dt.datetime.now(dt.timezone.utc)
    db.commit()
    db.refresh(alert)
    await manager.broadcast("alert_updated", {"id": alert.id, "status": alert.status})
    return alert


@router.post("/test", response_model=AlertOut)
async def send_test_alert(db: Session = Depends(get_db)):
    zone = db.query(Zone).first()
    if not zone:
        raise HTTPException(status_code=422, detail="No zones seeded yet")
    alert = Alert(
        zone_id=zone.id,
        level="Watch",
        previous_level="Safe",
        message=f"TEST ALERT for {zone.name}: this is a manually triggered test notification.",
        reasons=["Manually triggered via /api/alerts/test"],
        status="active",
        delivery_channels=["in_app", "test_mode"],
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    await manager.broadcast("alert", {
        "id": alert.id, "zone_id": alert.zone_id, "level": alert.level,
        "previous_level": alert.previous_level, "message": alert.message,
        "delivery_channels": alert.delivery_channels,
    })
    return alert
