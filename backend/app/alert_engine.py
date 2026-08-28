"""
Alert & escalation layer.

Rules:
  - An alert is generated only when severity *increases* (Safe->Watch,
    Watch->Warning, Warning->Evacuate, or any jump upward).
  - Cooldown per zone avoids duplicate alerts firing repeatedly for the
    same level within ALERT_COOLDOWN_SECONDS.
  - Alerts are always persisted and always shown in-app.
  - Telegram / email are only attempted when credentials are configured;
    otherwise delivery is marked as demo-mode (no network call is made).
"""
from __future__ import annotations

import datetime as dt

import httpx
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Alert, Zone
from app.risk_engine import LEVEL_ORDER, RiskResult

settings = get_settings()

# In-memory cooldown tracker: {(zone_id, level): last_sent_at}
_cooldown_cache: dict[tuple[str, str], dt.datetime] = {}


def _is_escalation(previous_level: str, new_level: str) -> bool:
    return LEVEL_ORDER.index(new_level) > LEVEL_ORDER.index(previous_level)


def _in_cooldown(zone_id: str, level: str) -> bool:
    key = (zone_id, level)
    last_sent = _cooldown_cache.get(key)
    if last_sent is None:
        return False
    elapsed = (dt.datetime.now(dt.timezone.utc) - last_sent).total_seconds()
    return elapsed < settings.ALERT_COOLDOWN_SECONDS


def _mark_sent(zone_id: str, level: str) -> None:
    _cooldown_cache[(zone_id, level)] = dt.datetime.now(dt.timezone.utc)


def reset_cooldowns() -> None:
    _cooldown_cache.clear()


async def _deliver_telegram(message: str) -> bool:
    if not settings.telegram_configured:
        return False
    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(url, json={"chat_id": settings.TELEGRAM_CHAT_ID, "text": message})
            return resp.status_code == 200
    except Exception:
        return False


async def _deliver_email(subject: str, message: str) -> bool:
    if not settings.email_configured:
        return False
    try:
        import smtplib
        from email.mime.text import MIMEText

        msg = MIMEText(message)
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_USERNAME
        msg["To"] = settings.ALERT_EMAIL
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=5) as server:
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception:
        return False


async def maybe_create_alert(
    db: Session, zone: Zone, previous_level: str, risk: RiskResult
) -> Alert | None:
    """Create + persist + (optionally) deliver an alert if this is a genuine
    escalation and not within cooldown. Returns the Alert if one was created."""
    if not _is_escalation(previous_level, risk.level):
        return None
    if _in_cooldown(zone.id, risk.level):
        return None

    message = (
        f"{zone.name}: risk escalated from {previous_level} to {risk.level} "
        f"(score {risk.score}/100). {risk.recommended_action}"
    )

    channels: list[str] = ["in_app"]

    telegram_ok = await _deliver_telegram(message)
    if settings.telegram_configured:
        channels.append("telegram" if telegram_ok else "telegram_failed")
    else:
        channels.append("telegram_demo_mode")

    email_ok = await _deliver_email(f"HimalayaShield ALERT: {zone.name} - {risk.level}", message)
    if settings.email_configured:
        channels.append("email" if email_ok else "email_failed")
    else:
        channels.append("email_demo_mode")

    alert = Alert(
        zone_id=zone.id,
        level=risk.level,
        previous_level=previous_level,
        message=message,
        reasons=risk.reasons,
        status="active",
        delivery_channels=channels,
    )
    db.add(alert)
    db.flush()
    _mark_sent(zone.id, risk.level)
    return alert
