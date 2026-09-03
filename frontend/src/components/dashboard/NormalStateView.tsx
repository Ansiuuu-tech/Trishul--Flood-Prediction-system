import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui';
import { RudraRing, ContourField, LiveMap, zonesFromData } from '@/components/core';
import { DashboardData, mockDashboardData } from '@/lib/mockData';
import dashboardCalmBg from '@/assets/images/dashboard-bg.jpeg?url';

export function NormalStateView({ data = mockDashboardData }: { data: DashboardData }) {
  const zones = data.zones;
  const weather = data.weather;

  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  const zone = zones[activeIndex] ?? zones[0];

  // Track which slide is centered as the user scrolls/swipes
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            const idx = Number((entry.target as HTMLElement).dataset.index);
            if (!Number.isNaN(idx)) setActiveIndex(idx);
          }
        });
      },
      { root: container, threshold: 0.6 }
    );
    slideRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [zones.length]);

  const scrollToIndex = (idx: number) => {
    const clamped = Math.max(0, Math.min(zones.length - 1, idx));
    slideRefs.current[clamped]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <img
        src={dashboardCalmBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-15"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-forest-950/10" aria-hidden="true" />

      <div className="relative container-main py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Zone carousel — scroll or swipe to move between zones */}
            <div className="relative">
              <div
                ref={scrollRef}
                className="flex overflow-x-auto snap-x snap-mandatory gap-4 scroll-smooth"
                style={{ scrollbarWidth: 'none' }}
                role="region"
                aria-label="Zone conditions carousel"
              >
                {zones.map((z, i) => (
                  <div
                    key={z.id}
                    ref={(el) => (slideRefs.current[i] = el)}
                    data-index={i}
                    className="snap-center shrink-0 w-full"
                  >
                    <Card>
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="font-display text-h3 text-ink-900 dark:text-mist-50">
                          {z.name} — {z.district}
                        </h2>
                        <RudraRing level={z.rudraLevel} pulse={false} showLabel={true} />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-6">
                        <div className="p-4 bg-stone-100 dark:bg-forest-800 rounded-lg border border-stone-200 dark:border-moss-600">
                          <div className="font-mono text-2xl font-medium text-ink-900 dark:text-mist-50">{weather.temperature}°C</div>
                          <div className="text-caption text-ink-900/60 dark:text-mist-50/60">{weather.condition}</div>
                        </div>
                        <div className="p-4 bg-stone-100 dark:bg-forest-800 rounded-lg border border-stone-200 dark:border-moss-600">
                          <div className="font-mono text-2xl font-medium text-ink-900 dark:text-mist-50">{weather.humidity}%</div>
                          <div className="text-caption text-ink-900/60 dark:text-mist-50/60">Humidity</div>
                        </div>
                        <div className="p-4 bg-stone-100 dark:bg-forest-800 rounded-lg border border-stone-200 dark:border-moss-600">
                          <div className="font-mono text-2xl font-medium text-ink-900 dark:text-mist-50">{weather.windSpeed} km/h</div>
                          <div className="text-caption text-ink-900/60 dark:text-mist-50/60">Wind</div>
                        </div>
                        <div className="p-4 bg-stone-100 dark:bg-forest-800 rounded-lg border border-stone-200 dark:border-moss-600">
                          <div className="font-mono text-2xl font-medium text-rudra-safe">{z.shaktiScore}</div>
                          <div className="text-caption text-ink-900/60 dark:text-mist-50/60">Shakti Score</div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="p-4 bg-stone-100 dark:bg-forest-800 rounded-lg border border-stone-200 dark:border-moss-600">
                          <div className="font-mono text-xl font-medium text-ink-900 dark:text-mist-50 mb-1">
                            {z.rainfall.amount}mm
                          </div>
                          <div className="text-caption text-ink-900/60 dark:text-mist-50/60 mb-2">
                            {z.rainfall.window} Rainfall
                          </div>
                          <div className="h-2 bg-stone-200 dark:bg-forest-950 rounded-full overflow-hidden">
                            <div className="h-full bg-rudra-safe rounded-full" style={{ width: '12%' }} />
                          </div>
                        </div>
                        <div className="p-4 bg-stone-100 dark:bg-forest-800 rounded-lg border border-stone-200 dark:border-moss-600">
                          <div className="font-mono text-xl font-medium text-ink-900 dark:text-mist-50 mb-1">
                            {z.ground.saturation}%
                          </div>
                          <div className="text-caption text-ink-900/60 dark:text-mist-50/60 mb-2">
                            Soil Saturation
                          </div>
                          <div className="h-2 bg-stone-200 dark:bg-forest-950 rounded-full overflow-hidden">
                            <div className="h-full bg-rudra-safe rounded-full" style={{ width: '28%' }} />
                          </div>
                        </div>
                        <div className="p-4 bg-stone-100 dark:bg-forest-800 rounded-lg border border-stone-200 dark:border-moss-600">
                          <div className="font-mono text-xl font-medium text-ink-900 dark:text-mist-50 mb-1">
                            {z.vibration.anomalyScore.toFixed(2)}
                          </div>
                          <div className="text-caption text-ink-900/60 dark:text-mist-50/60 mb-2">
                            Vibration Anomaly
                          </div>
                          <div className="h-2 bg-stone-200 dark:bg-forest-950 rounded-full overflow-hidden">
                            <div className="h-full bg-rudra-safe rounded-full" style={{ width: '5%' }} />
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>

              {/* Prev/next arrows — helpful on desktop where trackpad scroll isn't obvious */}
              {zones.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous zone"
                    onClick={() => scrollToIndex(activeIndex - 1)}
                    disabled={activeIndex === 0}
                    className="hidden md:flex items-center justify-center absolute -left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white dark:bg-forest-800 border border-stone-200 dark:border-moss-600 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    aria-label="Next zone"
                    onClick={() => scrollToIndex(activeIndex + 1)}
                    disabled={activeIndex === zones.length - 1}
                    className="hidden md:flex items-center justify-center absolute -right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white dark:bg-forest-800 border border-stone-200 dark:border-moss-600 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}

              {/* Dot indicators */}
              {zones.length > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  {zones.map((z, i) => (
                    <button
                      key={z.id}
                      type="button"
                      aria-label={`Show ${z.name}`}
                      aria-current={i === activeIndex}
                      onClick={() => scrollToIndex(i)}
                      className={`h-2 rounded-full transition-all duration-200 ease-out ${i === activeIndex ? 'w-6 bg-rudra-safe' : 'w-2 bg-stone-300 dark:bg-moss-600'
                        }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <Card>
              <h3 className="font-display text-h3 text-ink-900 dark:text-mist-50 mb-4">
                12-Hour Forecast
              </h3>
              <div className="flex items-end justify-between gap-2">
                {weather.forecast.map((f) => (
                  <div key={f.timestamp ?? `${f.date ?? ''}-${f.time}`} className="flex flex-col items-center gap-2">
                    <div className="font-mono text-sm text-ink-900 dark:text-mist-50/70">{f.rainProb}%</div>
                    <div
                      className={`w-8 rounded-t-sm transition-all duration-200 ease-out ${f.rainProb > 70 ? 'h-20 bg-rudra-evacuate/30' :
                        f.rainProb > 50 ? 'h-16 bg-rudra-warn/30' :
                          f.rainProb > 30 ? 'h-12 bg-rudra-watch/30' :
                            'h-6 bg-rudra-safe/30'
                        }`}
                    />
                    <div className="font-sans text-xs text-ink-900/60 dark:text-mist-50/60">{f.time}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-rudra-safe" aria-hidden="true" />
                <span className="font-mono text-caption text-rudra-safe font-medium">All Systems Normal</span>
              </div>
              <h3 className="font-display text-h3 text-ink-900 dark:text-mist-50 mb-4">
                Ground Conditions
              </h3>
              <p className="text-body text-ink-900/70 dark:text-mist-50/70 mb-4">
                {zone.ground.status === 'stable' ? 'Slope stability nominal' : zone.ground.status}
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-900/60 dark:text-mist-50/60">Critical Depth</span>
                  <span className="font-mono text-ink-900 dark:text-mist-50">0.45m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-900/60 dark:text-mist-50/60">Tilt</span>
                  <span className="font-mono text-ink-900 dark:text-mist-50">{zone.ground.tilt}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-900/60 dark:text-mist-50/60">P(failure)</span>
                  <span className="font-mono text-ink-900 dark:text-mist-50">{zone.ground.pFailure.toFixed(2)}</span>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-rudra-safe" aria-hidden="true" />
                <span className="font-mono text-caption text-rudra-safe font-medium">Nearest Evacuation</span>
              </div>
              <h3 className="font-display text-h3 text-ink-900 dark:text-mist-50 mb-4">
                {zone.nearestEvacuation?.name}
              </h3>
              <p className="text-body text-ink-900/70 dark:text-mist-50/70">
                {zone.nearestEvacuation?.distance} km {zone.nearestEvacuation?.direction} — Capacity: {zone.nearestEvacuation?.capacity}
              </p>
              <p className="text-caption text-ink-900/50 dark:text-mist-50/50 mt-2">
                Route ready if needed. No action required at this time.
              </p>
            </Card>

            <Card variant="dark">
              <h3 className="font-display text-h3 text-mist-50 mb-4">
                Live Map
              </h3>
              <div className="bg-forest-950 rounded-lg border border-moss-600 overflow-hidden relative aspect-[16/9]">
                <ContourField className="absolute inset-0" opacity={0.12} />
                <div className="absolute inset-0">
                  <LiveMap
                    center={[zone.coordinates[0], zone.coordinates[1]]}
                    zoom={13}
                    showWeatherOverlay="clouds_new"
                    zoneMarkers={zonesFromData({ zones: data.zones })}
                    showUserLocation={true}
                  />
                </div>
              </div>
              <p className="text-caption text-mist-50/50 mt-3">
                {data.zones.length} zones monitored. Green markers indicate Safe/Watch levels. Your location shown as a green dot if geolocation is enabled.
              </p>
            </Card>

            <div className="text-center text-caption text-ink-900/50 dark:text-mist-50/50">
              Last updated: {zone.lastUpdate}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
