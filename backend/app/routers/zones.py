from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.evacuation_router import compute_evacuation_route, get_evacuation_route_geojson
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


@router.get("/all/historical-events", response_model=list[HistoricalEventOut])
def all_historical_events(db: Session = Depends(get_db)):
    """Return documented events for every zone, newest first, for map overlays."""
    return db.query(HistoricalEvent).order_by(HistoricalEvent.event_date.desc()).all()


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


@router.get("/{zone_id}/evacuation-route")
def get_evacuation_route(zone_id: str, place_name: str | None = Query(None, description="OSM place name for road graph"), db: Session = Depends(get_db)):
    zone = db.get(Zone, zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail=f"Zone '{zone_id}' not found")

    try:
        route_result = compute_evacuation_route(
            zone_id, place_name or f"{zone.district} district, Uttarakhand, India"
        )
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Failed to compute evacuation route: {str(e)}")

    if not route_result:
        raise HTTPException(status_code=404, detail=f"Could not compute evacuation route for zone '{zone_id}'")

    geojson = get_evacuation_route_geojson(route_result)
    return {
        "zone_id": zone_id,
        "zone_name": zone.name,
        "shelter": {
            "id": route_result.shelter_id,
            "name": route_result.shelter_name,
            "lat": route_result.shelter_lat,
            "lng": route_result.shelter_lng,
            "capacity": route_result.shelter_capacity,
            "shelter_type": route_result.shelter_type,
            "is_primary": route_result.shelter_is_primary,
        },
        "route_geojson": geojson,
        "route_coordinates": route_result.path,
        "distance_km": geojson["properties"]["distance_km"],
        "duration_min": geojson["properties"]["duration_min"],
    }
