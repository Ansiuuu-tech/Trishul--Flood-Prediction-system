import { ReactNode, useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  WMSTileLayer,
  LayersControl,
  Marker,
  CircleMarker,
  Popup,
  Polyline,
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
    district?: string;
    lat: number;
    lng: number;
    rudraLevel: RudraLevel;
    shaktiScore?: number;
  }[];
  /** Documented historical events, usually joined to their parent zone coordinates. */
  historicalMarkers?: { id: string; lat: number; lng: number; label: string; date: string; severity?: string }[];
  showUserLocation?: boolean;
  onZoneSelect?: (zoneId: string) => void;
  /** Evacuation route GeoJSON from API */
  evacuationRoute?: {
    geometry: {
      type: string;
      coordinates: number[][];
    };
    properties: {
      distance_km: number;
      duration_min: number;
      shelter_name: string;
      shelter_type: string;
      shelter_capacity: number;
      zone_name: string;
      zone_id: string;
    };
  } | null;
  /** Shelter location for marker */
  shelterLocation?: { lat: number; lng: number; name: string; capacity: number; shelter_type: string } | null;
  children?: ReactNode;
};

const DEFAULT_CENTER: [number, number] = [30.2, 79.2];
const DEFAULT_ZOOM = 8;

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
              <strong style={{ color: ZONE_COLOR[zone.rudraLevel] }}>
                {zone.name}{zone.district ? ` (${zone.district} Dist.)` : ''}
              </strong>
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

function HistoricalMarkers({ markers }: { markers: LiveMapProps['historicalMarkers'] }) {
  if (!markers) return null;
  return (
    <>
      {markers.map((event) => (
        <CircleMarker
          key={event.id}
          center={[event.lat, event.lng]}
          radius={5}
          fillColor="#8a8a8a"
          color="#ffffff"
          weight={1}
          fillOpacity={0.8}
        >
          <Popup>
            <div style={{ fontFamily: 'General Sans, sans-serif' }}>
              <strong>Historical event</strong><br />
              {event.label}<br />
              {new Date(event.date).toLocaleDateString()}
              {event.severity ? <><br />Severity: {event.severity}</> : null}
            </div>
          </Popup>
        </CircleMarker>
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
      maxNativeZoom={10}
      maxZoom={19}
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
      maxNativeZoom={10}
      maxZoom={19}
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
      maxNativeZoom={12}
      maxZoom={19}
      attribution='Glacier data: &copy; <a href="https://www.glims.org/">GLIMS / NSIDC</a>'
    />
  );
}

function EvacuationRoute({
  route,
}: {
  route: LiveMapProps['evacuationRoute'];
}) {
  if (!route || !route.geometry?.coordinates?.length) return null;

  // Convert [lng, lat] to [lat, lng] for Leaflet
  const positions = route.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);

  const props = route.properties;
  const popupContent = (
    <div style={{ fontFamily: 'General Sans, sans-serif', minWidth: 200 }}>
      <strong style={{ color: rudraColors.evacuate }}>Evacuation Route</strong>
      <br />
      To: {props.shelter_name} ({props.shelter_type})
      <br />
      Capacity: {props.shelter_capacity} people
      <br />
      Distance: {props.distance_km.toFixed(1)} km
      <br />
      Est. Time: {props.duration_min.toFixed(1)} min
    </div>
  );

  return (
    <Polyline
      positions={positions}
      color={rudraColors.evacuate}
      weight={4}
      opacity={0.9}
      dashArray="10, 5"
      lineCap="round"
      lineJoin="round"
    >
      <Popup>{popupContent}</Popup>
    </Polyline>
  );
}

function ShelterMarker({
  shelter,
}: {
  shelter: LiveMapProps['shelterLocation'];
}) {
  if (!shelter) return null;

  return (
    <Marker
      position={[shelter.lat, shelter.lng]}
      icon={L.divIcon({
        className: 'shelter-marker',
        html: `
          <div style="
            width: 28px; height: 28px; border-radius: 50%;
            background-color: #10B981;
            border: 4px solid #ffffff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex; align-items: center; justify-content: center;
            font-size: 14px; font-weight: bold; color: white;
          ">
            🏠
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      })}
    >
      <Popup>
        <div style={{ fontFamily: 'General Sans, sans-serif' }}>
          <strong style={{ color: '#10B981' }}>{shelter.name}</strong>
          <br />
          Type: {shelter.shelter_type.replace('_', ' ')}
          <br />
          Capacity: {shelter.capacity} people
        </div>
      </Popup>
    </Marker>
  );
}

export function LiveMap({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  showWeatherOverlay = null,
  showRainRadar = true,
  showGlaciers = true,
  zoneMarkers = [],
  historicalMarkers = [],
  showUserLocation = true,
  onZoneSelect,
  evacuationRoute = null,
  shelterLocation = null,
  children,
}: LiveMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      // Leaflet controls and panes use high internal z-index values. Giving
      // the map its own z-index creates a stacking context, so those values
      // remain inside the map instead of covering navigation or modals.
      className="relative z-0 h-full w-full"
      aria-label="Live hazard map"
    >
      <InvalidateSizeOnMount />

      <LayersControl position="topright" collapsed>
        <LayersControl.BaseLayer checked name="OpenStreetMap">
          <TileLayer
            url={import.meta.env.VITE_MAP_TILE_URL || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxNativeZoom={19}
            maxZoom={19}
          />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="CartoDB Dark">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
            maxNativeZoom={20}
            maxZoom={20}
            subdomains="abcd"
          />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="Satellite (ESRI)">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            maxNativeZoom={19}
            maxZoom={19}
          />
        </LayersControl.BaseLayer>

        <LayersControl.Overlay name="Terrain Labels (ESRI)">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            opacity={0.4}
            maxNativeZoom={19}
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
      <HistoricalMarkers markers={historicalMarkers} />

      {evacuationRoute && <EvacuationRoute route={evacuationRoute} />}
      {shelterLocation && <ShelterMarker shelter={shelterLocation} />}

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
    district: zone.district,
    lat: zone.coordinates[0],
    lng: zone.coordinates[1],
    rudraLevel: zone.rudraLevel,
    shaktiScore: zone.shaktiScore,
  }));
}
