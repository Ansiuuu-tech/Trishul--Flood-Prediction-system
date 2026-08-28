"""
Simulation engine. Runs as an asyncio background task inside the FastAPI
process (no external process required) and generates sensor readings every
SIMULATION_INTERVAL_SECONDS, feeding them through the same ingestion +
risk + alert pipeline real hardware would use.

Scenarios:
  normal            - gentle random walk around safe baseline, all zones.
  heavy_rain        - elevated rainfall/soil across all zones (reaches Watch/Warning).
  rapid_escalation  - one target zone climbs Safe -> Watch -> Warning -> Evacuate
                       deterministically over a fixed number of ticks.
  sensor_failure    - target zone's sensor goes offline / stops reporting.
"""
from __future__ import annotations

import asyncio
import datetime as dt
import random
from dataclasses import dataclass, field
from typing import Optional

from sqlalchemy.orm import Session

from app.alert_engine import maybe_create_alert
from app.config import get_settings
from app.database import session_scope
from app.models import HistoricalEvent, RiskAssessment, SensorReading, Zone
from app.risk_engine import RiskInputs, evaluate_risk
from app.ws_manager import manager

settings = get_settings()


@dataclass
class SimulationState:
    running: bool = False
    scenario: str = "normal"
    target_zone_id: Optional[str] = None
    ticks_elapsed: int = 0
    started_at: Optional[dt.datetime] = None
    _task: Optional[asyncio.Task] = field(default=None, repr=False)


state = SimulationState()

# Rapid-escalation is scripted over N ticks so it deterministically sweeps
# Safe -> Watch -> Warning -> Evacuate, driven by rainfall/soil/tilt/vibration.
_ESCALATION_STEPS = [
    # (rainfall_1h, rainfall_3h, rainfall_24h, soil_pct, tilt_deg, tilt_rate, vibration_g)
    (2, 5, 15, 35, 1.0, 0.1, 0.05),     # 0: Safe baseline
    (8, 20, 40, 48, 1.5, 0.3, 0.15),    # 1: rising
    (15, 35, 70, 58, 2.2, 0.8, 0.3),    # 2: Watch
    (25, 55, 110, 68, 3.0, 1.5, 0.6),   # 3: approaching Warning
    (35, 65, 140, 82, 4.5, 3.0, 1.2),   # 4: Warning (rule: rainfall_3h>=60 & soil>=80)
    (45, 85, 170, 88, 6.5, 5.5, 1.8),   # 5: Evacuate (rule: rainfall_3h>=80 & soil>=85 & tilt_rate>=5)
    (48, 90, 180, 90, 7.5, 6.5, 2.0),   # 6: hold at Evacuate
]


def _history_risk_for(db: Session, zone_id: str) -> float:
    count = db.query(HistoricalEvent).filter(HistoricalEvent.zone_id == zone_id).count()
    return min(100.0, 15.0 + count * 25.0)


async def _process_reading(db: Session, zone: Zone, reading: SensorReading) -> None:
    """Persist reading, run risk engine, persist assessment, fire alert if escalated, broadcast."""
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
        zone_id=zone.id,
        score=result.score,
        level=result.level,
        confidence=result.confidence,
        rainfall_risk=result.rainfall_risk,
        soil_risk=result.soil_risk,
        tilt_risk=result.tilt_risk,
        vibration_risk=result.vibration_risk,
        terrain_risk=result.terrain_risk,
        history_risk=result.history_risk,
        reasons=result.reasons,
        recommended_action=result.recommended_action,
        estimated_lead_time_minutes=result.estimated_lead_time_minutes,
        data_quality_warning=result.data_quality_warning,
        model_version=result.model_version,
    )
    db.add(assessment)
    db.flush()

    alert = await maybe_create_alert(db, zone, previous_level, result)

    await manager.broadcast("sensor_reading", {
        "zone_id": zone.id,
        "rainfall_mm_1h": reading.rainfall_mm_1h,
        "rainfall_mm_3h": reading.rainfall_mm_3h,
        "soil_moisture_pct": reading.soil_moisture_pct,
        "tilt_degrees": reading.tilt_degrees,
        "vibration_g": reading.vibration_g,
        "is_online": reading.is_online,
        "recorded_at": reading.recorded_at.isoformat(),
    })
    await manager.broadcast("risk_update", {
        "zone_id": zone.id,
        "score": result.score,
        "level": result.level,
        "previous_level": previous_level,
        "confidence": result.confidence,
        "reasons": result.reasons,
        "recommended_action": result.recommended_action,
        "estimated_lead_time_minutes": result.estimated_lead_time_minutes,
        "data_quality_warning": result.data_quality_warning,
    })
    if alert is not None:
        await manager.broadcast("alert", {
            "id": alert.id,
            "zone_id": alert.zone_id,
            "level": alert.level,
            "previous_level": alert.previous_level,
            "message": alert.message,
            "delivery_channels": alert.delivery_channels,
        })


def _rng_for(zone_id: str, tick: int) -> random.Random:
    return random.Random(hash((zone_id, tick, "sim")) % (2**32))


async def _tick_normal(db: Session, zones: list[Zone]) -> None:
    for zone in zones:
        rng = _rng_for(zone.id, state.ticks_elapsed)
        reading = SensorReading(
            zone_id=zone.id, source="simulator",
            rainfall_mm_1h=max(0, rng.gauss(2, 1.5)),
            rainfall_mm_3h=max(0, rng.gauss(5, 3)),
            rainfall_mm_24h=max(0, rng.gauss(15, 6)),
            soil_moisture_pct=max(0, min(100, rng.gauss(35, 5))),
            tilt_degrees=max(0, rng.gauss(1.2, 0.4)),
            tilt_change_rate=max(0, rng.gauss(0.15, 0.1)),
            vibration_g=max(0, rng.gauss(0.08, 0.05)),
            battery_pct=rng.uniform(75, 100),
            is_online=True,
        )
        db.add(reading)
        db.flush()
        await _process_reading(db, zone, reading)


async def _tick_heavy_rain(db: Session, zones: list[Zone]) -> None:
    for zone in zones:
        rng = _rng_for(zone.id, state.ticks_elapsed)
        progress = min(1.0, state.ticks_elapsed / 15.0)
        reading = SensorReading(
            zone_id=zone.id, source="simulator",
            rainfall_mm_1h=max(0, rng.gauss(10 + 20 * progress, 3)),
            rainfall_mm_3h=max(0, rng.gauss(25 + 45 * progress, 6)),
            rainfall_mm_24h=max(0, rng.gauss(60 + 90 * progress, 10)),
            soil_moisture_pct=max(0, min(100, 40 + 35 * progress + rng.gauss(0, 3))),
            tilt_degrees=max(0, rng.gauss(1.5 + 1.5 * progress, 0.4)),
            tilt_change_rate=max(0, rng.gauss(0.3 + 0.8 * progress, 0.2)),
            vibration_g=max(0, rng.gauss(0.1 + 0.3 * progress, 0.08)),
            battery_pct=rng.uniform(70, 100),
            is_online=True,
        )
        db.add(reading)
        db.flush()
        await _process_reading(db, zone, reading)


async def _tick_rapid_escalation(db: Session, zones: list[Zone]) -> None:
    target_id = state.target_zone_id or zones[0].id
    step_idx = min(state.ticks_elapsed, len(_ESCALATION_STEPS) - 1)
    r1, r3, r24, soil, tilt, tilt_rate, vib = _ESCALATION_STEPS[step_idx]

    for zone in zones:
        rng = _rng_for(zone.id, state.ticks_elapsed)
        if zone.id == target_id:
            reading = SensorReading(
                zone_id=zone.id, source="simulator",
                rainfall_mm_1h=r1, rainfall_mm_3h=r3, rainfall_mm_24h=r24,
                soil_moisture_pct=soil, tilt_degrees=tilt, tilt_change_rate=tilt_rate,
                vibration_g=vib, battery_pct=rng.uniform(85, 100), is_online=True,
            )
        else:
            reading = SensorReading(
                zone_id=zone.id, source="simulator",
                rainfall_mm_1h=max(0, rng.gauss(2, 1)),
                rainfall_mm_3h=max(0, rng.gauss(5, 2)),
                rainfall_mm_24h=max(0, rng.gauss(15, 5)),
                soil_moisture_pct=max(0, min(100, rng.gauss(35, 4))),
                tilt_degrees=max(0, rng.gauss(1.2, 0.3)),
                tilt_change_rate=max(0, rng.gauss(0.15, 0.1)),
                vibration_g=max(0, rng.gauss(0.08, 0.04)),
                battery_pct=rng.uniform(80, 100), is_online=True,
            )
        db.add(reading)
        db.flush()
        await _process_reading(db, zone, reading)


async def _tick_sensor_failure(db: Session, zones: list[Zone]) -> None:
    target_id = state.target_zone_id or zones[0].id
    for zone in zones:
        rng = _rng_for(zone.id, state.ticks_elapsed)
        if zone.id == target_id:
            reading = SensorReading(
                zone_id=zone.id, source="simulator",
                rainfall_mm_1h=0, rainfall_mm_3h=0, rainfall_mm_24h=0,
                soil_moisture_pct=0, tilt_degrees=0, tilt_change_rate=0, vibration_g=0,
                battery_pct=max(0, rng.uniform(0, 15)), is_online=False,
            )
        else:
            reading = SensorReading(
                zone_id=zone.id, source="simulator",
                rainfall_mm_1h=max(0, rng.gauss(2, 1)),
                rainfall_mm_3h=max(0, rng.gauss(5, 2)),
                rainfall_mm_24h=max(0, rng.gauss(15, 5)),
                soil_moisture_pct=max(0, min(100, rng.gauss(35, 4))),
                tilt_degrees=max(0, rng.gauss(1.2, 0.3)),
                tilt_change_rate=max(0, rng.gauss(0.15, 0.1)),
                vibration_g=max(0, rng.gauss(0.08, 0.04)),
                battery_pct=rng.uniform(80, 100), is_online=True,
            )
        db.add(reading)
        db.flush()
        await _process_reading(db, zone, reading)


_TICK_HANDLERS = {
    "normal": _tick_normal,
    "heavy_rain": _tick_heavy_rain,
    "rapid_escalation": _tick_rapid_escalation,
    "sensor_failure": _tick_sensor_failure,
}


async def _run_loop() -> None:
    while state.running:
        try:
            with session_scope() as db:
                zones = db.query(Zone).all()
                handler = _TICK_HANDLERS.get(state.scenario, _tick_normal)
                await handler(db, zones)
            state.ticks_elapsed += 1
        except Exception as exc:  # keep the loop alive even if one tick fails
            print(f"[simulation] tick error: {exc}")
        await asyncio.sleep(settings.SIMULATION_INTERVAL_SECONDS)


def start_simulation(scenario: str = "normal", target_zone_id: Optional[str] = None) -> None:
    state.scenario = scenario
    state.target_zone_id = target_zone_id
    state.ticks_elapsed = 0
    state.started_at = dt.datetime.now(dt.timezone.utc)
    from app.alert_engine import reset_cooldowns
    reset_cooldowns()
    if not state.running:
        state.running = True
        state._task = asyncio.create_task(_run_loop())


def stop_simulation() -> None:
    state.running = False
    if state._task:
        state._task.cancel()
        state._task = None


def set_scenario(scenario: str, target_zone_id: Optional[str] = None) -> None:
    state.scenario = scenario
    state.target_zone_id = target_zone_id
    state.ticks_elapsed = 0
    from app.alert_engine import reset_cooldowns
    reset_cooldowns()
    if not state.running:
        start_simulation(scenario, target_zone_id)


def reset_simulation(db: Session) -> None:
    stop_simulation()
    state.scenario = "normal"
    state.target_zone_id = None
    state.ticks_elapsed = 0
    state.started_at = None
    from app.alert_engine import reset_cooldowns
    reset_cooldowns()
    db.query(RiskAssessment).delete()
    db.query(SensorReading).delete()
    db.commit()
    from app.seed_data import seed_database
    seed_database(db)
