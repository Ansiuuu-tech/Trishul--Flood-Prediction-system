from __future__ import annotations

import asyncio
import datetime as dt
import time
from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Zone

router = APIRouter(prefix="/api/weather", tags=["weather"])

# In-memory weather cache: key -> (timestamp, data)
_WEATHER_CACHE: Dict[str, tuple[float, Dict[str, Any]]] = {}
CACHE_TTL_SECONDS = 300  # 5 minutes


def _wmo_to_condition(code: int) -> str:
    mapping = {
        0: "Clear Sky",
        1: "Mainly Clear",
        2: "Partly Cloudy",
        3: "Overcast",
        45: "Foggy",
        48: "Depositing Rime Fog",
        51: "Light Drizzle",
        53: "Moderate Drizzle",
        55: "Dense Drizzle",
        56: "Light Freezing Drizzle",
        57: "Dense Freezing Drizzle",
        61: "Slight Rain",
        63: "Moderate Rain",
        65: "Heavy Rain",
        66: "Light Freezing Rain",
        67: "Heavy Freezing Rain",
        71: "Slight Snow Fall",
        73: "Moderate Snow Fall",
        75: "Heavy Snow Fall",
        77: "Snow Grains",
        80: "Slight Rain Showers",
        81: "Moderate Rain Showers",
        82: "Violent Rain Showers",
        85: "Slight Snow Showers",
        86: "Heavy Snow Showers",
        95: "Thunderstorm",
        96: "Thunderstorm with Slight Hail",
        99: "Thunderstorm with Heavy Hail",
    }
    return mapping.get(code, "Clear")


async def fetch_zone_live_weather(lat: float, lon: float, location_name: str) -> Dict[str, Any]:
    cache_key = f"{lat:.3f},{lon:.3f}"
    now = time.time()
    if cache_key in _WEATHER_CACHE:
        ts, cached = _WEATHER_CACHE[cache_key]
        if now - ts < CACHE_TTL_SECONDS:
            return cached

    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation",
        "hourly": "temperature_2m,precipitation_probability,weather_code",
        "forecast_hours": "15",
    }

    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        current = data.get("current", {})
        hourly = data.get("hourly", {})
        hourly_times = hourly.get("time", [])
        hourly_temps = hourly.get("temperature_2m", [])
        hourly_probs = hourly.get("precipitation_probability", [])

        forecast = []
        for i in range(min(5, len(hourly_times))):
            idx = i * 3 if i * 3 < len(hourly_times) else i
            forecast.append({
                "time": "Now" if i == 0 else f"{i * 3}h",
                "temp": round(hourly_temps[idx] if idx < len(hourly_temps) else current.get("temperature_2m", 15)),
                "rainProb": round(hourly_probs[idx] if idx < len(hourly_probs) else 0),
            })

        result = {
            "location": f"{location_name} District" if location_name else "Himalayan Region",
            "temperature": round(current.get("temperature_2m", 15)),
            "condition": _wmo_to_condition(current.get("weather_code", 0)),
            "humidity": round(current.get("relative_humidity_2m", 75)),
            "windSpeed": round(current.get("wind_speed_10m", 10)),
            "precipitation_mm": current.get("precipitation", 0.0),
            "forecast": forecast,
            "source": "live_api",
            "updated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        }
        _WEATHER_CACHE[cache_key] = (now, result)
        return result
    except Exception:
        fallback = {
            "location": f"{location_name} District" if location_name else "Himalayan Region",
            "temperature": 15,
            "condition": "Partly Cloudy",
            "humidity": 75,
            "windSpeed": 10,
            "precipitation_mm": 0.0,
            "forecast": [
                {"time": "Now", "temp": 15, "rainProb": 10},
                {"time": "3h", "temp": 14, "rainProb": 20},
                {"time": "6h", "temp": 12, "rainProb": 35},
                {"time": "9h", "temp": 10, "rainProb": 50},
                {"time": "12h", "temp": 9, "rainProb": 40},
            ],
            "source": "fallback",
            "updated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        }
        return fallback


@router.get("")
async def get_all_zones_weather(db: Session = Depends(get_db)):
    """Fetch live real-time weather for all settlements registered in Trishul concurrently."""
    zones = db.query(Zone).all()
    tasks = [fetch_zone_live_weather(z.latitude, z.longitude, z.name) for z in zones]
    weather_results = await asyncio.gather(*tasks, return_exceptions=True)

    results = {}
    for zone, w in zip(zones, weather_results):
        if isinstance(w, dict):
            results[zone.id] = w
        else:
            results[zone.id] = {
                "location": f"{zone.name} District",
                "temperature": 15,
                "condition": "Partly Cloudy",
                "humidity": 75,
                "windSpeed": 10,
                "forecast": [],
                "source": "fallback",
            }
    return results


@router.get("/{zone_id}")
async def get_zone_weather(zone_id: str, db: Session = Depends(get_db)):
    """Fetch live real-time weather for a specific settlement by zone_id."""
    zone = db.get(Zone, zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail=f"Zone '{zone_id}' not found")
    return await fetch_zone_live_weather(zone.latitude, zone.longitude, zone.name)
