import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useApp } from "@/context/AppContext";
import { DemoBadge } from "@/components/DemoBadge";
import { LEVEL_COLORS } from "@/lib/riskColors";

export default function Analytics() {
  const { zones, riskByZone, alerts } = useApp();

  const scoreData = useMemo(
    () =>
      zones
        .map((z) => ({
          name: z.name,
          score: riskByZone[z.id]?.score ?? 0,
          level: riskByZone[z.id]?.level ?? "Safe",
        }))
        .sort((a, b) => b.score - a.score),
    [zones, riskByZone]
  );

  const alertsByZone = useMemo(() => {
    const counts: Record<string, number> = {};
    alerts.forEach((a) => {
      counts[a.zone_id] = (counts[a.zone_id] || 0) + 1;
    });
    return zones
      .map((z) => ({ name: z.name, alerts: counts[z.id] || 0 }))
      .sort((a, b) => b.alerts - a.alerts);
  }, [zones, alerts]);

  const populationAtRisk = useMemo(
    () =>
      zones.reduce((sum, z) => {
        const level = riskByZone[z.id]?.level;
        return level === "Warning" || level === "Evacuate" ? sum + z.population : sum;
      }, 0),
    [zones, riskByZone]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Analytics</h1>
          <p className="text-sm text-surface-600">District-wide comparisons across all zones</p>
        </div>
        <DemoBadge />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-surface-700 bg-surface-800 p-4">
          <div className="text-xs text-surface-600">Population in Warning/Evacuate zones</div>
          <div className="mt-1 font-display text-2xl font-semibold text-evacuate-light">
            {populationAtRisk.toLocaleString()}
          </div>
        </div>
        <div className="rounded-xl border border-surface-700 bg-surface-800 p-4">
          <div className="text-xs text-surface-600">Total alerts generated</div>
          <div className="mt-1 font-display text-2xl font-semibold text-white">{alerts.length}</div>
        </div>
        <div className="rounded-xl border border-surface-700 bg-surface-800 p-4">
          <div className="text-xs text-surface-600">Average risk score</div>
          <div className="mt-1 font-display text-2xl font-semibold text-white">
            {(scoreData.reduce((s, d) => s + d.score, 0) / (scoreData.length || 1)).toFixed(1)}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-surface-700 bg-surface-800 p-4">
        <h3 className="mb-3 font-display text-sm font-semibold text-white">Current risk score by zone</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={scoreData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
            <XAxis dataKey="name" tick={{ fill: "#7a8ba1", fontSize: 10 }} axisLine={{ stroke: "#2a3a4d" }} interval={0} angle={-25} textAnchor="end" height={60} />
            <YAxis domain={[0, 100]} tick={{ fill: "#7a8ba1", fontSize: 11 }} axisLine={{ stroke: "#2a3a4d" }} />
            <Tooltip contentStyle={{ background: "#161f2c", border: "1px solid #2a3a4d", borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="score" radius={[4, 4, 0, 0]}>
              {scoreData.map((d, i) => (
                <Cell key={i} fill={LEVEL_COLORS[d.level as keyof typeof LEVEL_COLORS].hex} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-surface-700 bg-surface-800 p-4">
        <h3 className="mb-3 font-display text-sm font-semibold text-white">Alerts generated per zone</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={alertsByZone} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
            <XAxis dataKey="name" tick={{ fill: "#7a8ba1", fontSize: 10 }} axisLine={{ stroke: "#2a3a4d" }} interval={0} angle={-25} textAnchor="end" height={60} />
            <YAxis allowDecimals={false} tick={{ fill: "#7a8ba1", fontSize: 11 }} axisLine={{ stroke: "#2a3a4d" }} />
            <Tooltip contentStyle={{ background: "#161f2c", border: "1px solid #2a3a4d", borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="alerts" fill="#3b9dd8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
