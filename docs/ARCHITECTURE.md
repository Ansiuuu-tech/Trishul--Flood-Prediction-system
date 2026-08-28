# HimalayaShield — Architecture

> Hackathon decision-support prototype. **Demo Mode — not for operational emergency decisions.**

## System overview

```mermaid
flowchart TB
    subgraph Sources["Data Sources (Demo Mode — no hardware required)"]
        SIM[Backend Simulation Engine<br/>POST /api/simulation/*]
        SCRIPT[scripts/simulate_sensors.py<br/>standalone process]
        ESP[ESP32 Hardware Sketch<br/>optional]
    end

    subgraph Backend["FastAPI Backend"]
        ING[1. Ingestion Layer<br/>/api/sensors/*]
        VAL[2. Validation & Data-Quality<br/>Pydantic + staleness checks]
        DB[(3. PostgreSQL / SQLite<br/>SQLAlchemy)]
        FUSE[4. Multi-Source Risk-Fusion Engine<br/>weighted scoring]
        CLASS[5. Explainable Classification<br/>Safe / Watch / Warning / Evacuate]
        ALERT[6. Alert & Escalation Layer<br/>cooldown + dedup]
        WS[7. WebSocket Broadcaster<br/>/ws/live]
    end

    subgraph Frontend["8. React GIS Response Dashboard"]
        MAP[Live Map — Leaflet]
        PAGES[Overview / Zone Detail / Alerts /<br/>Simulation / Analytics / Settings]
    end

    SIM -->|internal call| ING
    SCRIPT -->|POST /api/sensors/bulk| ING
    ESP -->|POST /api/sensors/reading| ING
    ING --> VAL --> DB
    VAL --> FUSE --> CLASS --> DB
    CLASS --> ALERT --> DB
    ALERT --> WS
    CLASS --> WS
    WS -.live push.-> Frontend
    Frontend -->|REST| Backend
```

## Risk evaluation sequence (single reading)

```mermaid
sequenceDiagram
    participant S as Sensor source (sim / script / ESP32)
    participant API as FastAPI ingestion
    participant DB as Database
    participant Risk as Risk-Fusion Engine
    participant Alert as Alert Engine
    participant WS as WebSocket
    participant UI as Dashboard

    S->>API: POST /api/sensors/reading (or /bulk)
    API->>API: Pydantic validation (ranges, types)
    API->>DB: INSERT sensor_readings
    API->>Risk: evaluate_risk(inputs)
    Risk->>Risk: weighted score + hard escalation rules
    Risk-->>API: score, level, reasons, action, lead time
    API->>DB: INSERT risk_assessments
    API->>Alert: maybe_create_alert(previous_level, result)
    alt severity increased AND not in cooldown
        Alert->>DB: INSERT alerts
        Alert->>WS: broadcast("alert", ...)
    end
    API->>WS: broadcast("sensor_reading", ...)
    API->>WS: broadcast("risk_update", ...)
    WS-->>UI: push live updates
    UI->>UI: re-render map, cards, charts
```

## Risk-fusion formula

```
risk_score = 0.35 * rainfall_risk
           + 0.25 * soil_risk
           + 0.15 * tilt_risk
           + 0.10 * vibration_risk
           + 0.10 * terrain_risk
           + 0.05 * history_risk
```

Each sub-risk is normalized to 0–100. Classification:

| Score range | Level    |
|-------------|----------|
| 0–24        | Safe     |
| 25–49       | Watch    |
| 50–74       | Warning  |
| 75–100      | Evacuate |

### Hard escalation rules (override the weighted score's classification with a *minimum* level)

- `rainfall_3h >= 60mm` AND `soil_moisture >= 80%` → minimum **Warning**
- `rainfall_3h >= 80mm` AND `soil_moisture >= 85%` AND `tilt_change_rate >= 5°/hr` → minimum **Evacuate**
- `vibration_g >= 2.5g` (critical threshold) → minimum **Warning**
- Stale (>15 min old) or offline readings reduce confidence and add a data-quality warning, but do not change the level itself.

See `backend/app/risk_engine.py` for the full implementation.

## Alert lifecycle

```mermaid
stateDiagram-v2
    [*] --> Active: severity escalates (and not in cooldown)
    Active --> Acknowledged: Operator/Admin acknowledges
    Acknowledged --> Resolved: Operator/Admin resolves
    Active --> Resolved: Operator/Admin resolves directly
    Resolved --> [*]
```

An alert is only created when the new level is strictly higher than the zone's previous level (Safe→Watch, Watch→Warning, Warning→Evacuate, or any upward jump). A per-zone-per-level cooldown (`ALERT_COOLDOWN_SECONDS`, default 120s) prevents duplicate alerts from repeated readings at the same level.

## Data model (ER overview)

```mermaid
erDiagram
    ZONES ||--o{ SENSOR_READINGS : has
    ZONES ||--o{ HISTORICAL_EVENTS : has
    ZONES ||--o{ RISK_ASSESSMENTS : has
    ZONES ||--o{ ALERTS : has

    ZONES {
        string id PK
        string name
        float latitude
        float longitude
        int population
        float terrain_risk
        json geojson_polygon
    }
    SENSOR_READINGS {
        string id PK
        string zone_id FK
        float rainfall_mm_1h
        float soil_moisture_pct
        float tilt_degrees
        float vibration_g
        bool is_online
        datetime recorded_at
    }
    RISK_ASSESSMENTS {
        string id PK
        string zone_id FK
        float score
        string level
        json reasons
        string recommended_action
        datetime created_at
    }
    ALERTS {
        string id PK
        string zone_id FK
        string level
        string previous_level
        string status
        json delivery_channels
    }
    HISTORICAL_EVENTS {
        string id PK
        string zone_id FK
        string event_type
        string severity
    }
```

## Why these design choices

- **SQLite by default, PostgreSQL via `DATABASE_URL`**: the demo needs to run with zero setup; Docker Compose / Supabase swap in PostgreSQL without code changes.
- **Simulation runs inside the FastAPI process** (`asyncio` background task) so the primary demo needs no extra process — `scripts/simulate_sensors.py` is provided as an alternative for running the simulator externally (e.g. against a deployed backend).
- **Hard escalation rules alongside the weighted score** keep the system explainable and conservative: a single dangerous signal (e.g. critical vibration) can force a minimum level even if the blended score alone wouldn't.
- **Cooldown-based alerting** avoids alert fatigue from noisy sensors while still catching every genuine escalation.
