import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { AlertPanel } from "@/components/AlertPanel";
import { DemoBadge } from "@/components/DemoBadge";
import * as api from "@/api/client";
import clsx from "clsx";

const FILTERS = ["all", "active", "acknowledged", "resolved"] as const;
type Filter = (typeof FILTERS)[number];

export default function AlertsCenter() {
  const { alerts, refresh, role } = useApp();
  const [filter, setFilter] = useState<Filter>("all");
  const [sending, setSending] = useState(false);

  const filtered = filter === "all" ? alerts : alerts.filter((a) => a.status === filter);

  const handleTestAlert = async () => {
    setSending(true);
    try {
      await api.sendTestAlert();
      await refresh();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Alerts Center</h1>
          <p className="text-sm text-surface-600">All escalation alerts, always saved and shown in-app</p>
        </div>
        <DemoBadge />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                "rounded-full px-3 py-1.5 text-xs capitalize transition-colors",
                filter === f ? "bg-accent text-white" : "bg-surface-800 text-surface-600 hover:text-white"
              )}
            >
              {f} {f !== "all" && `(${alerts.filter((a) => a.status === f).length})`}
            </button>
          ))}
        </div>
        {(role === "operator" || role === "administrator") && (
          <button
            onClick={handleTestAlert}
            disabled={sending}
            className="rounded-lg bg-surface-700 px-3 py-1.5 text-xs text-white hover:bg-surface-600 disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send test alert"}
          </button>
        )}
      </div>

      <AlertPanel alerts={filtered} />
    </div>
  );
}
