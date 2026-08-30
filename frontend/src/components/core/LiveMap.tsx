import { ReactNode } from 'react';
import {
  MapContainer,
  TileLayer,
  LayersControl,
  Marker,
  CircleMarker,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { rudraColors } from '@/components/core/RudraRing';
import { useUserLocation } from '@/hooks/useUserLocation';
import { ZoneData, RudraLevel } from '@/lib/mockData';

export type LiveMapProps = {
  center?: [number, number];
  zoom?: number;
  showWeatherOverlay?: 'precipitation_new' | 'clouds_new' | 'temp_new' | null;
  zoneMarkers?: {
    id: string;
    name: string;
    lat: number;
    lng: number;
    rudraLevel: RudraLevel;
    shaktiScore?: number;
  }[];
  showUserLocation?: boolean;
  onZoneSelect?: (zoneId: string) => void;
  children?: ReactNode;
};

const DEFAULT_CENTER: [number, number] = [27.95, 84.83];
const DEFAULT_ZOOM = 13;

const ZONE_COLOR: Record<RudraLevel, string> = {
  safe: rudraColors.safe,
  watch: rudraColors.watch,
  warn: rudraColors.warn,
  evacuate: rudraColors.evacuate,
};

function UserLocationMarker() {
  const { location, status } = useUserLocation();
  if (!location || status !== 'granted') return null;

  return (
    <CircleMarker
      center={[location.lat, location.lng]}
      radius={8}
      fillColor="#10B981"
      color="#ffffff"
      weight={2}
      opacity={1}
      fillOpacity={0.9}
    >
      <Popup>Your location</Popup>
    </CircleMarker>
  );
}

function ZoneMarkers({
  zones,
  onZoneSelect,
}: {
  zones: LiveMapProps['zoneMarkers'];
  onZoneSelect?: (zoneId: string) => void;
}) {
  if (!zones) return null;
  const map = useMap();

  const handleZoneClick = (zoneId: string, lat: number, lng: number) => {
    onZoneSelect?.(zoneId);
    map.setView([lat, lng], 15);
  };

  return (
    <>
      {zones.map((zone) => (
        <Marker
          key={zone.id}
          position={[zone.lat, zone.lng]}
          icon={L.divIcon({
            className: 'zone-marker',
            html: `
              <div style="
                width: 18px; height: 18px; border-radius: 50% 50% 50% 0;
                background-color: ${ZONE_COLOR[zone.rudraLevel]};
                border: 3px solid ${ZONE_COLOR[zone.rudraLevel]};
                box-shadow: 0 0 0 3px white;
                transform: rotate(45deg);
              " data-zone-id="${zone.id}">
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 24],
            popupAnchor: [0, -24],
          })}
          eventHandlers={{
            click: () => handleZoneClick(zone.id, zone.lat, zone.lng),
          }}
        >
          <Popup>
            <div style={{ fontFamily: 'General Sans, sans-serif' }}>
              <strong style={{ color: ZONE_COLOR[zone.rudraLevel] }}>{zone.name}</strong>
              <br />
              Level: {zone.rudraLevel}
              {zone.shaktiScore !== undefined && (
                <span> · Score: {zone.shaktiScore}/100</span>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

function WeatherOverlay({ layer }: { layer: string | null }) {
  const apiKey = import.meta.env.VITE_OPENWEATHER_KEY;
  if (!layer || !apiKey) return null;

  return (
    <TileLayer
      url={`https://tile.openweathermap.org/map/${layer}/{z}/{x}/{y}.png?appid=${apiKey}`}
      opacity={0.6}
      attribution='&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
    />
  );
}

export function LiveMap({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  showWeatherOverlay = null,
  zoneMarkers = [],
  showUserLocation = true,
  onZoneSelect,
  children,
}: LiveMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full"
      aria-label="Live hazard map"
    >
      <LayersControl.BaseLayer checked name="OpenStreetMap">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
      </LayersControl.BaseLayer>

      <LayersControl.Overlay name="Terrain (ESRI)" checked>
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          opacity={0.4}
        />
      </LayersControl.Overlay>

      {showWeatherOverlay && (
        <LayersControl.Overlay name={`Weather: ${showWeatherOverlay}`} checked>
          <WeatherOverlay layer={showWeatherOverlay} />
        </LayersControl.Overlay>
      )}

      <ZoneMarkers zones={zoneMarkers} onZoneSelect={onZoneSelect} />

      {showUserLocation && <UserLocationMarker />}

      {children}

      <LayersControl collapsed />
    </MapContainer>
  );
}

export function zonesFromData(
  data: { zones: ZoneData[]; selectedZone?: string },
): LiveMapProps['zoneMarkers'] {
  return data.zones.map((zone) => ({
    id: zone.id,
    name: zone.name,
    lat: zone.coordinates[0],
    lng: zone.coordinates[1],
    rudraLevel: zone.rudraLevel,
    shaktiScore: zone.shaktiScore,
  }));
}
