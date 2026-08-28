import { MapContainer, TileLayer, Polygon, Marker, Popup, CircleMarker } from "react-leaflet";
import { Link } from "react-router-dom";
import type { RiskAssessment, SensorReading, Zone } from "@/types";
import { LEVEL_COLORS, OFFLINE_COLOR } from "@/lib/riskColors";
import L from "leaflet";

// Fix default marker icons not loading under Vite bundling.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const TILE_URL =
  import.meta.env.VITE_MAP_TILE_URL || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export function MapView({
  zones,
  riskByZone,
  sensorByZone,
  height = "100%",
}: {
  zones: Zone[];
  riskByZone: Record<string, RiskAssessment>;
  sensorByZone: Record<string, SensorReading>;
  height?: string;
}) {
  const center: [number, number] =
    zones.length > 0
      ? [zones.reduce((s, z) => s + z.latitude, 0) / zones.length, zones.reduce((s, z) => s + z.longitude, 0) / zones.length]
      : [30.9, 78.7];

  return (
    <div style={{ height }} className="overflow-hidden rounded-xl border border-surface-700">
      <MapContainer center={center} zoom={10} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={TILE_URL}
        />
        {zones.map((zone) => {
          const risk = riskByZone[zone.id];
          const sensor = sensorByZone[zone.id];
          const isOffline = sensor && !sensor.is_online;
          const colors = isOffline ? OFFLINE_COLOR : LEVEL_COLORS[risk?.level ?? "Safe"];
          const positions = zone.geojson_polygon.coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number]);

          return (
            <div key={zone.id}>
              <Polygon
                positions={positions}
                pathOptions={{ color: colors.hex, fillColor: colors.hex, fillOpacity: 0.25, weight: 2 }}
              />
              <CircleMarker
                center={[zone.latitude, zone.longitude]}
                radius={9}
                pathOptions={{ color: colors.hex, fillColor: colors.hex, fillOpacity: 0.9, weight: 2 }}
              >
                <Popup>
                  <div className="min-w-[180px] text-sm">
                    <div className="font-semibold">{zone.name}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      {isOffline ? "Sensor offline" : risk?.level ?? "Safe"}
                      {risk && !isOffline && ` · score ${risk.score.toFixed(0)}/100`}
                    </div>
                    <div className="mt-1 text-xs">Pop. {zone.population.toLocaleString()}</div>
                    <Link to={`/zones/${zone.id}`} className="mt-2 inline-block text-xs font-medium text-blue-600 underline">
                      View zone details →
                    </Link>
                  </div>
                </Popup>
              </CircleMarker>
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}
