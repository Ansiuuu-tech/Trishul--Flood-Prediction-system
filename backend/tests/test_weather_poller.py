"""Unit tests for deterministic Open-Meteo value derivation."""
from __future__ import annotations

import datetime as dt
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.weather_poller import _derive_rainfall, _derive_soil_pct


def _utc_hour() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc).replace(minute=0, second=0, microsecond=0)


def test_rainfall_uses_only_observed_hours() -> None:
    current_hour = _utc_hour()
    start = current_hour - dt.timedelta(hours=23)
    times = [(start + dt.timedelta(hours=index)).isoformat() for index in range(25)]
    precipitation = list(range(1, 26))

    rainfall = _derive_rainfall({"time": times, "precipitation": precipitation})

    # The 25th value belongs to the next (forecast) hour and is excluded.
    assert rainfall == (24.0, 69.0, 300.0)


def test_soil_moisture_uses_latest_observed_value() -> None:
    current_hour = _utc_hour()
    soil_pct = _derive_soil_pct({
        "time": [
            (current_hour - dt.timedelta(hours=1)).isoformat(),
            (current_hour + dt.timedelta(hours=1)).isoformat(),
        ],
        "soil_moisture_0_to_7cm": [0.2, 0.4],
    })

    assert soil_pct == 44.4


def test_soil_moisture_uses_conservative_fallback_for_missing_data() -> None:
    assert _derive_soil_pct({"time": [], "soil_moisture_0_to_7cm": []}) == 30.0
