from __future__ import annotations

import datetime as dt

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.alert_engine import _deliver_sms, get_recipients_for_alert
from app.config import get_settings
from app.database import get_db
from app.models import Alert, AlertRecipient, Zone
from app.schemas import (
    AlertActionIn,
    AlertOut,
    AlertRecipientIn,
    AlertRecipientOut,
    AlertRecipientUpdate,
    SendSMSIn,
    SendSMSOut,
)
from app.ws_manager import manager

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("", response_model=list[AlertOut])
def list_alerts(status: str | None = None, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(Alert)
    if status:
        query = query.filter(Alert.status == status)
    return query.order_by(Alert.created_at.desc()).limit(limit).all()


@router.get("/recipients", response_model=list[AlertRecipientOut])
def list_recipients(
    district: str | None = None,
    zone_id: str | None = None,
    role: str | None = None,
    active_only: bool = True,
    db: Session = Depends(get_db),
):
    """List registered emergency SMS alert recipients filtered by district, zone, or role."""
    query = db.query(AlertRecipient)
    if active_only:
        query = query.filter(AlertRecipient.is_active.is_(True))
    if district:
        query = query.filter(AlertRecipient.district.ilike(district))
    if zone_id:
        query = query.filter(AlertRecipient.zone_id == zone_id)
    if role:
        query = query.filter(AlertRecipient.role.ilike(role))
    return query.order_by(AlertRecipient.district, AlertRecipient.name).all()


@router.post("/recipients", response_model=AlertRecipientOut, status_code=201)
def create_recipient(payload: AlertRecipientIn, db: Session = Depends(get_db)):
    """Add a new stakeholder or resident to receive SMS alerts."""
    if payload.zone_id:
        zone = db.get(Zone, payload.zone_id)
        if not zone:
            raise HTTPException(status_code=404, detail=f"Zone '{payload.zone_id}' not found")
    recipient = AlertRecipient(
        name=payload.name,
        phone_number=payload.phone_number,
        role=payload.role,
        district=payload.district,
        zone_id=payload.zone_id,
        min_alert_level=payload.min_alert_level,
        is_active=payload.is_active,
    )
    db.add(recipient)
    db.commit()
    db.refresh(recipient)
    return recipient


@router.put("/recipients/{recipient_id}", response_model=AlertRecipientOut)
def update_recipient(recipient_id: str, payload: AlertRecipientUpdate, db: Session = Depends(get_db)):
    """Update contact information or activation status for an emergency recipient."""
    recipient = db.get(AlertRecipient, recipient_id)
    if not recipient:
        raise HTTPException(status_code=404, detail=f"Recipient '{recipient_id}' not found")
    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(recipient, field, val)
    db.commit()
    db.refresh(recipient)
    return recipient


@router.delete("/recipients/{recipient_id}")
def delete_recipient(recipient_id: str, db: Session = Depends(get_db)):
    """Remove a recipient from the emergency contact registry."""
    recipient = db.get(AlertRecipient, recipient_id)
    if not recipient:
        raise HTTPException(status_code=404, detail=f"Recipient '{recipient_id}' not found")
    db.delete(recipient)
    db.commit()
    return {"success": True, "message": f"Recipient '{recipient_id}' removed"}


@router.post("/test-targeted-sms")
async def test_targeted_sms(
    zone_id: str,
    alert_level: str = "Warning",
    custom_message: str | None = None,
    simulate: bool = True,
    db: Session = Depends(get_db),
):
    """Test targeted SMS recipient lookup and dispatch simulation for a given village/zone."""
    zone = db.get(Zone, zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail=f"Zone '{zone_id}' not found")
    recipients = get_recipients_for_alert(db, zone, alert_level)
    msg = custom_message or f"TEST TRISHUL ALERT: {zone.name} ({zone.district}) flood risk {alert_level}. Evacuate to {zone.safe_location}."
    numbers = [r.phone_number for r in recipients]

    settings = get_settings()
    if not simulate and settings.twilio_configured and numbers:
        success, detail = await _deliver_sms(msg, to_numbers=numbers)
    else:
        success = True
        detail = f"Simulated dispatch in demo mode to {len(numbers)} recipient(s)"


    return {
        "success": success,
        "zone_id": zone.id,
        "zone_name": zone.name,
        "district": zone.district,
        "alert_level": alert_level,
        "message": msg,
        "detail": detail,
        "recipients_targeted": [
            {
                "id": r.id,
                "name": r.name,
                "phone_number": r.phone_number,
                "role": r.role,
                "district": r.district,
                "phone": r.phone_number,
            }
            for r in recipients
        ],
    }



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


@router.post("/send-sms", response_model=SendSMSOut)
async def send_manual_sms(payload: SendSMSIn):
    """Manually send an SMS to a recipient via configured Twilio credentials."""
    settings = get_settings()
    if not settings.twilio_configured:
        raise HTTPException(
            status_code=503,
            detail=(
                "Twilio credentials are not configured. "
                "Please configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, "
                "and TWILIO_FROM_NUMBER in backend/.env"
            ),
        )
    success, detail = await _deliver_sms(payload.message, to_numbers=[payload.to_number])
    if not success:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to dispatch SMS to {payload.to_number}: {detail}",
        )
    return SendSMSOut(
        success=True,
        detail=detail,
        to_number=payload.to_number,
    )

