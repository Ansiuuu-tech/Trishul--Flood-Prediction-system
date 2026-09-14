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
import { districtMapPositions, uttarakhandDistricts } from './UttarakhandRainfallGrid';

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const OPEN_METEO_DOCS = 'https://open-meteo.com/en/docs';

interface TerrainResponse {
  elevation: number;
  current: {
    soil_moisture_0_to_7cm: number;
  };
}

interface DistrictTerrain {
  name: string;
  elevation: number;
  soilMoisture: number;
  score: number;
  status: string;
}

function terrainScore(elevation: number, soilMoisture: number) {
  const elevationFactor = Math.min(60, Math.max(0, (elevation - 200) / 30));
  const moistureFactor = Math.min(40, soilMoisture * 40);
  return Math.round(Math.min(100, elevationFactor + moistureFactor));
}

function terrainStatus(score: number) {
  if (score >= 75) return 'Very high';
  if (score >= 55) return 'High';
  if (score >= 35) return 'Moderate';
  return 'Lower';
}

function statusTone(status: string) {
  if (status === 'Very high') return 'text-rudra-evacuate';
  if (status === 'High') return 'text-rudra-warn';
  if (status === 'Moderate') return 'text-rudra-watch';
  return 'text-fern-400';
}

async function fetchDistrictTerrain(district: typeof uttarakhandDistricts[number]): Promise<DistrictTerrain> {
  const params = new URLSearchParams({
    latitude: district.latitude.toString(),
    longitude: district.longitude.toString(),
    current: 'soil_moisture_0_to_7cm',
    timezone: 'Asia/Kolkata',
  });
  const response = await fetch(`${OPEN_METEO_URL}?${params}`);
  if (!response.ok) throw new Error(`Unable to load ${district.name}`);

  const data = await response.json() as TerrainResponse;
  const elevation = data.elevation;
  const soilMoisture = data.current.soil_moisture_0_to_7cm;
  const score = terrainScore(elevation, soilMoisture);

  return {
    name: district.name,
    elevation,
    soilMoisture: Math.round(soilMoisture * 100),
    score,
    status: terrainStatus(score),
  };
}

function TerrainChart({ data }: { data: DistrictTerrain[] }) {
  return (
    <Card className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <p className="font-mono text-caption text-fern-400 tracking-widest uppercase mb-2">Cartesian comparison</p>
          <h2 className="font-display text-h2 text-ink-900 dark:text-mist-50">Terrain susceptibility by district</h2>
        </div>
        <p className="text-caption text-ink-900/50 dark:text-mist-50/50">Y-axis: proxy score (0–100)</p>
      </div>
      <div className="h-80" role="img" aria-label="Line chart comparing terrain susceptibility proxy scores across Uttarakhand districts">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 54 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#9BAF9B" strokeOpacity={0.35} />
            <XAxis dataKey="name" angle={-35} textAnchor="end" height={70} interval={0} tick={{ fill: '#55705B', fontSize: 11 }} />
            <YAxis domain={[0, 100]} width={44} tick={{ fill: '#55705B', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(value: number) => [`${value}`, 'Proxy score']} contentStyle={{ borderRadius: 8, borderColor: '#9BAF9B', backgroundColor: '#F7FAF5' }} />
            <Legend verticalAlign="top" height={32} />
            <Line type="monotone" dataKey="score" name="Terrain proxy score" stroke="#D98B3A" strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function TerrainMap({ data }: { data: DistrictTerrain[] }) {
  return (
    <Card className="mb-8 overflow-hidden bg-forest-950 border-moss-600">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
        <div>
          <p className="font-mono text-caption text-fern-400 tracking-widest uppercase mb-2">Live district map</p>
          <h2 className="font-display text-h2 text-mist-50">Uttarakhand terrain field</h2>
        </div>
        <p className="text-caption text-mist-50/50">Open-Meteo elevation and soil signal</p>
      </div>
      <div className="relative overflow-hidden rounded-lg bg-mist-50">
        <img src="/ukmap.jpg" alt="Uttarakhand district boundaries" className="block w-full h-auto" />
        {data.map((district) => {
          const position = districtMapPositions[district.name] ?? { x: 400, y: 250 };
          const color = district.status === 'Very high' ? 'bg-rudra-evacuate' : district.status === 'High' ? 'bg-rudra-warn' : district.status === 'Moderate' ? 'bg-rudra-watch' : 'bg-fern-400';
          return (
            <div key={district.name} className="absolute z-10 group" style={{ left: `calc(${position.x / 8}% + 12px)`, top: `calc(${position.y / 5}% - 15px)` }} title={`${district.name}: ${district.status} (${district.score}/100)`}>
              <span className={`block w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg ${color}`} />
              <span className="absolute left-2 top-1 hidden group-hover:block whitespace-nowrap rounded bg-forest-950 px-2 py-1 font-mono text-[10px] text-mist-50 shadow-lg">{district.status} · {district.score}/100</span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-caption text-mist-50/60">
        <span><span className="inline-block w-2 h-2 rounded-full bg-rudra-evacuate mr-2" />Very high</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-rudra-warn mr-2" />High</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-rudra-watch mr-2" />Moderate</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-fern-400 mr-2" />Lower</span>
      </div>
    </Card>
  );
}

export function UttarakhandTerrainGrid() {
  const [terrain, setTerrain] = useState<DistrictTerrain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all(uttarakhandDistricts.map(fetchDistrictTerrain))
      .then((data) => {
        if (active) setTerrain(data);
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
    <section className="section-py bg-mist-50 dark:bg-forest-950" aria-labelledby="uttarakhand-terrain-heading">
      <div className="container-main">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
          <div>
            <p className="font-mono text-caption text-fern-400 tracking-widest uppercase mb-2">Sankat Grid · Live District Grid</p>
            <h1 id="uttarakhand-terrain-heading" className="font-display text-h1 text-ink-900 dark:text-mist-50">Uttarakhand Terrain Susceptibility</h1>
            <p className="text-body text-ink-900/60 dark:text-mist-50/60 mt-3 max-w-2xl">Elevation and soil-moisture context for all 13 districts.</p>
          </div>
          <a href={OPEN_METEO_DOCS} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-200 text-caption text-ink-900/60 hover:text-signal-amber dark:border-moss-600 dark:text-mist-50/60">Open-Meteo terrain data <ExternalLink size={13} aria-hidden="true" /></a>
        </div>

        {loading && <p className="text-body text-ink-900/60 dark:text-mist-50/60">Loading district terrain data...</p>}
        {error && <p className="text-body text-rudra-warn">Live terrain data is temporarily unavailable.</p>}
        {terrain.length > 0 && (
          <>
            <TerrainChart data={terrain} />
            <TerrainMap data={terrain} />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {terrain.map((district) => (
                <Card key={district.name} className="h-full">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <h2 className="font-display text-h3 text-ink-900 dark:text-mist-50">{district.name}</h2>
                      <p className={`font-mono text-caption mt-1 ${statusTone(district.status)}`}>{district.status}</p>
                    </div>
                    <span className="font-mono text-2xl text-ink-900 dark:text-mist-50">{district.score}<span className="text-sm">/100</span></span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 border-t border-stone-200 dark:border-moss-600 pt-4">
                    <div><p className="text-caption text-ink-900/50 dark:text-mist-50/50">Elevation</p><p className="font-mono text-lg text-ink-900 dark:text-mist-50">{district.elevation.toFixed(0)} m</p></div>
                    <div><p className="text-caption text-ink-900/50 dark:text-mist-50/50">Topsoil moisture</p><p className="font-mono text-lg text-ink-900 dark:text-mist-50">{district.soilMoisture}%</p></div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
        <p className="text-caption text-ink-900/40 dark:text-mist-50/40 mt-8">Numeric elevation and soil-moisture values are from Open-Meteo. The proxy is for product demonstration and should not replace official hazard maps.</p>
      </div>
    </section>
  );
}
