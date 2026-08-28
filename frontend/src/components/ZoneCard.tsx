import { Link } from "react-router-dom";
import { AlertTriangle, Wifi, WifiOff } from "lucide-react";
import type { RiskAssessment, SensorReading, Zone } from "@/types";
import { LEVEL_COLORS, OFFLINE_COLOR } from "@/lib/riskColors";
import clsx from "clsx";

export function ZoneCard({
  zone,
  risk,
  sensor,
}: {
  zone: Zone;
  risk?: RiskAssessment;
  sensor?: SensorReading;
}) {
  const level = risk?.level ?? "Safe";
  const colors = sensor && !sensor.is_online ? OFFLINE_COLOR : LEVEL_COLORS[level];
  const isOffline = sensor && !sensor.is_online;

  return (
    <Link
      to={`/zones/${zone.id}`}
      className={clsx(
        "block rounded-xl border bg-surface-800 p-4 transition-transform hover:-translate-y-0.5 hover:shadow-lg",
        colors.border
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="font-display text-base font-semibold text-white">{zone.name}</div>
          <div className="text-xs text-surface-600">Pop. {zone.population.toLocaleString()}</div>
        </div>
        <div className="flex items-center gap-1">
          {isOffline ? (
            <WifiOff size={14} className="text-offline-light" />
          ) : (
            <Wifi size={14} className="text-safe-light" />
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className={clsx("h-2.5 w-2.5 rounded-full", colors.dot)} />
        <span className={clsx("text-sm font-semibold", colors.text)}>{isOffline ? "Offline" : level}</span>
        {risk && <span className="ml-auto font-mono text-xs text-surface-600">{risk.score.toFixed(0)}/100</span>}
      </div>

      {risk && (level === "Warning" || level === "Evacuate") && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-warning-light">
          <AlertTriangle size={12} />
          <span className="truncate">{risk.recommended_action}</span>
        </div>
      )}
    </Link>
  );
}
