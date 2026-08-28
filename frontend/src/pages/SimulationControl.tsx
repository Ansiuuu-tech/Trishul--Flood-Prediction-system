import { useState } from "react";
import { CloudRain, Zap, WifiOff, Play, Square, RotateCcw, Waves } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { DemoBadge } from "@/components/DemoBadge";
import { LEVEL_COLORS } from "@/lib/riskColors";
import type { ScenarioName } from "@/types";
import clsx from "clsx";

const SCENARIOS: { id: ScenarioName; label: string; description: string; icon: any }[] = [
  { id: "normal", label: "Normal", description: "Gentle baseline readings across all zones.", icon: Waves },
  { id: "heavy_rain", label: "Heavy Rain", description: "Elevated rainfall & soil moisture district-wide.", icon: CloudRain },
  { id: "rapid_escalation", label: "Run Rapid Escalation", description: "One zone sweeps Safe → Watch → Warning → Evacuate.", icon: Zap },
  { id: "sensor_failure", label: "Sensor Failure", description: "One zone's sensor goes offline.", icon: WifiOff },
];

export default function SimulationControl() {
  const { zones, simulation, runScenario, stopSim, resetSim, role, riskByZone } = useApp();
  const [targetZone, setTargetZone] = useState(zones[0]?.id ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const canOperate = role === "operator" || role === "administrator";

  const needsZone = (s: ScenarioName) => s === "rapid_escalation" || s === "sensor_failure";

  const handleRun = async (scenario: ScenarioName) => {
    setBusy(scenario);
    try {
      await runScenario(scenario, needsZone(scenario) ? targetZone || zones[0]?.id : undefined);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Simulation Control</h1>
          <p className="text-sm text-surface-600">Drive the demo without physical hardware</p>
        </div>
        <DemoBadge />
      </div>

      {!canOperate && (
        <div className="rounded-lg border border-watch/40 bg-watch-bg px-4 py-2 text-xs text-watch-light">
          Viewer role: simulations can only be run by an Operator or Administrator. Switch role in Settings.
        </div>
      )}

      <div className="rounded-xl border border-surface-700 bg-surface-800 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm">
            <span className="text-surface-600">Status: </span>
            <span className={clsx("font-medium", simulation?.running ? "text-safe-light" : "text-surface-600")}>
              {simulation?.running ? "Running" : "Stopped"}
            </span>
            {simulation?.running && (
              <span className="ml-3 text-surface-600">
                scenario: <span className="text-white">{simulation.scenario}</span>
                {simulation.target_zone_id && (
                  <>
                    {" "}· target: <span className="text-white">{zones.find((z) => z.id === simulation.target_zone_id)?.name}</span>
                  </>
                )}
                {" "}· ticks: <span className="font-mono text-white">{simulation.ticks_elapsed}</span>
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={stopSim}
              disabled={!canOperate || !simulation?.running}
              className="flex items-center gap-1.5 rounded-lg bg-surface-700 px-3 py-1.5 text-xs text-white hover:bg-surface-600 disabled:opacity-40"
            >
              <Square size={12} /> Stop
            </button>
            <button
              onClick={resetSim}
              disabled={!canOperate}
              className="flex items-center gap-1.5 rounded-lg bg-surface-700 px-3 py-1.5 text-xs text-white hover:bg-surface-600 disabled:opacity-40"
            >
              <RotateCcw size={12} /> Reset all zones
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs text-surface-600">Target zone (for Rapid Escalation / Sensor Failure)</label>
        <select
          value={targetZone}
          onChange={(e) => setTargetZone(e.target.value)}
          disabled={!canOperate}
          className="w-full max-w-sm rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name} — currently {riskByZone[z.id]?.level ?? "Safe"}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SCENARIOS.map(({ id, label, description, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleRun(id)}
            disabled={!canOperate || busy === id}
            className={clsx(
              "flex items-start gap-3 rounded-xl border p-5 text-left transition-colors disabled:opacity-40",
              id === "rapid_escalation"
                ? "border-evacuate/50 bg-evacuate-bg hover:bg-evacuate-bg/80"
                : "border-surface-700 bg-surface-800 hover:bg-surface-700"
            )}
          >
            <Icon size={22} className={id === "rapid_escalation" ? "text-evacuate-light" : "text-accent"} />
            <div>
              <div className="flex items-center gap-2 font-display text-base font-semibold text-white">
                {label}
                {busy === id && <Play size={14} className="animate-pulse text-accent-light" />}
              </div>
              <p className="mt-1 text-xs text-surface-600">{description}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-surface-700 bg-surface-800 p-4">
        <h3 className="font-display text-sm font-semibold text-white">How the demo works</h3>
        <p className="mt-2 text-xs text-surface-600">
          Each tick (every {simulation?.tick_interval_seconds ?? 2}s) the simulator generates rainfall, soil moisture,
          slope tilt, and vibration readings, which pass through the same risk-fusion engine and alert pipeline real
          hardware would use. "Run Rapid Escalation" scripts the target zone through a deterministic sequence so it
          sweeps Safe → Watch → Warning → Evacuate over ~7 ticks (~14 seconds), generating an alert at each
          escalation. Watch the Overview or Live Map page to see it update in real time.
        </p>
      </div>
    </div>
  );
}
