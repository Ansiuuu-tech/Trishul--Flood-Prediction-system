import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui';
import { RudraRing, RudraBanner, DamageScene, ContourField, LiveMap } from '@/components/core';
import { DashboardData, mockAlertData } from '@/lib/mockData';
import { fetchEvacuationRoute } from '@/lib/api';
import { Polyline } from 'react-leaflet';

export function AlertStateView({ data = mockAlertData }: { data: DashboardData }) {
  const zone = data.zones[0];
  const weather = data.weather;
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);

  useEffect(() => {
    const nearest = zone.nearestEvacuation;
    if (!nearest) return;
    const evacLat = zone.coordinates[0] + 0.005;
    const evacLon = zone.coordinates[1] + 0.005;

    fetchEvacuationRoute(zone.coordinates, [evacLat, evacLon])
      .then((route) => {
        if (route) {
          setRouteCoords(route.coordinates.map(([lon, lat]) => [lat, lon]));
          setRouteDistance(route.distance);
          setRouteDuration(route.duration);
        }
      });
  }, [zone]);

  const polylinePositions = routeCoords || [
    [zone.coordinates[0], zone.coordinates[1]],
    [zone.coordinates[0] + 0.01, zone.coordinates[1] + 0.01],
  ];

  const timeToSafety = routeDuration
    ? `~${Math.round(routeDuration / 60)} min`
    : zone.timeToSafety;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <DamageScene shaktiScore={zone.shaktiScore} className="absolute inset-0" />
      <ContourField className="absolute inset-0" opacity={0.15} colorMode="dark" />
      <div className="absolute inset-0 bg-forest-950/60" aria-hidden="true" />

      <div className="relative container-main py-8">
        <div className="space-y-6">
            <Card className="border-2 border-rudra-evacuate/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-h2 text-rudra-evacuate">
                {zone.name} — {zone.district}
              </h2>
                <RudraBanner
                  level={zone.rudraLevel}
                  shaktiScore={zone.shaktiScore}
                  pulse={true}
                />
            </div>

            <p className="text-body text-mist-50/80 mb-4">
              {zone.drishtiReasoning}
            </p>
          </Card>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <h3 className="font-display text-h3 text-ink-900 dark:text-mist-50 mb-4">
                  Evacuation Route
                </h3>
                <div className="bg-forest-950 rounded-lg border border-moss-600 overflow-hidden relative aspect-[16/9]">
                  <ContourField className="absolute inset-0" opacity={0.12} />
                  <div className="absolute inset-0">
                    <LiveMap
                      center={[zone.coordinates[0], zone.coordinates[1]]}
                      zoom={14}
                      showWeatherOverlay="precipitation_new"
                      zoneMarkers={[
                        {
                          id: zone.id,
                          name: zone.name,
                          lat: zone.coordinates[0],
                          lng: zone.coordinates[1],
                          rudraLevel: zone.rudraLevel,
                          shaktiScore: zone.shaktiScore,
                        },
                      ]}
                      showUserLocation={true}
                    >
                      <Polyline
                        positions={polylinePositions as [number, number][]}
                        color="#B23A2E"
                        weight={4}
                      />
                    </LiveMap>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                  <div className="p-4 bg-forest-800 rounded-lg border border-moss-600">
                      <div className="font-mono text-2xl font-medium text-rudra-evacuate">
                        {timeToSafety}
                      </div>
                    <div className="text-caption text-mist-50/60">Time to Safety</div>
                  </div>
                  <div className="p-4 bg-forest-800 rounded-lg border border-moss-600">
                    <div className="font-mono text-2xl font-medium text-rudra-evacuate">
                      {zone.rainfall.amount}mm
                    </div>
                    <div className="text-caption text-mist-50/60">1h Rainfall (Extreme)</div>
                  </div>
                  <div className="p-4 bg-forest-800 rounded-lg border border-moss-600">
                    <div className="font-mono text-2xl font-medium text-fern-400">
                      {Math.round(zone.confidence * 100)}%
                    </div>
                    <div className="text-caption text-mist-50/60">Confidence</div>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="font-display text-h3 text-ink-900 dark:text-mist-50 mb-4">
                  Attribution (Shapley)
                </h3>
                <div className="space-y-4">
                  {[
                    { sensor: 'Rainfall (Varuna Watch)', value: zone.attribution.rain, color: 'fern-400', detail: `1h: ${zone.rainfall.amount}mm (${zone.rainfall.intensity})` },
                    { sensor: 'Ground (Bhumi Sense)', value: zone.attribution.ground, color: 'moss-600', detail: `P(fail): ${zone.ground.pFailure} • Saturation: ${zone.ground.saturation}%` },
                    { sensor: 'Vibration (Kampan Alert)', value: zone.attribution.vibration, color: 'signal-amber', detail: `Class: ${zone.vibration.classification} • Score: ${zone.vibration.anomalyScore}` },
                  ].map((a) => (
                    <div key={a.sensor}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-sans text-sm text-ink-900 dark:text-mist-50">{a.sensor}</span>
                        <span className="font-mono text-sm font-medium text-ink-900 dark:text-mist-50">{a.value}%</span>
                      </div>
                      <div className="h-2 bg-stone-200 dark:bg-forest-950 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${a.value}%`, backgroundColor: `var(--${a.color})` }} />
                      </div>
                      <div className="text-caption text-ink-900/50 dark:text-mist-50/50 mt-1 font-mono">{a.detail}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card variant="dark">
                <h3 className="font-display text-h3 text-rudra-evacuate mb-4">
                  Nearest Evacuation
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-rudra-evacuate/20 border border-rudra-evacuate/30 rounded-lg">
                    <div className="font-sans font-medium text-rudra-evacuate">{zone.nearestEvacuation?.name}</div>
                    <div className="text-caption text-rudra-evacuate/70 mt-1">
                      {zone.nearestEvacuation?.distance} km {zone.nearestEvacuation?.direction}
                    </div>
                    <div className="text-caption text-rudra-evacuate/70 mt-1">
                      Capacity: {zone.nearestEvacuation?.capacity}
                    </div>
                  </div>
                  <Link to="/dashboard">
                    <button className="w-full btn btn-secondary text-sm">
                      Get Directions
                    </button>
                  </Link>
                </div>
              </Card>

              <Card variant="dark">
                <h3 className="font-display text-h3 text-ink-900 dark:text-mist-50 mb-4">
                  Alert Delivery (Ghanta Signal)
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-forest-800 rounded-lg border border-moss-600">
                    <span className="font-sans text-sm text-mist-50">Siren</span>
                    <span className="font-mono text-sm text-rudra-evacuate">ACTIVE</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-forest-800 rounded-lg border border-moss-600">
                    <span className="font-sans text-sm text-mist-50">SMS</span>
                    <span className="font-mono text-sm text-fern-400">DELIVERED</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-forest-800 rounded-lg border border-moss-600">
                    <span className="font-sans text-sm text-mist-50">WhatsApp</span>
                    <span className="font-mono text-sm text-fern-400">DELIVERED</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-forest-800 rounded-lg border border-moss-600">
                    <span className="font-sans text-sm text-mist-50">IVR (Nepali)</span>
                    <span className="font-mono text-sm text-rudra-watch">CALLING</span>
                  </div>
                </div>
              </Card>

              <div className="text-center text-caption text-mist-50/50">
                Last updated: {zone.lastUpdate}
              </div>
            </div>
          </div>

          <Card variant="dark">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-h3 text-mist-50">
                  Current Weather — {weather.location}
                </h3>
                <p className="text-body text-mist-50/60">
                  {weather.temperature}°C • {weather.condition} • {weather.humidity}% humidity • {weather.windSpeed} km/h wind
                </p>
              </div>
              <RudraRing level={zone.rudraLevel} shaktiScore={zone.shaktiScore} pulse={true} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
