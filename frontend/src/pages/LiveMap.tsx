import { useApp } from "@/context/AppContext";
import { MapView } from "@/components/MapView";
import { DemoBadge } from "@/components/DemoBadge";
import { LEVEL_COLORS } from "@/lib/riskColors";
import clsx from "clsx";

export default function LiveMap() {
  const { zones, riskByZone, sensorByZone } = useApp();

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Live GIS Risk Map</h1>
          <p className="text-sm text-surface-600">Color-coded zone polygons and sensor markers, updated in real time</p>
        </div>
        <DemoBadge />
      </div>

      <div className="flex items-center gap-4 rounded-lg border border-surface-700 bg-surface-800 px-4 py-2 text-xs">
        {(["Safe", "Watch", "Warning", "Evacuate"] as const).map((level) => (
          <span key={level} className="flex items-center gap-1.5">
            <span className={clsx("h-2.5 w-2.5 rounded-full", LEVEL_COLORS[level].dot)} />
            <span className="text-surface-600">{level}</span>
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-offline" />
          <span className="text-surface-600">Offline</span>
        </span>
      </div>

      <div className="flex-1">
        <MapView zones={zones} riskByZone={riskByZone} sensorByZone={sensorByZone} height="600px" />
      </div>
    </div>
  );
}
