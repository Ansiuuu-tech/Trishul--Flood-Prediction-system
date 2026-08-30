import { useState, useEffect } from 'react';
import { Navigation, Footer } from '@/components/layout';
import { NormalStateView, AlertStateView } from '@/components/dashboard';
import { RudraRing, ContourField } from '@/components/core';
import { Button } from '@/components/ui';
import { DashboardData } from '@/lib/mockData';
import { mockDashboardData, mockAlertData } from '@/lib/mockData';
import { fetchDashboardData } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState<'normal' | 'alert'>('normal');

  const isAlertState = data?.isAlert ?? false;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchDashboardData()
      .then((fetched) => {
        if (!cancelled) {
          setData(fetched);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch data');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const showAlert = error ? manualMode === 'alert' : isAlertState;
  const { user } = useAuth();
  const firstName = user?.full_name?.split(/\s+/)[0] || user?.email?.split("@")[0];
  const zone = (data ?? mockDashboardData).zones[0];
  const weather = (data ?? mockDashboardData).weather;
  const displayData = showAlert ? (data ?? mockAlertData) : (data ?? mockDashboardData);

  if (loading) {
    return (
      <div className="min-h-screen bg-mist-50 dark:bg-forest-950">
        <Navigation />
        <main id="main-content" className="pt-16">
          <section className="section-py bg-forest-950 relative overflow-hidden" aria-labelledby="dashboard-heading">
            <ContourField className="absolute inset-0" opacity={0.08} />
            <div className="absolute inset-0 bg-forest-950/60" aria-hidden="true" />
            <div className="relative container-main text-center py-20">
              <p className="font-mono text-caption text-fern-400 tracking-widest uppercase mb-4">
                Loading Dashboard...
              </p>
              <p className="text-body text-mist-50/60">
                Connecting to Trishul Core and weather services.
              </p>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mist-50 dark:bg-forest-950">
      <Navigation />
      <main id="main-content" className="pt-16">
        <section className="section-py bg-forest-950 relative overflow-hidden" aria-labelledby="dashboard-heading">
          <ContourField className="absolute inset-0" opacity={0.08} />
          <div className="absolute inset-0 bg-forest-950/60" aria-hidden="true" />
          <div className="relative container-main">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="font-mono text-caption text-fern-400 tracking-widest uppercase mb-4">
                  {user ? `Welcome back, ${firstName}` : 'Command Center'}
                </p>
                <h1 id="dashboard-heading" className="font-display text-hero-h1 font-medium text-mist-50">
                  Live Dashboard
                </h1>
              </div>
              <div className="flex items-center gap-4">
                {error && (
                  <div className="flex items-center gap-3">
                    <span className="font-sans text-sm text-rudra-watch">
                      Demo Mode — backend unavailable
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setManualMode('normal')}
                        className={`px-3 py-1 rounded-btn text-xs font-medium transition-colors ${
                          manualMode === 'normal' ? 'bg-rudra-safe text-white' : 'bg-stone-200 dark:bg-forest-800 text-ink-900 dark:text-mist-50'
                        }`}
                      >
                        Normal
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualMode('alert')}
                        className={`px-3 py-1 rounded-btn text-xs font-medium transition-colors ${
                          manualMode === 'alert' ? 'bg-rudra-evacuate text-white' : 'bg-stone-200 dark:bg-forest-800 text-ink-900 dark:text-mist-50'
                        }`}
                      >
                        Alert
                      </button>
                    </div>
                  </div>
                )}
                <RudraRing
                  level={showAlert ? 'evacuate' : 'safe'}
                  shaktiScore={showAlert ? (zone?.shaktiScore ?? 82) : (zone?.shaktiScore ?? 0)}
                  pulse={showAlert}
                  size="md"
                />
              </div>
            </div>
            <p className="text-body text-mist-50/60 max-w-3xl">
              {showAlert
                ? 'Evacuate level active. Three signals fused — evacuation routes and delivery channels visible below.'
                : 'All sensors nominal. Calm dashboard with weather, rainfall trend, and nearest evacuation info.'}
            </p>
          </div>
        </section>

        {showAlert ? (
          <AlertStateView data={displayData} />
        ) : (
          <NormalStateView data={displayData} />
        )}

        <section className="section-py bg-forest-950 relative text-center" aria-hidden="true">
          <ContourField className="absolute inset-0" opacity={0.08} />
          <div className="relative container-main">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (error) {
                  setManualMode(manualMode === 'alert' ? 'normal' : 'alert');
                } else {
                  setData(null);
                }
              }}
              className="text-mist-50/50 hover:text-mist-50"
            >
              {error
                ? `Switch to ${manualMode === 'alert' ? 'Normal' : 'Alert'} Demo`
                : 'Simulate Alert Mode'}
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
