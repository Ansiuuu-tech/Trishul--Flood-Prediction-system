import { ReactNode, useEffect, useMemo, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  WMSTileLayer,
  GeoJSON,
  LayersControl,
  Marker,
  CircleMarker,
  Popup,
  Polyline,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { rudraColors } from '@/components/core/RudraRing';
import { useUserLocation } from '@/hooks/useUserLocation';
import { ZoneData, RudraLevel } from '@/lib/mockData';
import type { RiskAssessment, BackendSensor } from '@/lib/api';
import type { RiskUpdateEvent, SensorReadingEvent } from '@/hooks/useLiveFeed';

export type LiveMapProps = {
   center?: [number, number];
   zoom?: number;
   showWeatherOverlay?: 'precipitation_new' | 'clouds_new' | 'temp_new' | null;
   showRainRadar?: boolean;
   showGlaciers?: boolean;
   showHazardPolygons?: boolean;
   showSensors?: boolean;
   showRivers?: boolean;
   showLandslides?: boolean;
   showEvacuation?: boolean;
   /** Optional local GeoJSON URLs. Keep these real/sourced; empty values simply hide the layer. */
   floodRiskUrl?: string;
   landslideUrl?: string;
   riversUrl?: string;
   /** Existing backend zone data, transformed by zonesFromData(). */
   zoneMarkers?: {
     id: string;
     name: string;
     district?: string;
     lat: number;
     lng: number;
     rudraLevel: RudraLevel;
     shaktiScore?: number;
     geojsonPolygon?: { type: string; coordinates: number[][][] };
   }[];
   /** Live risk updates keyed by zone ID, for real-time marker updates. */
   liveRiskByZone?: Record<string, RiskUpdateEvent>;
   /** Live sensor updates keyed by zone ID, for real-time sensor marker updates. */
   liveSensorByZone?: Record<string, SensorReadingEvent>;
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
   /** All known evacuation centres for the selected zone. */
   shelterLocations?: { id: string; lat: number; lng: number; name: string; capacity: number; shelter_type: string }[];
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

const LEVEL_ORDER: Record<RudraLevel, number> = {
  safe: 0,
  watch: 1,
  warn: 2,
  evacuate: 3,
};

function toRudra(level?: string): RudraLevel {
  if (level === 'Evacuate') return 'evacuate';
  if (level === 'Warning') return 'warn';
  if (level === 'Watch') return 'watch';
  return 'safe';
}

function formatLevel(level: RudraLevel) {
  return level === 'warn' ? 'WARNING' : level.toUpperCase();
}

/**
 * React 18 StrictMode double-mounts components in dev, which can make
 * Leaflet cache a stale 0x0 container size on the throwaway first mount --
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

function ZoomMode({ onZoom }: { onZoom: (zoom: number) => void }) {
  useMapEvents({
    zoomend: (event) => onZoom(event.target.getZoom()),
  });
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

type ZoneMarkerType = NonNullable<LiveMapProps['zoneMarkers']>[number];

function ZoneMarkers({
   zones,
   riskByZone,
   onZoneSelect,
 }: {
   zones: LiveMapProps['zoneMarkers'];
   riskByZone: Record<string, RiskUpdateEvent>;
   onZoneSelect?: (zoneId: string) => void;
 }) {
  const map = useMap();

  if (!zones) return null;

  const handleZoneClick = (zone: ZoneMarkerType) => {
    onZoneSelect?.(zone.id);
    map.flyTo([zone.lat, zone.lng], 15, { duration: 1.2 });
  };

  return (
    <>
      {zones.map((zone) => {
        const liveRisk = riskByZone[zone.id];
        const level = liveRisk ? toRudra(liveRisk.level) : zone.rudraLevel;
        const color = ZONE_COLOR[level];

        return (
          <Marker
            key={zone.id}
            position={[zone.lat, zone.lng]}
            icon={L.divIcon({
              className: 'trishul-zone-marker',
              html: `
                <div class="trishul-marker-wrap" style="--risk-color:${color}">
                  <div class="trishul-marker-pulse"></div>
                  <div class="trishul-marker-pin"></div>
                  <span class="trishul-marker-score">${Math.round(liveRisk?.score ?? zone.shaktiScore ?? 0)}</span>
                </div>
              `,
              iconSize: [48, 48],
              iconAnchor: [24, 38],
              popupAnchor: [0, -38],
            })}
            eventHandlers={{ click: () => handleZoneClick(zone) }}
          >
            <Popup>
              <div style={{ minWidth: 190, fontFamily: 'General Sans, sans-serif' }}>
                <strong style={{ color }}>{zone.name}</strong>
                {zone.district && <div>{zone.district} District</div>}
                <hr />
                <div><b>Rudra:</b> {formatLevel(level)}</div>
                <div><b>Shakti:</b> {Math.round(liveRisk?.score ?? zone.shaktiScore ?? 0)}/100</div>
                {liveRisk && <div><b>Confidence:</b> {Math.round(liveRisk.confidence * 100)}%</div>}
                {liveRisk?.recommended_action && (
                  <div style={{ marginTop: 6 }}><b>Action:</b> {liveRisk.recommended_action}</div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
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

function RiskRings({
   zones,
   riskByZone,
   zoom,
 }: {
   zones: LiveMapProps['zoneMarkers'];
   riskByZone: Record<string, RiskUpdateEvent>;
   zoom: number;
 }) {
  if (!zones || zoom < 9) return null;

  return (
    <>
      {zones.map((zone) => {
        const liveRisk = riskByZone[zone.id];
        const level = liveRisk ? toRudra(liveRisk.level) : zone.rudraLevel;
        const color = ZONE_COLOR[level];
        const score = liveRisk?.score ?? zone.shaktiScore ?? 0;

        return (
          <CircleMarker
            key={`risk-ring-${zone.id}`}
            center={[zone.lat, zone.lng]}
            radius={Math.min(42, 14 + score / 5)}
            pathOptions={{
              color,
              weight: LEVEL_ORDER[level] >= 2 ? 3 : 2,
              fillColor: color,
              fillOpacity: zoom >= 12 ? 0.12 : 0.18,
              opacity: 0.9,
            }}
          >
            <Popup>
              <b>{zone.name}</b><br />
              Risk zone: {formatLevel(level)}<br />
              Score: {Math.round(score)}/100
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}

function SensorMarkers({
  sensors,
  zones,
  zoom,
}: {
  sensors: BackendSensor[];
  zones: LiveMapProps['zoneMarkers'];
  zoom: number;
}) {
  if (zoom < 11) return null;

  const zoneMap = new Map((zones ?? []).map((z) => [z.id, z]));

  return (
    <>
      {sensors.map((sensor) => {
        const zone = zoneMap.get(sensor.zone_id);
        if (!zone) return null;

        const online = sensor.is_online;
        return (
          <CircleMarker
            key={`sensor-${sensor.zone_id}`}
            center={[zone.lat, zone.lng]}
            radius={zoom >= 14 ? 7 : 5}
            pathOptions={{
              color: online ? '#0f172a' : '#64748b',
              weight: 2,
              fillColor: online ? '#22c55e' : '#94a3b8',
              fillOpacity: 1,
            }}
          >
            <Popup>
              <div style={{ minWidth: 220 }}>
                <strong>{zone.name} — Sensor Node</strong>
                <hr />
                <div>Rainfall 1h: <b>{sensor.rainfall_mm_1h.toFixed(1)} mm</b></div>
                <div>Rainfall 3h: <b>{sensor.rainfall_mm_3h.toFixed(1)} mm</b></div>
                <div>Soil moisture: <b>{sensor.soil_moisture_pct.toFixed(1)}%</b></div>
                <div>Tilt: <b>{sensor.tilt_degrees.toFixed(1)}°</b></div>
                <div>Vibration: <b>{sensor.vibration_g.toFixed(2)}g</b></div>
                <div>Battery: <b>{sensor.battery_pct.toFixed(0)}%</b></div>
                <div>Status: <b>{online ? 'ONLINE' : 'OFFLINE'}</b></div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}

function GeoJsonOverlay({
  url,
  name,
  zoom,
  visibleFrom,
  styleForFeature,
}: {
  url?: string;
  name: string;
  zoom: number;
  visibleFrom: number;
  styleForFeature?: (feature: any) => L.PathOptions;
}) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;

    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error(`${name}: ${response.status}`);
        return response.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((error) => console.warn(`${name} GeoJSON unavailable`, error));

    return () => {
      cancelled = true;
    };
  }, [url, name]);

  if (!url || !data || zoom < visibleFrom) return null;

  return (
    <GeoJSON
      data={data}
      style={(feature) =>
        styleForFeature?.(feature) ?? {
          color: '#f97316',
          weight: 2,
          fillOpacity: 0.12,
        }
      }
    />
  );
}

function RainRadarOverlay({ opacity = 0.58 }: { opacity?: number }) {
  const [tileUrl, setTileUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLatestFrame() {
      try {
        const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        if (!res.ok) throw new Error(`RainViewer: ${res.status}`);

        const data = await res.json();
        const frames = data.radar?.past ?? [];
        const latest = frames[frames.length - 1];

        if (latest && !cancelled) {
          setTileUrl(
            `https://tilecache.rainviewer.com${latest.path}/256/{z}/{x}/{y}/4/1_1.png`,
          );
        }
      } catch (error) {
        console.warn('RainViewer fetch failed:', error);
      }
    }

    loadLatestFrame();
    const interval = window.setInterval(loadLatestFrame, 10 * 60 * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  if (!tileUrl) return null;

  return (
    <TileLayer
      key={tileUrl} // remounts the layer whenever a newer radar frame is fetched
      url={tileUrl}
      opacity={opacity}
      maxNativeZoom={7}
      maxZoom={9}
      attribution='Rain radar: &copy; <a href="https://www.rainviewer.com/">RainViewer</a>'
    />
  );
}

function WeatherOverlay({ layer }: { layer: string | null }) {
  const apiKey = import.meta.env.VITE_OPENWEATHER_KEY;
  if (!layer || !apiKey) return null;

  return (
    <TileLayer
      url={`https://tile.openweathermap.org/map/${layer}/{z}/{x}/{y}.png?appid=${apiKey}`}
      opacity={0.52}
      maxNativeZoom={10}
      maxZoom={19}
      attribution='&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
    />
  );
}

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

function FitEvacuationBounds({ route, shelters, zone }: {
  route: LiveMapProps['evacuationRoute'];
  shelters: NonNullable<LiveMapProps['shelterLocations']>;
  zone?: ZoneMarkerType;
}) {
  const map = useMap();
  const boundsKey = JSON.stringify({ route: route?.geometry.coordinates, shelters, zone: zone?.id });

  useEffect(() => {
    const points: [number, number][] = [];
    if (zone) points.push([zone.lat, zone.lng]);
    route?.geometry.coordinates.forEach(([lng, lat]) => points.push([lat, lng]));
    shelters.forEach((shelter) => points.push([shelter.lat, shelter.lng]));
    if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [36, 36], maxZoom: 13 });
  }, [map, boundsKey]);

  return null;
}

function MapHUD({
  zoom,
  activeCount,
}: {
  zoom: number;
  activeCount: number;
}) {
  const mode =
    zoom <= 8 ? 'REGIONAL INTELLIGENCE' :
      zoom <= 11 ? 'HAZARD OVERVIEW' :
        zoom <= 14 ? 'DETAILED HAZARD VIEW' :
          'ZONE RESPONSE VIEW';

  return (
    <div
      className="absolute bottom-4 left-4 z-[500] rounded-xl border border-white/20 bg-slate-950/85 px-4 py-3 text-xs text-white shadow-xl backdrop-blur-md"
      style={{ pointerEvents: 'none' }}
    >
      <div className="font-semibold tracking-widest text-emerald-300">{mode}</div>
      <div className="mt-1 text-slate-300">ZOOM {zoom.toFixed(1)} · {activeCount} MONITORED ZONES</div>
    </div>
  );
}



export function LiveMap({
   center = DEFAULT_CENTER,
   zoom = DEFAULT_ZOOM,
   showWeatherOverlay = null,
   showRainRadar = true,
   showGlaciers = true,
   showHazardPolygons = true,
   showSensors = true,
   showRivers = true,
   showLandslides = true,
   showEvacuation = false,
   floodRiskUrl,
   landslideUrl,
   riversUrl,
   zoneMarkers = [],
   historicalMarkers = [],
   liveRiskByZone,
   liveSensorByZone,
   showUserLocation = true,
   onZoneSelect,
   evacuationRoute = null,
   shelterLocation = null,
   shelterLocations = [],
   children,
}: LiveMapProps) {
   const [currentZoom, setCurrentZoom] = useState(zoom);

   const riskByZone = liveRiskByZone ?? {};
   const sensorsList = liveSensorByZone 
     ? Object.values(liveSensorByZone).map((event) => ({
         ...event,
         source: 'unknown',
         rainfall_mm_24h: 0,
         tilt_change_rate: 0,
         battery_pct: 100,
       } as BackendSensor))
     : [];

   const activeCount = zoneMarkers.filter((zone) => {
     const risk = riskByZone[zone.id];
     return (risk?.score ?? zone.shaktiScore ?? 0) >= 25;
   }).length;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={zoom}
        // Leaflet controls and panes use high internal z-index values. Giving
        // the map its own z-index creates a stacking context, so those values
        // remain inside the map instead of covering navigation or modals.
        className="relative z-0 h-full w-full"
        aria-label="Trishul live hazard map"
      >
        <InvalidateSizeOnMount />
        <ZoomMode onZoom={setCurrentZoom} />

        <LayersControl position="topright" collapsed>
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              url={import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              maxNativeZoom={19}
              maxZoom={19}
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

          {showWeatherOverlay && (
            <LayersControl.Overlay name={`Weather: ${showWeatherOverlay}`} checked>
              <WeatherOverlay layer={showWeatherOverlay} />
            </LayersControl.Overlay>
          )}

          {showRainRadar && currentZoom <= 9 && (
            <LayersControl.Overlay name="Live Rain Radar" checked>
              <RainRadarOverlay />
            </LayersControl.Overlay>
          )}

          {showGlaciers && currentZoom >= 10 && (
            <LayersControl.Overlay name="Glacier Outlines (GLIMS)">
              <GlacierOverlay />
            </LayersControl.Overlay>
          )}

          {showHazardPolygons && (
            <LayersControl.Overlay name="Flood Risk Zones">
              <GeoJsonOverlay
                url={floodRiskUrl}
                name="Flood risk"
                zoom={currentZoom}
                visibleFrom={9}
                styleForFeature={(feature) => {
                  const level = String(feature?.properties?.level ?? 'Watch').toLowerCase();
                  const color =
                    level.includes('evacuate') ? ZONE_COLOR.evacuate :
                      level.includes('warning') ? ZONE_COLOR.warn :
                        level.includes('watch') ? ZONE_COLOR.watch :
                          ZONE_COLOR.safe;

                  return {
                    color,
                    weight: 2,
                    fillColor: color,
                    fillOpacity: currentZoom >= 12 ? 0.20 : 0.12,
                  };
                }}
              />
            </LayersControl.Overlay>
          )}

          {showLandslides && (
            <LayersControl.Overlay name="Landslide Inventory">
              <GeoJsonOverlay
                url={landslideUrl}
                name="Landslides"
                zoom={currentZoom}
                visibleFrom={11}
                styleForFeature={() => ({
                  color: '#f97316',
                  weight: 2,
                  fillColor: '#f97316',
                  fillOpacity: 0.20,
                })}
              />
            </LayersControl.Overlay>
          )}

          {showRivers && (
            <LayersControl.Overlay name="River Network">
              <GeoJsonOverlay
                url={riversUrl}
                name="Rivers"
                zoom={currentZoom}
                visibleFrom={10}
                styleForFeature={() => ({
                  color: '#38bdf8',
                  weight: currentZoom >= 13 ? 3 : 2,
                  opacity: 0.85,
                })}
              />
            </LayersControl.Overlay>
          )}
        </LayersControl>

        <RiskRings
          zones={zoneMarkers}
          riskByZone={riskByZone}
          zoom={currentZoom}
        />

        <ZoneMarkers
          zones={zoneMarkers}
          riskByZone={riskByZone}
          onZoneSelect={onZoneSelect}
        />

        <HistoricalMarkers markers={historicalMarkers} />

{showSensors && (
           <SensorMarkers
             sensors={sensorsList}
             zones={zoneMarkers}
             zoom={currentZoom}
           />
         )}

        {showUserLocation && <UserLocationMarker />}

        <FitEvacuationBounds route={evacuationRoute} shelters={shelterLocations} zone={zoneMarkers[0]} />
        {evacuationRoute && <EvacuationRoute route={evacuationRoute} />}
        {shelterLocations.map((shelter) => <ShelterMarker key={shelter.id} shelter={shelter} />)}
        {shelterLocation && !shelterLocations.some((shelter) => shelter.lat === shelterLocation.lat && shelter.lng === shelterLocation.lng) && <ShelterMarker shelter={shelterLocation} />}

        {showEvacuation ? children : null}
      </MapContainer>

      <MapHUD zoom={currentZoom} activeCount={activeCount} />
    </div>
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
    geojsonPolygon: undefined,
  }));
}
