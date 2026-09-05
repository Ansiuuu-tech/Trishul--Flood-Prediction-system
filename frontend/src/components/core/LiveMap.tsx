import { ReactNode, useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  WMSTileLayer,
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
  /** Live rain radar via RainViewer. No API key needed. Defaults to on. */
  showRainRadar?: boolean;
  /** GLIMS glacier outlines (GLOF risk context). No API key needed. Defaults to on. */
  showGlaciers?: boolean;
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

/**
 * React 18 StrictMode double-mounts components in dev, which can make
 * Leaflet cache a stale 0x0 container size on the throwaway first mount —
 * resulting in a map that never requests any tiles even though the
 * container looks the right size on screen. A ResizeObserver on the actual
 * map container reacts to real layout changes (mount, animation settling,
 * window resize) rather than guessing a timeout, and is the robust fix.
 */
function InvalidateSizeOnMount() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const fix = () => map.invalidateSize();

    // Fire once immediately in case the container is already sized correctly.
    fix();

    const observer = new ResizeObserver(fix);
    observer.observe(container);
    window.addEventListener('resize', fix);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', fix);
    };
  }, [map]);

  return null;
}

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

/**
 * Live precipitation radar via the RainViewer public API — free, no API key
 * required (unlike the OpenWeather overlay above, which needs
 * VITE_OPENWEATHER_KEY). Directly relevant to Varuna Watch's rainfall signal.
 * Docs: https://www.rainviewer.com/api.html
 */
function RainRadarOverlay({ opacity = 0.6 }: { opacity?: number }) {
  const [tileUrl, setTileUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLatestFrame() {
      try {
        const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        const data = await res.json();
        const frames = [...(data.radar?.past ?? []), ...(data.radar?.nowcast ?? [])];
        const latest = frames[frames.length - 1];
        if (latest && !cancelled) {
          // color scheme 4 = "Universal Blue", smoothed, with snow rendered
          setTileUrl(`https://tilecache.rainviewer.com${latest.path}/256/{z}/{x}/{y}/4/1_1.png`);
        }
      } catch (err) {
        console.error('RainViewer fetch failed:', err);
      }
    }

    loadLatestFrame();
    const interval = setInterval(loadLatestFrame, 10 * 60 * 1000); // refresh every 10 min
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!tileUrl) return null;

  return (
    <TileLayer
      key={tileUrl} // remounts the layer whenever a newer radar frame is fetched
      url={tileUrl}
      opacity={opacity}
      attribution='Rain radar: &copy; <a href="https://www.rainviewer.com/">RainViewer</a>'
    />
  );
}

/**
 * Glacier outlines from the GLIMS Glacier Database (hosted by NSIDC), loaded
 * as an OGC WMS layer. No API key required. Relevant for GLOF (glacial lake
 * outburst flood) risk context upstream of monitored zones.
 * Capabilities: https://www.glims.org/geoserver/ows?service=wms&version=1.3.0&request=GetCapabilities
 */
function GlacierOverlay() {
  return (
    <WMSTileLayer
      url="https://www.glims.org/geoserver/ows"
      layers="GLIMS:GLIMS_RC_Outlines"
      format="image/png"
      transparent
      version="1.3.0"
      attribution='Glacier data: &copy; <a href="https://www.glims.org/">GLIMS / NSIDC</a>'
    />
  );
}

export function LiveMap({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  showWeatherOverlay = null,
  showRainRadar = true,
  showGlaciers = true,
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
      <InvalidateSizeOnMount />

      <LayersControl position="topright" collapsed>
        <LayersControl.BaseLayer checked name="OpenStreetMap">
          <TileLayer
            url={import.meta.env.VITE_MAP_TILE_URL || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxZoom={19}
          />
        </LayersControl.BaseLayer>

        <LayersControl.Overlay name="Terrain (ESRI)">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            opacity={0.4}
            maxNativeZoom={12}
            maxZoom={19}
          />
        </LayersControl.Overlay>

        {showWeatherOverlay && (
          <LayersControl.Overlay name={`Weather: ${showWeatherOverlay}`} checked>
            <WeatherOverlay layer={showWeatherOverlay} />
          </LayersControl.Overlay>
        )}

        <LayersControl.Overlay name="Live Rain Radar" checked={showRainRadar}>
          <RainRadarOverlay />
        </LayersControl.Overlay>

        <LayersControl.Overlay name="Glacier Outlines (GLIMS)" checked={showGlaciers}>
          <GlacierOverlay />
        </LayersControl.Overlay>
      </LayersControl>

      <ZoneMarkers zones={zoneMarkers} onZoneSelect={onZoneSelect} />

      {showUserLocation && <UserLocationMarker />}

      {children}
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
