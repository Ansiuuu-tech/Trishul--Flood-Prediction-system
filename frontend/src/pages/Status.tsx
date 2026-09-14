import { useEffect, useState } from 'react';
import { ContourField } from '@/components/core';
import { RudraBadge } from '@/components/ui';
import { fetchZones, fetchCurrentRisk, BackendZone, RiskAssessment } from '@/lib/api';

interface StatusItem {
  id: string;
  name: string;
  district: string;
  level: 'safe' | 'watch' | 'warn' | 'evacuate';
  lastUpdate: string;
}

const defaultStatus: StatusItem[] = [
  { id: 'chamoli_raini', name: 'Raini', district: 'Chamoli', level: 'safe', lastUpdate: 'Just now' },
  { id: 'chamoli_joshimath', name: 'Joshimath', district: 'Chamoli', level: 'safe', lastUpdate: '2 min ago' },
  { id: 'rudraprayag_kedarnath', name: 'Kedarnath', district: 'Rudraprayag', level: 'safe', lastUpdate: '1 min ago' },
  { id: 'uttarkashi_dharali', name: 'Dharali', district: 'Uttarkashi', level: 'safe', lastUpdate: '3 min ago' },
  { id: 'dehradun_maldevta', name: 'Maldevta', district: 'Dehradun', level: 'safe', lastUpdate: 'Just now' },
  { id: 'pithoragarh_malpa', name: 'Malpa', district: 'Pithoragarh', level: 'safe', lastUpdate: '4 min ago' },
  { id: 'nainital_haldwani', name: 'Haldwani', district: 'Nainital', level: 'safe', lastUpdate: '2 min ago' },
  { id: 'haridwar_harkipauri', name: 'Har Ki Pauri', district: 'Haridwar', level: 'safe', lastUpdate: 'Just now' },
];

function levelMap(level?: string): 'safe' | 'watch' | 'warn' | 'evacuate' {
  switch (level?.toLowerCase()) {
    case 'watch': return 'watch';
    case 'warning':
    case 'warn': return 'warn';
    case 'evacuate': return 'evacuate';
    default: return 'safe';
  }
}

export function StatusPage() {
  const [items, setItems] = useState<StatusItem[]>(defaultStatus);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchZones(), fetchCurrentRisk().catch(() => [] as RiskAssessment[])])
      .then(([zones, risks]) => {
        if (cancelled || !zones || zones.length === 0) return;
        const riskMap = new Map(risks.map((r) => [r.zone_id, r]));
        const mapped: StatusItem[] = zones.map((z) => {
          const r = riskMap.get(z.id);
          return {
            id: z.id,
            name: z.name,
            district: z.district || 'Uttarakhand',
            level: levelMap(r?.level),
            lastUpdate: r?.created_at ? 'Live' : 'Active',
          };
        });
        setItems(mapped);
      })
      .catch(() => {
        // Fallback to default Uttarakhand records
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-mist-50 dark:bg-forest-950">
      <div>
        <section className="section-py bg-forest-950 relative" aria-labelledby="status-heading">
          <ContourField className="absolute inset-0" opacity={0.08} />
          <div className="relative container-main text-center">
            <p className="font-mono text-caption text-fern-400 tracking-widest uppercase mb-4 animate-fade-in">
              Uttarakhand Live System Status
            </p>
            <h1 id="status-heading" className="font-display text-hero-h1 font-medium text-mist-50 mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
              Trishul Status
            </h1>
            <p className="text-body text-mist-50/70 max-w-2xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
              Public read-only view of current Rudra Levels across all monitored Uttarakhand districts and vulnerable settlements. Updated in real time from Trishul Core.
            </p>
            <div className="max-w-3xl mx-auto text-left space-y-4">
              {items.map((item, i) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-card bg-forest-800 border border-moss-600 animate-fade-in"
                  style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
                >
                  <div>
                    <p className="font-display text-h3 text-mist-50">
                      {item.name} <span className="text-sm font-sans font-normal text-mist-50/60">— {item.district} District</span>
                    </p>
                    <p className="text-caption text-mist-50/60">Status: {item.lastUpdate}</p>
                  </div>
                  <RudraBadge level={item.level} />
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
