import type { RiskLevel } from "@/types";

export const LEVEL_COLORS: Record<RiskLevel, { text: string; bg: string; border: string; dot: string; hex: string }> = {
  Safe: { text: "text-safe-light", bg: "bg-safe-bg", border: "border-safe", dot: "bg-safe", hex: "#16a34a" },
  Watch: { text: "text-watch-light", bg: "bg-watch-bg", border: "border-watch", dot: "bg-watch", hex: "#ca8a04" },
  Warning: { text: "text-warning-light", bg: "bg-warning-bg", border: "border-warning", dot: "bg-warning", hex: "#ea580c" },
  Evacuate: { text: "text-evacuate-light", bg: "bg-evacuate-bg", border: "border-evacuate", dot: "bg-evacuate", hex: "#dc2626" },
};

export const OFFLINE_COLOR = { text: "text-offline-light", bg: "bg-offline-bg", border: "border-offline", dot: "bg-offline", hex: "#6b7280" };

export function levelWeight(level: RiskLevel): number {
  return { Safe: 0, Watch: 1, Warning: 2, Evacuate: 3 }[level];
}

export function formatRelativeTime(iso: string | null): string {
  if (!iso) return "never";
  const diffMs = Date.now() - new Date(iso).getTime();
  const seconds = Math.max(0, Math.floor(diffMs / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
