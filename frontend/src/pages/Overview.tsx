import { useMemo } from "react";
import { ShieldCheck, AlertTriangle, Radio, Clock } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { DemoBadge } from "@/components/DemoBadge";
import { ZoneCard } from "@/components/ZoneCard";
import { MapView } from "@/components/MapView";
import { AlertPanel } from "@/components/AlertPanel";
import { LEVEL_COLORS, formatRelativeTime } from "@/lib/riskColors";
import type { RiskLevel } from "@/types";
import clsx from "clsx";

function StatCard({ label, value, icon: Icon, tone = "text-white" }: { label: string; value: string | number; icon: any; tone?: string }) {
  return (
    <div className="rounded-xl border border-surface-700 bg-surface-800 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-surface-600">{label}</span>
        <Icon size={16} className="text-surface-600" />
      </div>
      <div className={clsx("mt-2 font-display text-2xl font-semibold", tone)}>{value}</div>
    </div>
  );
}

export default function Overview() {
  const { zones, riskByZone, sensorByZone, alerts, lastUpdate } = useApp();

  const counts = useMemo(() => {
    const c: Record<RiskLevel, number> = { Safe: 0, Watch: 0, Warning: 0, Evacuate: 0 };
    zones.forEach((z) => {
      const level = riskByZone[z.id]?.level ?? "Safe";
      c[level]++;
    });
    return c;
  }, [zones, riskByZone]);

  const activeAlerts = alerts.filter((a) => a.status === "active").length;
  const onlineCount = zones.filter((z) => sensorByZone[z.id]?.is_online !== false).length;
  const uptimePct = zones.length ? Math.round((onlineCount / zones.length) * 100) : 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Overview</h1>
          <p className="text-sm text-surface-600">District-wide flash-flood & landslide risk status</p>
        </div>
        <DemoBadge />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Zones" value={zones.length} icon={ShieldCheck} />
        <StatCard label="Safe" value={counts.Safe} icon={ShieldCheck} tone="text-safe-light" />
        <StatCard label="Watch" value={counts.Watch} icon={AlertTriangle} tone="text-watch-light" />
        <StatCard label="Warning" value={counts.Warning} icon={AlertTriangle} tone="text-warning-light" />
        <StatCard label="Evacuate" value={counts.Evacuate} icon={AlertTriangle} tone="text-evacuate-light" />
        <StatCard label="Active Alerts" value={activeAlerts} icon={Radio} tone={activeAlerts > 0 ? "text-evacuate-light" : "text-white"} />
      </div>

      <div className="flex items-center gap-4 text-xs text-surface-600">
        <span className="flex items-center gap-1.5">
          <Clock size={13} /> Last update: {formatRelativeTime(lastUpdate)}
        </span>
        <span>Sensor uptime: {uptimePct}%</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MapView zones={zones} riskByZone={riskByZone} sensorByZone={sensorByZone} height="420px" />
        </div>
        <div>
          <h2 className="mb-2 font-display text-sm font-semibold text-white">Recent Alerts</h2>
          <div className="max-h-[420px] overflow-y-auto pr-1">
            <AlertPanel alerts={alerts.slice(0, 6)} compact />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-display text-sm font-semibold text-white">Zones</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {zones.map((zone) => (
            <ZoneCard key={zone.id} zone={zone} risk={riskByZone[zone.id]} sensor={sensorByZone[zone.id]} />
          ))}
        </div>
      </div>
    </div>
  );
}
