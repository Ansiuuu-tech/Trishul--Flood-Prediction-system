export function TermsPage() {
  return (
    <div className="min-h-screen bg-mist-50 dark:bg-forest-950">
      <section className="section-py bg-forest-950 relative" aria-labelledby="terms-heading">
        <div className="relative container-main text-center">
          <p className="font-mono text-caption text-fern-400 tracking-widest uppercase mb-4">Legal</p>
          <h1 id="terms-heading" className="font-display text-hero-h1 font-medium text-mist-50 mb-4">
            Terms of Service
          </h1>
          <p className="text-caption text-mist-50/50">Last updated: September 14, 2026</p>
        </div>
      </section>

      <section className="section-py bg-mist-50 dark:bg-forest-950">
        <div className="container-main max-w-3xl mx-auto text-body text-ink-900/80 dark:text-mist-50/80 space-y-8">
          <p>
            These Terms of Service ("Terms") govern your use of the Trishul flash-flood
            early-warning dashboard ("Trishul", "the system", "we"). By creating an account or
            using the dashboard, you agree to these Terms.
          </p>

          <div>
            <h2 className="font-display text-h3 text-ink-900 dark:text-mist-50 mb-3">1. Nature of the Service</h2>
            <p>
              Trishul is a prototype / demonstration early-warning system for flash floods. It is
              provided for research, educational, and demonstration purposes. It is{' '}
              <strong>not a certified public safety or emergency alert system</strong>, and must
              not be relied upon as the sole source of information for evacuation or
              life-safety decisions. Always follow guidance from local authorities and official
              emergency services.
            </p>
          </div>

          <div>
            <h2 className="font-display text-h3 text-ink-900 dark:text-mist-50 mb-3">2. Accounts</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You may create an account directly or via Facebook Login.</li>
              <li>You are responsible for keeping your login credentials secure.</li>
              <li>You must provide accurate information when creating an account.</li>
              <li>We may suspend or terminate accounts used for misuse or abuse of the system.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-h3 text-ink-900 dark:text-mist-50 mb-3">3. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Attempt to disrupt, overload, or gain unauthorized access to the system.</li>
              <li>Use the dashboard data to mislead others or spread false alerts.</li>
              <li>Reverse engineer or scrape the service beyond normal use.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-h3 text-ink-900 dark:text-mist-50 mb-3">4. No Warranty</h2>
            <p>
              The service is provided "as is", without warranties of any kind. Sensor data,
              predictions, and alerts may be delayed, inaccurate, or unavailable due to hardware,
              network, or model limitations inherent to a prototype system.
            </p>
          </div>

          <div>
            <h2 className="font-display text-h3 text-ink-900 dark:text-mist-50 mb-3">5. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Trishul and its contributors are not liable
              for any damages, losses, or harm arising from reliance on the dashboard, its data,
              or its predictions.
            </p>
          </div>

          <div>
            <h2 className="font-display text-h3 text-ink-900 dark:text-mist-50 mb-3">6. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of the service after
              changes are posted constitutes acceptance of the updated Terms.
            </p>
          </div>

          <div>
            <h2 className="font-display text-h3 text-ink-900 dark:text-mist-50 mb-3">7. Contact</h2>
            <p>
              Questions about these Terms can be sent to{' '}
              <a href="mailto:contact@trishul-warning.org" className="underline">contact@trishul-warning.org</a>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
