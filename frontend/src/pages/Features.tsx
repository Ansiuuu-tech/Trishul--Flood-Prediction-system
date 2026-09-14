import { Link } from 'react-router-dom';
import { RudraBadge, Card } from '@/components/ui';
import { FeatureIcon } from '@/components/core/FeaturePage';
import { features } from '@/lib/features';
import featuresBg from '@/assets/images/features-bg.jpeg?url';

const featureAccents: Record<string, string> = {
  'varuna-watch': 'bg-gradient-to-r from-rudra-watch via-rudra-warn to-rudra-evacuate',
  'bhumi-sense': 'bg-gradient-to-r from-rudra-safe via-rudra-watch to-rudra-warn',
  'kampan-alert': 'bg-gradient-to-r from-rudra-warn via-rudra-evacuate to-rudra-watch',
  'trishul-core': 'bg-gradient-to-r from-rudra-safe via-rudra-watch to-rudra-evacuate',
  'rudra-levels': 'bg-gradient-to-r from-rudra-safe to-rudra-evacuate',
  'kailash-view': 'bg-gradient-to-r from-fern-400 via-moss-600 to-forest-950',
  'drishti-panel': 'bg-gradient-to-r from-signal-amber via-rudra-warn to-rudra-watch',
  'ghanta-signal': 'bg-gradient-to-r from-rudra-evacuate via-signal-amber to-rudra-warn',
  'dhal-watch': 'bg-gradient-to-r from-rudra-safe via-rudra-watch to-rudra-warn',
  'smriti-track': 'bg-gradient-to-r from-signal-amber via-rudra-warn to-rudra-evacuate',
  'sankat-grid': 'bg-gradient-to-r from-rudra-watch via-rudra-warn to-rudra-evacuate',
};

const additionalFeatures = [
  {
    id: 'dhal-watch',
    name: 'Dhal Watch',
    myth: 'Slope',
    description: 'Maps how steep the terrain is at each point. Steeper slopes shed rainwater far faster than flat ground, giving communities downstream less time to react once heavy rain begins.',
    icon: { type: 'ground' },
    isPlanned: true,
  },
  {
    id: 'smriti-track',
    name: 'Smriti Track',
    myth: 'Historical flood frequency',
    description: 'Records how often a specific location has flooded before. Areas with repeated past events carry structural risk factors — drainage patterns, land use — that make them likely to flood again.',
    icon: { type: 'insight' },
    isPlanned: true,
  },
  {
    id: 'sankat-grid',
    name: 'Sankat Grid',
    myth: 'Terrain susceptibility',
    description: 'Combines elevation, drainage density, and land cover into a single vulnerability score per zone. It flags which areas are inherently flood-prone, independent of any single day weather.',
    icon: { type: 'core' },
    isPlanned: true,
  },
];

export function FeaturesPage() {
  return (
    <div className="min-h-screen bg-mist-50 dark:bg-forest-950">
      <div>
        {/* Hero */}
        <section className="section-py bg-forest-950 relative" style={{ backgroundImage: `url(${featuresBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }} aria-labelledby="features-hero-heading">
          <div className="absolute inset-0 bg-forest-950/70" aria-hidden="true" />
          <div className="relative container-main text-center">
            <p className="font-mono text-caption text-fern-400 tracking-widest uppercase mb-4 animate-fade-in">
              Product Capabilities
            </p>
            <h1 id="features-hero-heading" className="font-display text-hero-h1 font-medium text-mist-50 mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
              Six Modules<br />
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
              {[...features
                .filter(feature => !['ghanta-signal', 'drishti-panel', 'rudra-levels', 'kailash-view', 'trishul-core'].includes(feature.id)), ...additionalFeatures]
                .map(feature => {
                const card = (
                <article key={feature.id} className="card hover group h-full" role="listitem">
                  <div className="flex items-start justify-between mb-4">
                    <FeatureIcon type={feature.icon.type} />
                    <div
                      className={`h-1 w-12 rounded-full ${featureAccents[feature.id]} opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-out`}
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
                </article>
                );

                return (
                  <Link
                    key={feature.id}
                    to={`/features/${feature.id}`}
                    className="block h-full"
                    aria-label={`Open ${feature.name} full page`}
                  >
                    {card}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
