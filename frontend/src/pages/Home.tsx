import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { ContourField, DamageScene } from '@/components/core';
import { KAILASH_BG } from '@/components/core/FeaturePage';

const IMD_RADAR_URL = 'https://mausam.imd.gov.in/Radar/MOSAIC/Converted/mosaic.gif';
const IMD_SATELLITE_URL = 'https://mausam.imd.gov.in/Satellite/3Dasiasec_ir1.jpg';
const IMD_LIGHTNING_URL = 'https://mausam.imd.gov.in/lightning/Converted/BT.gif';

const stats = [
  { value: '7.38 Mha', label: 'Average area affected annually' },
  { value: '1.2 million', label: 'Average houses damaged annually' },
  { value: '1,666', label: 'Average human lives lost annually' },
  { value: '₹6,972 crore', label: 'Average annual economic loss' },
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
                <Link to="/features">
                  <Button variant="primary-pill" size="lg">
                    See Trishul Live
                  </Button>
                </Link>
                <Link to="/about">
                  <Button variant="secondary" size="lg">
                    How It Works
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
                Three prongs, one warning
              </h2>
              <p className="text-body text-ink-900/60 dark:text-mist-50/60">
                Trishul is built as three linked stages — the system takes its name from the three-pronged instrument, each prong carrying the warning one step closer to the people who need to act on it.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              <Link to="/features" className="block h-full" aria-label="Open the feature grid">
                <article className="card hover group h-full">
                <p className="font-mono text-caption text-accent-light mb-4">01 — DETECT</p>
                <h3 className="font-display text-h3 text-ink-900 dark:text-mist-50 mb-3">Sense &amp; Fuse</h3>
                <p className="text-body text-ink-900/70 dark:text-mist-50/70 mb-6">
                  Ground sensors and satellite feeds capture rainfall, soil, slope, seismic and terrain data, aligned onto one timeline and catchment map with gaps filled and confidence-scored.
                </p>
                <ul className="space-y-2 text-body text-ink-900/70 dark:text-mist-50/70">
                  <li>Multi-source sensing</li>
                  <li>Time &amp; spatial alignment</li>
                  <li>Gap-filled, confidence-scored</li>
                </ul>
                </article>
              </Link>

              <Link to="/features" className="block h-full" aria-label="Open the feature grid">
                <article className="card hover group h-full">
                <p className="font-mono text-caption text-fern-400 mb-4">02 — PREDICT</p>
                <h3 className="font-display text-h3 text-ink-900 dark:text-mist-50 mb-3">Predict &amp; Score</h3>
                <p className="text-body text-ink-900/70 dark:text-mist-50/70 mb-6">
                  A physics-based model sets a hydrological baseline; machine learning corrects it using historical patterns, producing a calibrated risk score with confidence and explainability attached.
                </p>
                <ul className="space-y-2 text-body text-ink-900/70 dark:text-mist-50/70">
                  <li>Hybrid physics + ML model</li>
                  <li>Explainable predictions</li>
                  <li>Calibrated risk score</li>
                </ul>
                </article>
              </Link>

              <Link to="/features" className="block h-full" aria-label="Open the feature grid">
                <article className="card hover group h-full">
                <p className="font-mono text-caption text-signal-amber mb-4">03 — ALERT</p>
                <h3 className="font-display text-h3 text-ink-900 dark:text-mist-50 mb-3">Alert &amp; Act</h3>
                <p className="text-body text-ink-900/70 dark:text-mist-50/70 mb-6">
                  Once risk crosses a threshold, warnings reach people via SMS, sirens and local relays — backed by a dashboard showing risk by region, state and river basin.
                </p>
                <ul className="space-y-2 text-body text-ink-900/70 dark:text-mist-50/70">
                  <li>Multi-channel alerts</li>
                  <li>Region/state/basin dashboard</li>
                  <li>Backtested against real floods</li>
                </ul>
                </article>
              </Link>
            </div>
          </div>
        </section>

        {/* Kailash View */}
        <section className="section-py bg-forest-950 relative overflow-hidden" aria-labelledby="kailash-view-heading">
          <ContourField className="absolute inset-0" opacity={0.1} drift={true} />
          <div className="relative container-main">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
              <div className="max-w-3xl">
                <p className="font-mono text-caption text-signal-amber tracking-widest uppercase mb-3">Live atmospheric window</p>
                <h2 id="kailash-view-heading" className="font-display text-h2 text-mist-50 mb-4">Kailash View</h2>
                <p className="text-body text-mist-50/65">
                  A high-altitude glance across the signals above Uttarakhand: satellite cloud structure, radar rain echoes, and the lightning nowcast that turns a distant storm into a local decision.
                </p>
              </div>
              <a
                href="https://mausam.imd.gov.in/imd_latest/contents/satellite.php"
                target="_blank"
                rel="noreferrer"
                className="link text-mist-50 whitespace-nowrap"
              >
                Open IMD source →
              </a>
            </div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              <article className="rounded-card border border-moss-600 bg-forest-800 overflow-hidden">
                <div className="aspect-[4/3] bg-forest-950 overflow-hidden">
                  <img
                    src={IMD_SATELLITE_URL}
                    alt="Live IMD infrared satellite view of Asia"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <p className="font-mono text-caption text-accent-light tracking-widest uppercase mb-2">01 / Satellite</p>
                  <h3 className="font-display text-h3 text-mist-50 mb-2">Infrared satellite</h3>
                  <p className="text-caption text-mist-50/60 mb-4">Live cloud temperature and storm structure from IMD's Asia sector view.</p>
                  <a href="https://mausam.imd.gov.in/responsive/satellite.php" target="_blank" rel="noreferrer" className="link text-caption text-mist-50">Open IMD satellite →</a>
                </div>
              </article>

              <article className="rounded-card border border-moss-600 bg-forest-800 overflow-hidden">
                <div className="aspect-[4/3] bg-forest-950 overflow-hidden">
                  <img
                    src={IMD_RADAR_URL}
                    alt="Live IMD mosaic radar reflectivity map"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <p className="font-mono text-caption text-signal-amber tracking-widest uppercase mb-2">02 / Radar</p>
                  <h3 className="font-display text-h3 text-mist-50 mb-2">Radar reflectivity</h3>
                  <p className="text-caption text-mist-50/60 mb-4">Live precipitation echoes from the IMD radar network, matching the Mausam radar view.</p>
                  <a href="https://mausam.imd.gov.in/responsive/radar.php" target="_blank" rel="noreferrer" className="link text-caption text-mist-50">Open IMD radar →</a>
                </div>
              </article>

              <article className="rounded-card border border-moss-600 bg-forest-800 overflow-hidden">
                <div className="aspect-[4/3] bg-forest-950 overflow-hidden">
                  <img
                    src={IMD_LIGHTNING_URL}
                    alt="Live IMD brightness temperature lightning map"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <p className="font-mono text-caption text-accent-light tracking-widest uppercase mb-2">03 / Lightning</p>
                  <h3 className="font-display text-h3 text-mist-50 mb-2">District nowcast</h3>
                  <p className="text-caption text-mist-50/60 mb-4">Live IMD warning map for thunderstorms, lightning, and other district-level hazards.</p>
                  <div className="flex flex-wrap gap-4 text-caption">
                    <a href="https://mausam.imd.gov.in/responsive/districtWiseNowcastGIS.php" target="_blank" rel="noreferrer" className="link text-mist-50">Open IMD nowcast →</a>
                    <a href="https://play.google.com/store/apps/details?id=com.lightening.live.damini" target="_blank" rel="noreferrer" className="link text-mist-50">Damini →</a>
                  </div>
                </div>
              </article>
            </div>
            <p className="mt-5 text-caption text-mist-50/40">Imagery is served by the India Meteorological Department and may refresh on its own schedule.</p>
          </div>
        </section>

        {/* System in Action - Dark Section */}
        <section className="section-py bg-forest-950 relative overflow-hidden" aria-labelledby="system-action-heading">
          <ContourField className="absolute inset-0" opacity={0.08} drift={true} />
          
          <div className="relative container-main">
            <div className="max-w-5xl mx-auto rounded-card border border-moss-600 bg-forest-800 p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <h2 id="system-action-heading" className="font-display text-h2 text-mist-50">
                  Risk status — live
                </h2>
                <span className="inline-flex items-center gap-2 self-start rounded-pill border border-fern-400/30 bg-fern-400/10 px-3 py-1.5 font-mono text-caption text-fern-400" role="status" aria-live="polite">
                  <span className="h-2 w-2 rounded-full bg-fern-400 animate-pulse" aria-hidden="true" />
                  Updated recently
                </span>
              </div>

              <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
                <div>
                  <svg className="w-full h-auto rounded-lg border border-moss-600 bg-forest-950 p-4" viewBox="0 0 420 150" fill="none" role="img" aria-label="Basin status map showing low, moderate, high, and extreme risk points">
                    <path d="M10 20 C 60 40, 90 10, 140 35 C 190 60, 220 30, 270 55 C 320 80, 350 60, 410 90" stroke="#3E5A76" strokeWidth="2" fill="none" />
                    <path d="M30 90 C 80 100, 120 80, 170 100 C 220 120, 260 95, 320 115 C 360 128, 380 118, 405 130" stroke="#4A6E8C" strokeWidth="2" fill="none" />
                    <circle cx="140" cy="35" r="5" fill="#7FD79A" />
                    <circle cx="270" cy="55" r="5" fill="#DFA23B" />
                    <circle cx="170" cy="100" r="5" fill="#E38377" />
                    <circle cx="320" cy="115" r="5" fill="#7FD79A" />
                    <circle cx="60" cy="40" r="5" fill="#7FD79A" />
                  </svg>
                  <p className="mt-3 font-mono text-caption text-mist-50/45">Basin signal field · Uttarakhand · live synthesis</p>
                </div>

                <div className="space-y-3" aria-label="Flood risk zones and required actions">
                  <div className="flex gap-3 rounded-lg border border-rudra-evacuate/30 bg-rudra-evacuate/10 p-4">
                    <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-rudra-evacuate" aria-hidden="true" />
                    <div><strong className="text-rudra-evacuate">Red · Extreme risk</strong><p className="mt-1 text-caption text-mist-50/65">Flooding is imminent or underway. Evacuate affected areas and activate emergency response.</p></div>
                  </div>
                  <div className="flex gap-3 rounded-lg border border-rudra-warn/30 bg-rudra-warn/10 p-4">
                    <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-rudra-warn" aria-hidden="true" />
                    <div><strong className="text-rudra-warn">Orange · High risk</strong><p className="mt-1 text-caption text-mist-50/65">Dangerous conditions are likely. Issue warnings, prepare shelters, and move people from vulnerable zones.</p></div>
                  </div>
                  <div className="flex gap-3 rounded-lg border border-rudra-watch/30 bg-rudra-watch/10 p-4">
                    <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-rudra-watch" aria-hidden="true" />
                    <div><strong className="text-rudra-watch">Yellow · Moderate risk</strong><p className="mt-1 text-caption text-mist-50/65">Conditions need close monitoring. Verify sensors, brief response teams, and prepare public advisories.</p></div>
                  </div>
                  <div className="flex gap-3 rounded-lg border border-rudra-safe/30 bg-rudra-safe/10 p-4">
                    <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-rudra-safe" aria-hidden="true" />
                    <div><strong className="text-rudra-safe">Green · Low risk</strong><p className="mt-1 text-caption text-mist-50/65">No immediate threat is detected. Continue routine monitoring and keep response plans ready.</p></div>
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
                Single signal systems see the flood after it arrives. Trishul sees the conditions that create it.
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
                  <p className="text-body text-mist-50/70 mb-6">Most current flood forecasting in India, including CWC's core method, still relies mainly on a single signal — either river water level observed upstream, or rainfall alone — rather than fusing ground, terrain, and seismic conditions together.</p>
                  <ul className="space-y-3 text-mist-50/70">
                    <li className="flex items-center gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rudra-evacuate flex-shrink-0" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span>No rainfall intensity tracking</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rudra-evacuate flex-shrink-0" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span>Ignores terrain/slope</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rudra-evacuate flex-shrink-0" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span>Single point failure</span>
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
                  <h3 className="font-display text-h3 text-mist-50 mb-4">Six signals.Early warning.</h3>
                  <p className="text-body text-mist-50/70 mb-6">Trishul doesn't just predict floods — it fuses six independent ground and satellite signals through a hybrid physics-plus-AI model built specifically for hilly terrain, where generic flood systems fail.
It turns that prediction into a 20+ minute head start and an alert that actually reaches the village, not just a dashboard for officials.</p>
                  <ul className="space-y-3 text-mist-50/70">
                    <li className="flex items-center gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rudra-safe flex-shrink-0" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      <span>Rainfall intensity + accumulation </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rudra-safe flex-shrink-0" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      <span>Soil Saturation + Terrain Susceptibility</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rudra-safe flex-shrink-0" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      <span>Detect Ground vibrations and slopes</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rudra-safe flex-shrink-0" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      <span>Track historical frequency</span>
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
                <div key={stat.label} className="flex h-full flex-col items-center" style={{ animationDelay: `${index * 60}ms` }}>
                  <div className="stat-number mb-2 flex h-14 items-center whitespace-nowrap animate-fade-in" style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'forwards', opacity: 0 }}>
                    {stat.value}
                  </div>
                  <div className="stat-label min-h-10 max-w-[13rem] text-center animate-fade-in" style={{ animationDelay: `${index * 60 + 100}ms`, animationFillMode: 'forwards', opacity: 0 }}>
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
