"""
Seed data for the demo: 8 REAL villages/towns in Uttarakhand's Garhwal
Himalaya (Uttarkashi, Rudraprayag, and Chamoli districts), an area with a
well-documented history of cloudbursts, flash floods, and landslides,
including the 2013 Kedarnath disaster, the 2021 Chamoli/Rishiganga flood,
the Joshimath land-subsidence crisis, and the 2025 Dharali flash flood.

Coordinates, elevations, populations, and historical events below are
sourced from Wikipedia, Census of India 2011 village/town data, and
contemporaneous news coverage. Slope and terrain-risk figures are modeled
estimates for demo purposes (this app is not a certified survey tool), not
surveyed values. Raini's coordinates are an approximation of the
Rishiganga-Dhauliganga confluence near Tapovan, since no precise official
village-center coordinate is published.

This demo's sensor readings and live risk scores remain simulated - only
the zone geography, population, and historical-event data below are real.
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
        id="dharali", name="Dharali", description="Village on the Kheer Ganga river between Harsil and Gangotri, Uttarkashi district; hit by a cloudburst-triggered debris flow in August 2025.",
        latitude=31.0408, longitude=78.7811, population=505, elevation_m=2621, slope_degrees=32,
        terrain_risk=82, safe_location="Higher ground east of the village toward Harsil road",
        evacuation_route="Move uphill away from the Kheer Ganga riverbed toward the Harsil road, avoiding the market area.",
    ),
    dict(
        id="harsil", name="Harsil", description="Army cantonment village and apple-growing settlement on the Bhagirathi river, 7km upstream of Dharali on the Gangotri route.",
        latitude=31.0330, longitude=78.7330, population=1205, elevation_m=2745, slope_degrees=26,
        terrain_risk=55, safe_location="Harsil Army Cantonment high ground",
        evacuation_route="Move away from the Bhagirathi riverbank to the cantonment area on higher ground.",
    ),
    dict(
        id="uttarkashi", name="Uttarkashi", description="District headquarters town on the Bhagirathi river; lower-risk monitoring hub for the surrounding valleys.",
        latitude=30.7300, longitude=78.4500, population=17475, elevation_m=1158, slope_degrees=10,
        terrain_risk=30, safe_location="District Disaster Management Office grounds",
        evacuation_route="Follow marked routes away from the riverbank to the district office grounds.",
    ),
    dict(
        id="sonprayag", name="Sonprayag", description="Village at the confluence of the Mandakini and Basuki rivers, Rudraprayag district; the road-transit gateway to the Kedarnath trek.",
        latitude=30.6325, longitude=78.9600, population=805, elevation_m=1829, slope_degrees=24,
        terrain_risk=62, safe_location="Sonprayag bus terminus (elevated forecourt)",
        evacuation_route="Move away from the riverside parking area to the elevated bus terminus.",
    ),
    dict(
        id="gaurikund", name="Gaurikund", description="Trailhead village for the Kedarnath trek, Rudraprayag district; the settlement was almost entirely destroyed in the June 2013 floods.",
        latitude=30.6330, longitude=79.0170, population=310, elevation_m=1982, slope_degrees=34,
        terrain_risk=85, safe_location="Gaurikund helipad plateau",
        evacuation_route="Ascend the pilgrim trail away from the Mandakini riverbank toward the helipad plateau.",
    ),
    dict(
        id="kedarnath", name="Kedarnath", description="Himalayan pilgrimage town below Kedarnath peak, Rudraprayag district; site of the catastrophic 16-17 June 2013 flash flood and debris flow.",
        latitude=30.7346, longitude=79.0669, population=612, elevation_m=3583, slope_degrees=40,
        terrain_risk=90, safe_location="Ridge above the temple complex, away from the Chorabari moraine",
        evacuation_route="Move to high ground on the ridge above the temple, away from the Mandakini floodplain.",
    ),
    dict(
        id="raini", name="Raini", description="Village at the Rishiganga-Dhauliganga confluence near Tapovan, Chamoli district; site of the 7 February 2021 glacier/rock-avalanche flash flood. Coordinates are an approximate confluence location. Slopes above the village have since been assessed as unstable.",
        latitude=30.6170, longitude=79.7180, population=487, elevation_m=1850, slope_degrees=38,
        terrain_risk=88, safe_location="Raini Panchayat Bhawan on the upper slope",
        evacuation_route="Move upslope away from the Rishiganga-Dhauliganga confluence toward the Panchayat Bhawan.",
    ),
    dict(
        id="joshimath", name="Joshimath", description="Gateway town to Badrinath and the high Himalaya, Chamoli district, at the Alaknanda-Dhauliganga confluence area; a January 2023 land-subsidence crisis cracked hundreds of buildings due to unstable slope ground.",
        latitude=30.5550, longitude=79.5650, population=48202, elevation_m=1875, slope_degrees=20,
        terrain_risk=78, safe_location="Joshimath Auli Ropeway upper station area",
        evacuation_route="Move away from subsidence-affected wards toward the upper Auli road, following local administration guidance.",
    ),
]

HISTORICAL_EVENTS = {
    "dharali": [("flash_flood", "severe", 5, dt.date(2025, 8, 5), "A cloudburst over the Kheer Ganga catchment triggered a debris flow that destroyed homes, hotels, and the village market; dozens were reported missing in the days after.")],
    "kedarnath": [("flash_flood", "severe", 0, dt.date(2013, 6, 17), "A moraine-dammed lake above Kedarnath breached after a cloudburst, sending floodwater and debris through the town; the wider Uttarakhand disaster killed an estimated 4,000+ people, one of India's deadliest flood events.")],
    "gaurikund": [("flash_flood", "severe", 0, dt.date(2013, 6, 17), "Floodwaters from the Kedarnath disaster nearly destroyed Gaurikund entirely, along with the trek route toward Rambara.")],
    "sonprayag": [("flash_flood", "moderate", 0, dt.date(2013, 6, 17), "Sonprayag and neighbouring Sitapur suffered severe flood damage during the Kedarnath disaster.")],
    "raini": [("flash_flood", "severe", 2, dt.date(2021, 2, 7), "A rock-ice avalanche near Nanda Devi triggered a flash flood down the Rishiganga valley, destroying the Rishiganga hydel project and damaging the Tapovan dam; the broader Chamoli disaster killed 200+ people.")],
    "joshimath": [("landslide", "moderate", 0, dt.date(2023, 1, 2), "Long-suspected slope instability beneath the town surfaced as widespread ground subsidence, cracking over 800 buildings and forcing evacuations.")],
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
            is_fictional=False,
        )
        db.add(zone)

        for event_type, severity, fatalities, event_date, description in HISTORICAL_EVENTS.get(z["id"], []):
            db.add(HistoricalEvent(
                zone_id=z["id"],
                event_type=event_type,
                event_date=dt.datetime(event_date.year, event_date.month, event_date.day, tzinfo=dt.timezone.utc),
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
    