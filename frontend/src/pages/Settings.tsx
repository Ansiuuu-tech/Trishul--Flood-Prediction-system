import { useEffect, useState } from "react";
import { ShieldCheck, User, Wrench, Settings as SettingsIcon } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { DemoBadge } from "@/components/DemoBadge";
import * as api from "@/api/client";
import type { HealthStatus, UserRole } from "@/types";
import clsx from "clsx";

const ROLES: { id: UserRole; label: string; description: string }[] = [
  { id: "viewer", label: "Viewer", description: "View dashboard, map, zones, alerts, and analytics." },
  { id: "operator", label: "Operator", description: "Viewer permissions + acknowledge/resolve alerts, run simulations." },
  { id: "administrator", label: "Administrator", description: "Operator permissions + manage settings and alert channels." },
];

export default function Settings() {
  const { role, setRole } = useApp();
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    api.getHealth().then(setHealth).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Settings</h1>
          <p className="text-sm text-surface-600">Demo login, system status, and alert channel configuration</p>
        </div>
        <DemoBadge />
      </div>

      <div className="rounded-xl border border-surface-700 bg-surface-800 p-5">
        <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-white">
          <User size={16} /> Demo login / role
        </h2>
        <p className="mt-1 text-xs text-surface-600">
          No password auth in this prototype — pick a role to see how the UI adapts to permissions.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {ROLES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              className={clsx(
                "rounded-lg border p-3 text-left transition-colors",
                role === r.id ? "border-accent bg-accent/10" : "border-surface-700 bg-surface-700/40 hover:bg-surface-700"
              )}
            >
              <div className="flex items-center gap-2 font-medium text-white">
                {role === r.id && <ShieldCheck size={14} className="text-accent-light" />}
                {r.label}
              </div>
              <p className="mt-1 text-xs text-surface-600">{r.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-surface-700 bg-surface-800 p-5">
        <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-white">
          <Wrench size={16} /> System status
        </h2>
        {health ? (
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <InfoRow label="API status" value={health.status} />
            <InfoRow label="Demo mode" value={health.demo_mode ? "Enabled" : "Disabled"} />
            <InfoRow label="Model version" value={health.model_version} />
            <InfoRow label="Database" value={health.database} />
            <InfoRow label="Telegram alerts" value={health.telegram_configured ? "Configured" : "Demo mode"} />
            <InfoRow label="Email alerts" value={health.email_configured ? "Configured" : "Demo mode"} />
          </div>
        ) : (
          <p className="mt-3 text-xs text-surface-600">Loading system status…</p>
        )}
      </div>

      <div className="rounded-xl border border-surface-700 bg-surface-800 p-5">
        <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-white">
          <SettingsIcon size={16} /> About this demo
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-surface-600">
          HimalayaShield is a hackathon decision-support prototype for hyper-local flash-flood and landslide
          early warning. All 8 zones, sensor readings, and locations shown are fictional and used only to
          demonstrate the risk-fusion pipeline. This tool is <span className="text-warning-light">not certified for
          operational emergency decisions</span>. Telegram/email alert delivery activates automatically once
          credentials are set in the backend .env file; until then, deliveries are marked "demo mode" and no
          external network calls are made.
        </p>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-surface-600">{label}</div>
      <div className="mt-0.5 capitalize text-white">{value}</div>
    </div>
  );
}
