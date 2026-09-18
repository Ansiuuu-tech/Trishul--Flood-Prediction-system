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
    district: str = ""
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


# ---------- Evacuation Shelters ----------
class EvacuationShelterOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: str
    zone_id: str
    name: str
    lat: float
    lng: float
    capacity: int
    shelter_type: str
    is_primary: bool


# ---------- Sensor readings ----------
class SensorReadingIn(BaseModel):
    zone_id: str
    source: str = "manual"
    rainfall_mm_1h: float = Field(ge=0, le=500)
    rainfall_mm_3h: float = Field(ge=0, le=1000)
    rainfall_mm_24h: float = Field(ge=0, le=2000)
    rainfall_mm_3d: float = Field(ge=0, le=3000, default=0.0)   # ← ADD
    rainfall_mm_7d: float = Field(ge=0, le=5000, default=0.0)   # ← ADD
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
    rainfall_mm_3d: float = Field(ge=0, le=3000, default=0.0)   # ← ADD
    rainfall_mm_7d: float = Field(ge=0, le=5000, default=0.0)   # ← ADD
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
    ml_probability: float | None = None
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
    email: Optional[str] = None
    full_name: Optional[str] = None
    display_name: str
    role: str
    is_demo_account: bool
    oauth_provider: Optional[str] = None
    oauth_id: Optional[str] = None
    avatar_url: Optional[str] = None
    home_zone_id: Optional[str] = None
    created_at: Optional[dt.datetime] = None


class LoginResponse(BaseModel):
    token: str
    user: UserOut


# ---------- SMS & Alert Recipients ----------
class AlertRecipientIn(BaseModel):
    name: str = Field(..., description="Recipient full name")
    phone_number: str = Field(..., description="E.164 format e.g. +919876543210")
    role: str = Field("General", description="e.g. Gram Pradhan, DEOC Officer, SDRF Commander, Dam In-charge")
    district: str = Field("", description="District name e.g. Chamoli")
    zone_id: Optional[str] = Field(None, description="Optional specific village/zone ID")
    min_alert_level: str = Field("Watch", description="Minimum alert level: Watch, Warning, Critical")
    is_active: bool = True


class AlertRecipientUpdate(BaseModel):
    name: Optional[str] = None
    phone_number: Optional[str] = None
    role: Optional[str] = None
    district: Optional[str] = None
    zone_id: Optional[str] = None
    min_alert_level: Optional[str] = None
    is_active: Optional[bool] = None


class AlertRecipientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    phone_number: str
    role: str
    district: str
    zone_id: Optional[str] = None
    min_alert_level: str
    is_active: bool
    created_at: dt.datetime


class SendSMSIn(BaseModel):
    to_number: str = Field(..., description="E.164 phone number e.g. +919876543210")
    message: str = Field(..., description="Message body to send")


class SendSMSOut(BaseModel):
    success: bool
    detail: str
    to_number: str


# ---------- SOS emergency requests ----------
SOSStatus = Literal["Pending", "Acknowledged", "Rescue Dispatched", "Resolved", "False Alarm"]
SOSSituation = Literal["Trapped", "Injured", "Medical Emergency", "Need Evacuation", "Other"]


class SOSCreateIn(BaseModel):
    phone_number: str = Field(..., min_length=7, max_length=24)
    name: str = Field("", max_length=120)
    people_count: int = Field(1, ge=1, le=500)
    situation_type: SOSSituation
    message: str = Field("", max_length=2000)
    latitude: float | None = Field(None, ge=-90, le=90)
    longitude: float | None = Field(None, ge=-180, le=180)
    location_source: Literal["gps", "map_pin", "unavailable"] = "unavailable"


class SOSStatusUpdateIn(BaseModel):
    status: SOSStatus
    note: str = Field("", max_length=1000)


class SOSOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    reference_id: str
    phone_number: str
    name: str
    people_count: int
    situation_type: str
    message: str
    latitude: float | None
    longitude: float | None
    location_source: str
    nearest_zone_id: str | None
    nearest_zone_name: str
    district: str
    risk_level: str
    shelter_name: str
    shelter_latitude: float | None
    shelter_longitude: float | None
    status: SOSStatus
    status_note: str
    updated_by: str
    notification_channels: list[str]
    created_at: dt.datetime
    updated_at: dt.datetime



# ---------- Health ----------
class HealthOut(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    status: str
    demo_mode: bool
    model_version: str
    database: str
    time: dt.datetime
    telegram_configured: bool
    email_configured: bool
    sms_configured: bool = False

