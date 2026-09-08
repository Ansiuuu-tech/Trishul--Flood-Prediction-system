"""Live weather poller for Open-Meteo.

Periodically fetches precipitation and surface soil moisture for every zone,
then feeds each reading through the same ingestion pipeline used by manual
posts and field hardware. Risk scoring, alerts, evacuation guidance, and live
WebSocket updates therefore remain source-agnostic.

Open-Meteo does not provide tilt or vibration measurements. Until physical
ground sensors are deployed, those fields are deliberately stable, near-zero
placeholders and every reading is marked ``source="weather_api"``. They must
not be interpreted as live ground-sensor coverage.
"""
from __future__ import annotations

import asyncio
import datetime as dt
from typing import Any

import httpx
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import session_scope
from app.models import Zone
from app.routers.sensors import ingest_reading
from app.schemas import SensorReadingIn

settings = get_settings()

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

_state: dict[str, Any] = {"running": False, "task": None}


async def _fetch_zone_weather(client: httpx.AsyncClient, zone: Zone) -> dict[str, Any] | None:
    params = {
        "latitude": zone.latitude,
        "longitude": zone.longitude,
        "hourly": "precipitation,soil_moisture_0_to_7cm",
        "past_days": 1,
        "forecast_days": 1,
        "timezone": "UTC",
    }
    try:
        response = await client.get(OPEN_METEO_URL, params=params, timeout=10.0)
        response.raise_for_status()
        return response.json()
    except Exception as exc:  # keep polling the remaining zones after a failure
        print(f"[weather_poller] fetch failed for {zone.id}: {exc}")
        return None


def _hour_index_at_or_before_now(times: list[Any]) -> int | None:
    """Return the latest hourly observation slot, never a future forecast slot."""
    now = dt.datetime.now(dt.timezone.utc)
    latest_index: int | None = None
    latest_time: dt.datetime | None = None

    for index, value in enumerate(times):
        if not isinstance(value, str):
            continue
        try:
            parsed = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=dt.timezone.utc)
            else:
                parsed = parsed.astimezone(dt.timezone.utc)
        except ValueError:
            continue
        if parsed <= now and (latest_time is None or parsed > latest_time):
            latest_index = index
            latest_time = parsed

    return latest_index


def _numeric_window(values: list[Any], start: int, end: int) -> float:
    return sum(float(value) for value in values[start:end] if isinstance(value, (int, float)))


def _derive_rainfall(hourly: dict[str, Any]) -> tuple[float, float, float]:
    """Convert Open-Meteo hourly precipitation into 1h, 3h, and 24h totals."""
    precipitation = hourly.get("precipitation", [])
    times = hourly.get("time", [])
    if not isinstance(precipitation, list) or not isinstance(times, list):
        return 0.0, 0.0, 0.0

    index = _hour_index_at_or_before_now(times)
    if index is None:
        return 0.0, 0.0, 0.0

    # Values are hourly totals; include the most recent observed hour.
    end = min(index + 1, len(precipitation))
    if end <= 0:
        return 0.0, 0.0, 0.0
    return (
        round(_numeric_window(precipitation, max(0, end - 1), end), 2),
        round(_numeric_window(precipitation, max(0, end - 3), end), 2),
        round(_numeric_window(precipitation, max(0, end - 24), end), 2),
    )


def _derive_soil_pct(hourly: dict[str, Any]) -> float:
    """Convert m³/m³ surface soil moisture into a 0–100 saturation proxy."""
    values = hourly.get("soil_moisture_0_to_7cm", [])
    times = hourly.get("time", [])
    if not isinstance(values, list) or not values:
        return 30.0  # conservative fallback, rather than claiming dry ground

    index = _hour_index_at_or_before_now(times) if isinstance(times, list) else None
    candidates = values[: index + 1] if index is not None else values
    latest = next((value for value in reversed(candidates) if isinstance(value, (int, float))), None)
    if latest is None:
        return 30.0

    # 0.45 m³/m³ is a practical saturated-soil proxy for this early-warning demo.
    return round(min(100.0, max(0.0, (float(latest) / 0.45) * 100)), 1)


async def _poll_once(db: Session, client: httpx.AsyncClient) -> None:
    for zone in db.query(Zone).all():
        data = await _fetch_zone_weather(client, zone)
        if data is None:
            continue

        hourly = data.get("hourly", {})
        if not isinstance(hourly, dict):
            print(f"[weather_poller] invalid hourly data for {zone.id}")
            continue
        rainfall_1h, rainfall_3h, rainfall_24h = _derive_rainfall(hourly)

        await ingest_reading(
            db,
            SensorReadingIn(
                zone_id=zone.id,
                source="weather_api",
                rainfall_mm_1h=rainfall_1h,
                rainfall_mm_3h=rainfall_3h,
                rainfall_mm_24h=rainfall_24h,
                soil_moisture_pct=_derive_soil_pct(hourly),
                # Placeholders only: Open-Meteo has no tilt/vibration signal.
                tilt_degrees=1.0,
                tilt_change_rate=0.1,
                vibration_g=0.05,
                battery_pct=100.0,
                is_online=True,
            ),
        )


async def _run_loop() -> None:
    async with httpx.AsyncClient() as client:
        while _state["running"]:
            try:
                # session_scope owns the transaction commit/rollback lifecycle.
                with session_scope() as db:
                    await _poll_once(db, client)
            except Exception as exc:  # a bad poll must not stop later polls
                print(f"[weather_poller] loop error: {exc}")
            await asyncio.sleep(settings.WEATHER_POLL_INTERVAL_SECONDS)


def start_weather_poller() -> None:
    """Start one in-process weather task; repeated startup calls are harmless."""
    if not _state["running"]:
        _state["running"] = True
        _state["task"] = asyncio.create_task(_run_loop())


def stop_weather_poller() -> None:
    """Request a graceful stop and cancel any pending sleep/request task."""
    _state["running"] = False
    task = _state.get("task")
    if task:
        task.cancel()
        _state["task"] = None
