import { Navigation, Footer } from '@/components/layout';
import { Link } from 'react-router-dom';
import { DamageScene, ContourField } from '@/components/core';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-mist-50 dark:bg-forest-950">
      <Navigation />
      <main id="main-content" className="pt-16">
        <section className="section-py bg-forest-950 relative overflow-hidden" aria-labelledby="404-heading">
          <DamageScene shaktiScore={35} className="absolute inset-0 opacity-20" />
          <ContourField className="absolute inset-0" opacity={0.08} />
          <div className="absolute inset-0 bg-forest-950/70" aria-hidden="true" />
          <div className="relative container-main text-center">
            <p className="font-mono text-caption text-fern-400 tracking-widest uppercase mb-4 animate-fade-in">
              404
            </p>
            <h1 id="404-heading" className="font-display text-hero-h1 font-medium text-mist-50 mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
              Page Not Found
            </h1>
            <p className="text-body text-mist-50/70 max-w-2xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
              The river changed course, and this page got swept away. If you were looking for the warning system, you know where to find it.
            </p>
            <Link to="/home" className="animate-fade-in" style={{ animationDelay: '300ms' }}>
              <button className="btn btn-primary-pill">Back to Home</button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
