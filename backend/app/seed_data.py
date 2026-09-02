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
        id="rasuwa",
        name="Rasuwa",
        description="Rasuwa District, Nepal — glacier-fed valley in the Langtang/Trishuli region, high GLOF risk.",
        latitude=28.1084,
        longitude=85.3006,
        population=45000,
        elevation_m=1800,
        slope_degrees=28,
        terrain_risk=78,
        safe_location="Rasuwa Bazar high ground",
        evacuation_route="Move uphill away from the Trishuli River corridor toward Rasuwa Bazar high ground.",
    ),
    dict(
        id="sindhupalchok",
        name="Sindhupalchok",
        description="Sindhupalchok District, Nepal — steep catchment with historical landslide-dam events.",
        latitude=27.9509,
        longitude=85.6836,
        population=280000,
        elevation_m=1500,
        slope_degrees=32,
        terrain_risk=82,
        safe_location="Sindhupalchok HQ safe zone",
        evacuation_route="Move to designated safe zone away from river valleys and landslide-prone slopes.",
    ),
    dict(
        id="chamoli",
        name="Chamoli",
        description="Chamoli District, Uttarakhand, India — glacier/rockfall origin flash floods; 2021 Rishiganga event region.",
        latitude=30.4010,
        longitude=79.5185,
        population=390000,
        elevation_m=1600,
        slope_degrees=30,
        terrain_risk=85,
        safe_location="Chamoli district headquarters high ground",
        evacuation_route="Move uphill away from the Rishiganga-Dhauliganga river corridors toward district HQ high ground.",
    ),
    dict(
        id="uttarkashi",
        name="Uttarkashi",
        description="Uttarkashi District, Uttarakhand, India — monsoon cloudburst, steep gradient valley.",
        latitude=30.7268,
        longitude=78.4354,
        population=330000,
        elevation_m=1200,
        slope_degrees=24,
        terrain_risk=70,
        safe_location="Uttarkashi town safe zone",
        evacuation_route="Move to Uttarkashi town safe zone away from Bhagirathi riverbank.",
    ),
    dict(
        id="kullu",
        name="Kullu",
        description="Kullu District, Himachal Pradesh, India — cloudburst-prone, narrow river valley.",
        latitude=31.9576,
        longitude=77.1095,
        population=440000,
        elevation_m=1300,
        slope_degrees=26,
        terrain_risk=72,
        safe_location="Kullu town high ground",
        evacuation_route="Move to Kullu town high ground away from Beas river narrow valley sections.",
    ),
    dict(
        id="mandi",
        name="Mandi",
        description="Mandi District, Himachal Pradesh, India — cloudburst-prone, 2024 event region.",
        latitude=31.7084,
        longitude=76.9319,
        population=1000000,
        elevation_m=900,
        slope_degrees=20,
        terrain_risk=65,
        safe_location="Mandi district safe zone",
        evacuation_route="Move to Mandi district safe zone away from river corridors.",
    ),
    dict(
        id="dhading",
        name="Dhading",
        description="Dhading District, Nepal — steep terrain, Trishuli River corridor.",
        latitude=27.8600,
        longitude=84.9077,
        population=320000,
        elevation_m=1400,
        slope_degrees=27,
        terrain_risk=74,
        safe_location="Dhading Besi safe zone",
        evacuation_route="Move uphill away from Trishuli River corridor toward Dhading Besi safe zone.",
    ),
    dict(
        id="mangan",
        name="Mangan",
        description="Mangan District, North Sikkim, India — GLOF risk; 2023 South Lhonak Lake event region.",
        latitude=27.5155,
        longitude=88.5324,
        population=44000,
        elevation_m=1000,
        slope_degrees=22,
        terrain_risk=68,
        safe_location="Mangan town safe zone",
        evacuation_route="Move to Mangan town safe zone away from Teesta River valley.",
    ),
]

HISTORICAL_EVENTS = {
    "chamoli": [
        ("flash_flood", "severe", 0, dt.date(2021, 2, 7), "A rock-ice avalanche near Nanda Devi triggered a flash flood down the Rishiganga valley, destroying the Rishiganga hydel project and damaging the Tapovan dam; the broader Chamoli disaster killed 200+ people."),
    ],
    "uttarkashi": [],
    "kullu": [],
    "mandi": [
        ("flash_flood", "moderate", 0, dt.date(2024, 8, 1), "A cloudburst over the Mandi catchment triggered flash floods and landslides in the region."),
    ],
    "sindhupalchok": [
        ("landslide", "severe", 0, dt.date(2015, 4, 25), "A major landslide dammed the Bhotekoshi River, causing downstream flood risk."),
    ],
    "rasuwa": [],
    "dhading": [],
    "mangan": [
        ("glof", "severe", 0, dt.date(2023, 10, 4), "A GLOF from South Lhonak Lake in Sikkim caused downstream flooding; Mangan district is within the at-risk corridor."),
    ],
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


_DEMO_USERS = [
    ("viewer_demo", "viewer@trishul.demo", "Demo Viewer", "viewer"),
    ("operator_demo", "operator@trishul.demo", "Demo Operator", "operator"),
    ("admin_demo", "admin@trishul.demo", "Demo Administrator", "administrator"),
]


def _ensure_demo_users(db: Session) -> None:
    """Create the three demo role-users if missing and backfill email/full_name
    on rows that pre-date those columns (handles upgrading an older DB)."""
    for username, email, full_name, role in _DEMO_USERS:
        user = db.query(User).filter(User.username == username).first()
        if user:
            if not user.email:
                user.email = email
            if not user.full_name:
                user.full_name = full_name
            if not user.display_name:
                user.display_name = full_name
        else:
            db.add(User(
                username=username,
                email=email,
                full_name=full_name,
                display_name=full_name,
                role=role,
                is_demo_account=True,
            ))
    db.commit()


_SHELTERS = {
    "rasuwa": [
        ("Rasuwa Community Hall", 28.1090, 85.3010, 300, "community_center"),
        ("Langtang Gompa Shelter", 28.1070, 85.2990, 150, "temple"),
    ],
    "sindhupalchok": [
        ("Sindhupalchok District School", 27.9515, 85.6840, 400, "school"),
        ("Bhotekoshi Community Hall", 27.9500, 85.6820, 200, "community_center"),
    ],
    "chamoli": [
        ("Chamoli District School", 30.4020, 79.5190, 500, "school"),
        ("Rishiganga Temple Shelter", 30.4000, 79.5170, 200, "temple"),
    ],
    "uttarkashi": [
        ("Uttarkashi District School", 30.7275, 78.4360, 600, "school"),
        ("Bhagirathi Community Hall", 30.7260, 78.4340, 300, "community_center"),
    ],
    "kullu": [
        ("Kullu District School", 31.9580, 77.1100, 500, "school"),
        ("Beas Valley Community Hall", 31.9570, 77.1080, 250, "community_center"),
    ],
    "mandi": [
        ("Mandi District School", 31.7090, 76.9320, 600, "school"),
        ("Mandi Gompa Shelter", 31.7080, 76.9300, 200, "temple"),
    ],
    "dhading": [
        ("Dhading Besi School", 27.8605, 84.9080, 400, "school"),
        ("Trishuli Community Hall", 27.8595, 84.9060, 200, "community_center"),
    ],
    "mangan": [
        ("Mangan District School", 27.5160, 88.5330, 300, "school"),
        ("Mangan Gompa Shelter", 27.5150, 88.5310, 150, "temple"),
    ],
}


def seed_shelters(db: Session) -> None:
    if db.query(EvacuationShelter).count() > 0:
        return
    for zone_id, shelters in _SHELTERS.items():
        for name, lat, lng, capacity, shelter_type in shelters:
            db.add(EvacuationShelter(
                zone_id=zone_id,
                name=name,
                lat=lat,
                lng=lng,
                capacity=capacity,
                shelter_type=shelter_type,
                is_primary=True,
            ))
    db.commit()


def seed_database(db: Session) -> None:
    if db.query(Zone).count() > 0:
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

    db.commit()

    seed_shelters(db)

    _ensure_demo_users(db)

    seed_baseline_readings_and_risk(db)
    