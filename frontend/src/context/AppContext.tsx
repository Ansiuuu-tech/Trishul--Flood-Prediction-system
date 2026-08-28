import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";
import * as api from "@/api/client";
import { useLiveSocket } from "@/hooks/useLiveSocket";
import type {
  Alert,
  RiskAssessment,
  RiskLevel,
  ScenarioName,
  SensorReading,
  SimulationStatus,
  UserRole,
  WSMessage,
  Zone,
} from "@/types";

interface AppState {
  zones: Zone[];
  riskByZone: Record<string, RiskAssessment>;
  sensorByZone: Record<string, SensorReading>;
  alerts: Alert[];
  simulation: SimulationStatus | null;
  role: UserRole;
  wsConnected: boolean;
  loading: boolean;
  error: string | null;
  lastUpdate: string | null;
}

type Action =
  | { type: "INIT"; zones: Zone[]; risk: RiskAssessment[]; sensors: SensorReading[]; alerts: Alert[] }
  | { type: "RISK_UPDATE"; assessment: Partial<RiskAssessment> & { zone_id: string; level: RiskLevel } }
  | { type: "SENSOR_UPDATE"; reading: Partial<SensorReading> & { zone_id: string } }
  | { type: "ALERT_NEW"; alert: Alert }
  | { type: "ALERTS_SET"; alerts: Alert[] }
  | { type: "SET_ROLE"; role: UserRole }
  | { type: "SET_WS"; connected: boolean }
  | { type: "SET_SIM"; sim: SimulationStatus }
  | { type: "ERROR"; message: string }
  | { type: "LOADED" };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "INIT": {
      const riskByZone: Record<string, RiskAssessment> = {};
      action.risk.forEach((r) => (riskByZone[r.zone_id] = r));
      const sensorByZone: Record<string, SensorReading> = {};
      action.sensors.forEach((s) => (sensorByZone[s.zone_id] = s));
      return {
        ...state,
        zones: action.zones,
        riskByZone,
        sensorByZone,
        alerts: action.alerts,
        loading: false,
        lastUpdate: new Date().toISOString(),
      };
    }
    case "RISK_UPDATE":
      return {
        ...state,
        riskByZone: {
          ...state.riskByZone,
          [action.assessment.zone_id]: {
            ...state.riskByZone[action.assessment.zone_id],
            ...action.assessment,
          } as RiskAssessment,
        },
        lastUpdate: new Date().toISOString(),
      };
    case "SENSOR_UPDATE":
      return {
        ...state,
        sensorByZone: {
          ...state.sensorByZone,
          [action.reading.zone_id]: {
            ...state.sensorByZone[action.reading.zone_id],
            ...action.reading,
          } as SensorReading,
        },
        lastUpdate: new Date().toISOString(),
      };
    case "ALERT_NEW":
      return { ...state, alerts: [action.alert, ...state.alerts] };
    case "ALERTS_SET":
      return { ...state, alerts: action.alerts };
    case "SET_ROLE":
      return { ...state, role: action.role };
    case "SET_WS":
      return { ...state, wsConnected: action.connected };
    case "SET_SIM":
      return { ...state, simulation: action.sim };
    case "ERROR":
      return { ...state, error: action.message, loading: false };
    case "LOADED":
      return { ...state, loading: false };
    default:
      return state;
  }
}

const initialState: AppState = {
  zones: [],
  riskByZone: {},
  sensorByZone: {},
  alerts: [],
  simulation: null,
  role: "viewer",
  wsConnected: false,
  loading: true,
  error: null,
  lastUpdate: null,
};

interface AppContextValue extends AppState {
  refresh: () => Promise<void>;
  setRole: (role: UserRole) => void;
  runScenario: (scenario: ScenarioName, zoneId?: string) => Promise<void>;
  stopSim: () => Promise<void>;
  resetSim: () => Promise<void>;
  ackAlert: (id: string) => Promise<void>;
  resolveAlertById: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const refresh = useCallback(async () => {
    try {
      const [zones, risk, sensors, alerts, sim] = await Promise.all([
        api.getZones(),
        api.getCurrentRisk(),
        api.getLatestSensorReadings(),
        api.getAlerts(),
        api.getSimulationStatus(),
      ]);
      dispatch({ type: "INIT", zones, risk, sensors, alerts });
      dispatch({ type: "SET_SIM", sim });
    } catch (err) {
      dispatch({ type: "ERROR", message: err instanceof Error ? err.message : "Failed to load data" });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Poll simulation status regularly (cheap) so the Simulation Control page
  // stays accurate even if a WS message is missed.
  useEffect(() => {
    const interval = setInterval(() => {
      api.getSimulationStatus().then((sim) => dispatch({ type: "SET_SIM", sim })).catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleWSMessage = useCallback((msg: WSMessage) => {
    if (msg.type === "risk_update") {
      dispatch({ type: "RISK_UPDATE", assessment: msg.data as any });
    } else if (msg.type === "sensor_reading") {
      dispatch({ type: "SENSOR_UPDATE", reading: msg.data as any });
    } else if (msg.type === "alert") {
      const d = msg.data as any;
      dispatch({
        type: "ALERT_NEW",
        alert: {
          id: d.id,
          zone_id: d.zone_id,
          level: d.level,
          previous_level: d.previous_level,
          message: d.message,
          reasons: d.reasons || [],
          status: "active",
          delivery_channels: d.delivery_channels || [],
          acknowledged_by: "",
          acknowledged_at: null,
          resolved_at: null,
          created_at: new Date().toISOString(),
        },
      });
    } else if (msg.type === "alert_updated") {
      api.getAlerts().then((alerts) => dispatch({ type: "ALERTS_SET", alerts }));
    }
  }, []);

  const { connected } = useLiveSocket(handleWSMessage);
  useEffect(() => dispatch({ type: "SET_WS", connected }), [connected]);

  const setRole = useCallback((role: UserRole) => dispatch({ type: "SET_ROLE", role }), []);

  const runScenario = useCallback(async (scenario: ScenarioName, zoneId?: string) => {
    const sim = await api.startSimulation(scenario, zoneId);
    dispatch({ type: "SET_SIM", sim });
  }, []);

  const stopSim = useCallback(async () => {
    const sim = await api.stopSimulation();
    dispatch({ type: "SET_SIM", sim });
  }, []);

  const resetSim = useCallback(async () => {
    const sim = await api.resetSimulation();
    dispatch({ type: "SET_SIM", sim });
    await refresh();
  }, [refresh]);

  const ackAlert = useCallback(async (id: string) => {
    await api.acknowledgeAlert(id, "demo-operator");
    const alerts = await api.getAlerts();
    dispatch({ type: "ALERTS_SET", alerts });
  }, []);

  const resolveAlertById = useCallback(async (id: string) => {
    await api.resolveAlert(id, "demo-operator");
    const alerts = await api.getAlerts();
    dispatch({ type: "ALERTS_SET", alerts });
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({ ...state, refresh, setRole, runScenario, stopSim, resetSim, ackAlert, resolveAlertById }),
    [state, refresh, setRole, runScenario, stopSim, resetSim, ackAlert, resolveAlertById]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
