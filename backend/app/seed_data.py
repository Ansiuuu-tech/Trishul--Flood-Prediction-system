"""
Seed data for the demo: 8 FICTIONAL zones in a fictional Himalayan district.
None of these places correspond to real administrative boundaries; names and
coordinates are invented for demonstration purposes only.
"""
from __future__ import annotations

import datetime as dt
import random

from sqlalchemy.orm import Session

from app.models import HistoricalEvent, RiskAssessment, SensorReading, User, Zone


def _polygon(center_lat: float, center_lon: float, size: float = 0.02) -> dict:
    """Generate a small square-ish GeoJSON polygon around a center point."""
    return {
        "type": "Polygon",
        "coordinates": [[
            [center_lon - size, center_lat - size],
            [center_lon + size, center_lat - size],
            [center_lon + size, center_lat + size],
            [center_lon - size, center_lat + size],
            [center_lon - size, center_lat - size],
        ]],
    }


ZONES = [
    dict(
        id="dharali", name="Dharali", description="Fictional riverside hamlet below a steep forested ridge.",
        latitude=30.9950, longitude=78.7550, population=1450, elevation_m=2100, slope_degrees=34,
        terrain_risk=68, safe_location="Dharali Community Hall (upper terrace)",
        evacuation_route="Follow marked trail NE from river bridge to upper terrace, 900m, ~20 min on foot.",
    ),
    dict(
        id="bhagirathi_view", name="Bhagirathi View", description="Fictional terraced settlement overlooking a glacial valley.",
        latitude=31.0120, longitude=78.7810, population=980, elevation_m=2350, slope_degrees=28,
        terrain_risk=55, safe_location="Bhagirathi View School Ground",
        evacuation_route="Head south along the ridge road to the school ground, 600m, ~15 min on foot.",
    ),
    dict(
        id="pine_ridge", name="Pine Ridge", description="Fictional forested slope community with shallow soil cover.",
        latitude=31.0300, longitude=78.7300, population=610, elevation_m=1980, slope_degrees=31,
        terrain_risk=60, safe_location="Pine Ridge Forest Rest House",
        evacuation_route="Ascend the fire trail to the rest house, 750m, ~18 min on foot.",
    ),
    dict(
        id="kedarnath_valley", name="Kedarnath Valley", description="Fictional narrow valley settlement near a seasonal stream.",
        latitude=30.7350, longitude=79.0650, population=2200, elevation_m=2650, slope_degrees=38,
        terrain_risk=80, safe_location="Kedarnath Valley Helipad Plateau",
        evacuation_route="Move uphill via the pilgrim trail to the helipad plateau, 1.2km, ~30 min on foot.",
    ),
    dict(
        id="riverbend", name="Riverbend", description="Fictional low-lying village at a river confluence, flash-flood prone.",
        latitude=30.9100, longitude=78.6900, population=1750, elevation_m=1450, slope_degrees=12,
        terrain_risk=58, safe_location="Riverbend Elevated Grain Storage",
        evacuation_route="Move away from the riverbank to the elevated storage compound, 500m, ~12 min on foot.",
    ),
    dict(
        id="cloudrest", name="Cloudrest", description="Fictional high-altitude hamlet frequently in cloud cover with heavy monsoon rain.",
        latitude=31.0500, longitude=78.8100, population=430, elevation_m=2800, slope_degrees=26,
        terrain_risk=50, safe_location="Cloudrest Monastery Courtyard",
        evacuation_route="Follow the monastery path uphill, 400m, ~10 min on foot.",
    ),
    dict(
        id="mandla_slope", name="Mandla Slope", description="Fictional agricultural terraces on a historically unstable slope.",
        latitude=30.8700, longitude=78.7200, population=890, elevation_m=1850, slope_degrees=36,
        terrain_risk=75, safe_location="Mandla Slope Panchayat Bhawan",
        evacuation_route="Take the terraced steps down to the panchayat bhawan, 550m, ~14 min on foot.",
    ),
    dict(
        id="himalayan_gate", name="Himalayan Gate", description="Fictional gateway town at the base of the district, main transit hub.",
        latitude=30.7000, longitude=78.4400, population=3100, elevation_m=900, slope_degrees=9,
        terrain_risk=35, safe_location="Himalayan Gate District Stadium",
        evacuation_route="Follow the highway bypass to the district stadium, 1.5km, ~10 min by vehicle.",
    ),
]

HISTORICAL_EVENTS = {
    "dharali": [("landslide", "severe", 3, "2019 monsoon landslide damaged 6 homes.")],
    "kedarnath_valley": [("flash_flood", "severe", 12, "2021 flash flood following glacial lake outburst upstream.")],
    "mandla_slope": [("landslide", "moderate", 0, "2022 slope failure blocked the access road for 4 days.")],
    "riverbend": [("flash_flood", "moderate", 1, "2020 monsoon flash flood affected low-lying fields.")],
    "pine_ridge": [("landslide", "minor", 0, "2018 minor debris slide near the fire trail.")],
}


def seed_baseline_readings_and_risk(db: Session) -> None:
    """(Re)create one baseline 'Safe' sensor reading + risk assessment per
    zone. Safe to call whenever zones exist but readings/assessments are
    empty (e.g. right after startup, or after a simulation reset)."""
    from app.risk_engine import RiskInputs, evaluate_risk

    zones = db.query(Zone).all()
    if not zones:
        return
    if db.query(SensorReading).count() > 0:
        return  # baseline (or live) data already present

    for zone in zones:
        rng = random.Random(hash(zone.id) % (2**32))
        reading = SensorReading(
            zone_id=zone.id,
            source="simulator",
            rainfall_mm_1h=rng.uniform(0, 3),
            rainfall_mm_3h=rng.uniform(0, 8),
            rainfall_mm_24h=rng.uniform(2, 20),
            soil_moisture_pct=rng.uniform(25, 45),
            tilt_degrees=rng.uniform(0.5, 2.0),
            tilt_change_rate=rng.uniform(0, 0.3),
            vibration_g=rng.uniform(0.02, 0.15),
            battery_pct=rng.uniform(80, 100),
            is_online=True,
            recorded_at=dt.datetime.now(dt.timezone.utc),
        )
        db.add(reading)
        db.flush()

        history_risk = 40.0 if zone.id in HISTORICAL_EVENTS else 10.0
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
            history_risk_static=history_risk,
            is_online=True,
            reading_age_seconds=0,
        )
        result = evaluate_risk(inputs)
        db.add(RiskAssessment(
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
        ))
    db.commit()


def seed_database(db: Session) -> None:
    if db.query(Zone).count() > 0:
        # Zones already exist; just make sure baseline readings/assessments
        # are present (used after a simulation reset).
        seed_baseline_readings_and_risk(db)
        return

    for z in ZONES:
        zone = Zone(
            id=z["id"],
            name=z["name"],
            description=z["description"],
            latitude=z["latitude"],
            longitude=z["longitude"],
            population=z["population"],
            elevation_m=z["elevation_m"],
            slope_degrees=z["slope_degrees"],
            terrain_risk=z["terrain_risk"],
            geojson_polygon=_polygon(z["latitude"], z["longitude"]),
            safe_location=z["safe_location"],
            evacuation_route=z["evacuation_route"],
            is_fictional=True,
        )
        db.add(zone)

        rng = random.Random(hash(z["id"]) % (2**32))
        for event_type, severity, fatalities, description in HISTORICAL_EVENTS.get(z["id"], []):
            db.add(HistoricalEvent(
                zone_id=z["id"],
                event_type=event_type,
                event_date=dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=rng.randint(200, 1500)),
                severity=severity,
                fatalities=fatalities,
                description=description,
            ))

    # Demo users for the three roles (no password auth in demo mode).
    db.add(User(username="viewer_demo", display_name="Demo Viewer", role="viewer", is_demo_account=True))
    db.add(User(username="operator_demo", display_name="Demo Operator", role="operator", is_demo_account=True))
    db.add(User(username="admin_demo", display_name="Demo Administrator", role="administrator", is_demo_account=True))

    db.commit()

    # Initial baseline readings + risk assessments (all Safe) so the
    # dashboard has data immediately on first load.
    seed_baseline_readings_and_risk(db)
