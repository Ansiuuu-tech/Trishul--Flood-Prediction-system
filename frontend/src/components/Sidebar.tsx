import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Map,
  Mountain,
  Bell,
  PlayCircle,
  BarChart3,
  Settings,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import clsx from "clsx";

const NAV_ITEMS = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/map", label: "Live Map", icon: Map },
  { to: "/alerts", label: "Alerts Center", icon: Bell },
  { to: "/simulation", label: "Simulation", icon: PlayCircle },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const { wsConnected, alerts } = useApp();
  const activeAlerts = alerts.filter((a) => a.status === "active").length;

  return (
    <aside className="flex h-full w-60 flex-col border-r border-surface-700 bg-surface-900">
      <div className="flex items-center gap-2 px-5 py-5">
        <Mountain className="text-accent" size={26} />
        <div>
          <div className="font-display text-lg font-semibold leading-tight text-white">HimalayaShield</div>
          <div className="text-[11px] text-surface-600">Early Warning Demo</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              clsx(
                "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-accent/15 text-accent-light font-medium"
                  : "text-surface-600 hover:bg-surface-800 hover:text-white"
              )
            }
          >
            <span className="flex items-center gap-3">
              <Icon size={17} />
              {label}
            </span>
            {label === "Alerts Center" && activeAlerts > 0 && (
              <span className="rounded-full bg-evacuate px-1.5 py-0.5 text-[10px] font-bold text-white">
                {activeAlerts}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-surface-700 px-5 py-4">
        <div className="flex items-center gap-2 text-xs text-surface-600">
          {wsConnected ? (
            <>
              <Wifi size={14} className="text-safe-light" />
              <span>Live feed connected</span>
            </>
          ) : (
            <>
              <WifiOff size={14} className="text-evacuate-light" />
              <span>Reconnecting…</span>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
