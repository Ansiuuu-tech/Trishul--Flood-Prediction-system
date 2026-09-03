import { Link } from 'react-router-dom';
import { Button, RudraBadge } from '@/components/ui';
import { TrishulMark, ContourField, DamageScene } from '@/components/core';
import { KAILASH_BG } from '@/components/core/FeaturePage';

const features = [
  {
    id: 'varuna-watch',
    name: 'Varuna Watch',
    myth: 'Rainfall monitoring',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2v20M5 12h14M7 7l10 10M17 7l-10 10"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    description: 'Multi-window rainfall intelligence — 1h, 3h, 24h accumulation with intensity classification.',
  },
  {
    id: 'bhumi-sense',
    name: 'Bhumi Sense',
    myth: 'Soil moisture + slope tilt',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 12h18M3 18h18M9 6v12M15 6v12"/>
        <path d="M12 2v2M12 20v2"/>
      </svg>
    ),
    description: 'Volumetric water content and inclinometry fused into slope stability probability.',
  },
  {
    id: 'kampan-alert',
    name: 'Kampan Alert',
    myth: 'Vibration / seismic detection',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 13a8 8 0 1 1 16 0"/>
        <path d="M4 11a10 10 0 1 1 16 0"/>
        <path d="M12 2v20M12 22v2"/>
      </svg>
    ),
    description: 'MEMS accelerometer array detecting precursor tremors and debris-flow vibration signatures.',
  },
];

const stats = [
  { value: '9m', label: 'River rise in 30 min (Trishuli, Aug 2026)' },
  { value: '3', label: 'Signals fused: rain, ground, vibration' },
  { value: '8', label: 'Zones covered in prototype' },
  { value: '<6hr', label: 'Typical warning window in hilly terrain' },
];

export function HomePage() {
  return (
    <div className="min-h-screen bg-mist-50 dark:bg-forest-950">
      <div>
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center bg-forest-950 overflow-hidden" aria-labelledby="hero-heading">
          <img src={KAILASH_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <ContourField className="absolute inset-0" opacity={0.08} />
          <div className="relative container-main py-20 lg:py-32">
            <div className="max-w-4xl">
              <p className="font-mono text-caption text-fern-400 tracking-widest uppercase mb-6 animate-fade-in">
                HYPER-LOCAL EARLY WARNING
              </p>
              <h1 id="hero-heading" className="font-display text-hero-h1 font-medium text-mist-50 leading-none mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
                Know the river.<br />
                <span className="block">Warn the village.</span>
              </h1>
              <p className="text-body text-mist-50/70 max-w-2xl mb-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
                Trishul fuses rainfall, ground condition, and vibration into one warning system — so no village learns about a flood from the flood itself.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
                <Link to="/features/trishul-core">
                  <Button variant="primary-pill" size="lg">
                    See Trishul Live
                  </Button>
                </Link>
                <Link to="/about">
                  <Button variant="secondary" size="lg">
                    Read about Flash Floods..
                  </Button>
                </Link>
              </div>
            </div>
          </div>


        </section>

        {/* Three Prongs Section */}
        <section className="section-py bg-mist-50 dark:bg-forest-950" aria-labelledby="three-prongs-heading">
          <div className="container-main">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 id="three-prongs-heading" className="font-display text-h2 text-ink-900 dark:text-mist-50 mb-4">
                Three Prongs. One System.
              </h2>
              <p className="text-body text-ink-900/60 dark:text-mist-50/60">
                Each module watches a different signal. Trishul Core fuses them into a single Rudra Level — the alert the village actually receives.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {features.map((feature, index) => (
                <article
                  key={feature.id}
                  className="card hover group"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className="text-fern-400 mb-4" aria-hidden="true">
                    {feature.icon}
                  </div>
                  <h3 className="font-display text-h3 text-ink-900 dark:text-mist-50 mb-2">
                    {feature.name}
                  </h3>
                  <p className="font-mono text-caption text-ink-900/40 dark:text-mist-50/40 mb-3">
                    {feature.myth}
                  </p>
                  <p className="text-body text-ink-900/70 dark:text-mist-50/70 mb-6">
                    {feature.description}
                  </p>
                  <Link
                    to={`/features/${feature.id}`}
                    className="link font-medium"
                  >
                    Learn more →
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* System in Action - Dark Section */}
        <section className="section-py bg-forest-950 relative overflow-hidden" aria-labelledby="system-action-heading">
          <ContourField className="absolute inset-0" opacity={0.08} drift={true} />
          
          <div className="relative container-main">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 id="system-action-heading" className="font-display text-h2 text-mist-50 mb-4">
                System in Action
              </h2>
              <p className="text-body text-mist-50/60">
                Live demo of Trishul Core fusing three sensor streams into a Rudra Level. This is the actual Tandav demo mode — not a screenshot.
              </p>
            </div>

            <div className="card-dark max-w-4xl mx-auto">
              <div className="aspect-[16/9] relative rounded-lg bg-forest-950 border border-moss-600 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="flex flex-wrap justify-center gap-3 mb-6" role="status" aria-live="polite" aria-label="Live Rudra Level demonstration">
                      <RudraBadge level="safe" pulse={false} />
                      <RudraBadge level="watch" pulse={false} />
                      <RudraBadge level="warn" pulse={true} />
                      <RudraBadge level="evacuate" pulse={true} />
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-4 bg-forest-800 rounded-lg border border-moss-600">
                        <p className="font-mono text-2xl font-medium text-fern-400">142mm</p>
                        <p className="text-caption text-mist-50/60 mt-1">1h Rainfall</p>
                      </div>
                      <div className="p-4 bg-forest-800 rounded-lg border border-moss-600">
                        <p className="font-mono text-2xl font-medium text-fern-400">67%</p>
                        <p className="text-caption text-mist-50/60 mt-1">Soil Saturation</p>
                      </div>
                      <div className="p-4 bg-forest-800 rounded-lg border border-moss-600">
                        <p className="font-mono text-2xl font-medium text-fern-400">0.34g</p>
                        <p className="text-caption text-mist-50/60 mt-1">Peak Vibration</p>
                      </div>
                    </div>
                    <p className="mt-6 text-caption text-mist-50/50 font-mono">
                      Zone 3 — Dhading District — Last update: 2 min ago
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Before/After Split Section */}
        <section className="relative overflow-hidden" aria-labelledby="before-after-heading">
          <div className="container-main">
            <div className="text-center max-w-3xl mx-auto mb-12 px-6">
              <h2 id="before-after-heading" className="font-display text-h2 text-ink-900 dark:text-mist-50 mb-4">
                Before Trishul / After Trishul
              </h2>
              <p className="text-body text-ink-900/60 dark:text-mist-50/60">
                Water-level-only systems see the flood after it arrives. Trishul sees the conditions that create it.
              </p>
            </div>

             <div className="grid lg:grid-cols-2 gap-0">
               {/* Before - calm DamageScene at low shakti */}
               <article className="relative min-h-[500px] lg:min-h-[600px] bg-forest-950 flex items-center justify-center overflow-hidden">
                 <DamageScene shaktiScore={0} className="opacity-30" />
                 <div className="absolute inset-0 bg-gradient-to-r from-forest-950 via-forest-950/60 to-transparent" aria-hidden="true" />
                 <div className="relative z-10 p-8 max-w-xl">
                  <span className="inline-block px-3 py-1 rounded-btn bg-rudra-evacuate/20 text-rudra-evacuate text-caption font-medium mb-4">
                    Before Trishul
                  </span>
                  <h3 className="font-display text-h3 text-mist-50 mb-4">Single signal. Blind spots.</h3>
                  <p className="text-body text-mist-50/70 mb-6">
                    The legacy system monitored only river stage. On 26 August 2026, the Trishuli rose 9 metres in 30 minutes — triggered by a glacier collapse the water-level sensor never saw coming.
                  </p>
                  <ul className="space-y-3 text-mist-50/70">
                    <li className="flex items-center gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rudra-evacuate flex-shrink-0" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span>No rainfall intensity tracking</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rudra-evacuate flex-shrink-0" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span>No soil stability monitoring</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rudra-evacuate flex-shrink-0" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span>No precursor vibration detection</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rudra-evacuate flex-shrink-0" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span>Warning issued after flood arrival</span>
                    </li>
                  </ul>
                </div>
              </article>

               {/* After - DamageScene with ContourField glow + Rudra-safe tint */}
               <article className="relative min-h-[500px] lg:min-h-[600px] bg-forest-800 flex items-center justify-center overflow-hidden">
                 <DamageScene shaktiScore={35} className="opacity-20" />
                 <ContourField className="absolute inset-0" opacity={0.15} colorMode="dark" />
                 <div className="absolute inset-0 bg-gradient-to-l from-rudra-safe/20 via-transparent to-transparent" aria-hidden="true" />
                 <div className="relative z-10 p-8 max-w-xl">
                  <span className="inline-block px-3 py-1 rounded-btn bg-rudra-safe/20 text-rudra-safe text-caption font-medium mb-4">
                    After Trishul
                  </span>
                  <h3 className="font-display text-h3 text-mist-50 mb-4">Three signals. Early warning.</h3>
                  <p className="text-body text-mist-50/70 mb-6">
                    Varuna Watch detects extreme rainfall intensity. Bhumi Sense measures slope saturation approaching failure. Kampan Alert picks up debris-flow vibration signatures. Trishul Core fuses them — issuing a Warning level 4+ hours before water reaches the village.
                  </p>
                  <ul className="space-y-3 text-mist-50/70">
                    <li className="flex items-center gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rudra-safe flex-shrink-0" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      <span>Rainfall intensity + accumulation windows</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rudra-safe flex-shrink-0" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      <span>Volumetric soil moisture + tilt</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rudra-safe flex-shrink-0" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      <span>MEMS vibration classification</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rudra-safe flex-shrink-0" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      <span>Rudra Level issued hours in advance</span>
                    </li>
                  </ul>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Stat Band */}
        <section className="section-py bg-forest-950 relative" aria-labelledby="stats-heading">
          <ContourField className="absolute inset-0" opacity={0.08} />
          
          <div className="relative container-main">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 text-center">
              {stats.map((stat, index) => (
                <div key={stat.label} style={{ animationDelay: `${index * 60}ms` }}>
                  <div className="stat-number mb-2 animate-fade-in" style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'forwards', opacity: 0 }}>
                    {stat.value}
                  </div>
                  <div className="stat-label animate-fade-in" style={{ animationDelay: `${index * 60 + 100}ms`, animationFillMode: 'forwards', opacity: 0 }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Closing Giant Wordmark */}
        <section className="py-16 lg:py-24 bg-mist-50 dark:bg-forest-950" aria-hidden="true">
          <div className="container-main text-center">
            <p className="font-display text-hero-h1 font-medium text-ink-900 dark:text-mist-50 tracking-wider select-none">
              Know the river.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
