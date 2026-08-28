import axios from "axios";
import type {
  Alert,
  HealthStatus,
  HistoricalEvent,
  RiskAssessment,
  ScenarioName,
  SensorReading,
  SimulationStatus,
  User,
  UserRole,
  Zone,
} from "@/types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

export const WS_URL = API_URL.replace(/^http/, "ws") + "/ws/live";

// ---------- Health ----------
export const getHealth = () => api.get<HealthStatus>("/api/health").then((r) => r.data);

// ---------- Zones ----------
export const getZones = () => api.get<Zone[]>("/api/zones").then((r) => r.data);
export const getZone = (id: string) => api.get<Zone>(`/api/zones/${id}`).then((r) => r.data);
export const getZoneHistory = (id: string) =>
  api
    .get<{ zone_id: string; risk_history: RiskAssessment[]; historical_events: HistoricalEvent[] }>(
      `/api/zones/${id}/history`
    )
    .then((r) => r.data);

// ---------- Sensors ----------
export const getLatestSensorReadings = () =>
  api.get<SensorReading[]>("/api/sensors/latest").then((r) => r.data);
export const getZoneSensorReadings = (zoneId: string, limit = 100) =>
  api.get<SensorReading[]>(`/api/sensors/${zoneId}`, { params: { limit } }).then((r) => r.data);

// ---------- Risk ----------
export const getCurrentRisk = () => api.get<RiskAssessment[]>("/api/risk/current").then((r) => r.data);
export const getZoneRiskHistory = (zoneId: string, limit = 100) =>
  api.get<RiskAssessment[]>(`/api/risk/${zoneId}/history`, { params: { limit } }).then((r) => r.data);
export const evaluateZoneRisk = (zoneId: string) =>
  api.post<RiskAssessment>(`/api/risk/evaluate/${zoneId}`).then((r) => r.data);

// ---------- Alerts ----------
export const getAlerts = (status?: string) =>
  api.get<Alert[]>("/api/alerts", { params: status ? { status } : {} }).then((r) => r.data);
export const acknowledgeAlert = (alertId: string, actor: string) =>
  api.post<Alert>(`/api/alerts/${alertId}/acknowledge`, { actor }).then((r) => r.data);
export const resolveAlert = (alertId: string, actor: string) =>
  api.post<Alert>(`/api/alerts/${alertId}/resolve`, { actor }).then((r) => r.data);
export const sendTestAlert = () => api.post<Alert>("/api/alerts/test").then((r) => r.data);

// ---------- Simulation ----------
export const startSimulation = (scenario: ScenarioName, zoneId?: string) =>
  api.post<SimulationStatus>("/api/simulation/start", { scenario, zone_id: zoneId }).then((r) => r.data);
export const stopSimulation = () => api.post<SimulationStatus>("/api/simulation/stop").then((r) => r.data);
export const resetSimulation = () => api.post<SimulationStatus>("/api/simulation/reset").then((r) => r.data);
export const setSimulationScenario = (scenario: ScenarioName, zoneId?: string) =>
  api.post<SimulationStatus>("/api/simulation/scenario", { scenario, zone_id: zoneId }).then((r) => r.data);
export const getSimulationStatus = () =>
  api.get<SimulationStatus>("/api/simulation/status").then((r) => r.data);

// ---------- Auth ----------
export const demoLogin = (role: UserRole) =>
  api.post<User>("/api/auth/demo-login", { role }).then((r) => r.data);
