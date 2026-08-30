from __future__ import annotations

import datetime as dt

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.config import get_settings
from app.database import get_db, init_db, session_scope
from app.routers import alerts, auth, auth_oauth, risk, sensors, simulation, zones
from app.schemas import HealthOut
from app.seed_data import seed_database
from app.simulation_engine import start_simulation
from app.ws_manager import manager

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

# Required by authlib's OAuth dance (state/pkce stored per-session between the
# redirect to the provider and the callback).
app.add_middleware(SessionMiddleware, secret_key=settings.session_secret)

app.include_router(zones.router)
app.include_router(sensors.router)
app.include_router(risk.router)
app.include_router(alerts.router)
app.include_router(simulation.router)
app.include_router(auth.router)
app.include_router(auth_oauth.router)


@app.on_event("startup")
async def on_startup() -> None:
    init_db()
    with session_scope() as db:
        seed_database(db)
    start_simulation("normal")


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
    )


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
