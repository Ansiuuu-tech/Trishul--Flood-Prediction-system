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
from app.models import Alert, AlertRecipient, Zone
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


async def _deliver_sms(message: str, to_numbers: list[str] | None = None) -> tuple[bool, str]:
    """Deliver an SMS notification via Twilio REST API.
    Returns (success, detail_message)."""
    if not settings.twilio_configured:
        return False, "Twilio credentials not configured"
    recipients = to_numbers or settings.alert_sms_recipients
    if not recipients:
        return False, "No SMS recipient numbers configured in ALERT_SMS_NUMBERS"

    url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
    auth = (settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    sent_any = False
    last_detail = ""

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            for number in recipients:
                resp = await client.post(
                    url,
                    auth=auth,
                    data={
                        "From": settings.TWILIO_FROM_NUMBER,
                        "To": number,
                        "Body": message,
                    },
                )
                if resp.status_code in (200, 201):
                    sent_any = True
                    last_detail = "SMS dispatched successfully via Twilio"
                else:
                    try:
                        err = resp.json()
                        last_detail = f"Twilio Error {err.get('code')}: {err.get('message')}"
                    except Exception:
                        last_detail = f"HTTP {resp.status_code}: {resp.text}"
        return sent_any, last_detail
    except Exception as e:
        return False, str(e)


def get_recipients_for_alert(db: Session, zone: Zone, alert_level: str) -> list[AlertRecipient]:
    """Retrieve active SMS recipients for a zone and its district whose severity threshold is met."""
    thresholds = ["Watch"]
    if alert_level in ("Warning", "Critical"):
        thresholds.append("Warning")
    if alert_level == "Critical":
        thresholds.append("Critical")

    query = db.query(AlertRecipient).filter(
        AlertRecipient.is_active.is_(True),
        AlertRecipient.min_alert_level.in_(thresholds),
    )

    if zone.district:
        query = query.filter(
            (AlertRecipient.zone_id == zone.id) |
            ((AlertRecipient.district.ilike(zone.district)) & (AlertRecipient.zone_id.is_(None)))
        )
    else:
        query = query.filter(AlertRecipient.zone_id == zone.id)

    return query.all()


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

    email_ok = await _deliver_email(f"Trishul ALERT: {zone.name} - {risk.level}", message)
    if settings.email_configured:
        channels.append("email" if email_ok else "email_failed")
    else:
        channels.append("email_demo_mode")

    # Target SMS recipients (DEOC, Pradhans, SDRF, etc.)
    target_recipients = get_recipients_for_alert(db, zone, risk.level)
    target_numbers = [r.phone_number for r in target_recipients]
    if not target_numbers and settings.alert_sms_recipients:
        target_numbers = settings.alert_sms_recipients

    sms_ok, sms_detail = await _deliver_sms(message, to_numbers=target_numbers)
    if settings.twilio_configured:
        channels.append("sms" if sms_ok else f"sms_failed: {sms_detail}")
    else:
        recipient_count = len(target_recipients)
        if recipient_count > 0:
            channels.append(f"sms_demo_mode ({recipient_count} recipients targeted)")
        else:
            channels.append("sms_demo_mode")

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

