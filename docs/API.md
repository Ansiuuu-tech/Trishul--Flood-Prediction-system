# Trishul — API Reference

Base URL (local): `http://localhost:8000`
Interactive Swagger UI: `http://localhost:8000/docs`
Interactive ReDoc: `http://localhost:8000/redoc`

All responses are JSON. All timestamps are ISO-8601 UTC.

## Health

### `GET /api/health`
```bash
curl http://localhost:8000/api/health
```
```json
{
  "status": "ok",
  "demo_mode": true,
  "model_version": "risk-fusion-v1.0.0-demo",
  "database": "sqlite",
  "time": "2026-08-28T08:00:00Z",
  "telegram_configured": false,
  "email_configured": false
}
```

## Zones

### `GET /api/zones`
List all zones.
```bash
curl http://localhost:8000/api/zones
```

### `GET /api/zones/{zone_id}`
```bash
curl http://localhost:8000/api/zones/dharali
```

### `GET /api/zones/{zone_id}/history`
Risk history + historical incidents for a zone.
```bash
curl "http://localhost:8000/api/zones/dharali/history?limit=50"
```

## Sensors

### `GET /api/sensors/latest`
Latest reading per zone.
```bash
curl http://localhost:8000/api/sensors/latest
```

### `GET /api/sensors/{zone_id}`
```bash
curl "http://localhost:8000/api/sensors/dharali?limit=100"
```

### `POST /api/sensors/reading`
Ingest a single reading (used by the ESP32 sketch and manual testing).
```bash
curl -X POST http://localhost:8000/api/sensors/reading \
  -H "Content-Type: application/json" \
  -d '{
    "zone_id": "dharali",
    "source": "manual",
    "rainfall_mm_1h": 12,
    "rainfall_mm_3h": 28,
    "rainfall_mm_24h": 55,
    "soil_moisture_pct": 62,
    "tilt_degrees": 2.1,
    "tilt_change_rate": 0.6,
    "vibration_g": 0.3,
    "battery_pct": 92,
    "is_online": true
  }'
```

### `POST /api/sensors/bulk`
Ingest multiple readings at once (used by `scripts/simulate_sensors.py`).
```bash
curl -X POST http://localhost:8000/api/sensors/bulk \
  -H "Content-Type: application/json" \
  -d '{"readings": [{"zone_id": "dharali", "rainfall_mm_1h": 5, "rainfall_mm_3h": 10, "rainfall_mm_24h": 20, "soil_moisture_pct": 40, "tilt_degrees": 1.2, "vibration_g": 0.1}]}'
```

## Risk

### `POST /api/risk/evaluate/{zone_id}`
Re-run the risk engine on the zone's latest reading.
```bash
curl -X POST http://localhost:8000/api/risk/evaluate/dharali
```

### `GET /api/risk/current`
Latest risk assessment for every zone.
```bash
curl http://localhost:8000/api/risk/current
```

### `GET /api/risk/{zone_id}/history`
```bash
curl "http://localhost:8000/api/risk/dharali/history?limit=100"
```

## Simulation

### `POST /api/simulation/start`
```bash
curl -X POST http://localhost:8000/api/simulation/start \
  -H "Content-Type: application/json" \
  -d '{"scenario": "rapid_escalation", "zone_id": "dharali"}'
```
Scenarios: `normal`, `heavy_rain`, `rapid_escalation`, `sensor_failure`. `zone_id` is required for `rapid_escalation` and `sensor_failure` (defaults to the first zone if omitted).

### `POST /api/simulation/stop`
```bash
curl -X POST http://localhost:8000/api/simulation/stop
```

### `POST /api/simulation/reset`
Clears all readings/assessments and reseeds every zone to a baseline Safe state.
```bash
curl -X POST http://localhost:8000/api/simulation/reset
```

### `POST /api/simulation/scenario`
Switch scenario without stopping (restarts tick counter).
```bash
curl -X POST http://localhost:8000/api/simulation/scenario \
  -H "Content-Type: application/json" \
  -d '{"scenario": "heavy_rain"}'
```

### `GET /api/simulation/status`
```bash
curl http://localhost:8000/api/simulation/status
```

## Alerts

### `GET /api/alerts`
```bash
curl "http://localhost:8000/api/alerts?status=active"
```

### `POST /api/alerts/{alert_id}/acknowledge`
```bash
curl -X POST http://localhost:8000/api/alerts/<alert_id>/acknowledge \
  -H "Content-Type: application/json" -d '{"actor": "demo-operator"}'
```

### `POST /api/alerts/{alert_id}/resolve`
```bash
curl -X POST http://localhost:8000/api/alerts/<alert_id>/resolve \
  -H "Content-Type: application/json" -d '{"actor": "demo-operator"}'
```

### `POST /api/alerts/test`
Sends a manually triggered test alert for the first zone.
```bash
curl -X POST http://localhost:8000/api/alerts/test
```

## Auth (demo)

### `POST /api/auth/demo-login`
```bash
curl -X POST http://localhost:8000/api/auth/demo-login \
  -H "Content-Type: application/json" -d '{"role": "operator"}'
```

### `GET /api/auth/roles`
```bash
curl http://localhost:8000/api/auth/roles
```

## WebSocket

### `WS /ws/live`
```bash
# Using websocat or similar:
websocat ws://localhost:8000/ws/live
```
Message types pushed: `connected`, `sensor_reading`, `risk_update`, `alert`, `alert_updated`.
```json
{"type": "risk_update", "data": {"zone_id": "dharali", "score": 78.8, "level": "Evacuate", "previous_level": "Warning", "confidence": 0.95, "reasons": ["..."], "recommended_action": "...", "estimated_lead_time_minutes": 15, "data_quality_warning": ""}}
```
