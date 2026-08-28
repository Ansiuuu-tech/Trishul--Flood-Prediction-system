"""
Multi-source risk-fusion engine + explainable classification layer.

risk_score = 0.35*rainfall_risk + 0.25*soil_risk + 0.15*tilt_risk
           + 0.10*vibration_risk + 0.10*terrain_risk + 0.05*history_risk

Classification:
  0-24  Safe
  25-49 Watch
  50-74 Warning
  75-100 Evacuate

Hard escalation rules can force a *minimum* level regardless of the
weighted score (e.g. extreme rainfall + saturated soil always implies at
least Warning), which keeps the system explainable and conservative.
"""
from __future__ import annotations

import datetime as dt
from dataclasses import dataclass, field

from app.config import get_settings

settings = get_settings()

LEVEL_ORDER = ["Safe", "Watch", "Warning", "Evacuate"]

# Weights (must sum to 1.0)
W_RAINFALL = 0.35
W_SOIL = 0.25
W_TILT = 0.15
W_VIBRATION = 0.10
W_TERRAIN = 0.10
W_HISTORY = 0.05

VIBRATION_CRITICAL_G = 2.5  # SW-420-equivalent threshold for "critical shaking"

LEAD_TIME_BY_LEVEL = {
    "Safe": 0,
    "Watch": 180,      # 3 hours
    "Warning": 60,      # 1 hour
    "Evacuate": 15,     # 15 minutes
}

ACTION_BY_LEVEL = {
    "Safe": "No action required. Continue routine monitoring.",
    "Watch": "Alert local ward officer. Advise residents near slopes/streams to stay informed.",
    "Warning": "Activate community alert system. Prepare evacuation routes. Move vulnerable residents to safe zones.",
    "Evacuate": "Issue immediate evacuation order. Direct residents to designated safe location via evacuation route.",
}


@dataclass
class RiskInputs:
    zone_id: str
    rainfall_mm_1h: float
    rainfall_mm_3h: float
    rainfall_mm_24h: float
    soil_moisture_pct: float
    tilt_degrees: float
    tilt_change_rate: float
    vibration_g: float
    terrain_risk_static: float  # 0-100, from zone metadata
    history_risk_static: float  # 0-100, derived from historical_events
    is_online: bool
    reading_age_seconds: float


@dataclass
class RiskResult:
    zone_id: str
    score: float
    level: str
    confidence: float
    rainfall_risk: float
    soil_risk: float
    tilt_risk: float
    vibration_risk: float
    terrain_risk: float
    history_risk: float
    reasons: list[str] = field(default_factory=list)
    recommended_action: str = ""
    estimated_lead_time_minutes: int = 0
    data_quality_warning: str = ""
    model_version: str = settings.MODEL_VERSION
    timestamp: dt.datetime = field(default_factory=lambda: dt.datetime.now(dt.timezone.utc))


def _clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, value))


def _rainfall_risk(mm_1h: float, mm_3h: float, mm_24h: float) -> float:
    # Blend short-burst intensity with sustained accumulation.
    burst = _clamp((mm_1h / 40.0) * 100)          # 40mm/hr ~ extreme
    sustained = _clamp((mm_3h / 90.0) * 100)       # 90mm/3hr ~ extreme
    accumulation = _clamp((mm_24h / 200.0) * 100)  # 200mm/24hr ~ extreme
    return _clamp(0.45 * burst + 0.40 * sustained + 0.15 * accumulation)


def _soil_risk(pct: float) -> float:
    # Near-linear, steepens above 70% saturation.
    if pct <= 70:
        return _clamp(pct * (60 / 70))
    return _clamp(60 + (pct - 70) * (40 / 30))


def _tilt_risk(degrees: float, change_rate: float) -> float:
    base = _clamp((abs(degrees) / 15.0) * 100)          # 15deg static tilt ~ extreme
    rate = _clamp((abs(change_rate) / 8.0) * 100)        # 8 deg/hr change ~ extreme
    return _clamp(0.5 * base + 0.5 * rate)


def _vibration_risk(g: float) -> float:
    return _clamp((g / VIBRATION_CRITICAL_G) * 100)


def classify(score: float) -> str:
    if score >= 75:
        return "Evacuate"
    if score >= 50:
        return "Warning"
    if score >= 25:
        return "Watch"
    return "Safe"


def _apply_escalation_rules(level: str, inputs: RiskInputs, reasons: list[str]) -> str:
    idx = LEVEL_ORDER.index(level)

    if inputs.rainfall_mm_3h >= 80 and inputs.soil_moisture_pct >= 85 and inputs.tilt_change_rate >= 5:
        reasons.append(
            f"Rule triggered: extreme rainfall ({inputs.rainfall_mm_3h:.0f}mm/3h) + saturated soil "
            f"({inputs.soil_moisture_pct:.0f}%) + rapid tilt change ({inputs.tilt_change_rate:.1f}°/hr) "
            "-> minimum level Evacuate."
        )
        idx = max(idx, LEVEL_ORDER.index("Evacuate"))
    elif inputs.rainfall_mm_3h >= 60 and inputs.soil_moisture_pct >= 80:
        reasons.append(
            f"Rule triggered: high 3h rainfall ({inputs.rainfall_mm_3h:.0f}mm) with soil moisture "
            f"near saturation ({inputs.soil_moisture_pct:.0f}%) -> minimum level Warning."
        )
        idx = max(idx, LEVEL_ORDER.index("Warning"))

    if inputs.vibration_g >= VIBRATION_CRITICAL_G:
        reasons.append(
            f"Rule triggered: vibration ({inputs.vibration_g:.2f}g) exceeds critical threshold "
            f"({VIBRATION_CRITICAL_G}g) -> minimum level Warning."
        )
        idx = max(idx, LEVEL_ORDER.index("Warning"))

    return LEVEL_ORDER[idx]


def _build_reasons(inputs: RiskInputs, r_rain, r_soil, r_tilt, r_vib, r_terrain, r_hist) -> list[str]:
    reasons: list[str] = []
    if r_rain >= 50:
        reasons.append(
            f"High rainfall intensity: {inputs.rainfall_mm_1h:.0f}mm in the last hour, "
            f"{inputs.rainfall_mm_3h:.0f}mm in 3 hours."
        )
    if r_soil >= 50:
        reasons.append(f"Soil moisture near saturation at {inputs.soil_moisture_pct:.0f}%.")
    if r_tilt >= 50:
        reasons.append(
            f"Slope tilt elevated at {inputs.tilt_degrees:.1f}° with a change rate of "
            f"{inputs.tilt_change_rate:.1f}°/hr, indicating possible ground movement."
        )
    if r_vib >= 50:
        reasons.append(f"Elevated ground vibration detected: {inputs.vibration_g:.2f}g.")
    if r_terrain >= 50:
        reasons.append("Zone has high static terrain susceptibility (steep slope / loose substrate).")
    if r_hist >= 30:
        reasons.append("Historical landslide/flash-flood incidents recorded in this zone.")
    if not reasons:
        reasons.append("All monitored indicators are within normal ranges.")
    return reasons


def evaluate_risk(inputs: RiskInputs) -> RiskResult:
    r_rain = _rainfall_risk(inputs.rainfall_mm_1h, inputs.rainfall_mm_3h, inputs.rainfall_mm_24h)
    r_soil = _soil_risk(inputs.soil_moisture_pct)
    r_tilt = _tilt_risk(inputs.tilt_degrees, inputs.tilt_change_rate)
    r_vib = _vibration_risk(inputs.vibration_g)
    r_terrain = _clamp(inputs.terrain_risk_static)
    r_hist = _clamp(inputs.history_risk_static)

    raw_score = (
        W_RAINFALL * r_rain
        + W_SOIL * r_soil
        + W_TILT * r_tilt
        + W_VIBRATION * r_vib
        + W_TERRAIN * r_terrain
        + W_HISTORY * r_hist
    )
    raw_score = _clamp(raw_score)

    base_level = classify(raw_score)
    reasons = _build_reasons(inputs, r_rain, r_soil, r_tilt, r_vib, r_terrain, r_hist)
    final_level = _apply_escalation_rules(base_level, inputs, reasons)

    # Confidence: reduced by offline sensors or stale data.
    confidence = 0.95
    dq_warning = ""
    if not inputs.is_online:
        confidence -= 0.35
        dq_warning = "Sensor reporting offline."
    if inputs.reading_age_seconds > settings.STALE_READING_SECONDS:
        confidence -= 0.25
        stale_min = int(inputs.reading_age_seconds // 60)
        dq_warning = (dq_warning + " " if dq_warning else "") + f"Last reading is {stale_min} minutes old (stale)."
    confidence = max(0.1, round(confidence, 2))

    if dq_warning:
        reasons.append(f"Data-quality warning: {dq_warning}")

    return RiskResult(
        zone_id=inputs.zone_id,
        score=round(raw_score, 1),
        level=final_level,
        confidence=confidence,
        rainfall_risk=round(r_rain, 1),
        soil_risk=round(r_soil, 1),
        tilt_risk=round(r_tilt, 1),
        vibration_risk=round(r_vib, 1),
        terrain_risk=round(r_terrain, 1),
        history_risk=round(r_hist, 1),
        reasons=reasons,
        recommended_action=ACTION_BY_LEVEL[final_level],
        estimated_lead_time_minutes=LEAD_TIME_BY_LEVEL[final_level],
        data_quality_warning=dq_warning,
    )
