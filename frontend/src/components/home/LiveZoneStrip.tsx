import { Sparkline } from '@/components/dashboard/Sparkline';
import type { BackendSensor, BackendZone } from '@/lib/api';
import type { SensorReadingEvent } from '@/hooks/useLiveFeed';

export function LiveZoneStrip({ zones, sensors, liveSensors }: { zones: BackendZone[]; sensors: Record<string, BackendSensor>; liveSensors: Record<string, SensorReadingEvent> }) {
  const selected = [...zones].sort((a, b) => b.population - a.population).slice(0, 6);
  if (!selected.length) return null;
  return <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">{selected.map((zone) => {
    const rainfall = liveSensors[zone.id]?.rainfall_mm_1h ?? sensors[zone.id]?.rainfall_mm_1h;
    return <div key={zone.id} className="rounded-lg border border-moss-600 bg-forest-800 p-3">
      <p className="truncate text-caption text-mist-50/75">{zone.name}</p>
      {rainfall === undefined ? <p className="mt-2 text-caption text-mist-50/45">Awaiting reading</p> : <><p className="mt-1 font-mono text-mist-50">{rainfall.toFixed(1)} mm/h</p><Sparkline value={rainfall} color="#7FD79A" /></>}
    </div>;
  })}</div>;
}
