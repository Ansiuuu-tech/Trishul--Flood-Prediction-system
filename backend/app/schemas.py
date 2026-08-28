"""
Pydantic v2 schemas for API validation and serialization.
"""
from __future__ import annotations

import datetime as dt
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

RiskLevel = Literal["Safe", "Watch", "Warning", "Evacuate"]


# ---------- Zones ----------
class ZoneOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: str
    name: str
    description: str
    latitude: float
    longitude: float
    population: int
    elevation_m: float
    slope_degrees: float
    terrain_risk: float
    geojson_polygon: dict
    safe_location: str
    evacuation_route: str
    is_fictional: bool


# ---------- Sensor readings ----------
class SensorReadingIn(BaseModel):
    zone_id: str
    source: str = "manual"
    rainfall_mm_1h: float = Field(ge=0, le=500)
    rainfall_mm_3h: float = Field(ge=0, le=1000)
    rainfall_mm_24h: float = Field(ge=0, le=2000)
    soil_moisture_pct: float = Field(ge=0, le=100)
    tilt_degrees: float = Field(ge=-90, le=90)
    tilt_change_rate: float = Field(ge=-45, le=45, default=0.0)
    vibration_g: float = Field(ge=0, le=10)
    battery_pct: float = Field(ge=0, le=100, default=100.0)
    is_online: bool = True


class SensorReadingBulkIn(BaseModel):
    readings: list[SensorReadingIn]


class SensorReadingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: str
    zone_id: str
    source: str
    rainfall_mm_1h: float
    rainfall_mm_3h: float
    rainfall_mm_24h: float
    soil_moisture_pct: float
    tilt_degrees: float
    tilt_change_rate: float
    vibration_g: float
    battery_pct: float
    is_online: bool
    recorded_at: dt.datetime


# ---------- Risk assessments ----------
class RiskAssessmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: str
    zone_id: str
    score: float
    level: RiskLevel
    confidence: float
    rainfall_risk: float
    soil_risk: float
    tilt_risk: float
    vibration_risk: float
    terrain_risk: float
    history_risk: float
    reasons: list[str]
    recommended_action: str
    estimated_lead_time_minutes: int
    data_quality_warning: str
    model_version: str
    created_at: dt.datetime


# ---------- Alerts ----------
class AlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: str
    zone_id: str
    level: RiskLevel
    previous_level: str
    message: str
    reasons: list[str]
    status: str
    delivery_channels: list[str]
    acknowledged_by: str
    acknowledged_at: Optional[dt.datetime]
    resolved_at: Optional[dt.datetime]
    created_at: dt.datetime


class AlertActionIn(BaseModel):
    actor: str = "demo-operator"


# ---------- Historical events ----------
class HistoricalEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: str
    zone_id: str
    event_type: str
    event_date: dt.datetime
    severity: str
    fatalities: int
    description: str


# ---------- Simulation ----------
ScenarioName = Literal["normal", "heavy_rain", "rapid_escalation", "sensor_failure"]


class SimulationScenarioIn(BaseModel):
    scenario: ScenarioName
    zone_id: Optional[str] = None  # required for rapid_escalation / sensor_failure


class SimulationStatusOut(BaseModel):
    running: bool
    scenario: Optional[str]
    target_zone_id: Optional[str]
    tick_interval_seconds: float
    ticks_elapsed: int
    started_at: Optional[dt.datetime]


# ---------- Auth ----------
class DemoLoginIn(BaseModel):
    role: Literal["viewer", "operator", "administrator"]


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: str
    username: str
    display_name: str
    role: str
    is_demo_account: bool


# ---------- Health ----------
class HealthOut(BaseModel):
    status: str
    demo_mode: bool
    model_version: str
    database: str
    time: dt.datetime
    telegram_configured: bool
    email_configured: bool
