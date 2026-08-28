# HimalayaShield

**Hyper-local flash-flood and landslide early-warning platform for hilly regions — hackathon prototype.**

> ⚠️ **Demo Mode.** This is a decision-support prototype built for a hackathon. It is **not certified for operational emergency decisions**. All 8 zones, coordinates, and historical events are fictional.

HimalayaShield fuses rainfall, soil moisture, slope tilt, vibration, static terrain susceptibility, and historical-incident data into an explainable 0–100 risk score per zone, classified as **Safe / Watch / Warning / Evacuate**, with reasons, a recommended action, and an estimated lead time — updated live over WebSockets.

📖 [Architecture (with Mermaid diagrams)](docs/ARCHITECTURE.md) · [API Reference](docs/API.md) · [5-Minute Demo Script](docs/DEMO_SCRIPT.md)

---

## Quick start (Docker Compose — recommended)

Requires Docker + Docker Compose. No external services, API keys, or physical sensors needed.

```bash
git clone <this-repo> himalaya-shield
cd himalaya-shield
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000 (Swagger docs at `/docs`)
- PostgreSQL: localhost:5432 (user/pass/db: `himalaya`/`himalaya`/`himalayashield`)

The backend seeds all 8 zones automatically on first startup.

---

## Quick start (local, no Docker)

**Backend** (Python 3.11+):
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Uses local SQLite by default (`himalayashield.db`) — zero config needed. To use PostgreSQL instead, set `DATABASE_URL` in `backend/.env` (see `.env.example`).

**Frontend** (Node 18+):
```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000" > .env
npm run dev
```
Open http://localhost:5173.

**Run the demo:** in the app, go to **Simulation Control** → pick a target zone → click **Run Rapid Escalation**. Watch the Overview/Live Map/Alerts pages update in real time. See the [5-minute demo script](docs/DEMO_SCRIPT.md) for a full walkthrough.

---

## Seeding & simulation commands

Seeding happens automatically on backend startup. To reseed after clearing the database, just restart the backend (SQLite) or re-run `docker compose up` (Postgres — data persists in the ` himalaya_pgdata` volume until removed).

Run the standalone sensor simulator (alternative to the in-app Simulation Control page):
```bash
python scripts/simulate_sensors.py --scenario normal
python scripts/simulate_sensors.py --scenario heavy_rain
python scripts/simulate_sensors.py --scenario rapid_escalation --zone dharali
python scripts/simulate_sensors.py --scenario sensor_failure --zone kedarnath_valley
python scripts/simulate_sensors.py --api-url http://localhost:8000 --interval 2
```

---

## Running tests

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```
Covers: risk-score classification & escalation rules, alert cooldown/dedup logic, and sensor-reading input validation (20 tests).

---

## Project structure

```
himalaya-shield/
├── docker-compose.yml
├── .env.example
├── docs/                      # Architecture, API reference, demo script
├── backend/                   # FastAPI + SQLAlchemy + risk engine
│   ├── app/
│   │   ├── main.py            # App entrypoint, CORS, WebSocket
│   │   ├── risk_engine.py     # Weighted fusion + escalation rules
│   │   ├── alert_engine.py    # Escalation-only alerts + cooldown
│   │   ├── simulation_engine.py
│   │   ├── seed_data.py       # 8 fictional zones
│   │   └── routers/           # zones, sensors, risk, alerts, simulation, auth
│   ├── migrations/001_init.sql
│   └── tests/
├── scripts/simulate_sensors.py
├── hardware/himalaya_shield_esp32.ino   # optional; not required for demo
└── frontend/                  # React + TS + Vite + Tailwind + Leaflet
    └── src/
        ├── pages/              # Overview, LiveMap, ZoneDetail, AlertsCenter,
        │                       # SimulationControl, Analytics, Settings
        ├── components/
        ├── context/AppContext.tsx   # global state + WebSocket wiring
        └── api/client.ts
```

---

## Hardware (optional)

The demo works fully without any physical sensors. If you want to show a real hardware path, `hardware/himalaya_shield_esp32.ino` is a complete ESP32 sketch for a rain sensor, capacitive soil-moisture sensor, MPU6050 (tilt/vibration), and SW-420 vibration sensor, posting JSON readings to `POST /api/sensors/reading` with Wi-Fi retry and sensor-failure handling. Set `WIFI_SSID`, `WIFI_PASSWORD`, `API_BASE_URL`, and `ZONE_ID` at the top of the sketch before flashing.

---

## Deployment

- **Frontend → Vercel:** point Vercel at `frontend/`, set `VITE_API_URL` to your deployed backend URL.
- **Backend → Render / Railway:** point at `backend/`, use the included `Dockerfile`, set `DATABASE_URL` (Render/Railway Postgres or Supabase) and `CORS_ORIGINS` to your Vercel frontend URL.
- **Database → Supabase (optional):** create a project, run `backend/migrations/001_init.sql` in the SQL editor (or let SQLAlchemy's `create_all()` do it on first backend startup), and set `DATABASE_URL`/`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`.

No paid services, weather APIs, or Supabase are required to run the primary demo — everything above is optional.

---

## Environment variables

See [`.env.example`](.env.example) for the full list with comments. Nothing needs to be filled in to run the demo; Telegram/email alerting and Supabase are opt-in.

---

## License / disclaimer

Hackathon prototype for demonstration purposes only. Not affiliated with any government disaster-management authority. Do not use for real evacuation decisions.
