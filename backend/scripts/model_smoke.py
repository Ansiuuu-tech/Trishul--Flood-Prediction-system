"""Run manually after installing backend requirements to verify ML serving."""
from app.ml.predict import get_predictor


predictor = get_predictor()
print("Model loaded! Features:", predictor.features)

fake_reading = {
    "rainfall_24h": 45.0,
    "rainfall_3d": 120.0,
    "rainfall_7d": 200.0,
    "rainfall_intensity": 30.0,
    "soil_moisture": 85.0,
    "elevation": 1800,
    "slope": 25,
    "terrain_susceptibility": 60.0,
    "seismic_zone": "V",
    "quake_count_100km_alltime": 12,
    "seismic_activity_90d": 1,
    "historical_flood_freq": 4,
    "historical_landslide_freq": 3,
    "month": 7,
}
print(predictor.predict_risk_level(fake_reading))
