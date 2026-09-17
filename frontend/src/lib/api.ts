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
  district?: string;
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

export interface BackendHistoricalEvent {
  id: string;
  zone_id: string;
  event_type: string;
  event_date: string;
  severity: string;
  fatalities: number;
  description: string;
}

interface OWCurrent {
  main: { temp: number; humidity: number };
  wind: { speed: number };
  weather: [{ description: string; main: string }];
}

interface OWForecast {
  list: Array<{
    dt: number;
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

function extractDistrict(description: string, name: string): string {
  const m = description.match(/([A-Za-z\s]+(?:District|Nepal|India)[A-Za-z\s]*)/i);
  if (m) return m[1].trim();
  return description.includes('district') ? description.split('district')[0].trim() + ' District' : name;
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
    district: zone.district || extractDistrict(zone.description, zone.name),
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

export async function fetchLatestSensors(): Promise<BackendSensor[]> {
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

const OPENWEATHER_ENDPOINT = 'https://api.openweathermap.org/data/2.5';
const OPEN_METEO_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';

// Cache weather responses for 5 minutes (300,000 ms) to avoid redundant requests
const weatherCache = new Map<string, { data: WeatherData; timestamp: number }>();
const WEATHER_CACHE_TTL_MS = 5 * 60 * 1000;

function getWmoWeatherDescription(code: number): string {
  switch (code) {
    case 0: return 'Clear Sky';
    case 1: return 'Mainly Clear';
    case 2: return 'Partly Cloudy';
    case 3: return 'Overcast';
    case 45: return 'Foggy';
    case 48: return 'Depositing Rime Fog';
    case 51: return 'Light Drizzle';
    case 53: return 'Moderate Drizzle';
    case 55: return 'Dense Drizzle';
    case 56: return 'Light Freezing Drizzle';
    case 57: return 'Dense Freezing Drizzle';
    case 61: return 'Slight Rain';
    case 63: return 'Moderate Rain';
    case 65: return 'Heavy Rain';
    case 66: return 'Light Freezing Rain';
    case 67: return 'Heavy Freezing Rain';
    case 71: return 'Slight Snow Fall';
    case 73: return 'Moderate Snow Fall';
    case 75: return 'Heavy Snow Fall';
    case 77: return 'Snow Grains';
    case 80: return 'Slight Rain Showers';
    case 81: return 'Moderate Rain Showers';
    case 82: return 'Violent Rain Showers';
    case 85: return 'Slight Snow Showers';
    case 86: return 'Heavy Snow Showers';
    case 95: return 'Thunderstorm';
    case 96: return 'Thunderstorm with Slight Hail';
    case 99: return 'Thunderstorm with Heavy Hail';
    default: return 'Clear';
  }
}

async function fetchFromOpenMeteo(lat: number, lon: number, locationName: string): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation',
    hourly: 'temperature_2m,precipitation_probability,weather_code',
    forecast_hours: '15',
  });

  const resp = await fetch(`${OPEN_METEO_ENDPOINT}?${params}`);
  if (!resp.ok) throw new Error(`Open-Meteo error: ${resp.status}`);
  const data = await resp.json();

  const current = data.current || {};
  const hourly = data.hourly || { time: [], temperature_2m: [], precipitation_probability: [] };

  const forecast = (hourly.time || [])
    .slice(0, 5)
    .map((timeStr: string, idx: number) => {
      const dateObj = new Date(timeStr);
      return {
        timestamp: Math.floor(dateObj.getTime() / 1000),
        time: idx === 0 ? 'Now' : `${idx * 3}h`,
        date: dateObj.toISOString().split('T')[0],
        temp: Math.round(hourly.temperature_2m?.[idx * 3] ?? current.temperature_2m ?? 15),
        rainProb: Math.round(hourly.precipitation_probability?.[idx * 3] ?? 0),
      };
    });

  return {
    location: locationName ? `${locationName} District` : 'Himalayan Region',
    temperature: Math.round(current.temperature_2m ?? 14),
    condition: getWmoWeatherDescription(current.weather_code ?? 0),
    humidity: Math.round(current.relative_humidity_2m ?? 75),
    windSpeed: Math.round(current.wind_speed_10m ?? 10),
    forecast,
  };
}

async function fetchFromOpenWeather(lat: number, lon: number, locationName: string): Promise<WeatherData> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    units: 'metric',
    appid: OPENWEATHER_KEY,
  });

  const currentResp = await fetch(`${OPENWEATHER_ENDPOINT}/weather?${params}`);
  if (!currentResp.ok) throw new Error(`OpenWeather error: ${currentResp.status}`);
  const current = (await currentResp.json()) as OWCurrent;

  let forecastList: WeatherData['forecast'] = [];
  try {
    const forecastResp = await fetch(`${OPENWEATHER_ENDPOINT}/forecast?${params}`);
    if (forecastResp.ok) {
      const fdata = (await forecastResp.json()) as OWForecast;
      forecastList = (fdata.list || []).slice(0, 5).map((item, idx) => ({
        timestamp: item.dt,
        time: idx === 0 ? 'Now' : new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        temp: Math.round(item.main.temp),
        rainProb: Math.round((item.pop || 0) * 100),
      }));
    }
  } catch {
    // Non-fatal, fallback to current
  }

  return {
    location: locationName ? `${locationName} District` : 'Himalayan Region',
    temperature: Math.round(current.main.temp),
    condition: current.weather?.[0]?.description ? current.weather[0].description.replace(/\b\w/g, (c) => c.toUpperCase()) : 'Clear',
    humidity: current.main.humidity,
    windSpeed: Math.round(current.wind.speed * 3.6),
    forecast: forecastList,
  };
}

export async function fetchWeatherForCoordinates(lat: number, lon: number, locationName: string = ''): Promise<WeatherData> {
  const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  const cached = weatherCache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < WEATHER_CACHE_TTL_MS) {
    return cached.data;
  }

  let result: WeatherData;
  if (OPENWEATHER_KEY) {
    try {
      result = await fetchFromOpenWeather(lat, lon, locationName);
      weatherCache.set(cacheKey, { data: result, timestamp: now });
      return result;
    } catch {
      // Fall through to Open-Meteo on failure
    }
  }

  try {
    result = await fetchFromOpenMeteo(lat, lon, locationName);
    weatherCache.set(cacheKey, { data: result, timestamp: now });
    return result;
  } catch {
    // Ultimate fallback if both network queries fail
    return {
      location: locationName ? `${locationName} District` : 'Himalayan Region',
      temperature: 15,
      condition: 'Partly Cloudy',
      humidity: 70,
      windSpeed: 10,
      forecast: [
        { time: 'Now', temp: 15, rainProb: 10 },
        { time: '3h', temp: 14, rainProb: 20 },
        { time: '6h', temp: 12, rainProb: 35 },
        { time: '9h', temp: 10, rainProb: 50 },
        { time: '12h', temp: 9, rainProb: 40 },
      ],
    };
  }
}

export async function fetchDashboardData(): Promise<DashboardData> {
  let zonesList: BackendZone[] = [];
  try {
    zonesList = await fetchBackendZones();
  } catch {
    throw new Error('Backend unreachable');
  }

  // Fetch risks, sensors, health, and live weather for ALL settlements concurrently
  const weatherPromises = zonesList.map((z) => fetchWeatherForCoordinates(z.latitude, z.longitude, z.name));

  const [risksResult, sensorsResult, healthResult, ...weatherResults] = await Promise.allSettled([
    fetchBackendRisk(),
    fetchLatestSensors(),
    fetchBackendHealth(),
    ...weatherPromises,
  ]);

  const riskList: BackendRisk[] = risksResult.status === 'fulfilled' ? risksResult.value : [];
  const sensorList: BackendSensor[] = sensorsResult.status === 'fulfilled' ? sensorsResult.value : [];
  const isDemo = healthResult.status === 'fulfilled' && healthResult.value?.demo_mode;

  const riskByZone = new Map(riskList.map((r) => [r.zone_id, r]));
  const sensorByZone = new Map(sensorList.map((s) => [s.zone_id, s]));

  const apiZones: ZoneData[] = zonesList.map((zone, idx) => {
    const risk = riskByZone.get(zone.id);
    const sensor = sensorByZone.get(zone.id);
    const weatherRes = weatherResults[idx];
    const zoneWeather: WeatherData | undefined =
      weatherRes && weatherRes.status === 'fulfilled' ? (weatherRes.value as WeatherData) : undefined;

    if (!risk) {
      return {
        id: zone.id,
        name: zone.name,
        district: zone.district || extractDistrict(zone.description, zone.name),
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
        weather: zoneWeather,
      };
    }

    const builtZone = buildZoneFromBackend(zone, risk, sensor || null);
    builtZone.weather = zoneWeather;
    return builtZone;
  });

  const primaryWeather: WeatherData =
    apiZones[0]?.weather || {
      location: zonesList[0]?.name ? `${zonesList[0].name} District` : 'Himalayan Region',
      temperature: 15,
      condition: 'Partly Cloudy',
      humidity: 75,
      windSpeed: 10,
      forecast: [],
    };

  const selectedZone = apiZones[0]?.id || '';
  const hasAlert = apiZones.some((z) => z.rudraLevel === 'evacuate' || z.rudraLevel === 'warn');

  return {
    weather: primaryWeather,
    zones: apiZones,
    selectedZone,
    isAlert: hasAlert,
    isDemo,
  };
}

// ---------- Simulation Control ----------
// Wires the frontend to the backend's `/api/simulation/*` endpoints
// (see backend/app/routers/simulation.py + simulation_engine.py).
// Lets an operator/judge pick a target zone and deterministically walk it
// through Safe -> Watch -> Warning -> Evacuate ("rapid_escalation"), or
// simulate a dead sensor ("sensor_failure"), without touching real hardware.
export type SimulationScenario = 'normal' | 'heavy_rain' | 'rapid_escalation' | 'sensor_failure';

export interface SimulationStatus {
  running: boolean;
  scenario: SimulationScenario | null;
  target_zone_id: string | null;
  tick_interval_seconds: number;
  ticks_elapsed: number;
  started_at: string | null;
}

export interface RiskAssessment {
  id: string;
  zone_id: string;
  score: number;
  level: 'Safe' | 'Watch' | 'Warning' | 'Evacuate';
  confidence: number;
  reasons: string[];
  recommended_action: string;
  estimated_lead_time_minutes: number;
  data_quality_warning: string;
  created_at: string;
}

export async function fetchZones(): Promise<BackendZone[]> {
  return fetchBackendZones();
}

export async function fetchCurrentRisk(): Promise<RiskAssessment[]> {
  const resp = await fetch(`${API_URL}/api/risk/current`);
  if (!resp.ok) throw new Error(`Backend error: ${resp.status}`);
  return resp.json();
}

export async function fetchAllHistoricalEvents(): Promise<BackendHistoricalEvent[]> {
  const resp = await fetch(`${API_URL}/api/zones/all/historical-events`);
  if (!resp.ok) throw new Error(`Backend error: ${resp.status}`);
  return resp.json();
}

export async function fetchHealth(): Promise<{ status: string; demo_mode: boolean } | null> {
  return fetchBackendHealth();
}

export async function fetchSimulationStatus(): Promise<SimulationStatus> {
  const resp = await fetch(`${API_URL}/api/simulation/status`);
  if (!resp.ok) throw new Error(`Backend error: ${resp.status}`);
  return resp.json();
}

/** Start (or switch) a simulation scenario. For 'rapid_escalation' or
 * 'sensor_failure', pass zoneId to target a single zone — every other
 * zone keeps ticking along at its normal safe baseline. */
export async function runSimulationScenario(
  scenario: SimulationScenario,
  zoneId?: string,
): Promise<SimulationStatus> {
  const resp = await apiFetch(`${API_URL}/api/simulation/scenario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario, zone_id: zoneId ?? null }),
  });
  if (!resp.ok) {
    const detail = await resp.json().catch(() => null);
    throw new Error(detail?.detail || `Backend error: ${resp.status}`);
  }
  return resp.json();
}

export async function stopSimulation(): Promise<SimulationStatus> {
  const resp = await apiFetch(`${API_URL}/api/simulation/stop`, { method: 'POST' });
  if (!resp.ok) throw new Error(`Backend error: ${resp.status}`);
  return resp.json();
}

/** Wipes simulated readings/assessments and reseeds every zone back to its
 * clean baseline — the "put it back to Safe before the judges arrive" button. */
export async function resetSimulation(): Promise<SimulationStatus> {
  const resp = await apiFetch(`${API_URL}/api/simulation/reset`, { method: 'POST' });
  if (!resp.ok) throw new Error(`Backend error: ${resp.status}`);
  return resp.json();
}

export interface ORSRoute {
  coordinates: [number, number][];
  distance: number;
  duration: number;
}

export interface EvacuationRouteResponse {
  zone_id: string;
  zone_name: string;
  shelter: {
    id: string;
    name: string;
    lat: number;
    lng: number;
    capacity: number;
    shelter_type: string;
    is_primary: boolean;
  };
  route_geojson: {
    type: string;
    geometry: {
      type: string;
      coordinates: number[][];
    };
    properties: {
      distance_km: number;
      duration_min: number;
      shelter_name: string;
      shelter_type: string;
      shelter_capacity: number;
      zone_name: string;
      zone_id: string;
    };
  };
  distance_km: number;
  duration_min: number;
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
    const url = `https://api.openrouteservice.org/v2/directions/foot-hiking?api_key=${ORS_KEY}&start=${from[1]},${from[0]}&end=${to[1]},${to[0]}`;

    const resp = await fetch(url);

    if (!resp.ok) {
      throw new Error(`ORS error: ${resp.status}`);
    }

    const data = await resp.json();
    const route = data.routes?.[0];
    if (!route) return null;

    return {
      coordinates: route.geometry?.coordinates as [number, number][] || [],
      distance: route.summary?.distance || 0,
      duration: route.summary?.duration || 0,
    };
  } catch (err) {
    console.warn('ORS routing failed:', err);
    return null;
  }
}

export async function fetchEvacuationRouteFromBackend(zoneId: string): Promise<EvacuationRouteResponse | null> {
  try {
    const resp = await fetch(`${API_URL}/api/zones/${zoneId}/evacuation-route`);
    if (!resp.ok) {
      throw new Error(`Backend error: ${resp.status}`);
    }
    return resp.json();
  } catch (err) {
    console.warn('Backend evacuation route failed:', err);
    return null;
  }
}
