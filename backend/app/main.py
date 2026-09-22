from __future__ import annotations

import datetime as dt
import threading

from fastapi import Depends, FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware

from app.config import get_settings
from app.database import get_db, init_db, session_scope
from app.evacuation_router import prewarm_graphs
from app.models import HistoricalEvent
from sqlalchemy.orm import Session
from app.routers import alerts, auth, auth_oauth, risk, sensors, simulation, sos, weather, zones
from app.schemas import HealthOut, HistoricalEventOut
from app.seed_data import seed_database
from app.simulation_engine import start_simulation
from app.weather_poller import start_weather_poller, stop_weather_poller
from app.ws_manager import manager
from app.ml.predict import get_predictor

# Only the districts you're actually demoing evacuation routing for -- prewarming
# all 13 Uttarakhand districts at once would itself take many minutes and a lot
# of memory. Add more here once each one is confirmed fetchable from OSM.
EVACUATION_DEMO_DISTRICTS = [
    "Bageshwar district, Uttarakhand, India",
    "Rudraprayag district, Uttarakhand, India",
    "Chamoli district, Uttarakhand, India",
]

settings = get_settings()

app = FastAPI(
    title="Trishul API",
    description=(
        "Hyper-local flash-flood and landslide early-warning platform — "
        "HACKATHON DEMO. Not for operational emergency decisions."
    ),
    version="1.0.0-demo",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Render (and most PaaS hosts) terminate TLS at a proxy and forward requests
# to this app over plain HTTP, setting an `X-Forwarded-Proto: https` header.
# Without this middleware, Starlette doesn't trust that header, so
# `request.url_for(...)` in auth_oauth.py builds an `http://` redirect_uri
# even though the app is only reachable over https:// -- and Facebook/Google
# reject it as "not whitelisted" because it doesn't match the https:// URL
# registered in the OAuth app settings. This makes Starlette trust the
# forwarded proto/host so the generated redirect_uri is correctly https://.
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

# Required by authlib's OAuth dance (state/pkce stored per-session between the
# redirect to the provider and the callback).
app.add_middleware(SessionMiddleware, secret_key=settings.session_secret)

app.include_router(zones.router)
app.include_router(sensors.router)
app.include_router(risk.router)
app.include_router(alerts.router)
app.include_router(simulation.router)
app.include_router(weather.router)
app.include_router(auth.router)
app.include_router(auth_oauth.router)
app.include_router(sos.router)


@app.on_event("startup")
async def on_startup() -> None:
    init_db()
    with session_scope() as db:
        seed_database(db)
    get_predictor()
    print("[startup] Flood risk model loaded")
    if settings.DATA_MODE == "live":
        start_weather_poller()
    else:
        start_simulation("normal")

    # Fetch + cache evacuation-route road graphs in the background so the
    # first real user request never triggers a live 1-2 min OSM download on
    # the request path. Runs in a plain thread (not asyncio) since osmnx's
    # network calls are blocking; daemon=True so it never blocks shutdown.
    threading.Thread(
        target=prewarm_graphs, args=(EVACUATION_DEMO_DISTRICTS,), daemon=True
    ).start()
    print(f"[startup] Prewarming evacuation road graphs in background for: {EVACUATION_DEMO_DISTRICTS}")


@app.on_event("shutdown")
async def on_shutdown() -> None:
    stop_weather_poller()


@app.get("/api/health", response_model=HealthOut)
def health():
    return HealthOut(
        status="ok",
        demo_mode=settings.DEMO_MODE,
        model_version=settings.MODEL_VERSION,
        database="sqlite" if settings.DATABASE_URL.startswith("sqlite") else "postgresql",
        time=dt.datetime.now(dt.timezone.utc),
        telegram_configured=settings.telegram_configured,
        email_configured=settings.email_configured,
        sms_configured=settings.twilio_configured,
    )


@app.get("/api/historical-events", response_model=list[HistoricalEventOut])
def get_historical_events(db: Session = Depends(get_db)):
    """Return documented historical events for all zones, newest first."""
    return db.query(HistoricalEvent).order_by(HistoricalEvent.event_date.desc()).all()



@app.websocket("/ws/live")
async def websocket_live(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        await websocket.send_json({"type": "connected", "data": {"message": "Trishul live feed connected (Demo Mode)."}})
        while True:
            # Keep the connection open; the client doesn't need to send anything,
            # but we read to detect disconnects promptly.
            await websocket.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
    except Exception:
        await manager.disconnect(websocket)
