import { AlertTriangle, Check, CheckCheck, Clock } from "lucide-react";
import type { Alert } from "@/types";
import { LEVEL_COLORS } from "@/lib/riskColors";
import { formatRelativeTime } from "@/lib/riskColors";
import { useApp } from "@/context/AppContext";
import clsx from "clsx";

export function AlertPanel({ alerts, compact = false }: { alerts: Alert[]; compact?: boolean }) {
  const { ackAlert, resolveAlertById, zones, role } = useApp();
  const canAct = role === "operator" || role === "administrator";

  if (alerts.length === 0) {
    return (
      <div className="rounded-xl border border-surface-700 bg-surface-800 p-6 text-center text-sm text-surface-600">
        No alerts yet. Alerts appear here when a zone's risk level escalates.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => {
        const colors = LEVEL_COLORS[alert.level];
        const zoneName = zones.find((z) => z.id === alert.zone_id)?.name ?? alert.zone_id;
        return (
          <div key={alert.id} className={clsx("rounded-lg border bg-surface-800 p-3", colors.border)}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={16} className={clsx("mt-0.5 shrink-0", colors.text)} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{zoneName}</span>
                    <span className={clsx("rounded px-1.5 py-0.5 text-[10px] font-bold uppercase", colors.bg, colors.text)}>
                      {alert.previous_level} → {alert.level}
                    </span>
                  </div>
                  {!compact && <p className="mt-1 text-xs text-surface-600">{alert.message}</p>}
                  <div className="mt-1.5 flex items-center gap-3 text-[11px] text-surface-600">
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {formatRelativeTime(alert.created_at)}
                    </span>
                    <span className="capitalize">{alert.status}</span>
                    {alert.delivery_channels.includes("telegram_demo_mode") && (
                      <span className="rounded bg-surface-700 px-1.5 py-0.5">Telegram: demo mode</span>
                    )}
                  </div>
                </div>
              </div>
              {canAct && alert.status === "active" && (
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => ackAlert(alert.id)}
                    className="flex items-center gap-1 rounded-md bg-surface-700 px-2 py-1 text-[11px] text-white hover:bg-surface-600"
                  >
                    <Check size={12} /> Acknowledge
                  </button>
                  <button
                    onClick={() => resolveAlertById(alert.id)}
                    className="flex items-center gap-1 rounded-md bg-accent/20 px-2 py-1 text-[11px] text-accent-light hover:bg-accent/30"
                  >
                    <CheckCheck size={12} /> Resolve
                  </button>
                </div>
              )}
              {alert.status === "acknowledged" && canAct && (
                <button
                  onClick={() => resolveAlertById(alert.id)}
                  className="flex shrink-0 items-center gap-1 rounded-md bg-accent/20 px-2 py-1 text-[11px] text-accent-light hover:bg-accent/30"
                >
                  <CheckCheck size={12} /> Resolve
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
