"""Unit tests for weather router and weather helpers."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest
from fastapi.testclient import TestClient

from app.database import init_db, session_scope
from app.main import app
from app.routers.weather import _wmo_to_condition
from app.seed_data import seed_database


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    init_db()
    with session_scope() as db:
        seed_database(db)


def test_wmo_weather_code_translation():
    assert _wmo_to_condition(0) == "Clear Sky"
    assert _wmo_to_condition(2) == "Partly Cloudy"
    assert _wmo_to_condition(65) == "Heavy Rain"
    assert _wmo_to_condition(95) == "Thunderstorm"
    assert _wmo_to_condition(999) == "Clear"


def test_get_all_zones_weather():
    with TestClient(app) as client:
        response = client.get("/api/weather")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        assert len(data) > 0
        first_zone_weather = next(iter(data.values()))
        assert "temperature" in first_zone_weather
        assert "condition" in first_zone_weather
        assert "humidity" in first_zone_weather
        assert "windSpeed" in first_zone_weather
        assert "forecast" in first_zone_weather


def test_get_single_zone_weather():
    with TestClient(app) as client:
        zones_resp = client.get("/api/zones")
        assert zones_resp.status_code == 200
        zones = zones_resp.json()
        assert len(zones) > 0
        target_zone = zones[0]

        response = client.get(f"/api/weather/{target_zone['id']}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data["temperature"], (int, float))
        assert isinstance(data["humidity"], (int, float))
        assert isinstance(data["windSpeed"], (int, float))


def test_nonexistent_zone_weather():
    with TestClient(app) as client:
        response = client.get("/api/weather/non_existent_zone_xyz")
        assert response.status_code == 404
