import { useEffect, useState } from 'react';
import type { AlertEvent, LiveFeedState, RiskUpdateEvent } from '@/hooks/useLiveFeed';

function timeAgo(at: number, now: number) { const s = Math.max(0, Math.floor((now - at) / 1000)); return s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ago`; }
export function LiveTicker({ events, isDemo }: { events: LiveFeedState['recentEvents']; isDemo: boolean | null }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  return <div className="rounded-lg border border-moss-600 bg-forest-950 px-4 py-3" aria-live="polite">
    <p className="mb-2 font-mono text-caption uppercase tracking-widest text-mist-50/60">{isDemo === null ? 'Live feed' : isDemo ? 'Live simulation feed' : 'Live sensor feed'}</p>
    {events.length ? <div className="space-y-1 text-caption text-mist-50/80">{events.slice(0, 5).map((event) => {
      const data = event.data as AlertEvent | RiskUpdateEvent;
      const message = event.type === 'alert'
        ? `${(data as AlertEvent).zone_id}: ${(data as AlertEvent).previous_level} → ${(data as AlertEvent).level}`
        : `${(data as RiskUpdateEvent).zone_id}: score ${(data as RiskUpdateEvent).score.toFixed(0)}`;
      return <div key={`${event.type}-${event.at}`}>{message} <span className="opacity-50">· {timeAgo(event.at, now)}</span></div>;
    })}</div> : <p className="text-caption text-mist-50/45">Waiting for live updates.</p>}
  </div>;
}
