import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { ContourField, DamageScene, LiveMap } from '@/components/core';
import { LiveIndicator } from '@/components/dashboard';
import { KAILASH_BG } from '@/components/core/FeaturePage';
import { LiveTicker, LiveZoneStrip, TopRiskCallout } from '@/components/home';
import { fetchAllHistoricalEvents, fetchCurrentRisk, fetchHealth, fetchLatestSensors, fetchZones, type BackendSensor, type BackendZone, type RiskAssessment } from '@/lib/api';
import { useLiveFeed } from '@/hooks/useLiveFeed';

const IMD_RADAR_URL = 'https://mausam.imd.gov.in/Radar/MOSAIC/Converted/mosaic.gif';
const IMD_SATELLITE_URL = 'https://mausam.imd.gov.in/Satellite/3Dasiasec_ir1.jpg';
const IMD_LIGHTNING_URL = 'https://mausam.imd.gov.in/lightning/Converted/BT.gif';

const stats = [
  { value: '7.38 Mha', label: 'Average area affected annually' },
  { value: '1.2 million', label: 'Average houses damaged annually' },
  { value: '1,666', label: 'Average human lives lost annually' },
  { value: '₹6,972 crore', label: 'Average annual economic loss' },
];

const levelToRudra = (level: string): 'safe' | 'watch' | 'warn' | 'evacuate' => ({ Safe: 'safe', Watch: 'watch', Warning: 'warn', Evacuate: 'evacuate' }[level] || 'safe') as 'safe' | 'watch' | 'warn' | 'evacuate';

function LeadTime({ minutes }: { minutes: number }) {
  const [remaining, setRemaining] = useState(minutes * 60);
  useEffect(() => { setRemaining(minutes * 60); const timer = setInterval(() => setRemaining((s) => Math.max(0, s - 1)), 1000); return () => clearInterval(timer); }, [minutes]);
  return <span className="font-mono text-caption text-rudra-warn">Lead time {String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}</span>;
}

export function HomePage() {
  const live = useLiveFeed();
  const [zones, setZones] = useState<BackendZone[]>([]);
  const [risks, setRisks] = useState<Record<string, RiskAssessment>>({});
  const [sensors, setSensors] = useState<Record<string, BackendSensor>>({});
  const [historicalEvents, setHistoricalEvents] = useState<Awaited<ReturnType<typeof fetchAllHistoricalEvents>>>([]);
  const [isDemo, setIsDemo] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([fetchZones(), fetchCurrentRisk(), fetchLatestSensors(), fetchAllHistoricalEvents(), fetchHealth()]).then(([zoneResult, riskResult, sensorResult, eventResult, healthResult]) => {
      if (cancelled) return;
      if (zoneResult.status === 'fulfilled') setZones(zoneResult.value);
      if (riskResult.status === 'fulfilled') setRisks(Object.fromEntries(riskResult.value.map((risk) => [risk.zone_id, risk])));
      if (sensorResult.status === 'fulfilled') setSensors(Object.fromEntries(sensorResult.value.map((sensor) => [sensor.zone_id, sensor])));
      if (eventResult.status === 'fulfilled') setHistoricalEvents(eventResult.value);
      if (healthResult.status === 'fulfilled') setIsDemo(healthResult.value?.demo_mode ?? null);
    });
    return () => { cancelled = true; };
  }, []);

  const mapMarkers = useMemo(() => zones.map((zone) => {
    const update = live.latestRiskByZone[zone.id];
    const risk = update || risks[zone.id];
    return { id: zone.id, name: zone.name, district: zone.district, lat: zone.latitude, lng: zone.longitude, rudraLevel: levelToRudra(risk?.level || 'Safe'), shaktiScore: risk?.score ?? 0 };
  }), [zones, risks, live.latestRiskByZone]);
  const historicalMarkers = useMemo(() => historicalEvents.flatMap((event) => {
    const zone = zones.find((candidate) => candidate.id === event.zone_id);
    return zone ? [{ id: event.id, lat: zone.latitude, lng: zone.longitude, label: event.event_type, date: event.event_date, severity: event.severity }] : [];
  }), [historicalEvents, zones]);
  const effectiveRisks = useMemo(() => zones.map((zone) => live.latestRiskByZone[zone.id] || risks[zone.id]).filter(Boolean), [zones, risks, live.latestRiskByZone]);
  const topRisk = useMemo(() => [...effectiveRisks].sort((a, b) => b.score - a.score)[0], [effectiveRisks]);
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

        <section className="bg-forest-950 pb-12" aria-label="Current highest risk">
          <div className="container-main">
            {topRisk ? <div className="max-w-3xl"><TopRiskCallout zoneName={zones.find((zone) => zone.id === topRisk.zone_id)?.name || topRisk.zone_id} score={topRisk.score} level={topRisk.level} reason={topRisk.reasons?.[0]} recommendedAction={topRisk.recommended_action} />
              {(topRisk.level === 'Warning' || topRisk.level === 'Evacuate') && topRisk.estimated_lead_time_minutes > 0 ? <div className="mt-3"><LeadTime minutes={topRisk.estimated_lead_time_minutes} /></div> : null}
            </div> : <div className="max-w-3xl rounded-card border border-moss-600 bg-forest-800 p-6 text-mist-50/65">Loading current zone status…</div>}
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

        <section className="section-py bg-mist-50 dark:bg-forest-900" aria-labelledby="model-trust-heading">
          <div className="container-main grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <p className="font-mono text-caption text-accent-light tracking-widest uppercase mb-3">Model trust</p>
              <h2 id="model-trust-heading" className="font-display text-h2 text-ink-900 dark:text-mist-50 mb-4">Validation that respects time</h2>
              {/* Update shap_summary.png + the ROC-AUC line below whenever train.py is re-run. */}
              <p className="text-body text-ink-900/70 dark:text-mist-50/70">ROC-AUC 0.9867 on a strict time-based split: trained on 2013–2022 and tested on 2023–2025, never on shuffled records.</p>
              <p className="mt-3 text-body text-ink-900/70 dark:text-mist-50/70">Top predictors (SHAP): 3-day rainfall accumulation and soil moisture.</p>
            </div>
            <div className="rounded-card border border-moss-600 bg-white/40 p-4 dark:bg-forest-800">
              <img src="/images/shap_summary.png" alt="SHAP feature-importance summary for the deployed risk model" className="w-full" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
              <p className="text-caption text-ink-900/50 dark:text-mist-50/50">Feature-importance artifact is shown when the training output is included in the deployment.</p>
            </div>
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
                <LiveIndicator resetKey={Object.keys(live.latestRiskByZone).length ? JSON.stringify(live.latestRiskByZone) : 'init'} label={live.connected ? 'Live' : 'Reconnecting'} />
              </div>

              <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
                <div>
                  <div className="overflow-hidden rounded-lg border border-moss-600" style={{ height: 420 }}>
                    <LiveMap zoneMarkers={mapMarkers} historicalMarkers={historicalMarkers} liveRiskByZone={live.latestRiskByZone} liveSensorByZone={live.latestSensorByZone} zoom={7.5} showUserLocation={false} />
                  </div>
                  <div className="mt-4 space-y-4">
                    <LiveTicker events={live.recentEvents} isDemo={isDemo} />
                    <LiveZoneStrip zones={zones} sensors={sensors} liveSensors={live.latestSensorByZone} />
                  </div>
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
            <div className="mt-10 grid grid-cols-2 gap-4 border-t border-moss-600 pt-6 text-center sm:max-w-xl sm:mx-auto">
              <div><p className="font-mono text-xl text-mist-50">{zones.length || '—'}</p><p className="text-caption text-mist-50/60">villages monitored</p></div>
              <div><p className="font-mono text-xl text-mist-50">{zones.length ? Object.values(sensors).filter((sensor) => sensor.is_online).length : '—'}</p><p className="text-caption text-mist-50/60">sensors reporting now</p></div>
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
