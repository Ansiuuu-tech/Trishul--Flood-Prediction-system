import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Users, Mountain as MountainIcon, AlertCircle, Navigation, Clock } from "lucide-react";
import { useApp } from "@/context/AppContext";
import * as api from "@/api/client";
import { LEVEL_COLORS } from "@/lib/riskColors";
import { TrendChart } from "@/components/TrendChart";
import type { HistoricalEvent, RiskAssessment, SensorReading } from "@/types";
import clsx from "clsx";

export default function ZoneDetail() {
  const { zoneId } = useParams<{ zoneId: string }>();
  const { zones, riskByZone, sensorByZone } = useApp();
  const [riskHistory, setRiskHistory] = useState<RiskAssessment[]>([]);
  const [sensorHistory, setSensorHistory] = useState<SensorReading[]>([]);
  const [events, setEvents] = useState<HistoricalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const zone = zones.find((z) => z.id === zoneId);
  const risk = zoneId ? riskByZone[zoneId] : undefined;
  const sensor = zoneId ? sensorByZone[zoneId] : undefined;

  useEffect(() => {
    if (!zoneId) return;
    setLoading(true);
    Promise.all([api.getZoneRiskHistory(zoneId, 60), api.getZoneSensorReadings(zoneId, 60), api.getZoneHistory(zoneId)])
      .then(([rh, sh, zh]) => {
        setRiskHistory(rh);
        setSensorHistory(sh);
        setEvents(zh.historical_events);
      })
      .finally(() => setLoading(false));
  }, [zoneId, risk?.created_at]);

  if (!zone) {
    return (
      <div className="text-sm text-surface-600">
        Zone not found. <Link to="/" className="text-accent">Back to overview</Link>
      </div>
    );
  }

  const colors = LEVEL_COLORS[risk?.level ?? "Safe"];
  const riskChartData = riskHistory.map((r, i) => ({ t: i, Score: r.score }));
  const sensorChartData = sensorHistory.map((s, i) => ({
    t: i,
    Rainfall: s.rainfall_mm_3h,
    Soil: s.soil_moisture_pct,
    Tilt: s.tilt_degrees,
    Vibration: s.vibration_g,
  }));

  return (
    <div className="space-y-6">
      <Link to="/" className="flex w-fit items-center gap-1.5 text-sm text-surface-600 hover:text-white">
        <ArrowLeft size={14} /> Back to overview
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">{zone.name}</h1>
          <p className="mt-1 text-sm text-surface-600">{zone.description}</p>
          {zone.is_fictional && <p className="mt-1 text-[11px] italic text-surface-600">Fictional demo location.</p>}
        </div>
        <div className={clsx("flex items-center gap-2 rounded-lg border px-4 py-2", colors.border, colors.bg)}>
          <span className={clsx("h-3 w-3 rounded-full", colors.dot)} />
          <span className={clsx("font-display text-lg font-semibold", colors.text)}>{risk?.level ?? "Safe"}</span>
          <span className="text-sm text-surface-600">{risk?.score.toFixed(1) ?? "0.0"}/100</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <InfoStat icon={Users} label="Population" value={zone.population.toLocaleString()} />
        <InfoStat icon={MountainIcon} label="Elevation" value={`${zone.elevation_m}m`} />
        <InfoStat icon={MountainIcon} label="Slope" value={`${zone.slope_degrees}°`} />
        <InfoStat icon={MapPin} label="Terrain risk" value={`${zone.terrain_risk}/100`} />
      </div>

      {risk && (
        <div className="rounded-xl border border-surface-700 bg-surface-800 p-5">
          <h2 className="font-display text-sm font-semibold text-white">Why this risk level?</h2>
          <ul className="mt-3 space-y-1.5">
            {risk.reasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-surface-300">
                <AlertCircle size={14} className={clsx("mt-0.5 shrink-0", colors.text)} />
                {reason}
              </li>
            ))}
          </ul>
          {risk.data_quality_warning && (
            <div className="mt-3 rounded-lg bg-offline-bg px-3 py-2 text-xs text-offline-light">
              Data quality: {risk.data_quality_warning}
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-surface-700/50 p-3">
              <div className="text-xs text-surface-600">Recommended action</div>
              <div className="mt-1 text-sm text-white">{risk.recommended_action}</div>
            </div>
            <div className="rounded-lg bg-surface-700/50 p-3">
              <div className="flex items-center gap-1.5 text-xs text-surface-600">
                <Clock size={12} /> Estimated lead time
              </div>
              <div className="mt-1 text-sm text-white">
                {risk.estimated_lead_time_minutes > 0 ? `${risk.estimated_lead_time_minutes} minutes` : "N/A"}
              </div>
            </div>
            <div className="rounded-lg bg-surface-700/50 p-3">
              <div className="text-xs text-surface-600">Confidence</div>
              <div className="mt-1 text-sm text-white">{Math.round(risk.confidence * 100)}%</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-surface-700/50 p-3">
              <div className="flex items-center gap-1.5 text-xs text-surface-600">
                <Navigation size={12} /> Safe location
              </div>
              <div className="mt-1 text-sm text-white">{zone.safe_location}</div>
            </div>
            <div className="rounded-lg bg-surface-700/50 p-3">
              <div className="text-xs text-surface-600">Evacuation route</div>
              <div className="mt-1 text-sm text-white">{zone.evacuation_route}</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-surface-700 bg-surface-800 p-4">
          <h3 className="mb-2 font-display text-sm font-semibold text-white">Risk score trend</h3>
          <TrendChart data={riskChartData} series={[{ key: "Score", color: "#3b9dd8", label: "Risk score" }]} yLabel="Score" />
        </div>
        <div className="rounded-xl border border-surface-700 bg-surface-800 p-4">
          <h3 className="mb-2 font-display text-sm font-semibold text-white">Sensor readings</h3>
          <TrendChart
            data={sensorChartData}
            series={[
              { key: "Rainfall", color: "#3b9dd8", label: "Rainfall 3h (mm)" },
              { key: "Soil", color: "#22c55e", label: "Soil moisture (%)" },
              { key: "Tilt", color: "#eab308", label: "Tilt (°)" },
              { key: "Vibration", color: "#ef4444", label: "Vibration (g)" },
            ]}
          />
        </div>
      </div>

      {events.length > 0 && (
        <div className="rounded-xl border border-surface-700 bg-surface-800 p-5">
          <h3 className="font-display text-sm font-semibold text-white">Historical incidents</h3>
          <ul className="mt-3 space-y-2">
            {events.map((e) => (
              <li key={e.id} className="text-sm text-surface-300">
                <span className="font-medium capitalize text-white">{e.event_type.replace("_", " ")}</span>{" "}
                <span className="text-surface-600">({new Date(e.event_date).getFullYear()}, {e.severity})</span>
                {" — "}
                {e.description}
              </li>
            ))}
          </ul>
        </div>
      )}

      {loading && <div className="text-xs text-surface-600">Loading history…</div>}
    </div>
  );
}

function InfoStat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-surface-700 bg-surface-800 p-3">
      <div className="flex items-center gap-1.5 text-xs text-surface-600">
        <Icon size={13} /> {label}
      </div>
      <div className="mt-1 font-display text-lg text-white">{value}</div>
    </div>
  );
}
