import { useEffect, useRef, useState } from 'react';
import { API_URL } from '@/lib/config';

export interface RiskUpdateEvent {
  zone_id: string;
  score: number;
  level: 'Safe' | 'Watch' | 'Warning' | 'Evacuate';
  previous_level: string;
  confidence: number;
  reasons: string[];
  recommended_action: string;
  estimated_lead_time_minutes: number;
  data_quality_warning: string;
}

export interface SensorReadingEvent {
  zone_id: string;
  rainfall_mm_1h: number;
  rainfall_mm_3h: number;
  soil_moisture_pct: number;
  tilt_degrees: number;
  vibration_g: number;
  is_online: boolean;
  recorded_at: string;
}

export interface AlertEvent {
  id: string;
  zone_id: string;
  level: string;
  previous_level: string;
  message: string;
  delivery_channels: string[];
}

export interface LiveFeedState {
  connected: boolean;
  latestRiskByZone: Record<string, RiskUpdateEvent>;
  latestSensorByZone: Record<string, SensorReadingEvent>;
  recentEvents: Array<{ type: 'risk_update' | 'alert'; at: number; data: RiskUpdateEvent | AlertEvent }>;
}

const WS_URL = API_URL.replace(/^http/, 'ws') + '/ws/live';
const MAX_TICKER_EVENTS = 20;

/** One websocket per mounted consumer; callers can layer its updates over initial API data. */
export function useLiveFeed(): LiveFeedState {
  const [state, setState] = useState<LiveFeedState>({ connected: false, latestRiskByZone: {}, latestSensorByZone: {}, recentEvents: [] });
  const retryDelay = useRef(1000);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const connect = () => {
      if (cancelled) return;
      ws = new WebSocket(WS_URL);
      ws.onopen = () => { retryDelay.current = 1000; setState((s) => ({ ...s, connected: true })); };
      ws.onmessage = (event) => {
        try {
          const { type, data } = JSON.parse(event.data);
          setState((s) => {
            if (type === 'risk_update') return { ...s, latestRiskByZone: { ...s.latestRiskByZone, [data.zone_id]: data }, recentEvents: [{ type, at: Date.now(), data }, ...s.recentEvents].slice(0, MAX_TICKER_EVENTS) };
            if (type === 'sensor_reading') return { ...s, latestSensorByZone: { ...s.latestSensorByZone, [data.zone_id]: data } };
            if (type === 'alert') return { ...s, recentEvents: [{ type, at: Date.now(), data }, ...s.recentEvents].slice(0, MAX_TICKER_EVENTS) };
            return s;
          });
        } catch { /* Ignore malformed frames. */ }
      };
      ws.onclose = () => {
        if (cancelled) return;
        setState((s) => ({ ...s, connected: false }));
        retryTimer = setTimeout(connect, retryDelay.current);
        retryDelay.current = Math.min(retryDelay.current * 2, 30000);
      };
      ws.onerror = () => ws?.close();
    };
    connect();
    return () => { cancelled = true; if (retryTimer) clearTimeout(retryTimer); ws?.close(); };
  }, []);
  return state;
}
