import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, RudraBadge } from '@/components/ui';
import { ContourField } from '@/components/core';
import {
  BackendZone,
  BackendSensor,
  fetchZones,
  fetchCurrentRisk,
  fetchLatestSensors,
  fetchSimulationStatus,
  runSimulationScenario,
  stopSimulation,
  resetSimulation,
  RiskAssessment,
  SimulationStatus,
  SimulationScenario,
} from '@/lib/api';

const LEVEL_MAP: Record<string, 'safe' | 'watch' | 'warn' | 'evacuate'> = {
  Safe: 'safe',
  Watch: 'watch',
  Warning: 'warn',
  Evacuate: 'evacuate',
};

const SCENARIOS: { id: SimulationScenario; label: string; needsZone: boolean; description: string }[] = [
  {
    id: 'rapid_escalation',
    label: 'Run Rapid Escalation',
    needsZone: true,
    description: 'Deterministically walks the selected zone Safe → Watch → Warning → Evacuate over ~7 ticks while every other zone stays calm.',
  },
  {
    id: 'sensor_failure',
    label: 'Simulate Sensor Failure',
    needsZone: true,
    description: 'Takes the selected zone\'s sensor offline (battery drains, no readings) so you can show the "stale data" handling.',
  },
  {
    id: 'heavy_rain',
    label: 'Heavy Rain (All Zones)',
    needsZone: false,
    description: 'Elevates rainfall and soil saturation across every zone at once — useful for a regional-storm narrative.',
  },
  {
    id: 'normal',
    label: 'Resume Normal',
    needsZone: false,
    description: 'Gentle random walk around the safe baseline for every zone. Use this to calm things back down without a full reset.',
  },
];

export function SimulationControlPage() {
  const [zones, setZones] = useState<BackendZone[]>([]);
  const [risk, setRisk] = useState<Record<string, RiskAssessment>>({});
  const [sensors, setSensors] = useState<Record<string, BackendSensor>>({});
  const [status, setStatus] = useState<SimulationStatus | null>(null);
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<SimulationScenario | 'stop' | 'reset' | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [zonesList, riskList, sensorList, simStatus] = await Promise.all([
        fetchZones(),
        fetchCurrentRisk().catch(() => []),
        fetchLatestSensors().catch(() => []),
        fetchSimulationStatus().catch(() => null),
      ]);
      setZones(zonesList);
      setRisk(Object.fromEntries(riskList.map((r) => [r.zone_id, r])));
      setSensors(Object.fromEntries(sensorList.map((sensor) => [sensor.zone_id, sensor])));
      setStatus(simStatus);
      setError(null);
      if (!selectedZone && zonesList.length > 0) setSelectedZone(zonesList[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reach the backend.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedZone]);

  useEffect(() => {
    refresh();
    // Poll every 3s while a scenario is running so the judge sees the
    // Watch -> Warning -> Evacuate sweep happen live on this page too.
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRun = async (scenario: SimulationScenario, needsZone: boolean) => {
    setBusy(scenario);
    try {
      const next = await runSimulationScenario(scenario, needsZone ? selectedZone : undefined);
      setStatus(next);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start scenario.');
    } finally {
      setBusy(null);
    }
  };

  const handleStop = async () => {
    setBusy('stop');
    try {
      setStatus(await stopSimulation());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not stop simulation.');
    } finally {
      setBusy(null);
    }
  };

  const handleReset = async () => {
    setBusy('reset');
    try {
      setStatus(await resetSimulation());
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset simulation.');
    } finally {
      setBusy(null);
    }
  };

  const sourceLabel = (source?: string) => {
    if (source === 'weather_api') return 'Live (rainfall + soil) · tilt/vibration: no sensor';
    if (source === 'simulator') return 'Simulated';
    return source ? `Source: ${source}` : 'No sensor reading';
  };

  return (
    <div className="min-h-screen bg-mist-50 dark:bg-forest-950">
      <section className="section-py bg-forest-950 relative" aria-labelledby="sim-heading">
        <ContourField className="absolute inset-0" opacity={0.08} />
        <div className="relative container-main">
          <p className="font-mono text-caption text-fern-400 tracking-widest uppercase mb-4">
            Operator Tools
          </p>
          <h1 id="sim-heading" className="font-display text-hero-h1 font-medium text-mist-50 mb-4">
            Simulation Control
          </h1>
          <p className="text-body text-mist-50/70 max-w-2xl">
            Pick a zone, trigger a scenario, and watch it flow through the same ingestion → risk →
            alert pipeline real sensors would use. Great for showing judges an Evacuate alert on
            demand without waiting for real weather. Open the{' '}
            <Link to="/dashboard" className="underline hover:text-mist-50">Dashboard</Link> or{' '}
            <Link to="/status" className="underline hover:text-mist-50">Status page</Link> in another
            tab to watch it update live.
          </p>
        </div>
      </section>

      <section className="section-py">
        <div className="container-main space-y-8">
          {error && (
            <Card className="border-rudra-warn/40 bg-rudra-warn/5">
              <p className="text-body text-rudra-warn">
                {error} — make sure the backend is running at the configured API URL and reachable
                from this browser.
              </p>
            </Card>
          )}

          {/* Current simulation state */}
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-caption text-ink-900/60 dark:text-mist-50/60 uppercase tracking-wide mb-1">
                  Engine status
                </p>
                <p className="font-display text-h3 text-ink-900 dark:text-mist-50">
                  {status?.running ? `Running — ${status.scenario}` : 'Idle'}
                  {status?.target_zone_id && (
                    <span className="text-body font-sans text-ink-900/60 dark:text-mist-50/60">
                      {' '}(target: {zones.find((z) => z.id === status.target_zone_id)?.name ?? status.target_zone_id})
                    </span>
                  )}
                </p>
                {status?.running && (
                  <p className="text-caption text-ink-900/50 dark:text-mist-50/50 mt-1">
                    Tick {status.ticks_elapsed} · every {status.tick_interval_seconds}s
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" size="sm" onClick={handleStop} isLoading={busy === 'stop'}>
                  Stop
                </Button>
                <Button variant="secondary" size="sm" onClick={handleReset} isLoading={busy === 'reset'}>
                  Reset All Zones
                </Button>
              </div>
            </div>
          </Card>

          {/* Zone picker */}
          <Card>
            <h2 className="font-display text-h3 text-ink-900 dark:text-mist-50 mb-4">
              1. Choose a target zone
            </h2>
            {loading ? (
              <p className="text-body text-ink-900/60 dark:text-mist-50/60">Loading zones…</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {zones.map((zone) => {
                  const level = risk[zone.id]?.level;
                  const source = sensors[zone.id]?.source;
                  const isSelected = selectedZone === zone.id;
                  return (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => setSelectedZone(zone.id)}
                      className={`text-left p-4 rounded-card border transition-colors duration-200 ${
                        isSelected
                          ? 'border-signal-amber bg-signal-amber/10'
                          : 'border-stone-200 dark:border-moss-600 hover:border-signal-amber/50'
                      }`}
                    >
                      <p className="font-sans font-medium text-ink-900 dark:text-mist-50 mb-2">
                        {zone.name}
                      </p>
                      <RudraBadge level={level ? LEVEL_MAP[level] : 'safe'} size="sm" />
                      <p className="text-caption text-ink-900/50 dark:text-mist-50/50 mt-2">
                        {sourceLabel(source)}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Scenarios */}
          <Card>
            <h2 className="font-display text-h3 text-ink-900 dark:text-mist-50 mb-4">
              2. Run a scenario
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {SCENARIOS.map((sc) => (
                <div
                  key={sc.id}
                  className="p-4 rounded-card border border-stone-200 dark:border-moss-600 flex flex-col justify-between"
                >
                  <div className="mb-4">
                    <p className="font-sans font-medium text-ink-900 dark:text-mist-50 mb-1">
                      {sc.label}
                    </p>
                    <p className="text-caption text-ink-900/60 dark:text-mist-50/60">
                      {sc.description}
                    </p>
                  </div>
                  <Button
                    variant={sc.id === 'rapid_escalation' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => handleRun(sc.id, sc.needsZone)}
                    isLoading={busy === sc.id}
                    disabled={sc.needsZone && !selectedZone}
                  >
                    {sc.label}
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Live zone readout */}
          <Card>
            <h2 className="font-display text-h3 text-ink-900 dark:text-mist-50 mb-4">
              Live zone status
            </h2>
            <div className="space-y-3">
              {zones.map((zone) => {
                const r = risk[zone.id];
                const source = sensors[zone.id]?.source;
                return (
                  <div
                    key={zone.id}
                    className="flex items-center justify-between p-3 rounded-btn bg-stone-100 dark:bg-forest-800"
                  >
                    <div>
                      <p className="font-sans text-ink-900 dark:text-mist-50">{zone.name}</p>
                      {r && (
                        <p className="text-caption text-ink-900/50 dark:text-mist-50/50">
                          Score {Math.round(r.score)} · {r.recommended_action}
                        </p>
                      )}
                      <p className="text-caption text-ink-900/50 dark:text-mist-50/50 mt-1">
                        {sourceLabel(source)}
                      </p>
                    </div>
                    <RudraBadge
                      level={r ? LEVEL_MAP[r.level] : 'safe'}
                      pulse={r?.level === 'Evacuate' || r?.level === 'Warning'}
                    />
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
