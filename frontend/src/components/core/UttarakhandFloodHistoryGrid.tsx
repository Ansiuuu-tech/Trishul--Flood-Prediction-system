import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '@/components/ui';
import { districtMapPositions, uttarakhandDistricts } from './UttarakhandRainfallGrid';

const SOURCE_URL = 'https://api.reliefweb.int/v2/reports';
const SOURCE_API_URL = import.meta.env.VITE_FLOOD_HISTORY_API_URL as string | undefined;

interface FloodHistoryRecord {
  district: string;
  floods_5y: number;
  floods_10y: number;
  floods_20y: number;
  loss_percentage: number;
}

interface DistrictFloodHistory extends FloodHistoryRecord {
  available: boolean;
}

function unavailableRecord(district: string): DistrictFloodHistory {
  return { district, floods_5y: 0, floods_10y: 0, floods_20y: 0, loss_percentage: 0, available: false };
}

function historyTone(value: number) {
  if (value >= 10) return 'text-rudra-evacuate';
  if (value >= 5) return 'text-rudra-warn';
  if (value > 0) return 'text-rudra-watch';
  return 'text-fern-400';
}

function HistoryChart({ data }: { data: DistrictFloodHistory[] }) {
  return (
    <Card className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <p className="font-mono text-caption text-fern-400 tracking-widest uppercase mb-2">Historical comparison</p>
          <h2 className="font-display text-h2 text-ink-900 dark:text-mist-50">Flood events by district</h2>
        </div>
        <p className="text-caption text-ink-900/50 dark:text-mist-50/50">External disaster records · event count</p>
      </div>
      <div className="h-80" role="img" aria-label="Bar chart comparing flood event counts over five, ten, and twenty years across Uttarakhand districts">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 54 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#9BAF9B" strokeOpacity={0.35} />
            <XAxis dataKey="district" angle={-35} textAnchor="end" height={70} interval={0} tick={{ fill: '#55705B', fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fill: '#55705B', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, borderColor: '#9BAF9B', backgroundColor: '#F7FAF5' }} />
            <Legend verticalAlign="top" height={32} />
            <Bar dataKey="floods_5y" name="Last 5 years" fill="#D98B3A" radius={[3, 3, 0, 0]} />
            <Bar dataKey="floods_10y" name="Last 10 years" fill="#4C8B5A" radius={[3, 3, 0, 0]} />
            <Bar dataKey="floods_20y" name="Last 20 years" fill="#315C8A" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function HistoryMap({ data }: { data: DistrictFloodHistory[] }) {
  return (
    <Card className="mb-8 overflow-hidden bg-forest-950 border-moss-600">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
        <div>
          <p className="font-mono text-caption text-fern-400 tracking-widest uppercase mb-2">District history map</p>
          <h2 className="font-display text-h2 text-mist-50">Uttarakhand flood memory field</h2>
        </div>
        <p className="text-caption text-mist-50/50">External event history · district view</p>
      </div>
      <div className="relative overflow-hidden rounded-lg bg-mist-50">
        <img src="/ukmap.jpg" alt="Uttarakhand district boundaries" className="block w-full h-auto" />
        {data.map((district) => {
          const position = districtMapPositions[district.district] ?? { x: 400, y: 250 };
          return (
            <div key={district.district} className="absolute z-10 group" style={{ left: `calc(${position.x / 8}% + 12px)`, top: `calc(${position.y / 5}% - 15px)` }} title={`${district.district}: ${district.available ? `${district.floods_5y} floods in 5 years` : 'Historical data unavailable'}`}>
              <span className={`block w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg ${district.available ? 'bg-signal-amber' : 'bg-stone-400'}`} />
              <span className="absolute left-2 top-1 hidden group-hover:block whitespace-nowrap rounded bg-forest-950 px-2 py-1 font-mono text-[10px] text-mist-50 shadow-lg">{district.available ? `${district.floods_5y} events · ${district.loss_percentage}% loss` : 'Historical data unavailable'}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function UttarakhandFloodHistoryGrid() {
  const [history, setHistory] = useState<DistrictFloodHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const loadHistory = async () => {
      if (!SOURCE_API_URL) {
        if (active) setHistory(uttarakhandDistricts.map((district) => unavailableRecord(district.name)));
        if (active) setLoading(false);
        return;
      }

      try {
        const response = await fetch(SOURCE_API_URL);
        if (!response.ok) throw new Error('Historical source request failed');
        const payload = await response.json() as FloodHistoryRecord[] | { records: FloodHistoryRecord[] };
        const records = Array.isArray(payload) ? payload : payload.records;
        const byDistrict = new Map(records.map((record) => [record.district.toLowerCase(), record]));
        if (active) {
          setHistory(uttarakhandDistricts.map((district) => ({
            ...(byDistrict.get(district.name.toLowerCase()) ?? unavailableRecord(district.name)),
            available: byDistrict.has(district.name.toLowerCase()),
          })));
        }
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadHistory();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="section-py bg-mist-50 dark:bg-forest-950" aria-labelledby="smriti-track-heading">
      <div className="container-main">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
          <div>
            <p className="font-mono text-caption text-fern-400 tracking-widest uppercase mb-2">Smriti Track · Historical District Grid</p>
            <h1 id="smriti-track-heading" className="font-display text-h1 text-ink-900 dark:text-mist-50">Uttarakhand Flood History</h1>
            <p className="text-body text-ink-900/60 dark:text-mist-50/60 mt-3 max-w-2xl">Historical flood frequency and calamity-loss context for all 13 districts.</p>
          </div>
          <a href={SOURCE_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-200 text-caption text-ink-900/60 hover:text-signal-amber dark:border-moss-600 dark:text-mist-50/60">Alternate disaster source <ExternalLink size={13} aria-hidden="true" /></a>
        </div>

        {!SOURCE_API_URL && <p className="mb-8 text-body text-rudra-warn">Historical data source is not connected yet. Set VITE_FLOOD_HISTORY_API_URL to a normalized public feed to populate these records.</p>}
        {loading && <p className="text-body text-ink-900/60 dark:text-mist-50/60">Loading historical flood records...</p>}
        {error && <p className="text-body text-rudra-warn">The external flood-history source is temporarily unavailable.</p>}
        {history.length > 0 && (
          <>
            <HistoryChart data={history} />
            <HistoryMap data={history} />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {history.map((district) => (
                <Card key={district.district} className="h-full">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <h2 className="font-display text-h3 text-ink-900 dark:text-mist-50">{district.district}</h2>
                      <p className={`font-mono text-caption mt-1 ${district.available ? historyTone(district.floods_5y) : 'text-ink-900/50 dark:text-mist-50/50'}`}>{district.available ? 'Historical record available' : 'Awaiting source data'}</p>
                    </div>
                    <span className="font-mono text-2xl text-ink-900 dark:text-mist-50">{district.available ? `${district.loss_percentage}%` : '—'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 border-t border-stone-200 dark:border-moss-600 pt-4">
                    <div><p className="text-caption text-ink-900/50 dark:text-mist-50/50">Last 5 years</p><p className="font-mono text-lg text-ink-900 dark:text-mist-50">{district.available ? district.floods_5y : '—'}</p></div>
                    <div><p className="text-caption text-ink-900/50 dark:text-mist-50/50">Last 10 years</p><p className="font-mono text-lg text-ink-900 dark:text-mist-50">{district.available ? district.floods_10y : '—'}</p></div>
                    <div><p className="text-caption text-ink-900/50 dark:text-mist-50/50">Last 20 years</p><p className="font-mono text-lg text-ink-900 dark:text-mist-50">{district.available ? district.floods_20y : '—'}</p></div>
                    <div><p className="text-caption text-ink-900/50 dark:text-mist-50/50">Calamity loss</p><p className="font-mono text-lg text-ink-900 dark:text-mist-50">{district.available ? `${district.loss_percentage}%` : '—'}</p></div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
        <p className="text-caption text-ink-900/40 dark:text-mist-50/40 mt-8">Figures are displayed only when supplied by the configured external flood-history feed. No historical values are estimated in the UI.</p>
      </div>
    </section>
  );
}
