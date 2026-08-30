import { Link } from 'react-router-dom';
import { RudraBadge, Card, Button } from '@/components/ui';
import { ContourField } from '@/components/core';
import { FeatureIcon } from '@/components/core/FeaturePage';
import { features } from '@/lib/features';
import { Navigation, Footer } from '@/components/layout';

const featureAccents: Record<string, string> = {
  'varuna-watch': 'bg-gradient-to-r from-rudra-watch via-rudra-warn to-rudra-evacuate',
  'bhumi-sense': 'bg-gradient-to-r from-rudra-safe via-rudra-watch to-rudra-warn',
  'kampan-alert': 'bg-gradient-to-r from-rudra-warn via-rudra-evacuate to-rudra-watch',
  'trishul-core': 'bg-gradient-to-r from-rudra-safe via-rudra-watch to-rudra-evacuate',
  'rudra-levels': 'bg-gradient-to-r from-rudra-safe to-rudra-evacuate',
  'kailash-view': 'bg-gradient-to-r from-fern-400 via-moss-600 to-forest-950',
  'drishti-panel': 'bg-gradient-to-r from-signal-amber via-rudra-warn to-rudra-watch',
  'ghanta-signal': 'bg-gradient-to-r from-rudra-evacuate via-signal-amber to-rudra-warn',
};

export function FeaturesPage() {
  return (
    <div className="min-h-screen bg-mist-50 dark:bg-forest-950">
      <Navigation />

      <main id="main-content" className="pt-16">
        {/* Hero */}
        <section className="section-py bg-forest-950 relative" aria-labelledby="features-hero-heading">
          <ContourField className="absolute inset-0" opacity={0.08} />
          <div className="relative container-main text-center">
            <p className="font-mono text-caption text-fern-400 tracking-widest uppercase mb-4 animate-fade-in">
              Product Capabilities
            </p>
            <h1 id="features-hero-heading" className="font-display text-hero-h1 font-medium text-mist-50 mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
              Eight Modules.<br />
              <span className="block">One Warning System.</span>
            </h1>
            <p className="text-body text-mist-50/70 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '200ms' }}>
              Each feature page follows the same structure: what it measures, how it works, what it feeds into Trishul Core, and a live mockup of that specific module.
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="section-py bg-mist-50 dark:bg-forest-950" aria-labelledby="features-grid-heading">
          <div className="container-main">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" role="list">
              {features.map((feature, index) => (
                <article
                  key={feature.id}
                  className="card hover group"
                  role="listitem"
                  >
                  <div className="flex items-start justify-between mb-4">
                    <FeatureIcon type={feature.icon.type} />
                    <div
                      className={`h-1 w-12 rounded-full ${featureAccents[feature.id]} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="font-display text-h3 text-ink-900 dark:text-mist-50 mb-2">
                    {feature.name}
                  </h3>
                  <p className="font-mono text-caption text-ink-900/40 dark:text-mist-50/40 mb-3">
                    {feature.myth}
                  </p>
                  <p className="text-body text-ink-900/70 dark:text-mist-50/70 mb-6">
                    {feature.description}
                  </p>
                  <Link
                    to={`/features/${feature.id}`}
                    className="link font-medium block"
                  >
                    Explore {feature.name} →
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section-py bg-forest-950 relative" aria-labelledby="features-cta-heading">
          <ContourField className="absolute inset-0" opacity={0.08} />
          <div className="relative container-main text-center">
            <h2 id="features-cta-heading" className="font-display text-h2 text-mist-50 mb-4">
              Ready to see the fusion in action?
            </h2>
            <p className="text-body text-mist-50/60 max-w-2xl mx-auto mb-8">
              Trishul Core is where the three signals become one warning. Walk through the live demo.
            </p>
            <Link to="/features/trishul-core">
              <Button variant="primary-pill" size="lg">
                Enter Trishul Core Demo
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}