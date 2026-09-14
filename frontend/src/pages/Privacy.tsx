export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-mist-50 dark:bg-forest-950">
      <section className="section-py bg-forest-950 relative" aria-labelledby="privacy-heading">
        <div className="relative container-main text-center">
          <p className="font-mono text-caption text-fern-400 tracking-widest uppercase mb-4">Legal</p>
          <h1 id="privacy-heading" className="font-display text-hero-h1 font-medium text-mist-50 mb-4">
            Privacy Policy
          </h1>
          <p className="text-caption text-mist-50/50">Last updated: September 14, 2026</p>
        </div>
      </section>

      <section className="section-py bg-mist-50 dark:bg-forest-950">
        <div className="container-main max-w-3xl mx-auto text-body text-ink-900/80 dark:text-mist-50/80 space-y-8">
          <p>
            Trishul ("we", "our", "the system") is a flash-flood early-warning dashboard. This
            page explains what information we collect from users of the Trishul web application
            and dashboard, and how we use it.
          </p>

          <div>
            <h2 className="font-display text-h3 text-ink-900 dark:text-mist-50 mb-3">Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Account information:</strong> when you sign up directly or via Facebook
                Login, we collect your name, email address, and public profile picture (if
                provided) to create and identify your account.
              </li>
              <li>
                <strong>Facebook Login:</strong> if you choose "Continue with Facebook", we
                request the <code>public_profile</code> and <code>email</code> permissions only.
                Providing your email is optional — Facebook lets you decline sharing it during
                login, and your account will still work.
              </li>
              <li>
                <strong>Usage data:</strong> basic technical information such as login timestamps
                and session activity, used to keep your account secure and the dashboard
                functioning.
              </li>
              <li>
                <strong>Sensor / dashboard data:</strong> flood-monitoring readings shown on the
                dashboard are system telemetry and are not linked to individual user accounts.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-h3 text-ink-900 dark:text-mist-50 mb-3">How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To create, authenticate, and secure your Trishul account.</li>
              <li>To operate and improve the flood-warning dashboard and its features.</li>
              <li>To communicate important alerts or account-related notices, where applicable.</li>
              <li>We do not sell your personal information to third parties.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-h3 text-ink-900 dark:text-mist-50 mb-3">Data Sharing</h2>
            <p>
              We do not share your personal data with third parties except: (a) service providers
              that host our infrastructure (e.g. hosting and database providers) strictly to
              operate the application, or (b) where required by law.
            </p>
          </div>

          <div>
            <h2 className="font-display text-h3 text-ink-900 dark:text-mist-50 mb-3">Data Retention & Security</h2>
            <p>
              Account data is retained for as long as your account is active. We use industry
              standard measures (encrypted connections, hashed credentials, and access controls)
              to protect your data. You may request deletion of your account and associated data
              at any time by contacting us.
            </p>
          </div>

          <div>
            <h2 className="font-display text-h3 text-ink-900 dark:text-mist-50 mb-3">Your Choices</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You can log in without sharing your email via Facebook Login.</li>
              <li>You can request access, correction, or deletion of your account data.</li>
              <li>You can disconnect your Facebook account from your Trishul profile at any time.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-h3 text-ink-900 dark:text-mist-50 mb-3">Contact Us</h2>
            <p>
              For any privacy questions or data requests, contact us at{' '}
              <a href="mailto:contact@trishul-warning.org" className="underline">contact@trishul-warning.org</a>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
