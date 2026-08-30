import { DashboardData, ZoneData, WeatherData, RudraLevel, mockDashboardData, mockAlertData } from '@/lib/mockData';
import { API_URL, TOKEN_STORAGE_KEY } from '@/lib/config';

const OPENWEATHER_KEY = import.meta.env.VITE_OPENWEATHER_KEY || '';
const ORS_KEY = import.meta.env.VITE_ORS_KEY || '';

/** Headers carrying the user's JWT (if logged in). Attach to any request
 * that needs identity, e.g. acknowledging alerts or saving home_zone_id. */
export function authHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** fetch wrapper that automatically attaches the auth header on top of any
 * per-call headers. Use for endpoints that need the user's session. */
export async function apiFetch(
  input: string | URL,
  init?: RequestInit,
): Promise<Response> {
  const mergedHeaders: Record<string, string> = {
    ...authHeaders(),
    ...(init?.headers as Record<string, string> | undefined),
  };
  return fetch(input, { ...init, headers: mergedHeaders });
}

export interface BackendZone {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  population: number;
  elevation_m: number;
  slope_degrees: number;
  terrain_risk: number;
  geojson_polygon: { type: string; coordinates: number[][][] };
  safe_location: string;
  evacuation_route: string;
  is_fictional: boolean;
}

export interface BackendRisk {
  zone_id: string;
  score: number;
  level: 'Safe' | 'Watch' | 'Warning' | 'Evacuate';
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
  model_version: string;
  created_at: string;
}

export interface BackendSensor {
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

interface OWCurrent {
  main: { temp: number; humidity: number };
  wind: { speed: number };
  weather: [{ description: string; main: string }];
}

interface OWForecast {
  list: Array<{
    dt_txt: string;
    main: { temp: number };
    pop: number;
  }>;
}

function levelToRudra(level: string): RudraLevel {
  const map: Record<string, RudraLevel> = {
    Safe: 'safe',
    Watch: 'watch',
    Warning: 'warn',
    Evacuate: 'evacuate',
  };
  return map[level] || 'safe';
}

function classifyRainfall(mm: number): 'light' | 'moderate' | 'heavy' | 'extreme' {
  if (mm < 2.5) return 'light';
  if (mm < 10) return 'moderate';
  if (mm < 50) return 'heavy';
  return 'extreme';
}

function classifyGround(saturation: number): 'stable' | 'monitoring' | 'unstable' | 'critical' {
  if (saturation < 40) return 'stable';
  if (saturation < 70) return 'monitoring';
  if (saturation < 85) return 'unstable';
  return 'critical';
}

function classifyVibration(g: number): string {
  if (g < 0.5) return 'Quiet';
  if (g < 1.5) return 'Tectonic';
  if (g < 2.5) return 'Debris Flow';
  return 'Critical Shaking';
}

function parseEvacuationRoute(route: string): { distance: number; direction: string } {
  const distMatch = route.match(/(\d+(?:\.\d+)?)\s*(m|km)/i);
  const dirMatch = route.match(/(NE|NW|SE|SW|N|S|E|W|north|south|east|west|uphill|downhill)/i);
  return {
    distance: distMatch ? (distMatch[2].toLowerCase() === 'km' ? parseFloat(distMatch[1]) : parseFloat(distMatch[1]) / 1000) : 0,
    direction: dirMatch ? dirMatch[1].toUpperCase() : 'NE',
  };
}

function buildZoneFromBackend(
  zone: BackendZone,
  risk: BackendRisk,
  reading: BackendSensor | null,
): ZoneData {
  const rudraLevel = levelToRudra(risk.level);
  const shaktiScore = Math.round(risk.score);
  const saturation = reading ? reading.soil_moisture_pct : 0;
  const tilt = reading ? reading.tilt_degrees : 0;
  const vibrationG = reading ? reading.vibration_g : 0;
  const vibrationAnomaly = Math.min(vibrationG / 2.5, 1);

  const coords: [number, number] = [zone.latitude, zone.longitude];
  const nearestEvac = {
    name: zone.safe_location.replace(/ \(.*\)$/, '').replace(/\.+$/, ''),
    type: 'community_center' as 'school' | 'community_center' | 'temple',
    distance: parseEvacuationRoute(zone.evacuation_route).distance,
    direction: parseEvacuationRoute(zone.evacuation_route).direction,
    capacity: zone.population,
  };

  const rainfallIntensity = reading ? classifyRainfall(reading.rainfall_mm_1h) : 'light';

  const reasons = risk.reasons.length > 0 ? risk.reasons.join('. ') : 'All monitored indicators are within normal ranges.';

  const pFailure = Math.min(risk.soil_risk / 100, 1);
  const tiltRiskPercent = Math.min(risk.tilt_risk / 100, 1);

  return {
    id: zone.id,
    name: zone.name,
    district: zone.description.includes('village') ? 'Fictional District' : 'Fictional District',
    coordinates: coords,
    shaktiScore,
    rudraLevel,
    confidence: risk.confidence,
    rainfall: {
      window: '1h',
      amount: reading ? reading.rainfall_mm_1h : 0,
      unit: 'mm',
      intensity: rainfallIntensity,
    },
    ground: {
      saturation: Math.round(saturation),
      tilt: Math.round(tilt * 10) / 10,
      pFailure: Math.round(pFailure * 100) / 100,
      status: classifyGround(saturation),
    },
    vibration: {
      anomalyScore: Math.round(vibrationAnomaly * 100) / 100,
      classification: reading ? classifyVibration(vibrationG) : 'Quiet',
    },
    lastUpdate: reading ? new Date(reading.recorded_at).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }) : 'N/A',
    attribution: {
      rain: Math.round(risk.rainfall_risk),
      ground: Math.round(risk.soil_risk),
      vibration: Math.round(risk.vibration_risk),
    },
    timeToSafety: risk.estimated_lead_time_minutes > 0
      ? `~${risk.estimated_lead_time_minutes} min`
      : 'N/A',
    evacuationPoints: [nearestEvac],
    nearestEvacuation: nearestEvac,
    drishtiReasoning: reasons,
  };
}

function buildWeatherFromBackend(zones: BackendZone[], backendWeather?: any): WeatherData {
  const primaryZone = zones[0];
  let location = primaryZone?.name || 'Unknown Location';
  if (primaryZone) {
    location = `${primaryZone.name} District`;
  }

  return {
    location,
    temperature: backendWeather?.temp || 14,
    condition: backendWeather?.description || 'Partly Cloudy',
    humidity: backendWeather?.humidity || 78,
    windSpeed: backendWeather?.wind || 12,
    forecast: [],
  };
}

async function fetchBackendZones(): Promise<BackendZone[]> {
  const resp = await fetch(`${API_URL}/api/zones`);
  if (!resp.ok) throw new Error(`Backend error: ${resp.status}`);
  return resp.json();
}

async function fetchBackendRisk(): Promise<BackendRisk[]> {
  const resp = await fetch(`${API_URL}/api/risk/current`);
  if (!resp.ok) throw new Error(`Backend error: ${resp.status}`);
  return resp.json();
}

async function fetchBackendSensors(): Promise<BackendSensor[]> {
  const resp = await fetch(`${API_URL}/api/sensors/latest`);
  if (!resp.ok) throw new Error(`Backend error: ${resp.status}`);
  return resp.json();
}

async function fetchBackendHealth(): Promise<{ status: string; demo_mode: boolean } | null> {
  try {
    const resp = await fetch(`${API_URL}/api/health`);
    if (!resp.ok) return null;
    return resp.json();
  } catch {
    return null;
  }
}

async function fetchWeather(lat: number, lon: number): Promise<OWCurrent & { forecast: OWForecast }> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    units: 'metric',
    appid: OPENWEATHER_KEY,
  });

  const currentResp = await fetch(`${OPENWEATHER_ENDPOINT}/weather?${params}`);
  if (!currentResp.ok) throw new Error(`Weather API error: ${currentResp.status}`);
  const current = await currentResp.json() as OWCurrent;

  const forecastResp = await fetch(`${OPENWEATHER_ENDPOINT}/forecast?${params}`);
  let forecast: OWForecast = { list: [] };
  if (forecastResp.ok) {
    const fdata = await forecastResp.json() as OWForecast;
    forecast = fdata;
  }

  return { ...current, forecast };
}

const OPENWEATHER_ENDPOINT = 'https://api.openweathermap.org/data/2.5';

function mapOpenWeather(ow: OWCurrent & { forecast: OWForecast }): {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  forecast: Array<{ time: string; temp: number; rainProb: number }>;
} {
  const forecast = ow.forecast.list
    .filter((_, i) => i % 2 === 0)
    .slice(0, 6)
    .map((item) => ({
      date: item.dt_txt.split(' ')[0],
      time: item.dt_txt.split(' ')[1].slice(0, 5),
      temp: Math.round(item.main.temp),
      rainProb: Math.round((item.pop || 0) * 100),
    }));

  return {
    temperature: Math.round(ow.main.temp),
    condition: ow.weather[0].description,
    humidity: ow.main.humidity,
    windSpeed: Math.round(ow.wind.speed * 3.6),
    forecast,
  };
}

export async function fetchDashboardData(): Promise<DashboardData> {
  try {
    const [zones, risks, sensors, health] = await Promise.allSettled([
      fetchBackendZones(),
      fetchBackendRisk(),
      fetchBackendSensors(),
      fetchBackendHealth(),
    ]);

    if (zones.status === 'rejected' || risks.status === 'rejected') {
      throw new Error('Backend unreachable');
    }

    const zonesList: BackendZone[] = zones.value;
    const riskList: BackendRisk[] = risks.status === 'fulfilled' ? risks.value : [];
    const sensorList: BackendSensor[] = sensors.status === 'fulfilled' ? sensors.value : [];
    const isDemo = health.status === 'fulfilled' && health.value?.demo_mode;

    const riskByZone = new Map(riskList.map((r) => [r.zone_id, r]));
    const sensorByZone = new Map(sensorList.map((s) => [s.zone_id, s]));

    const apiZones: ZoneData[] = zonesList.map((zone) => {
      const risk = riskByZone.get(zone.id);
      const sensor = sensorByZone.get(zone.id);

      if (!risk) {
        return {
          id: zone.id,
          name: zone.name,
          district: 'Fictional District',
          coordinates: [zone.latitude, zone.longitude] as [number, number],
          shaktiScore: 0,
          rudraLevel: 'safe' as RudraLevel,
          confidence: 0.9,
          rainfall: { window: '1h' as const, amount: 0, unit: 'mm' as const, intensity: 'light' as const },
          ground: { saturation: 30, tilt: 2, pFailure: 0.1, status: 'stable' as const },
          vibration: { anomalyScore: 0.05, classification: 'Quiet' },
          lastUpdate: 'No data',
          attribution: { rain: 0, ground: 0, vibration: 0 },
          timeToSafety: 'N/A',
          evacuationPoints: [],
          nearestEvacuation: {
            name: zone.safe_location,
            type: 'community_center' as const,
            distance: 1.2,
            direction: 'NE',
            capacity: zone.population,
          },
          drishtiReasoning: 'No sensor data available yet.',
        };
      }

      return buildZoneFromBackend(zone, risk, sensor || null);
    });

    let weather: WeatherData = {
      location: zonesList[0]?.name || 'Unknown Location',
      temperature: 14,
      condition: 'Partly Cloudy',
      humidity: 78,
      windSpeed: 12,
      forecast: [],
    };

    if (OPENWEATHER_KEY && zonesList.length > 0) {
      try {
        const primaryZone = zonesList[0];
        const ow = await fetchWeather(primaryZone.latitude, primaryZone.longitude);
        const mapped = mapOpenWeather(ow);
        weather = {
          location: `${primaryZone.name} District`,
          temperature: mapped.temperature,
          condition: mapped.condition,
          humidity: mapped.humidity,
          windSpeed: mapped.windSpeed,
          forecast: mapped.forecast,
        };
      } catch (weatherErr) {
        console.warn('Weather API fetch failed, falling back:', weatherErr);
      }
    }

    const selectedZone = apiZones[0]?.id || '';
    const hasAlert = apiZones.some((z) => z.rudraLevel === 'evacuate' || z.rudraLevel === 'warn');

    return {
      weather,
      zones: apiZones,
      selectedZone,
      isAlert: hasAlert,
      isDemo,
    };
  } catch (err) {
    console.warn('Backend fetch failed, using demo data:', err);
    throw err;
  }
}

export interface ORSRoute {
  coordinates: [number, number][];
  distance: number;
  duration: number;
}

export async function fetchEvacuationRoute(
  from: [number, number],
  to: [number, number],
): Promise<ORSRoute | null> {
  if (!ORS_KEY) {
    console.warn('ORS key not configured');
    return null;
  }

  try {
    const resp = await fetch(
      'https://api.openrouteservice.org/v2/directions/foot-hiking/geo_json',
      {
        method: 'POST',
        headers: {
          'Authorization': ORS_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coordinates: [
            [from[1], from[0]],
            [to[1], to[0]],
          ],
        }),
      }
    );

    if (!resp.ok) {
      throw new Error(`ORS error: ${resp.status}`);
    }

    const data = await resp.json();
    const route = data.features?.[0];
    if (!route) return null;

    return {
      coordinates: route.geometry.coordinates as [number, number][],
      distance: route.properties.summary?.distance || 0,
      duration: route.properties.summary?.duration || 0,
    };
  } catch (err) {
    console.warn('ORS routing failed:', err);
    return null;
  }
}
