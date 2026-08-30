# Trishul

**Three signals. One warning. An open-source, hyper-local early-warning platform for flash floods and landslides in Himalayan hill regions.**

> ⚠️ **Demo Mode.** Trishul is a decision-support prototype built for a hackathon. It is **not certified for operational emergency decisions**.

Trishul fuses rainfall, soil moisture, slope tilt, vibration, static terrain susceptibility, and historical-incident data into an explainable 0–100 risk score per zone, classified as **Safe / Watch / Warning / Evacuate**, with reasons, a recommended action, and an estimated lead time — updated live over WebSockets.

📖 [Architecture (with Mermaid diagrams)](docs/ARCHITECTURE.md) · [API Reference](docs/API.md) · [5-Minute Demo Script](docs/DEMO_SCRIPT.md)

---

## Table of contents

- [Quick start](#quick-start)
- [The eight modules](#the-eight-modules)
- [Risk-fusion formula](#risk-fusion-formula)
- [Simulation & scenarios](#simulation--scenarios)
- [API overview](#api-overview)
- [Running tests](#running-tests)
- [Hardware (optional)](#hardware-optional)
- [Project structure](#project-structure)
- [Environment variables](#environment-variables)
- [Deployment](#deployment)
- [License & disclaimer](#license--disclaimer)

---

## Quick start

Requires [Docker](https://docs.docker.com/get-docker) + Docker Compose. No external services, API keys, or physical sensors needed.

### Docker Compose (recommended — one command)

```bash
git clone <this-repo> trishul
cd trishul
cp .env.example .env
docker compose up --build
```

This starts three services:

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | React dashboard served via Nginx |
| Backend API | http://localhost:8000 | FastAPI REST + Swagger UI at `/docs` |
| PostgreSQL | localhost:5432 | user/pass/db: `trishul` / `trishul_dev` / `trishul` |

The backend seeds all 8 zones and demo users automatically on first startup.

### Local development (no Docker)

**Backend** (Python 3.11+):

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Uses local SQLite by default (`backend/trishul.db`) — zero config needed. To use PostgreSQL instead, set `DATABASE_URL` in `backend/.env` (see `.env.example`).

**Frontend** (Node 18+):

```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000" > .env
npm run dev
```

Open http://localhost:5173.

**Run the demo:** in the app, go to **Simulation Control** → pick a target zone → click **Run Rapid Escalation**. Watch the Dashboard map update in real time. See the [5-minute demo script](docs/DEMO_SCRIPT.md) for a full walkthrough.

---

## The eight modules

Trishul is architected as eight integrated modules. Each module contributes an independent signal — three of them (Varuna Watch, Bhumi Sense, Kampan Alert) feed into Trishul Core, which fuses them into a single **Rudra Level**. Kailash View renders the result on a GIS map, Drishti Panel explains *why* a level was chosen, and Ghanta Signal delivers the alert through every channel that works when the power is out.

### 1. Varuna Watch — Rainfall Intelligence

> *Varuna — god of water and rain*

Ingest gauge-corrected radar estimates (QPE) and ground-truth rain gauge data, computing accumulation across three operational windows — 1-hour, 3-hour, and 24-hour — with intensity classification (light, moderate, heavy, extreme) calibrated for Himalayan orographic enhancement. Outputs a rainfall likelihood score (0–1) to Trishul Core.

| Component | Detail |
|-----------|--------|
| Data source | Radar QPE + gauge network, fused via kriging at 500m resolution |
| Windows | Rolling 1h / 3h / 24h, updated every 5 minutes |
| Intensity | Light < 2.5, Moderate 2.5–10, Heavy 10–50, Extreme > 50 mm/h |
| Output | Rainfall likelihood (0–1) + dominant intensity class |

### 2. Bhumi Sense — Ground Stability

> *Bhumi — goddess of the earth*

Monitors volumetric water content (VWC) at multiple depths (0.2m, 0.5m, 1.0m) and slope inclination via MEMS inclinometers. Computes a slope stability probability using a physically-based infinite-slope model parameterized with real-time pore-pressure estimates. Detects progressive saturation leading to loss of shear strength — the precursor to shallow landslides and debris flows.

| Component | Detail |
|-----------|--------|
| Sensors | Capacitance VWC probes + biaxial tilt sensors (0.1° resolution) |
| Model | Infinite-slope stability with real-time pore pressure |
| Method | Monte Carlo sampling of soil cohesion/friction uncertainty |
| Output | Slope stability probability (0–1) + critical failure depth |

### 3. Kampan Alert — Vibration Detection

> *Kampan — vibration, tremor, resonance*

Operates a triaxial MEMS accelerometer array (400 Hz sampling) at each node. On-device DSP computes real-time PSD (power spectral density), dominant frequency, and kurtosis. A lightweight TinyML classifier distinguishes anthropogenic noise, tectonic microseisms, and debris-flow vibration signatures (broadband 10–80 Hz with rising amplitude).

| Component | Detail |
|-----------|--------|
| Sampling | Triaxial MEMS at 400 Hz, GPS-time-synced |
| DSP | STFT → PSD, dominant frequency, spectral centroid, kurtosis |
| Classifier | 4-class TinyML: quiet, anthropogenic, tectonic, debris-flow |
| Output | Vibration anomaly score (0–1) + class label |

### 4. Trishul Core — Bayesian Fusion Engine

> *Trishul — the three-pronged fusion*

The central Bayesian fusion engine. Receives three independent likelihood streams — Varuna Watch (rainfall), Bhumi Sense (slope), Kampan Alert (vibration) — each at its own cadence (5 min, 15 min, 5 s). Computes the posterior P(hazard | all evidence) using a naïve Bayes assumption calibrated on historical Himalayan events. Outputs the authoritative **Rudra Level** with per-sensor Shapley attribution.

| Step | Detail |
|------|--------|
| Normalize | Each stream → P(hazard | sensor) via calibration curves |
| Fuse | P(hazard | all) ∝ P(hazard) × ∏ P(sensor_i | hazard) / P(sensor_i) |
| Threshold | Safe <0.2, Watch 0.2–0.5, Warning 0.5–0.8, Evacuate >0.8 |
| Attribute | Shapley values per sensor — explains which signal drove the level |

### 5. Rudra Levels — Alert Taxonomy

> *Rudra — the roarer, the howler, the storm god*

The four-tier alert taxonomy that Trishul Core outputs. Replaces ambiguous color codes with action-bound levels calibrated on Himalayan catchment response times.

| Level | Posterior | Action | Delivery channels |
|-------|-----------|--------|-------------------|
| **Safe** | < 0.20 | No action. Routine monitoring. | — |
| **Watch** | 0.20–0.50 | Prepare: check supplies, review routes, monitor updates. | SMS, WhatsApp, App push |
| **Warning** | 0.50–0.80 | Move vulnerable: elderly, children, disabled to safe ground. | + Siren, IVR, Community radio |
| **Evacuate** | > 0.80 | Move everyone. Immediate evacuation to designated shelters. | + Radio, Door-to-door, PA systems |

Auto-expiry: Evacuate → Warning after 2h with no evidence; Warning → Watch after 1h. UI pulse animation activates only at Warning/Evacuate.

### 6. Kailash View — GIS Dashboard

> *Kailash — the mountain, the axis, the view from above*

The terrain-aware map interface (Leaflet + topo JSON) showing zone polygons, sensor node locations, and live Rudra Level rings at each zone centroid. Layers include rainfall accumulation raster, soil saturation interpolation, vibration heatmap, and contour lines. Dark mode default for field tablet use at night.

| Layer | Detail |
|-------|--------|
| Base | Terrain hillshade + contour lines |
| Zones | GeoJSON polygons with live Rudra Level rings (pulse at Warning/Evacuate) |
| Sensors | Node markers colored by last heartbeat; click for raw timeseries |
| Overlays | Rainfall raster, VWC interpolation, vibration heatmap, runout zones |

### 7. Drishti Panel — Explainable Alerts

> *Drishti — sight, vision, insight*

The explainable-alert interface. When an operator clicks a zone in Kailash View, Drishti opens a side panel showing: the current Rudra Level, the posterior probability, and a Shapley attribution breakdown (rain %, ground %, vibration %). Also shows the evidence timeline — what each sensor reported in the last 6 hours — and the "what changed" delta since the last level transition.

| Section | Detail |
|---------|--------|
| Attribute | Shapley values per sensor at fusion time |
| Timeline | Last 6h of each sensor stream aligned to fusion ticks |
| Delta | What changed since last level transition |
| Audit | Immutable log of every fusion decision, level change, and operator action |

### 8. Ghanta Signal — Multi-Channel Delivery

> *Ghanta — the bell, the call, the alarm*

The multi-channel alert delivery system. Receives Rudra Levels from Trishul Core and routes to: Siren (solar-powered, LoRa-triggered, 120 dB at 100m), SMS (bulk gateway, template per level), WhatsApp Business API (rich templates with map link), IVR (automated voice in Nepali/Hindi/local dialect), Community Radio (FM override), and Door-to-door (volunteer app with checkpoint confirmation).

Every level activates a superset of the previous level's channels — redundancy is the principle. Siren nodes use a LoRa mesh with solar + 72h battery; the gateway supports satellite backhaul.

| Channel | Watch | Warning | Evacuate |
|---------|-------|---------|----------|
| SMS | ✓ | ✓ | ✓ |
| WhatsApp | ✓ | ✓ | ✓ |
| Siren (LoRa) | — | ✓ Auto | ✓ Auto |
| IVR (Voice) | — | ✓ Auto | ✓ Auto |
| Community Radio | — | — | ✓ Override |
| Door-to-door | — | — | ✓ Volunteer |

---

## Risk-fusion formula

```
risk_score = 0.35 * rainfall_risk     (1h burst + 3h sustained + 24h accumulation)
           + 0.25 * soil_risk          (near-linear, steepens above 70% saturation)
           + 0.15 * tilt_risk          (static angle + change rate)
           + 0.10 * vibration_risk     (g-force proxy)
           + 0.10 * terrain_risk       (static, from zone metadata)
           + 0.05 * history_risk       (historical incidents count)
```

Each sub-risk is normalized to 0–100. Classification thresholds:

| Score range | Level |
|-------------|-------|
| 0–24 | Safe |
| 25–49 | Watch |
| 50–74 | Warning |
| 75–100 | Evacuate |

**Hard escalation rules** override the weighted score's classification with a minimum level when dangerous conditions are detected simultaneously:

- `rainfall_3h ≥ 60mm` AND `soil_moisture ≥ 80%` → minimum **Warning**
- `rainfall_3h ≥ 80mm` AND `soil_moisture ≥ 85%` AND `tilt_change_rate ≥ 5°/hr` → minimum **Evacuate**
- `vibration_g ≥ 2.5g` (critical threshold) → minimum **Warning**

Stale (>15 min old) or offline readings reduce confidence and add a data-quality warning, but do not change the level itself.

See `backend/app/risk_engine.py` for the full implementation.

---

## Simulation & scenarios

A built-in asyncio simulation engine runs inside the FastAPI process by default (no external process needed). It generates sensor readings every `SIMULATION_INTERVAL_SECONDS` (default 2s) and pushes them through the same ingestion → risk → alert pipeline real hardware would use.

Four scenarios are available via the **Simulation Control** page or the REST API:

| Scenario | Description |
|----------|-------------|
| `normal` | Gentle random walk around a safe baseline across all zones |
| `heavy_rain` | Elevated rainfall and soil moisture across all zones (reaches Watch/Warning) |
| `rapid_escalation` | One target zone climbs deterministically Safe → Watch → Warning → Evacuate over ~7 ticks |
| `sensor_failure` | Target zone's sensor goes offline / stops reporting |

### Standalone simulator script

An alternative to the built-in engine — useful for hitting a deployed backend over the network or scripting custom scenarios:

```bash
python scripts/simulate_sensors.py --scenario normal
python scripts/simulate_sensors.py --scenario heavy_rain
python scripts/simulate_sensors.py --scenario rapid_escalation --zone dharali
python scripts/simulate_sensors.py --scenario sensor_failure --zone joshimath
python scripts/simulate_sensors.py --api-url http://localhost:8000 --interval 2
```

---

## API overview

Interactive Swagger UI: http://localhost:8000/docs · ReDoc: http://localhost:8000/redoc

| Resource | Key endpoints |
|----------|---------------|
| **Health** | `GET /api/health` |
| **Zones** | `GET /api/zones`, `GET /api/zones/{zone_id}`, `GET /api/zones/{zone_id}/history`, `GET /api/zones/{zone_id}/shelters`, `GET /api/zones/nearest-shelter/{zone_id}` |
| **Sensors** | `GET /api/sensors/latest`, `GET /api/sensors/{zone_id}`, `POST /api/sensors/reading`, `POST /api/sensors/bulk` |
| **Risk** | `POST /api/risk/evaluate/{zone_id}`, `GET /api/risk/current`, `GET /api/risk/{zone_id}/history` |
| **Simulation** | `POST /api/simulation/start`, `POST /api/simulation/stop`, `POST /api/simulation/reset`, `POST /api/simulation/scenario`, `GET /api/simulation/status` |
| **Alerts** | `GET /api/alerts`, `POST /api/alerts/{alert_id}/acknowledge`, `POST /api/alerts/{alert_id}/resolve`, `POST /api/alerts/test` |
| **Auth** | `POST /api/auth/demo-login`, `GET /api/auth/me`, `GET /api/auth/roles`, `GET /api/auth/google/login`, `GET /api/auth/google/callback`, `GET /api/auth/facebook/login`, `GET /api/auth/facebook/callback` |
| **WebSocket** | `WS /ws/live` — pushes `connected`, `sensor_reading`, `risk_update`, `alert`, `alert_updated` events |

See [docs/API.md](docs/API.md) for full request/response examples with curl.

---

## Running tests

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

Covers:
- **Risk engine** (`test_risk_engine.py`): classification boundaries, weighted scoring, hard escalation rules, confidence/data-quality warnings
- **Alert engine** (`test_alert_cooldown.py`): escalation detection, per-zone-per-level cooldown/dedup
- **Sensor ingestion** (`test_sensor_ingestion.py`): Pydantic schema validation (range checks, required fields, defaults)

---

## Hardware (optional)

The demo works fully without any physical sensors. If you want to show a real hardware path, `hardware/trishul_esp32.ino` is a complete ESP32 sketch for:

- Rain sensor (YL-83 / FC-37) — GPIO34 (ADC)
- Capacitive soil-moisture sensor — GPIO35 (ADC)
- MPU6050 accelerometer/gyroscope (I2C, tilt + vibration) — SDA=21, SCL=22
- SW-420 vibration sensor (digital) — GPIO27

It posts JSON readings to `POST /api/sensors/reading` with Wi-Fi retry (exponential backoff) and sensor-failure handling (`is_online=false` on degraded reads). Set `WIFI_SSID`, `WIFI_PASSWORD`, `API_BASE_URL`, and `ZONE_ID` at the top of the sketch before flashing.

---

## Project structure

```
trishul/
├── docker-compose.yml            # PostgreSQL + Backend + Frontend (3 services)
├── .env.example                  # template — copy to .env before running
├── .gitignore
├── README.md                     # this file
├── docs/
│   ├── ARCHITECTURE.md           # Mermaid diagrams: data flow, ER model, alert lifecycle
│   ├── API.md                    # full REST + WebSocket reference
│   └── DEMO_SCRIPT.md            # 5-minute hackathon demo walkthrough
├── backend/                      # FastAPI + SQLAlchemy + risk/alert/simulation engines
│   ├── app/
│   │   ├── main.py               # app entrypoint, CORS, WebSocket, startup seeding
│   │   ├── config.py             # Pydantic-settings, all env vars
│   │   ├── database.py           # engine/session, SQLite ↔ PostgreSQL
│   │   ├── models.py             # SQLAlchemy ORM models (8 tables)
│   │   ├── schemas.py            # Pydantic v2 request/response schemas
│   │   ├── risk_engine.py        # weighted multi-source scoring + escalation rules
│   │   ├── alert_engine.py       # escalation-only alerts + cooldown
│   │   ├── simulation_engine.py  # in-process asyncio sensor simulation
│   │   ├── ws_manager.py         # WebSocket broadcast manager
│   │   ├── seed_data.py          # 8 real Uttarakhand zones, historical events, demo users
│   │   ├── auth_service.py       # JWT issue/verify, OAuth user resolution
│   │   ├── oauth.py              # Google/Facebook OAuth client registration
│   │   └── routers/              # zones, sensors, risk, alerts, simulation, auth, auth_oauth
│   ├── migrations/               # 001_init.sql (PostgreSQL), 002_alter_users_oauth.sql
│   ├── tests/                    # pytest: risk engine, alert cooldown, sensor validation
│   ├── requirements.txt
│   └── Dockerfile
├── scripts/
│   └── simulate_sensors.py       # standalone sensor simulator (alternative to built-in engine)
├── hardware/
│   └── trishul_esp32.ino # optional ESP32 field sensor sketch
├── frontend/                     # React + TS + Vite + Tailwind + Leaflet
│   ├── src/
│   │   ├── App.tsx               # route definitions + layouts
│   │   ├── main.tsx
│   │   ├── index.css
│   │   ├── index.html
│   │   ├── assets/               # icons (trishul-mark.svg), background images
│   │   ├── components/           # auth, core, dashboard, layout, ui
│   │   ├── context/              # AuthContext (JWT session management)
│   │   ├── hooks/                # useReducedMotion, useUserLocation
│   │   ├── lib/                  # api (backend integration + OpenWeather), config, features, mockData
│   │   └── pages/                # Dashboard, Features, 8 module pages, Profile, Settings, Auth, etc.
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js        # Trishul design tokens (wet forest / signal amber)
│   ├── postcss.config.js
│   └── Dockerfile                # multi-stage: Vite build → Nginx
```

---

## Environment variables

See [`.env.example`](.env.example) for the full list with comments. Nothing needs to be filled in to run the demo; Telegram/email alerting, OAuth, and Supabase are opt-in.

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./trishul.db` | SQLite (default) or PostgreSQL URL |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Comma-separated allowed frontend origins |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | — | Optional Telegram alerting |
| `SMTP_HOST` / `SMTP_USERNAME` / `SMTP_PASSWORD` / `ALERT_EMAIL` | — | Optional email alerting |
| `ALERT_COOLDOWN_SECONDS` | `120` | Per-zone-per-level alert dedup cooldown |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | — | Optional Google OAuth |
| `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET` | — | Optional Facebook OAuth |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | — | Optional Supabase |
| `SIMULATION_INTERVAL_SECONDS` | `2.0` | Seconds between simulation ticks |
| `STALE_READING_SECONDS` | `900` | Stale data-quality threshold (15 min) |
| `SESSION_SECRET` / `JWT_SECRET` | random | Required for production; auto-generated for local dev |
| `JWT_EXPIRY_HOURS` | `168` | JWT token lifetime (1 week) |

---

## Deployment

### Full-stack (Docker Compose)

```bash
docker compose up --build -d
```

Frontend → http://localhost:5173, Backend → http://localhost:8000, Swagger → http://localhost:8000/docs.

### Split deployment

- **Frontend → Vercel:** point Vercel at `frontend/`, set `VITE_API_URL` to your deployed backend URL.
- **Backend → Render / Railway:** point at `backend/`, use the included `Dockerfile`. Set `DATABASE_URL` (managed Postgres) and `CORS_ORIGINS` to your frontend URL.
- **Database → Supabase (optional):** create a project, run `backend/migrations/001_init.sql` in the SQL editor (or let SQLAlchemy's `create_all()` do it on first backend startup), then `002_alter_users_oauth.sql`, and set `DATABASE_URL`/`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`.

No paid services, weather APIs, or Supabase are required to run the primary demo — everything above is optional.

---

## License & disclaimer

Hackathon prototype for demonstration purposes only. Not affiliated with any government disaster-management authority. Do not use for real evacuation decisions.
