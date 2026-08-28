"""
ORM models: zones, sensor_readings, historical_events, risk_assessments,
alerts, users.
"""
from __future__ import annotations

import datetime as dt
import uuid

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


class Zone(Base):
    __tablename__ = "zones"

    id: Mapped[str] = mapped_column(String, primary_key=True)  # e.g. "dharali"
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    population: Mapped[int] = mapped_column(Integer, default=0)
    elevation_m: Mapped[float] = mapped_column(Float, default=0.0)
    slope_degrees: Mapped[float] = mapped_column(Float, default=0.0)
    terrain_risk: Mapped[float] = mapped_column(Float, default=0.0)  # 0-100 static susceptibility
    geojson_polygon: Mapped[dict] = mapped_column(JSON, default=dict)
    safe_location: Mapped[str] = mapped_column(String, default="")
    evacuation_route: Mapped[str] = mapped_column(Text, default="")
    is_fictional: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now)

    sensor_readings: Mapped[list["SensorReading"]] = relationship(back_populates="zone")
    risk_assessments: Mapped[list["RiskAssessment"]] = relationship(back_populates="zone")
    alerts: Mapped[list["Alert"]] = relationship(back_populates="zone")
    historical_events: Mapped[list["HistoricalEvent"]] = relationship(back_populates="zone")


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    zone_id: Mapped[str] = mapped_column(ForeignKey("zones.id"), nullable=False, index=True)
    source: Mapped[str] = mapped_column(String, default="simulator")  # simulator | esp32 | manual
    rainfall_mm_1h: Mapped[float] = mapped_column(Float, default=0.0)
    rainfall_mm_3h: Mapped[float] = mapped_column(Float, default=0.0)
    rainfall_mm_24h: Mapped[float] = mapped_column(Float, default=0.0)
    soil_moisture_pct: Mapped[float] = mapped_column(Float, default=0.0)
    tilt_degrees: Mapped[float] = mapped_column(Float, default=0.0)
    tilt_change_rate: Mapped[float] = mapped_column(Float, default=0.0)  # deg/hr
    vibration_g: Mapped[float] = mapped_column(Float, default=0.0)
    battery_pct: Mapped[float] = mapped_column(Float, default=100.0)
    is_online: Mapped[bool] = mapped_column(Boolean, default=True)
    recorded_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now, index=True)

    zone: Mapped["Zone"] = relationship(back_populates="sensor_readings")


class HistoricalEvent(Base):
    __tablename__ = "historical_events"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    zone_id: Mapped[str] = mapped_column(ForeignKey("zones.id"), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String, default="landslide")  # landslide | flash_flood
    event_date: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now)
    severity: Mapped[str] = mapped_column(String, default="moderate")  # minor|moderate|severe
    fatalities: Mapped[int] = mapped_column(Integer, default=0)
    description: Mapped[str] = mapped_column(Text, default="")

    zone: Mapped["Zone"] = relationship(back_populates="historical_events")


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    zone_id: Mapped[str] = mapped_column(ForeignKey("zones.id"), nullable=False, index=True)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    level: Mapped[str] = mapped_column(String, nullable=False)  # Safe|Watch|Warning|Evacuate
    confidence: Mapped[float] = mapped_column(Float, default=0.8)
    rainfall_risk: Mapped[float] = mapped_column(Float, default=0.0)
    soil_risk: Mapped[float] = mapped_column(Float, default=0.0)
    tilt_risk: Mapped[float] = mapped_column(Float, default=0.0)
    vibration_risk: Mapped[float] = mapped_column(Float, default=0.0)
    terrain_risk: Mapped[float] = mapped_column(Float, default=0.0)
    history_risk: Mapped[float] = mapped_column(Float, default=0.0)
    reasons: Mapped[list] = mapped_column(JSON, default=list)
    recommended_action: Mapped[str] = mapped_column(Text, default="")
    estimated_lead_time_minutes: Mapped[int] = mapped_column(Integer, default=0)
    data_quality_warning: Mapped[str] = mapped_column(String, default="")
    model_version: Mapped[str] = mapped_column(String, default="risk-fusion-v1.0.0-demo")
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now, index=True)

    zone: Mapped["Zone"] = relationship(back_populates="risk_assessments")


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    zone_id: Mapped[str] = mapped_column(ForeignKey("zones.id"), nullable=False, index=True)
    level: Mapped[str] = mapped_column(String, nullable=False)
    previous_level: Mapped[str] = mapped_column(String, default="Safe")
    message: Mapped[str] = mapped_column(Text, nullable=False)
    reasons: Mapped[list] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String, default="active")  # active|acknowledged|resolved
    delivery_channels: Mapped[list] = mapped_column(JSON, default=list)  # e.g. ["in_app","telegram_demo"]
    acknowledged_by: Mapped[str] = mapped_column(String, default="")
    acknowledged_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now, index=True)

    zone: Mapped["Zone"] = relationship(back_populates="alerts")


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    username: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String, default="")
    role: Mapped[str] = mapped_column(String, default="viewer")  # viewer|operator|administrator
    is_demo_account: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now)
