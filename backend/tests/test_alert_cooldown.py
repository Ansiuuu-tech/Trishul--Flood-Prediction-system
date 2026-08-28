"""Unit tests for alert escalation-only + cooldown/dedup logic."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import asyncio

import pytest

from app.alert_engine import _in_cooldown, _is_escalation, _mark_sent, reset_cooldowns
from app.risk_engine import RiskResult


def test_is_escalation_detects_upward_moves():
    assert _is_escalation("Safe", "Watch") is True
    assert _is_escalation("Watch", "Warning") is True
    assert _is_escalation("Safe", "Evacuate") is True


def test_is_escalation_ignores_same_or_downward_moves():
    assert _is_escalation("Watch", "Watch") is False
    assert _is_escalation("Warning", "Watch") is False
    assert _is_escalation("Evacuate", "Safe") is False


def test_cooldown_blocks_repeat_alert_for_same_zone_and_level():
    reset_cooldowns()
    zone_id = "cooldown_test_zone"
    assert _in_cooldown(zone_id, "Watch") is False
    _mark_sent(zone_id, "Watch")
    assert _in_cooldown(zone_id, "Watch") is True
    # A different level for the same zone is not in cooldown.
    assert _in_cooldown(zone_id, "Warning") is False


def test_reset_cooldowns_clears_state():
    zone_id = "cooldown_reset_zone"
    _mark_sent(zone_id, "Warning")
    assert _in_cooldown(zone_id, "Warning") is True
    reset_cooldowns()
    assert _in_cooldown(zone_id, "Warning") is False


class _FakeZone:
    def __init__(self, zone_id: str, name: str):
        self.id = zone_id
        self.name = name


def _fake_result(level: str) -> RiskResult:
    return RiskResult(
        zone_id="alert_test_zone", score=60.0, level=level, confidence=0.9,
        rainfall_risk=50, soil_risk=50, tilt_risk=50, vibration_risk=50,
        terrain_risk=50, history_risk=50, reasons=["test reason"],
        recommended_action="Test action", estimated_lead_time_minutes=60,
    )


def test_maybe_create_alert_skips_non_escalation():
    from app.alert_engine import maybe_create_alert

    async def _run():
        reset_cooldowns()
        zone = _FakeZone("alert_test_zone", "Alert Test Zone")
        # db=None is fine here because we never reach db.add() when the
        # level does not escalate.
        result = await maybe_create_alert(db=None, zone=zone, previous_level="Warning", risk=_fake_result("Watch"))
        assert result is None

    asyncio.run(_run())
