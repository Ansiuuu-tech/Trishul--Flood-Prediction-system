"""Unit tests for sensor-reading validation (Pydantic schema)."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest
from pydantic import ValidationError

from app.schemas import SensorReadingIn


def _valid_payload(**overrides) -> dict:
    base = dict(
        zone_id="dharali", source="simulator",
        rainfall_mm_1h=5, rainfall_mm_3h=10, rainfall_mm_24h=20,
        soil_moisture_pct=40, tilt_degrees=1.5, tilt_change_rate=0.2,
        vibration_g=0.1, battery_pct=90, is_online=True,
    )
    base.update(overrides)
    return base


def test_valid_reading_passes():
    reading = SensorReadingIn(**_valid_payload())
    assert reading.zone_id == "dharali"
    assert reading.rainfall_mm_1h == 5


def test_negative_rainfall_rejected():
    with pytest.raises(ValidationError):
        SensorReadingIn(**_valid_payload(rainfall_mm_1h=-5))


def test_soil_moisture_out_of_range_rejected():
    with pytest.raises(ValidationError):
        SensorReadingIn(**_valid_payload(soil_moisture_pct=150))
    with pytest.raises(ValidationError):
        SensorReadingIn(**_valid_payload(soil_moisture_pct=-1))


def test_tilt_degrees_out_of_range_rejected():
    with pytest.raises(ValidationError):
        SensorReadingIn(**_valid_payload(tilt_degrees=95))


def test_vibration_out_of_range_rejected():
    with pytest.raises(ValidationError):
        SensorReadingIn(**_valid_payload(vibration_g=15))


def test_missing_required_field_rejected():
    payload = _valid_payload()
    del payload["zone_id"]
    with pytest.raises(ValidationError):
        SensorReadingIn(**payload)


def test_default_battery_and_online_status():
    payload = _valid_payload()
    del payload["battery_pct"]
    del payload["is_online"]
    reading = SensorReadingIn(**payload)
    assert reading.battery_pct == 100.0
    assert reading.is_online is True
