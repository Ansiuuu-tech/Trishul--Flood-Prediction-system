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
import { ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui';
import { districtMapPositions, uttarakhandDistricts } from './UttarakhandRainfallGrid';

const USGS_URL = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
const USGS_LOOKBACK_DAYS = 30;

interface EarthquakeFeature {
  properties: { mag: number | null; place: string; time: number | null };
  geometry: { coordinates: [number, number, number] };
}

interface EarthquakeResponse {
  features: EarthquakeFeature[];
}

interface DistrictSeismic {
  name: string;
  quantity: number;
  status: string;
  maxMagnitude: number;
  latestEvent: string;
  latestPlace: string;
  latestDepth: number;
}

function seismicStatus(quantity: number, magnitude: number) {
  if (magnitude >= 5 || quantity >= 12) return 'Elevated';
  if (magnitude >= 3 || quantity >= 4) return 'Active';
  if (quantity > 0) return 'Low activity';
  return 'Quiet';
}

function statusTone(status: string) {
  if (status === 'Elevated') return 'text-rudra-evacuate';
  if (status === 'Active') return 'text-rudra-warn';
  if (status === 'Low activity') return 'text-rudra-watch';
  return 'text-fern-400';
}

async function fetchDistrictSeismic(district: typeof uttarakhandDistricts[number]): Promise<DistrictSeismic> {
  const start = new Date(Date.now() - USGS_LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const params = new URLSearchParams({
    format: 'geojson',
    latitude: district.latitude.toString(),
    longitude: district.longitude.toString(),
    maxradiuskm: '45',
    starttime: start,
    orderby: 'time',
    limit: '100',
  });
  const response = await fetch(`${USGS_URL}?${params}`);
  if (!response.ok) throw new Error(`Unable to load ${district.name}`);

  const data = await response.json() as EarthquakeResponse;
  const events = data.features.filter((event) => event.properties.mag !== null);
  const latest = events[0];
  const maxMagnitude = events.reduce((max, event) => Math.max(max, event.properties.mag ?? 0), 0);

  return {
    name: district.name,
    quantity: events.length,
    status: seismicStatus(events.length, maxMagnitude),
    maxMagnitude,
    latestEvent: latest?.properties.time ? new Date(latest.properties.time).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'No event',
    latestPlace: latest?.properties.place ?? 'No recent event within 45 km',
    latestDepth: latest?.geometry.coordinates[2] ?? 0,
  };
}

function SeismicChart({ data }: { data: DistrictSeismic[] }) {
  return (
    <Card className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <p className="font-mono text-caption text-fern-400 tracking-widest uppercase mb-2">Cartesian comparison · last 30 days</p>
          <h2 className="font-display text-h2 text-ink-900 dark:text-mist-50">Seismic activity by district</h2>
        </div>
        <p className="text-caption text-ink-900/50 dark:text-mist-50/50">Events and maximum magnitude</p>
      </div>
      <div className="h-80" role="img" aria-label="Line chart comparing earthquake quantity and maximum magnitude across Uttarakhand districts">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 54 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#9BAF9B" strokeOpacity={0.35} />
            <XAxis dataKey="name" angle={-35} textAnchor="end" height={70} interval={0} tick={{ fill: '#55705B', fontSize: 11 }} />
            <YAxis yAxisId="quantity" width={44} tick={{ fill: '#55705B', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="magnitude" orientation="right" domain={[0, 'auto']} width={44} tick={{ fill: '#55705B', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(value: number, name: string) => [name === 'Max magnitude' ? value.toFixed(1) : value, name]} contentStyle={{ borderRadius: 8, borderColor: '#9BAF9B', backgroundColor: '#F7FAF5' }} />
            <Legend verticalAlign="top" height={32} />
            <Line yAxisId="quantity" type="monotone" dataKey="quantity" name="Event quantity" stroke="#D98B3A" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line yAxisId="magnitude" type="monotone" dataKey="maxMagnitude" name="Max magnitude" stroke="#4C8B5A" strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function SeismicMap({ data }: { data: DistrictSeismic[] }) {
  return (
    <Card className="mb-8 overflow-hidden bg-forest-950 border-moss-600">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
        <div>
          <p className="font-mono text-caption text-fern-400 tracking-widest uppercase mb-2">Live district map</p>
          <h2 className="font-display text-h2 text-mist-50">Uttarakhand seismic field</h2>
        </div>
        <p className="text-caption text-mist-50/50">USGS events · last 30 days</p>
      </div>
      <div className="relative overflow-hidden rounded-lg bg-mist-50">
        <img src="/ukmap.jpg" alt="Uttarakhand district boundaries" className="block w-full h-auto" />
        {data.map((district) => {
          const position = districtMapPositions[district.name] ?? { x: 400, y: 250 };
          const markerColor = district.status === 'Elevated' ? 'bg-rudra-evacuate' : district.status === 'Active' ? 'bg-rudra-warn' : district.status === 'Low activity' ? 'bg-rudra-watch' : 'bg-fern-400';
          return (
            <div key={district.name} className="absolute z-10 group" style={{ left: `calc(${position.x / 8}% + 12px)`, top: `calc(${position.y / 5}% - 15px)` }} title={`${district.name}: ${district.quantity} events, max magnitude ${district.maxMagnitude.toFixed(1)}`}>
              <span className={`block w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg ${markerColor}`} />
              <span className="absolute left-2 top-1 hidden group-hover:block whitespace-nowrap rounded bg-forest-950 px-2 py-1 font-mono text-[10px] text-mist-50 shadow-lg">{district.quantity} events · M{district.maxMagnitude.toFixed(1)}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-caption text-mist-50/60">
        <span><span className="inline-block w-2 h-2 rounded-full bg-rudra-evacuate mr-2" />Elevated</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-rudra-warn mr-2" />Active</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-rudra-watch mr-2" />Low activity</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-fern-400 mr-2" />Quiet</span>
      </div>
    </Card>
  );
}

export function UttarakhandSeismicGrid() {
  const [seismic, setSeismic] = useState<DistrictSeismic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all(uttarakhandDistricts.map(fetchDistrictSeismic))
      .then((data) => {
        if (active) setSeismic(data);
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
    <section className="section-py bg-mist-50 dark:bg-forest-950" aria-labelledby="uttarakhand-seismic-heading">
      <div className="container-main">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
          <div>
            <p className="font-mono text-caption text-fern-400 tracking-widest uppercase mb-2">Kampan Alert · Live District Grid</p>
            <h1 id="uttarakhand-seismic-heading" className="font-display text-h1 text-ink-900 dark:text-mist-50">Uttarakhand Seismic Status</h1>
            <p className="text-body text-ink-900/60 dark:text-mist-50/60 mt-3 max-w-2xl">Earthquake activity and ground-motion context for all 13 districts.</p>
          </div>
          <a href="https://earthquake.usgs.gov/earthquakes/search/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-200 text-caption text-ink-900/60 hover:text-signal-amber dark:border-moss-600 dark:text-mist-50/60">USGS earthquake feed <ExternalLink size={13} aria-hidden="true" /></a>
        </div>

        {loading && <p className="text-body text-ink-900/60 dark:text-mist-50/60">Loading district seismic activity...</p>}
        {error && <p className="text-body text-rudra-warn">Live seismic data is temporarily unavailable.</p>}
        {seismic.length > 0 && (
          <>
            <SeismicChart data={seismic} />
            <SeismicMap data={seismic} />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {seismic.map((district) => (
                <Card key={district.name} className="h-full">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <h2 className="font-display text-h3 text-ink-900 dark:text-mist-50">{district.name}</h2>
                      <p className={`font-mono text-caption mt-1 ${statusTone(district.status)}`}>{district.status}</p>
                    </div>
                    <span className="font-mono text-2xl text-ink-900 dark:text-mist-50">{district.quantity}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 border-t border-stone-200 dark:border-moss-600 pt-4">
                    <div><p className="text-caption text-ink-900/50 dark:text-mist-50/50">Seismic quantity</p><p className="font-mono text-lg text-ink-900 dark:text-mist-50">{district.quantity} events</p></div>
                    <div><p className="text-caption text-ink-900/50 dark:text-mist-50/50">Max magnitude</p><p className="font-mono text-lg text-ink-900 dark:text-mist-50">M{district.maxMagnitude.toFixed(1)}</p></div>
                    <div><p className="text-caption text-ink-900/50 dark:text-mist-50/50">Latest event</p><p className="font-mono text-lg text-ink-900 dark:text-mist-50">{district.latestEvent}</p></div>
                    <div><p className="text-caption text-ink-900/50 dark:text-mist-50/50">Depth</p><p className="font-mono text-lg text-ink-900 dark:text-mist-50">{district.latestDepth.toFixed(1)} km</p></div>
                  </div>
                  <p className="text-caption text-ink-900/50 dark:text-mist-50/50 mt-4 truncate" title={district.latestPlace}>Latest: {district.latestPlace}</p>
                </Card>
              ))}
            </div>
          </>
        )}
        <p className="text-caption text-ink-900/40 dark:text-mist-50/40 mt-8">USGS events within 45 km of each district coordinate, queried over the last 30 days. Quantity is event count; magnitude is the largest recorded event in that window.</p>
      </div>
    </section>
  );
}
