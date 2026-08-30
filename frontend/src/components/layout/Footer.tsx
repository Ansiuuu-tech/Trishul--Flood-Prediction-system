import { Link } from 'react-router-dom';
import { NavLink, Button, Input } from '@/components/ui';
import { TrishulMark } from '@/components/core';

const footerLinks = {
  Product: [
    { label: 'Features', path: '/features' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Varuna Watch', path: '/features/varuna-watch' },
    { label: 'Bhumi Sense', path: '/features/bhumi-sense' },
    { label: 'Kampan Alert', path: '/features/kampan-alert' },
    { label: 'Trishul Core', path: '/features/trishul-core' },
    { label: 'Rudra Levels', path: '/features/rudra-levels' },
    { label: 'Kailash View', path: '/features/kailash-view' },
    { label: 'Drishti Panel', path: '/features/drishti-panel' },
    { label: 'Ghanta Signal', path: '/features/ghanta-signal' },
  ],
  Company: [
    { label: 'About', path: '/about' },
    { label: 'Team', path: '/team' },
    { label: 'Contact', path: '/contact' },
  ],
  Legal: [
    { label: 'Privacy Policy', path: '/privacy' },
    { label: 'Terms of Service', path: '/terms' },
    { label: 'System Status', path: '/status' },
  ],
  Social: [
    { label: 'GitHub', href: 'https://github.com', external: true },
    { label: 'Twitter', href: 'https://twitter.com', external: true },
    { label: 'LinkedIn', href: 'https://linkedin.com', external: true },
  ],
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-forest-950 text-mist-50" role="contentinfo">
      <div className="container-main py-16 lg:py-24">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12 mb-16">
          <div className="col-span-2 lg:col-span-1">
            <Link to="/home" className="flex items-center gap-2 mb-4" aria-label="Trishul Home">
              <TrishulMark size="md" color="light" />
              <span className="font-display text-2xl font-semibold">TRISHUL</span>
            </Link>
            <p className="text-caption text-mist-50/60 max-w-xs">
              Hyper-local flash-flood and landslide early warning for Himalayan hill regions. Three signals. One warning.
            </p>
          </div>

          <nav aria-label="Product links">
            <h3 className="font-sans text-caption font-semibold uppercase tracking-wider text-mist-50/80 mb-4">Product</h3>
            <ul className="space-y-3">
              {footerLinks.Product.map((link) => (
                <li key={link.path}>
                  <NavLink to={link.path} variant="dark" className="block">
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Company links">
            <h3 className="font-sans text-caption font-semibold uppercase tracking-wider text-mist-50/80 mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.Company.map((link) => (
                <li key={link.path}>
                  <NavLink to={link.path} variant="dark" className="block">
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal links">
            <h3 className="font-sans text-caption font-semibold uppercase tracking-wider text-mist-50/80 mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.Legal.map((link) => (
                <li key={link.path}>
                  <NavLink to={link.path} variant="dark" className="block">
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="font-sans text-caption font-semibold uppercase tracking-wider text-mist-50/80 mb-4">Updates</h3>
            <p className="text-caption text-mist-50/60 mb-4 max-w-xs">
              Receive occasional updates on Trishul's development and deployments.
            </p>
            <form className="flex flex-col gap-2" onSubmit={(e) => e.preventDefault()}>
              <label htmlFor="footer-email" className="sr-only">Email address</label>
              <Input
                id="footer-email"
                type="email"
                placeholder="Enter your email"
                className="bg-forest-800 border-moss-600 text-mist-50 placeholder-mist-50/40 focus:border-signal-amber focus:ring-signal-amber/20"
              />
              <Button type="submit" variant="primary-pill" className="w-full">
                Subscribe
              </Button>
            </form>
            <div className="flex gap-4 mt-6">
              {footerLinks.Social.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="text-mist-50/50 hover:text-signal-amber transition-colors duration-200"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    {link.label === 'GitHub' && (
                      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                    )}
                    {link.label === 'Twitter' && (
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 9.24-3.306.855-6.177-6.73L.83 21.87l3.307-.817 7.494-7.49-6.942-7.58h3.266l6.272 6.883 7.412-8.233z"/>
                    )}
                    {link.label === 'LinkedIn' && (
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    )}
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Giant closing wordmark */}
        <div className="my-16 lg:my-24 text-center">
          <p className="font-display text-hero-h1 font-medium text-mist-50/10 lg:text-[clamp(4rem,10vw,8rem)] tracking-wider select-none">
            Know the river.
          </p>
        </div>

        <div className="pt-8 border-t border-moss-600/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-caption text-mist-50/40">
            © {currentYear} Trishul. Prototype early-warning system. Not a certified emergency service.
          </p>
          <div className="flex items-center gap-6">
            <NavLink to="/status" variant="dark" className="text-caption">System Status</NavLink>
            <NavLink to="/privacy" variant="dark" className="text-caption">Privacy</NavLink>
            <NavLink to="/terms" variant="dark" className="text-caption">Terms</NavLink>
          </div>
        </div>
      </div>
    </footer>
  );
}