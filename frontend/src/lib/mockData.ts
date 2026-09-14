export type RudraLevel = 'safe' | 'watch' | 'warn' | 'evacuate';

export interface WeatherReading {
  timestamp?: number;
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
    location: 'Chamoli District, Uttarakhand',
    temperature: 15,
    condition: 'Partly Cloudy',
    humidity: 68,
    windSpeed: 10,
    forecast: [
      { date: '2026-09-14', time: 'Now', temp: 15, rainProb: 15 },
      { date: '2026-09-14', time: '3h', temp: 14, rainProb: 20 },
      { date: '2026-09-14', time: '6h', temp: 12, rainProb: 35 },
      { date: '2026-09-14', time: '9h', temp: 11, rainProb: 50 },
      { date: '2026-09-14', time: '12h', temp: 9, rainProb: 65 },
      { date: '2026-09-15', time: '15h', temp: 8, rainProb: 40 },
    ],
  },
  zones: [
    {
      id: 'chamoli_raini',
      name: 'Raini',
      district: 'Chamoli',
      coordinates: [30.4880, 79.7040],
      shaktiScore: 0,
      rudraLevel: 'safe',
      confidence: 0.92,
      rainfall: { window: '1h', amount: 2.1, unit: 'mm', intensity: 'light' },
      ground: { saturation: 32, tilt: 1.2, pFailure: 0.08, status: 'stable' },
      vibration: { anomalyScore: 0.05, classification: 'Quiet' },
      lastUpdate: 'Just now',
      attribution: { rain: 10, ground: 15, vibration: 5 },
      evacuationPoints: [
        { name: 'Raini Chak Lata Safe Ground', type: 'community_center', distance: 0.8, direction: 'NE', capacity: 300 },
        { name: 'Lata Village Community Hall', type: 'school', distance: 1.4, direction: 'E', capacity: 200 },
      ],
      nearestEvacuation: { name: 'Raini Chak Lata Safe Ground', type: 'community_center', distance: 0.8, direction: 'NE', capacity: 300 },
      drishtiReasoning: 'All telemetry channels nominal in Rishiganga basin. Rainfall in 1h window is 2.1mm (light). Slope stability stable at 32% saturation. Shakti Score remains 0 (Safe).',
    },
    {
      id: 'rudraprayag_kedarnath',
      name: 'Kedarnath',
      district: 'Rudraprayag',
      coordinates: [30.7352, 79.0669],
      shaktiScore: 12,
      rudraLevel: 'safe',
      confidence: 0.90,
      rainfall: { window: '1h', amount: 3.4, unit: 'mm', intensity: 'light' },
      ground: { saturation: 38, tilt: 1.5, pFailure: 0.12, status: 'stable' },
      vibration: { anomalyScore: 0.08, classification: 'Quiet' },
      lastUpdate: '1 min ago',
      attribution: { rain: 12, ground: 18, vibration: 6 },
      evacuationPoints: [
        { name: 'Kedarnath Safety Wall High Deck', type: 'temple', distance: 0.4, direction: 'N', capacity: 500 },
        { name: 'Kedarnath GMVN Safe Shelter', type: 'community_center', distance: 0.6, direction: 'NW', capacity: 350 },
      ],
      nearestEvacuation: { name: 'Kedarnath Safety Wall High Deck', type: 'temple', distance: 0.4, direction: 'N', capacity: 500 },
      drishtiReasoning: 'Mandakini headwaters telemetry normal. Rainfall 3.4mm/h with moderate runoff. Moraine lake rim sensors stable.',
    },
    {
      id: 'uttarkashi_dharali',
      name: 'Dharali',
      district: 'Uttarkashi',
      coordinates: [31.0340, 78.7840],
      shaktiScore: 5,
      rudraLevel: 'safe',
      confidence: 0.91,
      rainfall: { window: '1h', amount: 1.8, unit: 'mm', intensity: 'light' },
      ground: { saturation: 29, tilt: 0.9, pFailure: 0.05, status: 'stable' },
      vibration: { anomalyScore: 0.04, classification: 'Quiet' },
      lastUpdate: '3 min ago',
      attribution: { rain: 8, ground: 12, vibration: 4 },
      evacuationPoints: [
        { name: 'Dharali Orchard Safe Shelter', type: 'community_center', distance: 0.7, direction: 'N', capacity: 300 },
      ],
      nearestEvacuation: { name: 'Dharali Orchard Safe Shelter', type: 'community_center', distance: 0.7, direction: 'N', capacity: 300 },
      drishtiReasoning: 'Bhagirathi corridor nominal. Stream gauge at Kheer Ganga indicates baseline flow.',
    },
    {
      id: 'dehradun_maldevta',
      name: 'Maldevta',
      district: 'Dehradun',
      coordinates: [30.3150, 78.1250],
      shaktiScore: 8,
      rudraLevel: 'safe',
      confidence: 0.89,
      rainfall: { window: '1h', amount: 4.2, unit: 'mm', intensity: 'moderate' },
      ground: { saturation: 34, tilt: 1.1, pFailure: 0.09, status: 'stable' },
      vibration: { anomalyScore: 0.06, classification: 'Quiet' },
      lastUpdate: 'Just now',
      attribution: { rain: 14, ground: 10, vibration: 5 },
      evacuationPoints: [
        { name: 'Maldevta Kempty Ridge Relief Center', type: 'school', distance: 1.1, direction: 'NW', capacity: 400 },
      ],
      nearestEvacuation: { name: 'Maldevta Kempty Ridge Relief Center', type: 'school', distance: 1.1, direction: 'NW', capacity: 400 },
      drishtiReasoning: 'Song river catchment baseline clear. Surface runoff within safe carrying capacity.',
    },
  ],
  selectedZone: 'chamoli_raini',
  isAlert: false,
  isDemo: true,
};

export const mockAlertData: DashboardData = {
  weather: {
    location: 'Chamoli District, Uttarakhand',
    temperature: 11,
    condition: 'Torrential Rain & Cloudburst',
    humidity: 96,
    windSpeed: 32,
    forecast: [
      { date: '2026-09-14', time: 'Now', temp: 11, rainProb: 98 },
      { date: '2026-09-14', time: '3h', temp: 10, rainProb: 92 },
      { date: '2026-09-14', time: '6h', temp: 9, rainProb: 80 },
      { date: '2026-09-14', time: '9h', temp: 8, rainProb: 65 },
      { date: '2026-09-14', time: '12h', temp: 7, rainProb: 45 },
      { date: '2026-09-15', time: '15h', temp: 7, rainProb: 30 },
    ],
  },
  zones: [
    {
      id: 'chamoli_raini',
      name: 'Raini',
      district: 'Chamoli',
      coordinates: [30.4880, 79.7040],
      shaktiScore: 88,
      rudraLevel: 'evacuate',
      confidence: 0.95,
      rainfall: { window: '1h', amount: 138, unit: 'mm', intensity: 'extreme' },
      ground: { saturation: 72, tilt: 6.8, pFailure: 0.89, status: 'critical' },
      vibration: { anomalyScore: 0.93, classification: 'Debris Flow' },
      lastUpdate: 'Just now',
      attribution: { rain: 38, ground: 40, vibration: 22 },
      timeToSafety: '~15 min',
      evacuationPoints: [
        { name: 'Raini Chak Lata Safe Ground', type: 'community_center', distance: 0.8, direction: 'NE', capacity: 300 },
        { name: 'Lata Village Community Hall', type: 'school', distance: 1.4, direction: 'E', capacity: 200 },
      ],
      nearestEvacuation: { name: 'Raini Chak Lata Safe Ground', type: 'community_center', distance: 0.8, direction: 'NE', capacity: 300 },
      drishtiReasoning: 'Varuna Watch detected cloudburst threshold breach (138mm in 1h). Bhumi Sense measures pore saturation at 72% with critical tilt rate (6.8°/hr). Kampan Alert confirmed debris surge signature in upper Rishiganga ravine. Immediate Evacuation ordered.',
    },
  ],
  selectedZone: 'chamoli_raini',
  isAlert: true,
  isDemo: true,
};
