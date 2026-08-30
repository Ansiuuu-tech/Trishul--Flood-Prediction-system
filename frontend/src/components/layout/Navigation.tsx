import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NavLink, Button } from '@/components/ui';
import { TrishulMark } from '@/components/core';
import { UserMenu } from './UserMenu';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { path: '/home', label: 'Home' },
  { path: '/features', label: 'Features' },
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/about', label: 'About' },
  { path: '/team', label: 'Team' },
  { path: '/contact', label: 'Contact' },
];

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isLoading, logout } = useAuth();

  const closeAuthSession = () => {
    logout();
    setMobileMenuOpen(false);
  };

  // Logged-out: "Log in" / "Get Access" buttons.
  // Logged-in: the avatar + name dropdown (UserMenu).
  // Loading: a skeleton so there is no flash of the wrong state.
  const authControls = isLoading
    ? (
      <div
        className="h-8 w-8 shrink-0 rounded-full bg-mist-50/20 dark:bg-mist-50/10 animate-pulse"
        aria-label="Loading state"
      />
    )
    : user
      ? <UserMenu user={user} onLogout={closeAuthSession} />
      : (
        <>
          <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
            <Button variant="primary-pill" size="sm">Get Access</Button>
          </Link>
        </>
      );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-mist-50/95 backdrop-blur-md border-b border-stone-200 dark:bg-forest-950/95 dark:border-forest-800 dark:border-moss-600">
      <nav className="container-main" aria-label="Main navigation">
        <div className="flex h-16 items-center justify-between">
          <Link to="/home" className="flex items-center gap-2" aria-label="Trishul Home">
            <TrishulMark size="sm" color="dark" />
            <span className="font-display text-xl font-semibold text-ink-900 dark:text-mist-50">TRISHUL</span>
          </Link>

          <div className={`
            hidden md:flex items-center gap-8
            ${mobileMenuOpen ? 'md:hidden' : ''}
          `}>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                active={location.pathname === item.path}
                variant="default"
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {authControls}

            <button
              className="md:hidden p-2 rounded-btn text-ink-900 hover:bg-ink-900/10 dark:text-mist-50 dark:hover:bg-mist-50/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {mobileMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div id="mobile-menu" className="md:hidden py-4 border-t border-stone-200 dark:border-moss-600 animate-fade-in">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  active={location.pathname === item.path}
                  variant="default"
                  className="py-2 px-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-stone-200 dark:border-moss-600">
                {authControls}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}