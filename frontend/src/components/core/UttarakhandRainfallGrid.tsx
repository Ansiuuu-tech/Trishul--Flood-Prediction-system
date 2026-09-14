import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '@/components/ui';

const IMD_RAINFALL_URL = 'https://mausam.imd.gov.in/responsive/rainfallinformation_swd.php';
const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

export const uttarakhandDistricts = [
  { name: 'Almora', latitude: 29.5971, longitude: 79.6591 },
  { name: 'Bageshwar', latitude: 29.838, longitude: 79.771 },
  { name: 'Chamoli', latitude: 30.404, longitude: 79.318 },
  { name: 'Champawat', latitude: 29.336, longitude: 80.091 },
  { name: 'Dehradun', latitude: 30.3165, longitude: 78.0322 },
  { name: 'Haridwar', latitude: 29.9457, longitude: 78.1642 },
  { name: 'Nainital', latitude: 29.3919, longitude: 79.4542 },
  { name: 'Pauri Garhwal', latitude: 30.146, longitude: 78.78 },
  { name: 'Pithoragarh', latitude: 29.5829, longitude: 80.2182 },
  { name: 'Rudraprayag', latitude: 30.2847, longitude: 78.9811 },
  { name: 'Tehri Garhwal', latitude: 30.378, longitude: 78.4804 },
  { name: 'Udham Singh Nagar', latitude: 29.0, longitude: 79.4 },
  { name: 'Uttarkashi', latitude: 30.7268, longitude: 78.4354 },
];

interface ForecastResponse {
  current: { precipitation: number; weather_code: number };
  daily: { precipitation_sum: number[]; precipitation_probability_max: number[] };
}

interface DistrictRainfall {
  name: string;
  current: number;
  status: string;
  accumulated: number;
  probability: number;
  expected: number;
}

function weatherStatus(code: number) {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Rain showers';
  return 'Thunderstorm';
}

function rainfallTone(amount: number) {
  if (amount >= 50) return 'text-rudra-evacuate';
  if (amount >= 20) return 'text-rudra-warn';
  if (amount > 0) return 'text-rudra-watch';
  return 'text-fern-400';
}

export const districtMapPositions: Record<string, { x: number; y: number }> = {
  Uttarkashi: { x: 228, y: 98 },
  Chamoli: { x: 466, y: 193 },
  Pithoragarh: { x: 668, y: 253 },
  'Tehri Garhwal': { x: 215, y: 210 },
  Rudraprayag: { x: 350, y: 157 },
  Bageshwar: { x: 520, y: 283 },
  Dehradun: { x: 80, y: 203 },
  'Pauri Garhwal': { x: 270, y: 290 },
  Almora: { x: 468, y: 336 },
  Nainital: { x: 465, y: 402 },
  Haridwar: { x: 102, y: 298 },
  Champawat: { x: 584, y: 402 },
  'Udham Singh Nagar': { x: 492, y: 466 },
};

function mapPosition(name: string) {
  return districtMapPositions[name] ?? { x: 400, y: 250 };
}

function MapMarker({ district }: { district: DistrictRainfall }) {
  const position = mapPosition(district.name);
  const currentWidth = Math.max(4, Math.min(38, district.current * 3));
  const accumulatedWidth = Math.max(4, Math.min(38, district.accumulated / 4));

  return (
    <div
      className="absolute z-10 group"
      style={{ left: `calc(${position.x / 8}% + 12px)`, top: `calc(${position.y / 5}% - 15px)` }}
      title={`${district.name}: current ${district.current.toFixed(1)}mm, 3-day ${district.accumulated.toFixed(1)}mm`}
    >
      <span className="block w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal-amber border-2 border-white shadow-lg" />
      <span className="absolute left-2 top-1 hidden group-hover:block whitespace-nowrap rounded bg-forest-950 px-2 py-1 font-mono text-[10px] text-mist-50 shadow-lg">
        Now {district.current.toFixed(1)}mm · 3d {district.accumulated.toFixed(1)}mm
      </span>
      <span className="absolute left-2 top-3 w-10 space-y-1 opacity-80">
        <span className="block h-1 rounded bg-signal-amber" style={{ width: `${currentWidth}px` }} />
        <span className="block h-1 rounded bg-fern-400" style={{ width: `${accumulatedWidth}px` }} />
      </span>
    </div>
  );
}

function UttarakhandRainfallMap({ data }: { data: DistrictRainfall[] }) {
  return (
    <Card className="mb-8 overflow-hidden bg-forest-950 border-moss-600">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
        <div>
          <p className="font-mono text-caption text-fern-400 tracking-widest uppercase mb-2">Live district map</p>
          <h2 className="font-display text-h2 text-mist-50">Uttarakhand rainfall field</h2>
        </div>
        <p className="text-caption text-mist-50/50">District boundaries · live records</p>
      </div>
      <div className="relative overflow-hidden rounded-lg bg-mist-50">
        <img
          src="/ukmap.jpg"
          alt="Uttarakhand district boundaries"
          className="block w-full h-auto"
        />
        {data.map((district) => <MapMarker key={district.name} district={district} />)}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-caption text-mist-50/60">
        <span className="inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-signal-amber" /> Current rainfall</span>
        <span className="inline-flex items-center gap-2"><span className="w-8 h-1 rounded bg-fern-400" /> 3-day accumulated</span>
      </div>
    </Card>
  );
}

function RainfallTrendChart({ data }: { data: DistrictRainfall[] }) {
  return (
    <Card className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <p className="font-mono text-caption text-fern-400 tracking-widest uppercase mb-2">Cartesian comparison</p>
          <h2 className="font-display text-h2 text-ink-900 dark:text-mist-50">Rainfall by district</h2>
        </div>
        <p className="text-caption text-ink-900/50 dark:text-mist-50/50">Y-axis: rainfall in millimeters</p>
      </div>
      <div className="h-80" role="img" aria-label="Line chart comparing current and three-day accumulated rainfall across Uttarakhand districts">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 54 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#9BAF9B" strokeOpacity={0.35} />
            <XAxis
              dataKey="name"
              angle={-35}
              textAnchor="end"
              height={70}
              interval={0}
              tick={{ fill: '#55705B', fontSize: 11 }}
            />
            <YAxis
              unit=" mm"
              width={58}
              tick={{ fill: '#55705B', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(1)} mm`]}
              contentStyle={{ borderRadius: 8, borderColor: '#9BAF9B', backgroundColor: '#F7FAF5' }}
            />
            <Legend verticalAlign="top" height={32} />
            <Line type="monotone" dataKey="current" name="Current rainfall" stroke="#D98B3A" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="accumulated" name="3-day accumulated" stroke="#4C8B5A" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

async function fetchDistrictRainfall(district: typeof uttarakhandDistricts[number]): Promise<DistrictRainfall> {
  const params = new URLSearchParams({
    latitude: district.latitude.toString(),
    longitude: district.longitude.toString(),
    current: 'precipitation,weather_code',
    daily: 'precipitation_sum,precipitation_probability_max',
    timezone: 'Asia/Kolkata',
    forecast_days: '3',
  });
  const response = await fetch(`${OPEN_METEO_URL}?${params}`);
  if (!response.ok) throw new Error(`Unable to load ${district.name}`);

  const data = await response.json() as ForecastResponse;
  return {
    name: district.name,
    current: data.current.precipitation,
    status: weatherStatus(data.current.weather_code),
    accumulated: data.daily.precipitation_sum.reduce((total, value) => total + value, 0),
    probability: data.daily.precipitation_probability_max[0] ?? 0,
    expected: data.daily.precipitation_sum[0] ?? 0,
  };
}

export function UttarakhandRainfallGrid() {
  const [rainfall, setRainfall] = useState<DistrictRainfall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all(uttarakhandDistricts.map(fetchDistrictRainfall))
      .then((data) => {
        if (active) setRainfall(data);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="section-py bg-mist-50 dark:bg-forest-950" aria-labelledby="uttarakhand-rainfall-heading">
      <div className="container-main">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
          <div>
            <p className="font-mono text-caption text-fern-400 tracking-widest uppercase mb-2">Varuna Watch · Live District Grid</p>
            <h1 id="uttarakhand-rainfall-heading" className="font-display text-h1 text-ink-900 dark:text-mist-50">Uttarakhand Rainfall Status</h1>
            <p className="text-body text-ink-900/60 dark:text-mist-50/60 mt-3 max-w-2xl">
              Current rainfall and three-day forecast indicators for all 13 districts.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-caption">
            <span className="px-3 py-1.5 rounded-full bg-fern-400/10 text-fern-400">Open-Meteo · live model</span>
            <a href={IMD_RAINFALL_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-200 text-ink-900/60 hover:text-signal-amber dark:border-moss-600 dark:text-mist-50/60">
              IMD district rainfall <ExternalLink size={13} aria-hidden="true" />
            </a>
          </div>
        </div>

        {loading && <p className="text-body text-ink-900/60 dark:text-mist-50/60">Loading district rainfall...</p>}
        {error && <p className="text-body text-rudra-warn">Live rainfall data is temporarily unavailable. Check the IMD source above.</p>}

        {rainfall.length > 0 && (
          <>
            <RainfallTrendChart data={rainfall} />
            <UttarakhandRainfallMap data={rainfall} />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {rainfall.map((district) => (
                <Card key={district.name} className="h-full">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <h2 className="font-display text-h3 text-ink-900 dark:text-mist-50">{district.name}</h2>
                    <p className="text-caption text-ink-900/50 dark:text-mist-50/50 mt-1"> {district.status}</p>
                  </div>
                  <span className={`font-mono text-2xl ${rainfallTone(district.current)}`}>
                    {district.current.toFixed(1)}<span className="text-sm ml-1">mm</span>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 border-t border-stone-200 dark:border-moss-600 pt-4">
                  <div>
                    <p className="text-caption text-ink-900/50 dark:text-mist-50/50">3-day total</p>
                    <p className="font-mono text-lg text-ink-900 dark:text-mist-50">{district.accumulated.toFixed(1)}mm</p>
                  </div>
                  <div>
                    <p className="text-caption text-ink-900/50 dark:text-mist-50/50">Today chance</p>
                    <p className="font-mono text-lg text-ink-900 dark:text-mist-50">{district.probability}%</p>
                  </div>
                  <div>
                    <p className="text-caption text-ink-900/50 dark:text-mist-50/50">Today forecast</p>
                    <p className="font-mono text-lg text-ink-900 dark:text-mist-50">{district.expected.toFixed(1)}mm</p>
                  </div>
                </div>
                </Card>
              ))}
            </div>
          </>
        )}

        <p className="text-caption text-ink-900/40 dark:text-mist-50/40 mt-8">
          Numeric values are from Open-Meteo. IMD district rainfall observations and official forecasts are linked above for verification.
        </p>
      </div>
    </section>
  );
}
