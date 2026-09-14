import { useEffect, useState } from 'react';
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
import { districtMapPositions, uttarakhandDistricts } from './UttarakhandRainfallGrid';

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

interface SoilResponse {
  current: {
    soil_moisture_0_to_7cm: number;
    soil_moisture_7_to_28cm: number;
    soil_moisture_28_to_100cm: number;
    soil_temperature_0cm: number;
  };
}

interface DistrictSoil {
  name: string;
  status: string;
  top: number;
  middle: number;
  deep: number;
  temperature: number;
}

function moisturePercent(value: number) {
  return Math.round(value * 100);
}

function soilStatus(top: number, middle: number, deep: number) {
  const peak = Math.max(top, middle, deep);
  if (peak >= 45) return 'Saturated';
  if (peak >= 32) return 'Wet';
  if (peak >= 20) return 'Moist';
  return 'Dry';
}

function statusTone(status: string) {
  if (status === 'Saturated') return 'text-rudra-evacuate';
  if (status === 'Wet') return 'text-rudra-warn';
  if (status === 'Moist') return 'text-rudra-watch';
  return 'text-fern-400';
}

async function fetchDistrictSoil(district: typeof uttarakhandDistricts[number]): Promise<DistrictSoil> {
  const params = new URLSearchParams({
    latitude: district.latitude.toString(),
    longitude: district.longitude.toString(),
    current: 'soil_moisture_0_to_7cm,soil_moisture_7_to_28cm,soil_moisture_28_to_100cm,soil_temperature_0cm',
    timezone: 'Asia/Kolkata',
  });
  const response = await fetch(`${OPEN_METEO_URL}?${params}`);
  if (!response.ok) throw new Error(`Unable to load ${district.name}`);

  const data = await response.json() as SoilResponse;
  const top = moisturePercent(data.current.soil_moisture_0_to_7cm);
  const middle = moisturePercent(data.current.soil_moisture_7_to_28cm);
  const deep = moisturePercent(data.current.soil_moisture_28_to_100cm);

  return {
    name: district.name,
    status: soilStatus(top, middle, deep),
    top,
    middle,
    deep,
    temperature: data.current.soil_temperature_0cm,
  };
}

function SoilMoistureChart({ data }: { data: DistrictSoil[] }) {
  return (
    <Card className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <p className="font-mono text-caption text-fern-400 tracking-widest uppercase mb-2">Cartesian comparison</p>
          <h2 className="font-display text-h2 text-ink-900 dark:text-mist-50">Soil moisture by district</h2>
        </div>
        <p className="text-caption text-ink-900/50 dark:text-mist-50/50">Y-axis: volumetric moisture (%)</p>
      </div>
      <div className="h-80" role="img" aria-label="Line chart comparing soil moisture at three depths across Uttarakhand districts">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 54 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#9BAF9B" strokeOpacity={0.35} />
            <XAxis dataKey="name" angle={-35} textAnchor="end" height={70} interval={0} tick={{ fill: '#55705B', fontSize: 11 }} />
            <YAxis unit="%" width={44} tick={{ fill: '#55705B', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(value: number) => [`${value}%`]} contentStyle={{ borderRadius: 8, borderColor: '#9BAF9B', backgroundColor: '#F7FAF5' }} />
            <Legend verticalAlign="top" height={32} />
            <Line type="monotone" dataKey="top" name="0–7 cm" stroke="#D98B3A" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="middle" name="7–28 cm" stroke="#4C8B5A" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="deep" name="28–100 cm" stroke="#315C8A" strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function SoilMap({ data }: { data: DistrictSoil[] }) {
  return (
    <Card className="mb-8 overflow-hidden bg-forest-950 border-moss-600">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
        <div>
          <p className="font-mono text-caption text-fern-400 tracking-widest uppercase mb-2">Live district map</p>
          <h2 className="font-display text-h2 text-mist-50">Uttarakhand soil saturation field</h2>
        </div>
        <p className="text-caption text-mist-50/50">District boundaries · live records</p>
      </div>
      <div className="relative overflow-hidden rounded-lg bg-mist-50">
        <img src="/ukmap.jpg" alt="Uttarakhand district boundaries" className="block w-full h-auto" />
        {data.map((district) => {
          const position = districtMapPositions[district.name] ?? { x: 400, y: 250 };
          return (
            <div key={district.name} className="absolute z-10 group" style={{ left: `calc(${position.x / 8}% + 12px)`, top: `calc(${position.y / 5}% - 15px)` }} title={`${district.name}: ${district.status}, top moisture ${district.top}%`}>
              <span className={`block w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg ${district.status === 'Saturated' ? 'bg-rudra-evacuate' : district.status === 'Wet' ? 'bg-rudra-warn' : district.status === 'Moist' ? 'bg-rudra-watch' : 'bg-fern-400'}`} />
              <span className="absolute left-2 top-1 hidden group-hover:block whitespace-nowrap rounded bg-forest-950 px-2 py-1 font-mono text-[10px] text-mist-50 shadow-lg">{district.name} · {district.status}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-caption text-mist-50/60">
        <span><span className="inline-block w-2 h-2 rounded-full bg-rudra-evacuate mr-2" />Saturated</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-rudra-warn mr-2" />Wet</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-rudra-watch mr-2" />Moist</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-fern-400 mr-2" />Dry</span>
      </div>
    </Card>
  );
}

export function UttarakhandSoilGrid() {
  const [soil, setSoil] = useState<DistrictSoil[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all(uttarakhandDistricts.map(fetchDistrictSoil))
      .then((data) => {
        if (active) setSoil(data);
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
    <section className="section-py bg-mist-50 dark:bg-forest-950" aria-labelledby="uttarakhand-soil-heading">
      <div className="container-main">
        <div className="mb-8">
          <p className="font-mono text-caption text-fern-400 tracking-widest uppercase mb-2">Bhumi Sense · Live District Grid</p>
          <h1 id="uttarakhand-soil-heading" className="font-display text-h1 text-ink-900 dark:text-mist-50">Uttarakhand Soil Saturation Status</h1>
          <p className="text-body text-ink-900/60 dark:text-mist-50/60 mt-3 max-w-2xl">Live soil moisture and temperature indicators for all 13 districts.</p>
        </div>

        {loading && <p className="text-body text-ink-900/60 dark:text-mist-50/60">Loading district soil data...</p>}
        {error && <p className="text-body text-rudra-warn">Live soil data is temporarily unavailable.</p>}
        {soil.length > 0 && (
          <>
            <SoilMoistureChart data={soil} />
            <SoilMap data={soil} />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {soil.map((district) => (
                <Card key={district.name} className="h-full">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <h2 className="font-display text-h3 text-ink-900 dark:text-mist-50">{district.name}</h2>
                      <p className={`font-mono text-caption mt-1 ${statusTone(district.status)}`}>{district.status}</p>
                    </div>
                    <span className="font-mono text-xl text-ink-900 dark:text-mist-50">{district.temperature.toFixed(1)}°C</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 border-t border-stone-200 dark:border-moss-600 pt-4">
                    <div><p className="text-caption text-ink-900/50 dark:text-mist-50/50">0–7 cm</p><p className="font-mono text-lg text-ink-900 dark:text-mist-50">{district.top}%</p></div>
                    <div><p className="text-caption text-ink-900/50 dark:text-mist-50/50">7–28 cm</p><p className="font-mono text-lg text-ink-900 dark:text-mist-50">{district.middle}%</p></div>
                    <div><p className="text-caption text-ink-900/50 dark:text-mist-50/50">28–100 cm</p><p className="font-mono text-lg text-ink-900 dark:text-mist-50">{district.deep}%</p></div>
                  </div>
                  <p className="text-caption text-ink-900/50 dark:text-mist-50/50 mt-4">Soil temperature · {district.temperature.toFixed(1)}°C</p>
                </Card>
              ))}
            </div>
          </>
        )}
        <p className="text-caption text-ink-900/40 dark:text-mist-50/40 mt-8">Numeric values are from Open-Meteo current soil model data. Moisture is shown as volumetric water content.</p>
      </div>
    </section>
  );
}
