from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import simulation_engine as sim
from app.config import get_settings
from app.database import get_db
from app.models import Zone
from app.schemas import SimulationScenarioIn, SimulationStatusOut

router = APIRouter(prefix="/api/simulation", tags=["simulation"])
settings = get_settings()


@router.post("/start", response_model=SimulationStatusOut)
async def start(payload: SimulationScenarioIn | None = None, db: Session = Depends(get_db)):
    scenario = payload.scenario if payload else "normal"
    target = payload.zone_id if payload else None
    if target and not db.get(Zone, target):
        raise HTTPException(status_code=404, detail=f"Zone '{target}' not found")
    if scenario in ("rapid_escalation", "sensor_failure") and not target:
        target = db.query(Zone).first().id
    sim.start_simulation(scenario, target)
    return _status()


@router.post("/stop", response_model=SimulationStatusOut)
async def stop():
    sim.stop_simulation()
    return _status()


@router.post("/reset", response_model=SimulationStatusOut)
async def reset(db: Session = Depends(get_db)):
    sim.reset_simulation(db)
    return _status()


@router.post("/scenario", response_model=SimulationStatusOut)
async def scenario(payload: SimulationScenarioIn, db: Session = Depends(get_db)):
    if payload.zone_id and not db.get(Zone, payload.zone_id):
        raise HTTPException(status_code=404, detail=f"Zone '{payload.zone_id}' not found")
    target = payload.zone_id
    if payload.scenario in ("rapid_escalation", "sensor_failure") and not target:
        target = db.query(Zone).first().id
    sim.set_scenario(payload.scenario, target)
    return _status()


@router.get("/status", response_model=SimulationStatusOut)
def status():
    return _status()


def _status() -> SimulationStatusOut:
    return SimulationStatusOut(
        running=sim.state.running,
        scenario=sim.state.scenario,
        target_zone_id=sim.state.target_zone_id,
        tick_interval_seconds=settings.SIMULATION_INTERVAL_SECONDS,
        ticks_elapsed=sim.state.ticks_elapsed,
        started_at=sim.state.started_at,
    )
