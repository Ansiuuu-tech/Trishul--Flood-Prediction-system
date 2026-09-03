import { Link } from 'react-router-dom';
import { ContourField } from '@/components/core';
import { RudraBadge } from '@/components/ui';

const zoneStatus = [
  { id: 'rasuwa', name: 'Rasuwa', level: 'safe' as const, lastUpdate: '2 min ago' },
  { id: 'sindhupalchok', name: 'Sindhupalchok', level: 'safe' as const, lastUpdate: '2 min ago' },
  { id: 'chamoli', name: 'Chamoli', level: 'evacuate' as const, lastUpdate: 'Just now' },
  { id: 'uttarkashi', name: 'Uttarkashi', level: 'watch' as const, lastUpdate: '5 min ago' },
  { id: 'kullu', name: 'Kullu', level: 'warn' as const, lastUpdate: '1 min ago' },
  { id: 'mandi', name: 'Mandi', level: 'safe' as const, lastUpdate: '3 min ago' },
];

export function StatusPage() {
  return (
    <div className="min-h-screen bg-mist-50 dark:bg-forest-950">
      <div>
        <section className="section-py bg-forest-950 relative" aria-labelledby="status-heading">
          <ContourField className="absolute inset-0" opacity={0.08} />
          <div className="relative container-main text-center">
            <p className="font-mono text-caption text-fern-400 tracking-widest uppercase mb-4 animate-fade-in">
              Live System Status
            </p>
            <h1 id="status-heading" className="font-display text-hero-h1 font-medium text-mist-50 mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
              Trishul Status
            </h1>
            <p className="text-body text-mist-50/70 max-w-2xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
              Public read-only view of current Rudra Levels across all monitored zones. Updated in real time from Trishul Core.
            </p>
            <div className="max-w-3xl mx-auto text-left space-y-4">
              {zoneStatus.map((zone, i) => (
                <div
                  key={zone.id}
                  className="flex items-center justify-between p-4 rounded-card bg-forest-800 border border-moss-600 animate-fade-in"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div>
                    <p className="font-display text-h3 text-mist-50">{zone.name}</p>
                    <p className="text-caption text-mist-50/60">Last update: {zone.lastUpdate}</p>
                  </div>
                  <RudraBadge level={zone.level} />
                </div>
              ))}
            </div>
            <p className="text-caption text-mist-50/40 mt-8">
              This page is publicly linkable. For operator-grade views, open the Dashboard.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
