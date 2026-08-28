export type RiskLevel = "Safe" | "Watch" | "Warning" | "Evacuate";

export type UserRole = "viewer" | "operator" | "administrator";

export interface Zone {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  population: number;
  elevation_m: number;
  slope_degrees: number;
  terrain_risk: number;
  geojson_polygon: { type: "Polygon"; coordinates: number[][][] };
  safe_location: string;
  evacuation_route: string;
  is_fictional: boolean;
}

export interface SensorReading {
  id: string;
  zone_id: string;
  source: string;
  rainfall_mm_1h: number;
  rainfall_mm_3h: number;
  rainfall_mm_24h: number;
  soil_moisture_pct: number;
  tilt_degrees: number;
  tilt_change_rate: number;
  vibration_g: number;
  battery_pct: number;
  is_online: boolean;
  recorded_at: string;
}

export interface RiskAssessment {
  id: string;
  zone_id: string;
  score: number;
  level: RiskLevel;
  confidence: number;
  rainfall_risk: number;
  soil_risk: number;
  tilt_risk: number;
  vibration_risk: number;
  terrain_risk: number;
  history_risk: number;
  reasons: string[];
  recommended_action: string;
  estimated_lead_time_minutes: number;
  data_quality_warning: string;
  model_version: string;
  created_at: string;
}

export interface Alert {
  id: string;
  zone_id: string;
  level: RiskLevel;
  previous_level: string;
  message: string;
  reasons: string[];
  status: "active" | "acknowledged" | "resolved";
  delivery_channels: string[];
  acknowledged_by: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface HistoricalEvent {
  id: string;
  zone_id: string;
  event_type: string;
  event_date: string;
  severity: string;
  fatalities: number;
  description: string;
}

export type ScenarioName = "normal" | "heavy_rain" | "rapid_escalation" | "sensor_failure";

export interface SimulationStatus {
  running: boolean;
  scenario: ScenarioName | null;
  target_zone_id: string | null;
  tick_interval_seconds: number;
  ticks_elapsed: number;
  started_at: string | null;
}

export interface HealthStatus {
  status: string;
  demo_mode: boolean;
  model_version: string;
  database: string;
  time: string;
  telegram_configured: boolean;
  email_configured: boolean;
}

export interface User {
  id: string;
  username: string;
  display_name: string;
  role: UserRole;
  is_demo_account: boolean;
}

export interface WSMessage<T = unknown> {
  type: "connected" | "sensor_reading" | "risk_update" | "alert" | "alert_updated";
  data: T;
}
