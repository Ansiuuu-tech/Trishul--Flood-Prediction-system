import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { RudraBadge, Button, Card } from '@/components/ui';
import { RudraRing, ContourField } from '@/components/core';
import { Navigation, Footer } from '@/components/layout';
import { features } from '@/lib/features';
import kailashBg from '@/assets/images/kailash-bg.jpg?url';

export const KAILASH_BG = `${kailashBg}?v=2`;

export function FeatureIcon({ type }: { type: string }) {
  const icons: Record<string, JSX.Element> = {
    rainfall: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2v20M5 12h14M7 7l10 10M17 7l-10 10" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    ground: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 12h18M3 18h18M9 6v12M15 6v12" />
        <path d="M12 2v2M12 20v2" />
      </svg>
    ),
    vibration: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 13a8 8 0 1 1 16 0" />
        <path d="M4 11a10 10 0 1 1 16 0" />
        <path d="M12 2v20M12 22v2" />
      </svg>
    ),
    core: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
        <path d="M12 22V12M12 12l-10 3.5M12 12l10 3.5" />
      </svg>
    ),
    levels: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    map: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="3 11 22 2 13 21 11 13 3 11" />
        <circle cx="12" cy="12" r="1.5" />
      </svg>
    ),
    insight: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        <path d="M12 9v4M12 17h.01" />
      </svg>
    ),
    gong: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
    ),
  };

  return (
    <div className="text-fern-400 mb-4" aria-hidden="true">
      {icons[type] || icons.core}
    </div>
  );
}

function VarunaMockup({ mockup }: { mockup: any }) {
  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <h3 className="font-display text-h3 text-ink-900 dark:text-mist-50">Accumulation Windows</h3>
        <div className="grid grid-cols-3 gap-4">
          {mockup.rainfallWindows.map((w: any) => (
            <div key={w.window} className={`p-4 rounded-lg border-2 text-center ${w.level === 'evacuate' ? 'border-rudra-evacuate bg-rudra-evacuate/10' : 'border-rudra-warn bg-rudra-warn/10'}`}>
              <div className="font-mono text-2xl font-medium text-ink-900 dark:text-mist-50">{w.value}</div>
              <div className="font-display text-h3 text-ink-900/60 dark:text-mist-50/60">{w.window}</div>
              <RudraBadge level={w.level} className="mt-2" />
            </div>
          ))}
        </div>
        <div className="pt-4 border-t border-stone-200 dark:border-moss-600">
          <h4 className="font-sans font-medium text-ink-900 dark:text-mist-50 mb-3">Intensity Classification</h4>
          <div className="grid grid-cols-4 gap-2 text-center">
            {mockup.intensityClasses.map((c: any) => (
              <div key={c.label} className={`p-3 rounded-lg border ${c.color === 'rudra-safe' ? 'border-rudra-safe/30 bg-rudra-safe/10' : c.color === 'rudra-watch' ? 'border-rudra-watch/30 bg-rudra-watch/10' : c.color === 'rudra-warn' ? 'border-rudra-warn/30 bg-rudra-warn/10' : 'border-rudra-evacuate/30 bg-rudra-evacuate/10'}`}>
                <div className="font-sans text-sm font-medium text-ink-900 dark:text-mist-50">{c.label}</div>
                <div className="font-mono text-caption text-ink-900/50 dark:text-mist-50/50">{c.range}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-forest-950 rounded-lg border border-moss-600 overflow-hidden relative">
        <ContourField className="absolute inset-0" opacity={0.12} />
        <div className="relative p-6 h-full flex items-center justify-center">
          <div className="text-center max-w-sm">
            <div className="w-64 h-64 mx-auto mb-4 relative">
              <svg width="256" height="256" viewBox="0 0 256 256" className="transform -rotate-90">
                <circle cx="128" cy="128" r="100" fill="none" stroke="#173626" strokeWidth="16" />
                <circle cx="128" cy="128" r="100" fill="none" stroke="#7FA872" strokeWidth="16" strokeDasharray="628" strokeDashoffset="170" strokeLinecap="round" className="animate-pulse" />
                <circle cx="128" cy="128" r="80" fill="none" stroke="#3F6B49" strokeWidth="8" strokeDasharray="502" strokeDashoffset="502" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="font-mono text-4xl font-medium text-mist-50">{mockup.gaugeData.primary.value}</div>
                  <div className="text-caption text-mist-50/60">{mockup.gaugeData.primary.label}</div>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-left">
              <div className="flex justify-between text-caption">
                <span className="text-mist-50/60">{mockup.gaugeData.zone}</span>
                <span className="font-mono text-fern-400">{mockup.gaugeData.status}</span>
              </div>
              <div className="flex justify-between text-caption">
                <span className="text-mist-50/60">Last Update</span>
                <span className="font-mono text-mist-50">{mockup.gaugeData.lastUpdate}</span>
              </div>
              <div className="flex justify-between text-caption">
                <span className="text-mist-50/60">Next Refresh</span>
                <span className="font-mono text-mist-50">{mockup.gaugeData.nextRefresh}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BhumiMockup({ mockup }: { mockup: any }) {
  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <h3 className="font-display text-h3 text-ink-900 dark:text-mist-50">Sensor Profile</h3>
        <div className="space-y-4">
          {mockup.sensorProfile.map((s: any) => (
            <div key={s.depth} className="p-4 rounded-lg border bg-white dark:bg-forest-800 flex items-center justify-between">
              <div>
                <div className="font-mono text-lg font-medium text-ink-900 dark:text-mist-50">{s.depth} depth</div>
                <div className="text-caption text-ink-900/50 dark:text-mist-50/50">VWC: {s.vwc} — {s.status}</div>
              </div>
              <RudraBadge level={s.level} />
            </div>
          ))}
        </div>
        <div className="pt-4 border-t border-stone-200 dark:border-moss-600">
          <h4 className="font-sans font-medium text-ink-900 dark:text-mist-50 mb-3">Slope Inclination</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            {mockup.slopeStats.map((s: any) => (
              <div key={s.label} className={`p-3 rounded-lg border ${s.color === 'rudra-safe' ? 'border-rudra-safe/30 bg-rudra-safe/10' : s.color === 'rudra-watch' ? 'border-rudra-watch/30 bg-rudra-watch/10' : 'border-rudra-warn/30 bg-rudra-warn/10'}`}>
                <div className={`font-mono text-xl font-medium text-${s.color}`}>{s.value}</div>
                <div className="text-caption text-ink-900/50 dark:text-mist-50/50">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-forest-950 rounded-lg border border-moss-600 overflow-hidden relative">
        <ContourField className="absolute inset-0" opacity={0.12} />
        <div className="relative p-6 h-full flex items-center justify-center">
          <div className="text-center max-w-sm">
            <div className="font-mono text-5xl font-medium text-fern-400 mb-2">{mockup.stabilityGauge.value}</div>
            <div className="text-h3 text-mist-50 mb-4">{mockup.stabilityGauge.label}</div>
            <RudraBadge level={mockup.stabilityGauge.level} pulse={true} className="mx-auto mb-4" />
            <div className="space-y-2 text-left text-caption">
              <div className="flex justify-between"><span className="text-mist-50/60">Critical Depth</span><span className="font-mono text-mist-50">0.45m</span></div>
              <div className="flex justify-between"><span className="text-mist-50/60">Cohesion (est.)</span><span className="font-mono text-mist-50">12 kPa</span></div>
              <div className="flex justify-between"><span className="text-mist-50/60">Friction Angle</span><span className="font-mono text-mist-50">28°</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KampanMockup({ mockup }: { mockup: any }) {
  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <h3 className="font-display text-h3 text-ink-900 dark:text-mist-50">Real-Time Classification</h3>
        <div className="grid grid-cols-2 gap-4">
          {mockup.classifications.map((c: any) => (
            <div key={c.label} className={`p-4 rounded-lg border-2 text-center ${c.level === 'evacuate' ? 'border-rudra-evacuate bg-rudra-evacuate/10' : c.level === 'warn' ? 'border-rudra-warn bg-rudra-warn/10' : 'border-rudra-watch bg-rudra-watch/10'}`}>
              <div className="font-display text-h3 text-ink-900 dark:text-mist-50">{c.score}</div>
              <div className="font-sans text-sm font-medium text-ink-900/70 dark:text-mist-50/70">{c.label}</div>
              <RudraBadge level={c.level} className="mt-2" />
            </div>
          ))}
        </div>
        <div className="pt-4 border-t border-stone-200 dark:border-moss-600">
          <h4 className="font-sans font-medium text-ink-900 dark:text-mist-50 mb-3">Spectral Features (Live)</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            {mockup.spectralFeatures.map((s: any) => (
              <div key={s.label} className="p-3 rounded-lg border border-stone-200 dark:border-moss-600">
                <div className="font-mono text-xl font-medium text-ink-900 dark:text-mist-50">{s.value}</div>
                <div className="text-caption text-ink-900/50 dark:text-mist-50/50">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-forest-950 rounded-lg border border-moss-600 overflow-hidden relative">
        <ContourField className="absolute inset-0" opacity={0.12} />
        <div className="relative p-6 h-full flex items-center justify-center">
          <div className="text-center max-w-sm">
            <div className="font-mono text-5xl font-medium text-rudra-evacuate mb-2">{mockup.classificationResult.label}</div>
            <div className="text-h3 text-mist-50 mb-4">Classification</div>
            <RudraBadge level={mockup.classificationResult.level} pulse={true} className="mx-auto mb-4" />
            <div className="space-y-2 text-left text-caption">
              <div className="flex justify-between"><span className="text-mist-50/60">Confidence</span><span className="font-mono text-mist-50">{mockup.classificationResult.confidence}</span></div>
              <div className="flex justify-between"><span className="text-mist-50/60">Amplitude Trend</span><span className="font-mono text-rudra-evacuate">{mockup.classificationResult.amplitudeTrend}</span></div>
              <div className="flex justify-between"><span className="text-mist-50/60">Bandwidth</span><span className="font-mono text-mist-50">{mockup.classificationResult.bandwidth}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CoreMockup({ mockup }: { mockup: any }) {
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <h3 className="font-display text-h3 text-ink-900 dark:text-mist-50">Input Streams (Live)</h3>
        <div className="grid grid-cols-3 gap-4">
          {mockup.inputStreams.map((s: any) => (
            <div key={s.name} className="p-4 rounded-lg border bg-white dark:bg-forest-800">
              <div className="font-sans font-medium text-ink-900 dark:text-mist-50 mb-2">{s.name}</div>
              <div className="text-caption text-ink-900/50 dark:text-mist-50/50 mb-2">{s.metric}</div>
              <div className="flex items-center justify-between">
                <div className="font-mono text-3xl font-medium text-ink-900 dark:text-mist-50">{s.value}</div>
                <RudraBadge level={s.level} />
              </div>
              <div className="text-caption text-rudra-warn mt-1">{s.trend}</div>
            </div>
          ))}
        </div>
        <div className="pt-4 border-t border-stone-200 dark:border-moss-600">
          <h4 className="font-sans font-medium text-ink-900 dark:text-mist-50 mb-4">Attribution (Shapley)</h4>
          <div className="space-y-3">
            {mockup.attribution.map((a: any) => (
              <div key={a.sensor} className="flex items-center gap-3">
                <div className="w-32 font-sans text-sm text-ink-900 dark:text-mist-50">{a.sensor}</div>
                <div className="flex-1 h-3 bg-stone-200 dark:bg-forest-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${a.contribution}%`, backgroundColor: `var(--${a.color})` }} />
                </div>
                <div className="font-mono text-sm font-medium text-ink-900 dark:text-mist-50 w-12 text-right">{a.contribution}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-forest-950 rounded-lg border border-moss-600 relative">
        <ContourField className="absolute inset-0" opacity={0.12} />
        <div className="relative p-8 h-full flex flex-col items-center justify-center text-center">
          <RudraBadge level={mockup.fusionOutput.level} pulse={true} className="mb-4" style={{ transform: 'scale(1.5)' }} />
          <div className="font-display text-hero-h1 font-medium text-mist-50 mb-2">{mockup.fusionOutput.level.toUpperCase()}</div>
          <div className="font-mono text-xl text-mist-50/60 mb-6">Posterior: {mockup.fusionOutput.posterior}</div>
          <div className="w-full max-w-xs mx-auto space-y-3 text-left">
            <div className="p-3 rounded-lg bg-forest-800 border border-moss-600">
              <div className="font-sans text-sm font-medium text-mist-50">{mockup.fusionOutput.zone}</div>
              <div className="text-mist-50/60 text-sm">Last fusion: {mockup.fusionOutput.lastFusion}</div>
            </div>
            <div className={`p-3 rounded-lg ${mockup.fusionOutput.sirenActive ? 'bg-rudra-evacuate/20 border border-rudra-evacuate/30' : 'bg-forest-800 border border-moss-600'}`}>
              <div className={`font-sans text-sm font-medium ${mockup.fusionOutput.sirenActive ? 'text-rudra-evacuate' : 'text-mist-50'}`}>SIREN ACTIVE</div>
              <div className={mockup.fusionOutput.sirenActive ? 'text-rudra-evacuate/80 text-sm' : 'text-mist-50/60 text-sm'}>Ghanta Signal: All channels</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RudraMockup({ mockup }: { mockup: any }) {
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockup.levels.map((l: any) => (
          <Card key={l.level} variant="dark" className="relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-1 ${l.color}`} aria-hidden="true" />
            <div className="relative p-2">
              <RudraRing
                level={l.level}
                pulse={l.level === 'warn' || l.level === 'evacuate'}
                size="lg"
                showLabel={false}
                className="mb-4"
              />
              <h3 className="font-display text-h3 text-mist-50 mb-2">{l.label}</h3>
              <div className="space-y-3 text-sm">
                <div><span className="font-mono text-fern-400">Posterior: </span><span className="text-mist-50/80">{l.posterior}</span></div>
                <div><span className="font-mono text-fern-400">Action: </span><span className="text-mist-50/80">{l.action}</span></div>
                <div><span className="font-mono text-fern-400">Channels: </span><span className="text-mist-50/80">{l.channels}</span></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="text-center text-caption text-ink-900/50 dark:text-mist-50/50">
        Pulse animation active only at Warning and Evacuate — calm dot at Safe/Watch, urgent pulse only when it matters.
      </div>
    </div>
  );
}

function KailashMockup({ mockup }: { mockup: any }) {
  return (
    <div className="bg-forest-950 rounded-lg border border-moss-600 relative aspect-[16/9] overflow-hidden">
      <ContourField className="absolute inset-0" opacity={0.08} />
      <div className="relative p-6 h-full flex items-center justify-center">
        <div className="text-center max-w-2xl">
          <div className="font-display text-h2 text-mist-50 mb-4">Kailash View — Live Map</div>
          <div className="grid grid-cols-3 gap-4 mb-6 max-w-md mx-auto">
            {mockup.zones.map((z: any, i: number) => (
              <div key={z.label} className="p-3 rounded-lg bg-forest-800 border border-moss-600">
                <div className="font-sans font-medium text-mist-50">{z.label}</div>
                <RudraRing level={z.level} pulse={z.pulse} size="sm" />
              </div>
            ))}
          </div>
          <div className="text-caption text-mist-50/50 font-mono">{mockup.mapStyle}</div>
        </div>
      </div>
    </div>
  );
}

function DrishtiMockup({ mockup }: { mockup: any }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-h3 text-ink-900 dark:text-mist-50">{mockup.zone.name}</h3>
          <div className="text-caption text-ink-900/50 dark:text-mist-50/50 mt-1">Last fusion: {mockup.zone.lastFusion}</div>
        </div>
        <RudraBadge level={mockup.zone.level} pulse={true} style={{ transform: 'scale(1.3)' }} />
      </div>

      <div className="pt-4 border-t border-moss-600">
        <h4 className="font-sans font-medium text-ink-900 dark:text-mist-50 mb-4">Attribution (Shapley)</h4>
        <div className="space-y-4">
          {mockup.attribution.map((a: any) => (
            <div key={a.sensor}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-sans text-sm text-ink-900 dark:text-mist-50">{a.sensor}</span>
                <span className="font-mono text-sm font-medium text-ink-900 dark:text-mist-50">{a.value}%</span>
              </div>
              <div className="h-2 bg-stone-200 dark:bg-forest-950 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${a.value}%`, backgroundColor: `var(--${a.color})` }} />
              </div>
              <div className="text-caption text-ink-900/50 dark:text-mist-50/50 mt-1 font-mono">{a.detail}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-moss-600">
        <h4 className="font-sans font-medium text-ink-900 dark:text-mist-50 mb-4">What Changed (Since Watch → Warning)</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          {mockup.deltaSinceTransition.map((d: any) => (
            <div key={d.label} className={`p-3 rounded-lg border ${d.color === 'rudra-warn' ? 'bg-rudra-warn/10 border-rudra-warn/30' : 'bg-rudra-evacuate/10 border-rudra-evacuate/30'}`}>
              <div className={`font-mono text-xl text-${d.color}`}>{d.value}</div>
              <div className="text-caption text-ink-900/50 dark:text-mist-50/50">{d.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GhantaMockup({ mockup }: { mockup: any }) {
  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <h3 className="font-display text-h3 text-ink-900 dark:text-mist-50">Active Broadcast — Zone 3</h3>
        <RudraBadge level={mockup.activeBroadcast.level} pulse={true} className="mb-4" style={{ transform: 'scale(1.2)' }} />
        <div className="space-y-3">
          {mockup.deliveryStatus.map((c: any) => (
            <div key={c.channel} className="p-4 rounded-lg border bg-white dark:bg-forest-800 flex items-center justify-between">
              <div>
                <div className="font-sans font-medium text-ink-900 dark:text-mist-50">{c.channel}</div>
                <div className="text-caption text-ink-900/50 dark:text-mist-50/50">{c.detail}</div>
              </div>
              <div className="flex items-center gap-3">
                <RudraBadge level={c.level} showDot={false} />
                <span className="font-mono text-sm font-medium text-ink-900 dark:text-mist-50">{c.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-forest-950 rounded-lg border border-moss-600 relative p-6">
        <ContourField className="absolute inset-0" opacity={0.12} />
        <div className="relative text-center">
          <div className="font-mono text-5xl font-medium text-rudra-evacuate mb-2">{mockup.activeBroadcast.sirenSub}</div>
          <div className="text-h3 text-mist-50 mb-4">Siren Message</div>
          <div className="p-4 rounded-lg bg-rudra-evacuate/20 border border-rudra-evacuate/30 inline-block max-w-xs">
            <p className="text-sm text-rudra-evacuate font-medium">{mockup.activeBroadcast.sirenMessage}</p>
          </div>
          <div className="mt-6 space-y-2 text-caption text-mist-50/60">
            <div>Language: Nepali / Hindi / Tharu</div>
            <div>Repeat interval: 3 min</div>
            <div>Power: Solar + 72h battery</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderMockup(mockup: any) {
  switch (mockup.type) {
    case 'varuna': return <VarunaMockup mockup={mockup} />;
    case 'bhumi': return <BhumiMockup mockup={mockup} />;
    case 'kampan': return <KampanMockup mockup={mockup} />;
    case 'core': return <CoreMockup mockup={mockup} />;
    case 'rudra': return <RudraMockup mockup={mockup} />;
    case 'kailash': return <KailashMockup mockup={mockup} />;
    case 'drishti': return <DrishtiMockup mockup={mockup} />;
    case 'ghanta': return <GhantaMockup mockup={mockup} />;
    default: return null;
  }
}

export interface FeaturePageProps {
  featureId: string;
}

export function FeaturePage({ featureId }: FeaturePageProps) {
  const feature = useMemo(() => {
    return features.find(f => f.id === featureId) || features[0];
  }, [featureId]);

  const mockupElement = renderMockup(feature.mockup);

  const backgroundStyle = feature.backgroundImage === 'kailash' ? {
    backgroundImage: `url(${KAILASH_BG})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  } : undefined;

  return (
    <div className="min-h-screen bg-mist-50 dark:bg-forest-950">
      <Navigation />
      <main id="main-content" className="pt-16">
        {/* Hero */}
        <section
          className="section-py bg-forest-950 relative"
          aria-labelledby="feature-hero-heading"
          style={backgroundStyle}
        >
          {feature.backgroundImage ? (
            <div className="absolute inset-0 bg-forest-950/60" aria-hidden="true" />
          ) : (
            <ContourField className="absolute inset-0" opacity={0.08} />
          )}
          <div className="relative container-main">
            <div className="max-w-4xl">
              <p className="font-mono text-caption text-fern-400 tracking-widest uppercase mb-4 animate-fade-in">
                Feature Module
              </p>
              <h1 id="feature-hero-heading" className="font-display text-hero-h1 font-medium text-mist-50 mb-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
                {feature.name}
              </h1>
              <p className="font-display text-h3 italic text-mist-50/60 mb-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
                {feature.myth}
              </p>
              <p className="text-body text-mist-50/70 max-w-3xl animate-fade-in" style={{ animationDelay: '300ms' }}>
                {feature.description}
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="section-py bg-mist-50 dark:bg-forest-950" aria-labelledby="how-it-works-heading">
          <div className="container-main">
            <h2 id="how-it-works-heading" className="font-display text-h2 text-ink-900 dark:text-mist-50 mb-12 text-center">
              How It Works
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {feature.sections.map((section: any, index: number) => (
                <Card key={section.number} hover>
                  <div className="flex items-start gap-4">
                    <span className="font-display text-3xl font-medium text-ink-900/20 dark:text-mist-50/20 flex-shrink-0 mt-1">
                      {section.number.toString().padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className="font-display text-h3 text-ink-900 dark:text-mist-50 mb-2">
                        {section.title}
                      </h3>
                      <p className="text-body text-ink-900/70 dark:text-mist-50/70">
                        {section.desc}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Feeds Into */}
        <section
          className="section-py bg-forest-950 relative"
          aria-labelledby="feeds-into-heading"
        >
          {!feature.backgroundImage && (
            <ContourField className="absolute inset-0" opacity={0.08} />
          )}
          <div className="relative container-main">
            <h2 id="feeds-into-heading" className="font-display text-h2 text-mist-50 mb-12 text-center">
              {feature.feedsHeading || 'Feeds Into Trishul Core'}
            </h2>
            <div className="max-w-4xl mx-auto">
              <Card variant="dark">
                <p className="text-body text-mist-50/80">
                  {feature.feedsInto}
                </p>
              </Card>

              <div className="mt-8 grid md:grid-cols-3 gap-6 text-center">
                {feature.feedsIntoConnections.map((conn: any, i: number) => (
                  <div key={i} className="p-6 bg-forest-800 rounded-lg border border-moss-600">
                    <div className="font-mono text-4xl font-medium text-fern-400 mb-2">→</div>
                    <div className="font-sans font-medium text-mist-50">{conn.label}</div>
                    <div className="text-caption text-mist-50/50">{conn.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Live Mockup */}
        <section className="section-py bg-mist-50 dark:bg-forest-950" aria-labelledby="live-mockup-heading">
          <div className="container-main">
            <h2 id="live-mockup-heading" className="font-display text-h2 text-ink-900 dark:text-mist-50 mb-12 text-center">
              Live Module Mockup
            </h2>
            <div className="max-w-5xl mx-auto">
              <Card>
                {mockupElement}
              </Card>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section-py bg-forest-950 relative text-center" aria-labelledby="feature-cta-heading">
          <ContourField className="absolute inset-0" opacity={0.08} />
          <div className="relative container-main">
            <h2 id="feature-cta-heading" className="font-display text-h2 text-mist-50 mb-4">
              {feature.cta.text}
            </h2>
            <p className="text-body text-mist-50/60 max-w-2xl mx-auto mb-8">
              {feature.cta.sub}
            </p>
            <Link to={feature.cta.link}>
              <Button variant="primary-pill" size="lg">
                {feature.cta.linkLabel}
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
