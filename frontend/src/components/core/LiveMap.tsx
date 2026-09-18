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
import type { Layer } from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { rudraColors } from '@/components/core/RudraRing';
import { useUserLocation } from '@/hooks/useUserLocation';
import { ZoneData, RudraLevel } from '@/lib/mockData';
import {
  fetchCurrentRisk,
  fetchLatestSensors,
  type RiskAssessment,
  type BackendSensor,
} from '@/lib/api';

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
  showUserLocation?: boolean;
  onZoneSelect?: (zoneId: string) => void;
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
  riskByZone: Record<string, RiskAssessment>;
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

function RiskRings({
  zones,
  riskByZone,
  zoom,
}: {
  zones: LiveMapProps['zoneMarkers'];
  riskByZone: Record<string, RiskAssessment>;
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
        const radius = 300 + Math.max(0, Math.min(100, score)) * 15;

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
      key={tileUrl}
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

function LiveRiskController({
  onRisk,
  onSensors,
}: {
  onRisk: (items: RiskAssessment[]) => void;
  onSensors: (items: BackendSensor[]) => void;
}) {
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [risks, sensors] = await Promise.all([
          fetchCurrentRisk(),
          fetchLatestSensors(),
        ]);
        if (!cancelled) {
          onRisk(risks);
          onSensors(sensors);
        }
      } catch (error) {
        console.warn('Live map data refresh failed:', error);
      }
    };

    load();
    const interval = window.setInterval(load, 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [onRisk, onSensors]);

  return null;
}

function useLiveRiskWebSocket(onRisk: (risk: RiskAssessment) => void) {
  useEffect(() => {
    const wsBase = import.meta.env.VITE_WS_URL;
    if (!wsBase) return;

    let socket: WebSocket | null = null;
    let retryTimer: number | undefined;
    let stopped = false;

    const connect = () => {
      if (stopped) return;

      try {
        socket = new WebSocket(`${wsBase.replace(/\/$/, '')}/ws/live`);

        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message?.type !== 'risk_update' || !message.zone_id) return;

            onRisk({
              id: `ws-${message.zone_id}-${Date.now()}`,
              zone_id: message.zone_id,
              score: Number(message.score ?? 0),
              level: message.level ?? 'Safe',
              confidence: Number(message.confidence ?? 0),
              reasons: message.reasons ?? [],
              recommended_action: message.recommended_action ?? '',
              estimated_lead_time_minutes: Number(message.estimated_lead_time_minutes ?? 0),
              data_quality_warning: message.data_quality_warning ?? '',
              created_at: new Date().toISOString(),
            });
          } catch {
            // Ignore malformed WebSocket messages.
          }
        };

        socket.onclose = () => {
          if (!stopped) retryTimer = window.setTimeout(connect, 5000);
        };
      } catch {
        retryTimer = window.setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      stopped = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      socket?.close();
    };
  }, [onRisk]);
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
  showUserLocation = true,
  onZoneSelect,
  children,
}: LiveMapProps) {
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [riskList, setRiskList] = useState<RiskAssessment[]>([]);
  const [sensors, setSensors] = useState<BackendSensor[]>([]);

  const riskByZone = useMemo(
    () => Object.fromEntries(riskList.map((risk) => [risk.zone_id, risk])),
    [riskList],
  );

  const updateRisk = (risk: RiskAssessment) => {
    setRiskList((current) => {
      const next = current.filter((item) => item.zone_id !== risk.zone_id);
      return [...next, risk];
    });
  };

  useLiveRiskWebSocket(updateRisk);

  const activeCount = zoneMarkers.filter((zone) => {
    const risk = riskByZone[zone.id];
    return (risk?.score ?? zone.shaktiScore ?? 0) >= 25;
  }).length;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={zoom}
        className="relative z-0 h-full w-full"
        aria-label="Trishul live hazard map"
      >
        <InvalidateSizeOnMount />
        <ZoomMode onZoom={setCurrentZoom} />
        <LiveRiskController
          onRisk={setRiskList}
          onSensors={setSensors}
        />

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

        {showSensors && (
          <SensorMarkers
            sensors={sensors}
            zones={zoneMarkers}
            zoom={currentZoom}
          />
        )}

        {showUserLocation && <UserLocationMarker />}

        {showEvacuation && children}

        {children}
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
