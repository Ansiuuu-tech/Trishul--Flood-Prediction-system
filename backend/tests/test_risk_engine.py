"""Unit tests for the risk-fusion engine and severity classification."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.risk_engine import RiskInputs, classify, evaluate_risk


def _inputs(**overrides) -> RiskInputs:
    base = dict(
        zone_id="test_zone",
        rainfall_mm_1h=2, rainfall_mm_3h=5, rainfall_mm_24h=15,
        soil_moisture_pct=35, tilt_degrees=1.0, tilt_change_rate=0.1,
        vibration_g=0.05, terrain_risk_static=30, history_risk_static=10,
        is_online=True, reading_age_seconds=0,
    )
    base.update(overrides)
    return RiskInputs(**base)


def test_classify_boundaries():
    assert classify(0) == "Safe"
    assert classify(24.9) == "Safe"
    assert classify(25) == "Watch"
    assert classify(49.9) == "Watch"
    assert classify(50) == "Warning"
    assert classify(74.9) == "Warning"
    assert classify(75) == "Evacuate"
    assert classify(100) == "Evacuate"


def test_safe_baseline_stays_safe():
    result = evaluate_risk(_inputs())
    assert result.level == "Safe"
    assert result.score < 25


def test_extreme_inputs_reach_evacuate():
    result = evaluate_risk(_inputs(
        rainfall_mm_1h=48, rainfall_mm_3h=90, rainfall_mm_24h=180,
        soil_moisture_pct=90, tilt_degrees=7.5, tilt_change_rate=6.5,
        vibration_g=2.0, terrain_risk_static=80, history_risk_static=50,
    ))
    assert result.level == "Evacuate"
    assert result.score >= 75


def test_rainfall_soil_rule_forces_minimum_warning():
    # Below weighted-score threshold for Warning on its own, but the hard
    # rule (rainfall_3h>=60 & soil>=80) must force at least Warning.
    result = evaluate_risk(_inputs(
        rainfall_mm_1h=10, rainfall_mm_3h=62, rainfall_mm_24h=70,
        soil_moisture_pct=81, tilt_degrees=1.0, tilt_change_rate=0.2,
        vibration_g=0.1, terrain_risk_static=20, history_risk_static=10,
    ))
    assert result.level in ("Warning", "Evacuate")
    assert any("Rule triggered" in r for r in result.reasons)


def test_vibration_rule_forces_minimum_warning():
    result = evaluate_risk(_inputs(vibration_g=3.0))
    assert result.level in ("Warning", "Evacuate")


def test_offline_sensor_reduces_confidence_and_adds_warning():
    result = evaluate_risk(_inputs(is_online=False))
    assert result.confidence < 0.95
    assert result.data_quality_warning != ""


def test_stale_reading_reduces_confidence():
    result = evaluate_risk(_inputs(reading_age_seconds=3600))
    assert result.confidence < 0.95
    assert "stale" in result.data_quality_warning.lower()


def test_result_has_required_fields():
    result = evaluate_risk(_inputs())
    assert result.zone_id == "test_zone"
    assert isinstance(result.score, float)
    assert result.level in ("Safe", "Watch", "Warning", "Evacuate")
    assert 0 <= result.confidence <= 1
    assert isinstance(result.reasons, list) and len(result.reasons) > 0
    assert result.recommended_action != ""
    assert result.estimated_lead_time_minutes >= 0
    assert result.model_version != ""
