"""
backend/app/ml/predict.py

Loads model_v1.joblib once at startup and exposes predict_proba() for
risk_engine.py to call. Feature construction here MUST exactly match
train.py's feature engineering -- this is the #1 place silent bugs
happen in ML systems (train/serve skew).
"""
import numpy as np
import joblib
from pathlib import Path

MODEL_PATH = Path(__file__).parent / "model_v1.joblib"


class FloodRiskPredictor:
    def __init__(self, model_path: Path = MODEL_PATH):
        bundle = joblib.load(model_path)
        self.model = bundle["model"]
        self.features = bundle["features"]
        self.threshold = bundle["threshold"]
        self.zone_order = bundle["zone_order"]

    def _build_feature_row(self, reading: dict) -> list:
        """
        `reading` is the dict assembled by risk_engine.py from a zone's
        latest sensor/weather values + its static attributes. Must produce
        the exact same columns, in the exact same order, as FEATURES in
        train.py.
        """
        rainfall_24h = reading["rainfall_24h"]
        rainfall_7d = reading["rainfall_7d"]
        burst_ratio = (rainfall_24h / rainfall_7d) if rainfall_7d else 0.0

        month = reading["month"]  # 1-12, from the current date
        month_sin = np.sin(2 * np.pi * month / 12)
        month_cos = np.cos(2 * np.pi * month / 12)

        seismic_zone_ord = self.zone_order.get(reading.get("seismic_zone"), 0)

        row = {
            "rainfall_24h": rainfall_24h,
            "rainfall_3d": reading["rainfall_3d"],
            "rainfall_7d": rainfall_7d,
            "rainfall_intensity": reading["rainfall_intensity"],
            "burst_ratio": burst_ratio,
            "soil_moisture": reading["soil_moisture"],
            "elevation": reading["elevation"],
            "slope": reading["slope"],
            "terrain_susceptibility": reading["terrain_susceptibility"],
            "seismic_zone_ord": seismic_zone_ord,
            "quake_count_100km_alltime": reading.get("quake_count_100km_alltime", 0),
            "seismic_activity_90d": reading.get("seismic_activity_90d", 0),
            "historical_flood_freq": reading["historical_flood_freq"],
            "historical_landslide_freq": reading["historical_landslide_freq"],
            "month_sin": month_sin,
            "month_cos": month_cos,
        }
        return [row[f] for f in self.features]

    def predict_proba(self, reading: dict) -> float:
        """Returns flood probability in [0, 1] for one zone's current reading."""
        x = np.array([self._build_feature_row(reading)])
        return float(self.model.predict_proba(x)[0, 1])

    def predict_risk_level(self, reading: dict) -> dict:
        proba = self.predict_proba(reading)
        is_high_risk = proba >= self.threshold
        return {
            "ml_probability": round(proba, 4),
            "ml_flag": "HIGH_RISK" if is_high_risk else "NORMAL",
            "threshold_used": self.threshold,
        }


# Loaded once at app startup (see main.py wiring below), not per-request --
# joblib.load() is not free, don't call it inside a request handler.
predictor: FloodRiskPredictor | None = None


def get_predictor() -> FloodRiskPredictor:
    global predictor
    if predictor is None:
        predictor = FloodRiskPredictor()
    return predictor
