"""Public SOS intake and authenticated operator response workflow."""
from __future__ import annotations

import datetime as dt
import math
import secrets

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.alert_engine import _deliver_sms, _deliver_telegram
from app.auth_service import get_current_user
from app.database import get_db
from app.models import AlertRecipient, EvacuationShelter, RiskAssessment, SOSRequest, User, Zone
from app.schemas import SOSCreateIn, SOSOut, SOSStatusUpdateIn
from app.ws_manager import manager

router = APIRouter(prefix="/api/sos", tags=["sos"])
RATE_LIMIT_COUNT = 3
RATE_LIMIT_WINDOW = dt.timedelta(minutes=10)


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    return forwarded or (request.client.host if request.client else "unknown")


def _distance_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    radius = 6371.0088
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dlat, dlng = math.radians(lat2 - lat1), math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlng / 2) ** 2
    return radius * 2 * math.asin(math.sqrt(a))


def _nearest_context(db: Session, latitude: float | None, longitude: float | None):
    if latitude is None or longitude is None:
        return None, None, ""
    zones = db.query(Zone).all()
    if not zones:
        return None, None, ""
    zone = min(zones, key=lambda z: _distance_km(latitude, longitude, z.latitude, z.longitude))
    risk = (db.query(RiskAssessment).filter(RiskAssessment.zone_id == zone.id)
            .order_by(RiskAssessment.created_at.desc()).first())
    shelter = (db.query(EvacuationShelter).filter(EvacuationShelter.zone_id == zone.id)
               .order_by(EvacuationShelter.is_primary.desc(), EvacuationShelter.capacity.desc()).first())
    return zone, shelter, risk.level if risk else ""


def _new_reference(db: Session) -> str:
    for _ in range(10):
        reference = f"SOS-{dt.datetime.now(dt.timezone.utc):%y%m%d}-{secrets.randbelow(9000) + 1000}"
        if not db.query(SOSRequest.id).filter(SOSRequest.reference_id == reference).first():
            return reference
    return f"SOS-{secrets.token_hex(6).upper()}"


async def _notify_responders(numbers: list[str], message: str) -> None:
    # Delivery is backgrounded: emergency confirmation never waits for a
    # slow SMS gateway or Telegram endpoint.
    if numbers:
        await _deliver_sms(message, to_numbers=numbers)
    await _deliver_telegram(message)


def _operator(user: User = Depends(get_current_user)) -> User:
    if user.role not in {"operator", "administrator"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operator access required")
    return user


@router.post("", response_model=SOSOut, status_code=status.HTTP_201_CREATED)
async def create_sos(payload: SOSCreateIn, request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    ip = _client_ip(request)
    cutoff = dt.datetime.now(dt.timezone.utc) - RATE_LIMIT_WINDOW
    recent_count = db.query(SOSRequest).filter(SOSRequest.source_ip == ip, SOSRequest.created_at >= cutoff).count()
    if recent_count >= RATE_LIMIT_COUNT:
        raise HTTPException(status_code=429, detail="This connection can send up to 3 SOS requests every 10 minutes. Call 112 if danger is immediate.")

    zone, shelter, risk_level = _nearest_context(db, payload.latitude, payload.longitude)
    recipients = []
    if zone:
        recipients = (db.query(AlertRecipient).filter(AlertRecipient.is_active.is_(True))
                      .filter(or_(AlertRecipient.zone_id == zone.id, AlertRecipient.district == zone.district)).all())
    channels = ["in_app", "websocket", "telegram_queued"] + (["sms_queued"] if recipients else [])
    sos = SOSRequest(
        reference_id=_new_reference(db), phone_number=payload.phone_number.strip(), name=payload.name.strip(),
        people_count=payload.people_count, situation_type=payload.situation_type, message=payload.message.strip(),
        latitude=payload.latitude, longitude=payload.longitude, location_source=payload.location_source,
        nearest_zone_id=zone.id if zone else None, nearest_zone_name=zone.name if zone else "",
        district=zone.district if zone else "", risk_level=risk_level,
        shelter_name=shelter.name if shelter else "", shelter_latitude=shelter.lat if shelter else None,
        shelter_longitude=shelter.lng if shelter else None, source_ip=ip, notification_channels=channels,
    )
    db.add(sos)
    db.commit()
    db.refresh(sos)
    location = zone.name if zone else "location unavailable"
    message = f"TRISHUL SOS {sos.reference_id}: {sos.people_count} person(s), {sos.situation_type}, near {location}. Callback {sos.phone_number}."
    background_tasks.add_task(_notify_responders, [r.phone_number for r in recipients], message)
    await manager.broadcast("sos_created", SOSOut.model_validate(sos).model_dump(mode="json"))
    return sos


@router.get("", response_model=list[SOSOut])
def list_sos(status_filter: str | None = None, limit: int = 100, _: User = Depends(_operator), db: Session = Depends(get_db)):
    query = db.query(SOSRequest)
    if status_filter:
        query = query.filter(SOSRequest.status == status_filter)
    return query.order_by(SOSRequest.created_at.desc()).limit(min(max(limit, 1), 250)).all()


@router.patch("/{sos_id}/status", response_model=SOSOut)
async def update_sos_status(sos_id: str, payload: SOSStatusUpdateIn, user: User = Depends(_operator), db: Session = Depends(get_db)):
    sos = db.get(SOSRequest, sos_id)
    if not sos:
        raise HTTPException(status_code=404, detail="SOS request not found")
    sos.status, sos.status_note, sos.updated_by = payload.status, payload.note.strip(), user.display_name or user.username
    db.commit()
    db.refresh(sos)
    await manager.broadcast("sos_updated", SOSOut.model_validate(sos).model_dump(mode="json"))
    return sos
