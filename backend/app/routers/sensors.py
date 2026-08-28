from __future__ import annotations

import datetime as dt

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.alert_engine import maybe_create_alert
from app.config import get_settings
from app.database import get_db
from app.models import RiskAssessment, SensorReading, Zone
from app.risk_engine import RiskInputs, evaluate_risk
from app.schemas import SensorReadingBulkIn, SensorReadingIn, SensorReadingOut
from app.ws_manager import manager

router = APIRouter(prefix="/api/sensors", tags=["sensors"])
settings = get_settings()


def _history_risk_for(db: Session, zone_id: str) -> float:
    from app.models import HistoricalEvent

    count = db.query(HistoricalEvent).filter(HistoricalEvent.zone_id == zone_id).count()
    return min(100.0, 15.0 + count * 25.0)


@router.get("/latest", response_model=list[SensorReadingOut])
def latest_readings(db: Session = Depends(get_db)):
    zones = db.query(Zone).all()
    out = []
    for zone in zones:
        reading = (
            db.query(SensorReading)
            .filter(SensorReading.zone_id == zone.id)
            .order_by(SensorReading.recorded_at.desc())
            .first()
        )
        if reading:
            out.append(reading)
    return out


@router.get("/{zone_id}", response_model=list[SensorReadingOut])
def zone_readings(zone_id: str, limit: int = 100, db: Session = Depends(get_db)):
    zone = db.get(Zone, zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail=f"Zone '{zone_id}' not found")
    readings = (
        db.query(SensorReading)
        .filter(SensorReading.zone_id == zone_id)
        .order_by(SensorReading.recorded_at.desc())
        .limit(limit)
        .all()
    )
    return list(reversed(readings))


async def _ingest_one(db: Session, payload: SensorReadingIn) -> SensorReading:
    zone = db.get(Zone, payload.zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail=f"Zone '{payload.zone_id}' not found")

    reading = SensorReading(
        zone_id=payload.zone_id,
        source=payload.source,
        rainfall_mm_1h=payload.rainfall_mm_1h,
        rainfall_mm_3h=payload.rainfall_mm_3h,
        rainfall_mm_24h=payload.rainfall_mm_24h,
        soil_moisture_pct=payload.soil_moisture_pct,
        tilt_degrees=payload.tilt_degrees,
        tilt_change_rate=payload.tilt_change_rate,
        vibration_g=payload.vibration_g,
        battery_pct=payload.battery_pct,
        is_online=payload.is_online,
        recorded_at=dt.datetime.now(dt.timezone.utc),
    )
    db.add(reading)
    db.flush()

    previous = (
        db.query(RiskAssessment)
        .filter(RiskAssessment.zone_id == zone.id)
        .order_by(RiskAssessment.created_at.desc())
        .first()
    )
    previous_level = previous.level if previous else "Safe"

    inputs = RiskInputs(
        zone_id=zone.id,
        rainfall_mm_1h=reading.rainfall_mm_1h,
        rainfall_mm_3h=reading.rainfall_mm_3h,
        rainfall_mm_24h=reading.rainfall_mm_24h,
        soil_moisture_pct=reading.soil_moisture_pct,
        tilt_degrees=reading.tilt_degrees,
        tilt_change_rate=reading.tilt_change_rate,
        vibration_g=reading.vibration_g,
        terrain_risk_static=zone.terrain_risk,
        history_risk_static=_history_risk_for(db, zone.id),
        is_online=reading.is_online,
        reading_age_seconds=0,
    )
    result = evaluate_risk(inputs)
    assessment = RiskAssessment(
        zone_id=zone.id, score=result.score, level=result.level, confidence=result.confidence,
        rainfall_risk=result.rainfall_risk, soil_risk=result.soil_risk, tilt_risk=result.tilt_risk,
        vibration_risk=result.vibration_risk, terrain_risk=result.terrain_risk, history_risk=result.history_risk,
        reasons=result.reasons, recommended_action=result.recommended_action,
        estimated_lead_time_minutes=result.estimated_lead_time_minutes,
        data_quality_warning=result.data_quality_warning, model_version=result.model_version,
    )
    db.add(assessment)
    db.flush()

    alert = await maybe_create_alert(db, zone, previous_level, result)

    await manager.broadcast("sensor_reading", {
        "zone_id": zone.id, "rainfall_mm_1h": reading.rainfall_mm_1h, "rainfall_mm_3h": reading.rainfall_mm_3h,
        "soil_moisture_pct": reading.soil_moisture_pct, "tilt_degrees": reading.tilt_degrees,
        "vibration_g": reading.vibration_g, "is_online": reading.is_online,
        "recorded_at": reading.recorded_at.isoformat(),
    })
    await manager.broadcast("risk_update", {
        "zone_id": zone.id, "score": result.score, "level": result.level, "previous_level": previous_level,
        "confidence": result.confidence, "reasons": result.reasons,
        "recommended_action": result.recommended_action,
        "estimated_lead_time_minutes": result.estimated_lead_time_minutes,
        "data_quality_warning": result.data_quality_warning,
    })
    if alert is not None:
        await manager.broadcast("alert", {
            "id": alert.id, "zone_id": alert.zone_id, "level": alert.level,
            "previous_level": alert.previous_level, "message": alert.message,
            "delivery_channels": alert.delivery_channels,
        })

    return reading


@router.post("/reading", response_model=SensorReadingOut)
async def post_reading(payload: SensorReadingIn, db: Session = Depends(get_db)):
    reading = await _ingest_one(db, payload)
    db.commit()
    db.refresh(reading)
    return reading


@router.post("/bulk", response_model=list[SensorReadingOut])
async def post_bulk(payload: SensorReadingBulkIn, db: Session = Depends(get_db)):
    if not payload.readings:
        raise HTTPException(status_code=400, detail="readings list cannot be empty")
    results = []
    for item in payload.readings:
        reading = await _ingest_one(db, item)
        results.append(reading)
    db.commit()
    for r in results:
        db.refresh(r)
    return results
