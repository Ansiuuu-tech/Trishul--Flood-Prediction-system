from __future__ import annotations

import datetime as dt

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import HistoricalEvent, RiskAssessment, SensorReading, Zone
from app.risk_engine import ACTION_BY_LEVEL, LEAD_TIME_BY_LEVEL, RiskInputs, compute_hybrid_risk, evaluate_risk
from app.schemas import RiskAssessmentOut

router = APIRouter(prefix="/api/risk", tags=["risk"])
settings = get_settings()


def _history_risk_for(db: Session, zone_id: str) -> float:
    count = db.query(HistoricalEvent).filter(HistoricalEvent.zone_id == zone_id).count()
    return min(100.0, 15.0 + count * 25.0)


@router.post("/evaluate/{zone_id}", response_model=RiskAssessmentOut)
def evaluate(zone_id: str, db: Session = Depends(get_db)):
    zone = db.get(Zone, zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail=f"Zone '{zone_id}' not found")

    reading = (
        db.query(SensorReading)
        .filter(SensorReading.zone_id == zone_id)
        .order_by(SensorReading.recorded_at.desc())
        .first()
    )
    if not reading:
        raise HTTPException(status_code=422, detail=f"No sensor readings available for zone '{zone_id}'")

    age = (dt.datetime.now(dt.timezone.utc) - reading.recorded_at.replace(tzinfo=dt.timezone.utc)).total_seconds()
    inputs = RiskInputs(
        zone_id=zone.id,
        rainfall_mm_1h=reading.rainfall_mm_1h, rainfall_mm_3h=reading.rainfall_mm_3h,
        rainfall_mm_24h=reading.rainfall_mm_24h, soil_moisture_pct=reading.soil_moisture_pct,
        tilt_degrees=reading.tilt_degrees, tilt_change_rate=reading.tilt_change_rate,
        vibration_g=reading.vibration_g, terrain_risk_static=zone.terrain_risk,
        history_risk_static=_history_risk_for(db, zone.id), is_online=reading.is_online,
        reading_age_seconds=age,
    )
    result = evaluate_risk(inputs)
    ml_reading = {
        "rainfall_24h": reading.rainfall_mm_24h,
        "rainfall_3d": reading.rainfall_mm_3d,
        "rainfall_7d": reading.rainfall_mm_7d,
        "rainfall_intensity": reading.rainfall_mm_1h,
        "soil_moisture": reading.soil_moisture_pct,
        "elevation": zone.elevation_m,
        "slope": zone.slope_degrees,
        "terrain_susceptibility": zone.terrain_risk,
        "seismic_zone": zone.seismic_zone,
        "quake_count_100km_alltime": zone.quake_count_100km_alltime or 0,
        "seismic_activity_90d": 0,
        "historical_flood_freq": zone.historical_flood_freq or 0.0,
        "historical_landslide_freq": zone.historical_landslide_freq or 0.0,
        "month": dt.datetime.now(dt.timezone.utc).month,
    }
    hybrid_result = compute_hybrid_risk(ml_reading, result.level, result.score)
    if hybrid_result["final_level"] != result.level:
        result.level = hybrid_result["final_level"]
        result.reasons.append(
            f"ML model flagged HIGH_RISK (probability={hybrid_result['ml_probability']:.2f}); escalated to Warning."
        )
        result.recommended_action = ACTION_BY_LEVEL[result.level]
        result.estimated_lead_time_minutes = LEAD_TIME_BY_LEVEL[result.level]
    assessment = RiskAssessment(
        zone_id=zone.id, score=result.score, level=result.level, confidence=result.confidence,
        rainfall_risk=result.rainfall_risk, soil_risk=result.soil_risk, tilt_risk=result.tilt_risk,
        vibration_risk=result.vibration_risk, terrain_risk=result.terrain_risk, history_risk=result.history_risk,
        reasons=result.reasons, recommended_action=result.recommended_action,
        estimated_lead_time_minutes=result.estimated_lead_time_minutes,
        data_quality_warning=result.data_quality_warning, model_version=result.model_version,
        ml_probability=hybrid_result["ml_probability"],
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment


@router.get("/current", response_model=list[RiskAssessmentOut])
def current_risk(db: Session = Depends(get_db)):
    zones = db.query(Zone).all()
    out = []
    for zone in zones:
        assessment = (
            db.query(RiskAssessment)
            .filter(RiskAssessment.zone_id == zone.id)
            .order_by(RiskAssessment.created_at.desc())
            .first()
        )
        if assessment:
            out.append(assessment)
    return out


@router.get("/{zone_id}/history", response_model=list[RiskAssessmentOut])
def risk_history(zone_id: str, limit: int = 100, db: Session = Depends(get_db)):
    zone = db.get(Zone, zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail=f"Zone '{zone_id}' not found")
    assessments = (
        db.query(RiskAssessment)
        .filter(RiskAssessment.zone_id == zone_id)
        .order_by(RiskAssessment.created_at.desc())
        .limit(limit)
        .all()
    )
    return list(reversed(assessments))
