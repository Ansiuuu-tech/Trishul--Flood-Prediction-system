import { ShieldAlert } from "lucide-react";

export function DemoBadge() {
  return (
    <div className="flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300">
      <ShieldAlert size={14} />
      <span>Demo Mode — Not for operational emergency decisions</span>
    </div>
  );
}
