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

const OPEN_METEO_ELEVATION_URL = 'https://api.open-meteo.com/v1/elevation';
const OPEN_METEO_DOCS = 'https://open-meteo.com/en/docs/elevation-api';
const ONE_KILOMETRE_LATITUDE = 0.009;
const ONE_KILOMETRE_LONGITUDE = 0.0105;

interface ElevationResponse {
  elevation: number[];
}

interface DistrictSlope {
  name: string;
  elevation: number;
  slope: number;
  status: string;
}

function slopeStatus(slope: number) {
  if (slope >= 25) return 'Very steep';
  if (slope >= 15) return 'Steep';
  if (slope >= 8) return 'Moderate';
  return 'Gentle';
}

function statusTone(status: string) {
  if (status === 'Very steep') return 'text-rudra-evacuate';
  if (status === 'Steep') return 'text-rudra-warn';
  if (status === 'Moderate') return 'text-rudra-watch';
  return 'text-fern-400';
}

async function fetchDistrictSlope(district: typeof uttarakhandDistricts[number]): Promise<DistrictSlope> {
  const latitudes = [
    district.latitude,
    district.latitude + ONE_KILOMETRE_LATITUDE,
    district.latitude - ONE_KILOMETRE_LATITUDE,
    district.latitude,
    district.latitude,
  ];
  const longitudes = [
    district.longitude,
    district.longitude,
    district.longitude,
    district.longitude + ONE_KILOMETRE_LONGITUDE,
    district.longitude - ONE_KILOMETRE_LONGITUDE,
  ];
  const params = new URLSearchParams({
    latitude: latitudes.join(','),
    longitude: longitudes.join(','),
  });
  const response = await fetch(`${OPEN_METEO_ELEVATION_URL}?${params}`);
  if (!response.ok) throw new Error(`Unable to load ${district.name}`);

  const data = await response.json() as ElevationResponse;
  const center = data.elevation[0] ?? 0;
  const steepestDifference = Math.max(...data.elevation.slice(1).map((elevation) => Math.abs(elevation - center)));
  const slope = Math.round(Math.atan(steepestDifference / 1000) * (180 / Math.PI) * 10) / 10;

  return {
    name: district.name,
    elevation: center,
    slope,
    status: slopeStatus(slope),
  };
}

function SlopeChart({ data }: { data: DistrictSlope[] }) {
  return (
    <Card className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <p className="font-mono text-caption text-fern-400 tracking-widest uppercase mb-2">Cartesian comparison</p>
          <h2 className="font-display text-h2 text-ink-900 dark:text-mist-50">Slope and elevation by district</h2>
        </div>
        <p className="text-caption text-ink-900/50 dark:text-mist-50/50">Slope angle in degrees · elevation in metres</p>
      </div>
      <div className="h-80" role="img" aria-label="Line chart comparing slope angle and elevation across Uttarakhand districts">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 54 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#9BAF9B" strokeOpacity={0.35} />
            <XAxis dataKey="name" angle={-35} textAnchor="end" height={70} interval={0} tick={{ fill: '#55705B', fontSize: 11 }} />
            <YAxis yAxisId="slope" width={44} tick={{ fill: '#55705B', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="elevation" orientation="right" width={54} tick={{ fill: '#55705B', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(value: number, name: string) => [name === 'Elevation' ? `${value.toFixed(0)} m` : `${value.toFixed(1)}°`, name]} contentStyle={{ borderRadius: 8, borderColor: '#9BAF9B', backgroundColor: '#F7FAF5' }} />
            <Legend verticalAlign="top" height={32} />
            <Line yAxisId="slope" type="monotone" dataKey="slope" name="Slope angle" stroke="#D98B3A" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line yAxisId="elevation" type="monotone" dataKey="elevation" name="Elevation" stroke="#4C8B5A" strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function SlopeMap({ data }: { data: DistrictSlope[] }) {
  return (
    <Card className="mb-8 overflow-hidden bg-forest-950 border-moss-600">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
        <div>
          <p className="font-mono text-caption text-fern-400 tracking-widest uppercase mb-2">Live district map</p>
          <h2 className="font-display text-h2 text-mist-50">Uttarakhand slope field</h2>
        </div>
        <p className="text-caption text-mist-50/50">Open-Meteo elevation samples</p>
      </div>
      <div className="relative overflow-hidden rounded-lg bg-mist-50">
        <img src="/ukmap.jpg" alt="Uttarakhand district boundaries" className="block w-full h-auto" />
        {data.map((district) => {
          const position = districtMapPositions[district.name] ?? { x: 400, y: 250 };
          const color = district.status === 'Very steep' ? 'bg-rudra-evacuate' : district.status === 'Steep' ? 'bg-rudra-warn' : district.status === 'Moderate' ? 'bg-rudra-watch' : 'bg-fern-400';
          return (
            <div key={district.name} className="absolute z-10 group" style={{ left: `calc(${position.x / 8}% + 12px)`, top: `calc(${position.y / 5}% - 15px)` }} title={`${district.name}: ${district.slope.toFixed(1)}° slope, ${district.elevation.toFixed(0)}m elevation`}>
              <span className={`block w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg ${color}`} />
              <span className="absolute left-2 top-1 hidden group-hover:block whitespace-nowrap rounded bg-forest-950 px-2 py-1 font-mono text-[10px] text-mist-50 shadow-lg">{district.slope.toFixed(1)}° · {district.elevation.toFixed(0)}m</span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-caption text-mist-50/60">
        <span><span className="inline-block w-2 h-2 rounded-full bg-rudra-evacuate mr-2" />Very steep</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-rudra-warn mr-2" />Steep</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-rudra-watch mr-2" />Moderate</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-fern-400 mr-2" />Gentle</span>
      </div>
    </Card>
  );
}

export function UttarakhandSlopeGrid() {
  const [slopes, setSlopes] = useState<DistrictSlope[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all(uttarakhandDistricts.map(fetchDistrictSlope))
      .then((data) => {
        if (active) setSlopes(data);
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
    <section className="section-py bg-mist-50 dark:bg-forest-950" aria-labelledby="uttarakhand-slope-heading">
      <div className="container-main">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
          <div>
            <p className="font-mono text-caption text-fern-400 tracking-widest uppercase mb-2">Dhal Watch · Live District Grid</p>
            <h1 id="uttarakhand-slope-heading" className="font-display text-h1 text-ink-900 dark:text-mist-50">Uttarakhand Slope and Elevation</h1>
            <p className="text-body text-ink-900/60 dark:text-mist-50/60 mt-3 max-w-2xl">Terrain steepness and elevation context for all 13 districts.</p>
          </div>
          <a href={OPEN_METEO_DOCS} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-200 text-caption text-ink-900/60 hover:text-signal-amber dark:border-moss-600 dark:text-mist-50/60">Open-Meteo elevation data <ExternalLink size={13} aria-hidden="true" /></a>
        </div>

        {loading && <p className="text-body text-ink-900/60 dark:text-mist-50/60">Loading district slope data...</p>}
        {error && <p className="text-body text-rudra-warn">Live elevation data is temporarily unavailable.</p>}
        {slopes.length > 0 && (
          <>
            <SlopeChart data={slopes} />
            <SlopeMap data={slopes} />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {slopes.map((district) => (
                <Card key={district.name} className="h-full">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <h2 className="font-display text-h3 text-ink-900 dark:text-mist-50">{district.name}</h2>
                      <p className={`font-mono text-caption mt-1 ${statusTone(district.status)}`}>{district.status}</p>
                    </div>
                    <span className="font-mono text-2xl text-ink-900 dark:text-mist-50">{district.slope.toFixed(1)}°</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 border-t border-stone-200 dark:border-moss-600 pt-4">
                    <div><p className="text-caption text-ink-900/50 dark:text-mist-50/50">Slope angle</p><p className="font-mono text-lg text-ink-900 dark:text-mist-50">{district.slope.toFixed(1)}°</p></div>
                    <div><p className="text-caption text-ink-900/50 dark:text-mist-50/50">Elevation</p><p className="font-mono text-lg text-ink-900 dark:text-mist-50">{district.elevation.toFixed(0)} m</p></div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
        <p className="text-caption text-ink-900/40 dark:text-mist-50/40 mt-8">Elevation is fetched from Open-Meteo. Slope is estimated from the steepest elevation difference across nearby 1 km samples; it is not an official slope map.</p>
      </div>
    </section>
  );
}
