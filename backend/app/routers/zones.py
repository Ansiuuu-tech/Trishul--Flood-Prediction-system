from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import EvacuationShelter, HistoricalEvent, RiskAssessment, Zone
from app.schemas import (
    EvacuationShelterOut,
    HistoricalEventOut,
    RiskAssessmentOut,
    ZoneOut,
)

router = APIRouter(prefix="/api/zones", tags=["zones"])


@router.get("", response_model=list[ZoneOut])
def list_zones(db: Session = Depends(get_db)):
    return db.query(Zone).order_by(Zone.name).all()


@router.get("/{zone_id}", response_model=ZoneOut)
def get_zone(zone_id: str, db: Session = Depends(get_db)):
    zone = db.get(Zone, zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail=f"Zone '{zone_id}' not found")
    return zone


@router.get("/{zone_id}/history")
def get_zone_history(zone_id: str, limit: int = 50, db: Session = Depends(get_db)):
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
    events = db.query(HistoricalEvent).filter(HistoricalEvent.zone_id == zone_id).all()
    return {
        "zone_id": zone_id,
        "risk_history": [RiskAssessmentOut.model_validate(a) for a in reversed(assessments)],
        "historical_events": [HistoricalEventOut.model_validate(e) for e in events],
    }


@router.get("/{zone_id}/shelters", response_model=list[EvacuationShelterOut])
def get_zone_shelters(zone_id: str, db: Session = Depends(get_db)):
    zone = db.get(Zone, zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail=f"Zone '{zone_id}' not found")
    return (
        db.query(EvacuationShelter)
        .filter(EvacuationShelter.zone_id == zone_id)
        .order_by(EvacuationShelter.is_primary.desc(), EvacuationShelter.capacity.desc())
        .all()
    )


@router.get("/nearest-shelter/{zone_id}", response_model=EvacuationShelterOut)
def get_nearest_shelter(zone_id: str, db: Session = Depends(get_db)):
    zone = db.get(Zone, zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail=f"Zone '{zone_id}' not found")
    shelter = (
        db.query(EvacuationShelter)
        .filter(EvacuationShelter.zone_id == zone_id)
        .order_by(EvacuationShelter.is_primary.desc())
        .first()
    )
    if not shelter:
        raise HTTPException(status_code=404, detail=f"No shelters found for zone '{zone_id}'")
    return shelter
