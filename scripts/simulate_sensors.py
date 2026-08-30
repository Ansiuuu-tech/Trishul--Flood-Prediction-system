#!/usr/bin/env python3
"""
scripts/simulate_sensors.py

Standalone sensor simulator for Trishul. Sends realistic rainfall,
soil-moisture, tilt, and vibration readings to the backend's
POST /api/sensors/bulk endpoint every SIMULATION_INTERVAL_SECONDS (default
2s), without requiring any physical hardware.

This is an ALTERNATIVE to the built-in backend simulation engine
(POST /api/simulation/start): use this script if you want the simulator to
run as an independent process (e.g. hitting a deployed backend over the
network), or want to script a custom scenario. For the primary hackathon
demo, the built-in /api/simulation/* endpoints (driven from the Simulation
Control page) are simpler and are recommended.

Usage:
    python scripts/simulate_sensors.py --scenario normal
    python scripts/simulate_sensors.py --scenario heavy_rain
    python scripts/simulate_sensors.py --scenario rapid_escalation --zone dharali
    python scripts/simulate_sensors.py --scenario sensor_failure --zone kedarnath_valley
    python scripts/simulate_sensors.py --api-url http://localhost:8000 --interval 2
"""
from __future__ import annotations

import argparse
import random
import sys
import time
from typing import Optional

try:
    import requests
except ImportError:
    print("This script requires the 'requests' package: pip install requests --break-system-packages")
    sys.exit(1)

ZONE_IDS = [
    "dharali", "bhagirathi_view", "pine_ridge", "kedarnath_valley",
    "riverbend", "cloudrest", "mandla_slope", "himalayan_gate",
]

ESCALATION_STEPS = [
    (2, 5, 15, 35, 1.0, 0.1, 0.05),
    (8, 20, 40, 48, 1.5, 0.3, 0.15),
    (15, 35, 70, 58, 2.2, 0.8, 0.3),
    (25, 55, 110, 68, 3.0, 1.5, 0.6),
    (35, 65, 140, 82, 4.5, 3.0, 1.2),
    (45, 85, 170, 88, 6.5, 5.5, 1.8),
    (48, 90, 180, 90, 7.5, 6.5, 2.0),
]


def _rng(zone_id: str, tick: int) -> random.Random:
    return random.Random(hash((zone_id, tick)) % (2**32))


def _normal_reading(zone_id: str, tick: int) -> dict:
    rng = _rng(zone_id, tick)
    return dict(
        zone_id=zone_id, source="simulator_script",
        rainfall_mm_1h=max(0, rng.gauss(2, 1.5)),
        rainfall_mm_3h=max(0, rng.gauss(5, 3)),
        rainfall_mm_24h=max(0, rng.gauss(15, 6)),
        soil_moisture_pct=max(0, min(100, rng.gauss(35, 5))),
        tilt_degrees=max(0, rng.gauss(1.2, 0.4)),
        tilt_change_rate=max(0, rng.gauss(0.15, 0.1)),
        vibration_g=max(0, rng.gauss(0.08, 0.05)),
        battery_pct=rng.uniform(75, 100),
        is_online=True,
    )


def _heavy_rain_reading(zone_id: str, tick: int) -> dict:
    rng = _rng(zone_id, tick)
    progress = min(1.0, tick / 15.0)
    return dict(
        zone_id=zone_id, source="simulator_script",
        rainfall_mm_1h=max(0, rng.gauss(10 + 20 * progress, 3)),
        rainfall_mm_3h=max(0, rng.gauss(25 + 45 * progress, 6)),
        rainfall_mm_24h=max(0, rng.gauss(60 + 90 * progress, 10)),
        soil_moisture_pct=max(0, min(100, 40 + 35 * progress + rng.gauss(0, 3))),
        tilt_degrees=max(0, rng.gauss(1.5 + 1.5 * progress, 0.4)),
        tilt_change_rate=max(0, rng.gauss(0.3 + 0.8 * progress, 0.2)),
        vibration_g=max(0, rng.gauss(0.1 + 0.3 * progress, 0.08)),
        battery_pct=rng.uniform(70, 100),
        is_online=True,
    )


def _rapid_escalation_reading(zone_id: str, tick: int, target_zone: str) -> dict:
    if zone_id == target_zone:
        step_idx = min(tick, len(ESCALATION_STEPS) - 1)
        r1, r3, r24, soil, tilt, tilt_rate, vib = ESCALATION_STEPS[step_idx]
        return dict(
            zone_id=zone_id, source="simulator_script",
            rainfall_mm_1h=r1, rainfall_mm_3h=r3, rainfall_mm_24h=r24,
            soil_moisture_pct=soil, tilt_degrees=tilt, tilt_change_rate=tilt_rate,
            vibration_g=vib, battery_pct=95, is_online=True,
        )
    return _normal_reading(zone_id, tick)


def _sensor_failure_reading(zone_id: str, tick: int, target_zone: str) -> dict:
    if zone_id == target_zone:
        rng = _rng(zone_id, tick)
        return dict(
            zone_id=zone_id, source="simulator_script",
            rainfall_mm_1h=0, rainfall_mm_3h=0, rainfall_mm_24h=0,
            soil_moisture_pct=0, tilt_degrees=0, tilt_change_rate=0, vibration_g=0,
            battery_pct=max(0, rng.uniform(0, 15)), is_online=False,
        )
    return _normal_reading(zone_id, tick)


def build_readings(scenario: str, tick: int, target_zone: Optional[str]) -> list[dict]:
    target = target_zone or ZONE_IDS[0]
    readings = []
    for zone_id in ZONE_IDS:
        if scenario == "heavy_rain":
            readings.append(_heavy_rain_reading(zone_id, tick))
        elif scenario == "rapid_escalation":
            readings.append(_rapid_escalation_reading(zone_id, tick, target))
        elif scenario == "sensor_failure":
            readings.append(_sensor_failure_reading(zone_id, tick, target))
        else:
            readings.append(_normal_reading(zone_id, tick))
    return readings


def main() -> None:
    parser = argparse.ArgumentParser(description="Trishul sensor simulator")
    parser.add_argument("--api-url", default="http://localhost:8000", help="Backend base URL")
    parser.add_argument(
        "--scenario", default="normal",
        choices=["normal", "heavy_rain", "rapid_escalation", "sensor_failure"],
    )
    parser.add_argument("--zone", default=None, help="Target zone id for rapid_escalation / sensor_failure")
    parser.add_argument("--interval", type=float, default=2.0, help="Seconds between ticks")
    parser.add_argument("--ticks", type=int, default=0, help="Number of ticks to run (0 = run forever)")
    args = parser.parse_args()

    if args.zone and args.zone not in ZONE_IDS:
        print(f"Unknown zone '{args.zone}'. Valid zones: {', '.join(ZONE_IDS)}")
        sys.exit(1)

    url = f"{args.api_url.rstrip('/')}/api/sensors/bulk"
    print(f"Trishul simulator (Demo Mode) -> scenario={args.scenario} target={args.zone or ZONE_IDS[0]}")
    print(f"POSTing to {url} every {args.interval}s. Press Ctrl+C to stop.")

    tick = 0
    try:
        while True:
            readings = build_readings(args.scenario, tick, args.zone)
            try:
                resp = requests.post(url, json={"readings": readings}, timeout=5)
                status = "ok" if resp.status_code == 200 else f"HTTP {resp.status_code}"
            except requests.RequestException as exc:
                status = f"error: {exc}"
            print(f"[tick {tick}] {status}")
            tick += 1
            if args.ticks and tick >= args.ticks:
                break
            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\nSimulator stopped.")


if __name__ == "__main__":
    main()
