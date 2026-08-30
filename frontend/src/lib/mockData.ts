export type RudraLevel = 'safe' | 'watch' | 'warn' | 'evacuate';

export interface WeatherReading {
  time: string;
  date?: string;
  temp: number;
  rainProb: number;
}

export interface RainfallTrend {
  window: '1h' | '3h' | '24h';
  amount: number;
  unit: 'mm';
  intensity: 'light' | 'moderate' | 'heavy' | 'extreme';
}

export interface GroundStatus {
  saturation: number;
  tilt: number;
  pFailure: number;
  status: 'stable' | 'monitoring' | 'unstable' | 'critical';
}

export interface AttributionData {
  rain: number;
  ground: number;
  vibration: number;
}

export interface EvacuationPoint {
  name: string;
  type: 'school' | 'community_center' | 'temple';
  distance: number;
  direction: string;
  capacity: number;
}

export interface ZoneData {
  id: string;
  name: string;
  district: string;
  coordinates: [number, number];
  shaktiScore: number;
  rudraLevel: RudraLevel;
  confidence: number;
  rainfall: RainfallTrend;
  ground: GroundStatus;
  vibration: {
    anomalyScore: number;
    classification: string;
  };
  lastUpdate: string;
  attribution: AttributionData;
  timeToSafety?: string;
  evacuationPoints: EvacuationPoint[];
  nearestEvacuation: EvacuationPoint;
  drishtiReasoning: string;
}

export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  forecast: WeatherReading[];
}

export interface DashboardData {
  weather: WeatherData;
  zones: ZoneData[];
  selectedZone: string;
  isAlert?: boolean;
  isDemo?: boolean;
}

export const mockDashboardData: DashboardData = {
  weather: {
    location: 'Dhading District, Nepal',
    temperature: 14,
    condition: 'Partly Cloudy',
    humidity: 78,
    windSpeed: 12,
    forecast: [
      { date: '2024-06-15', time: 'Now', temp: 14, rainProb: 10 },
      { date: '2024-06-15', time: '3h', temp: 13, rainProb: 25 },
      { date: '2024-06-15', time: '6h', temp: 11, rainProb: 45 },
      { date: '2024-06-15', time: '9h', temp: 9, rainProb: 70 },
      { date: '2024-06-15', time: '12h', temp: 7, rainProb: 85 },
      { date: '2024-06-16', time: '15h', temp: 6, rainProb: 60 },
    ],
  },
  zones: [
    {
      id: 'zone-1',
      name: 'Zone 3',
      district: 'Dhading District',
      coordinates: [27.95, 84.83],
      shaktiScore: 0,
      rudraLevel: 'safe',
      confidence: 0.92,
      rainfall: { window: '1h', amount: 2.1, unit: 'mm', intensity: 'light' },
      ground: { saturation: 28, tilt: 12.3, pFailure: 0.12, status: 'stable' },
      vibration: { anomalyScore: 0.05, classification: 'Quiet' },
      lastUpdate: 'Just now',
      attribution: { rain: 10, ground: 15, vibration: 5 },
      evacuationPoints: [
        { name: 'Ward 4 School', type: 'school', distance: 1.2, direction: 'NE', capacity: 250 },
        { name: 'Community Center', type: 'community_center', distance: 3.4, direction: 'SE', capacity: 150 },
      ],
      nearestEvacuation: { name: 'Ward 4 School', type: 'school', distance: 1.2, direction: 'NE', capacity: 250 },
      drishtiReasoning: 'All three signals nominal. Rainfall in 1h window is 2.1mm (light). Soil saturation stable at 28%. No vibration anomalies detected. Shakti Score remains at 0 (Safe).',
    },
  ],
  selectedZone: 'zone-1',
  isAlert: false,
  isDemo: true,
};

export const mockAlertData: DashboardData = {
  weather: {
    location: 'Dhading District, Nepal',
    temperature: 12,
    condition: 'Heavy Rain',
    humidity: 94,
    windSpeed: 28,
    forecast: [
      { date: '2024-06-15', time: 'Now', temp: 12, rainProb: 95 },
      { date: '2024-06-15', time: '3h', temp: 11, rainProb: 88 },
      { date: '2024-06-15', time: '6h', temp: 10, rainProb: 75 },
      { date: '2024-06-15', time: '9h', temp: 9, rainProb: 60 },
      { date: '2024-06-15', time: '12h', temp: 8, rainProb: 45 },
      { date: '2024-06-16', time: '15h', temp: 7, rainProb: 30 },
    ],
  },
  zones: [
    {
      id: 'zone-3',
      name: 'Zone 3',
      district: 'Dhading District',
      coordinates: [27.95, 84.83],
      shaktiScore: 82,
      rudraLevel: 'evacuate',
      confidence: 0.94,
      rainfall: { window: '1h', amount: 142, unit: 'mm', intensity: 'extreme' },
      ground: { saturation: 67, tilt: 15.1, pFailure: 0.87, status: 'critical' },
      vibration: { anomalyScore: 0.91, classification: 'Debris Flow' },
      lastUpdate: '2 min ago',
      attribution: { rain: 35, ground: 42, vibration: 23 },
      timeToSafety: '~12 min',
      evacuationPoints: [
        { name: 'Ward 4 School', type: 'school', distance: 1.2, direction: 'NE', capacity: 250 },
        { name: 'Community Center', type: 'community_center', distance: 3.4, direction: 'SE', capacity: 150 },
        { name: 'Temple Ridge', type: 'temple', distance: 5.2, direction: 'NW', capacity: 300 },
      ],
      nearestEvacuation: { name: 'Ward 4 School', type: 'school', distance: 1.2, direction: 'NE', capacity: 250 },
      drishtiReasoning: 'Varuna Watch detected extreme rainfall (142mm in 1h). Bhumi Sense measures slope saturation at 67% approaching failure (P(fail): 0.87). Kampan Alert detected debris-flow vibration signature (anomaly: 0.91). Fused posterior: 0.94 — Evacuate level triggered 4+ hours before predicted flood arrival.',
    },
  ],
  selectedZone: 'zone-3',
  isAlert: true,
  isDemo: true,
};
