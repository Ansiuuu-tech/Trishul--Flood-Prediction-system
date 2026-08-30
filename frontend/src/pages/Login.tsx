import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input } from '@/components/ui';
import { TrishulMark, ContourField } from '@/components/core';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/config';

export function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setToken } = useAuth();

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Valid email required';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      const resp = await fetch(`${API_URL}/api/auth/demo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'viewer' }),
      });
      if (!resp.ok) throw new Error('Unable to sign in');
      const { token } = await resp.json();
      setToken(token);
      navigate('/dashboard', { replace: true });
    } catch {
      setErrors((prev) => ({
        ...prev,
        submit: 'Backend unavailable. Use Continue with Google / Facebook for a real account, or start the backend first.',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = (provider: 'google' | 'facebook') => {
    window.location.href = `${API_URL}/api/auth/${provider}/login`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  return (
    <div className="min-h-screen bg-mist-50 dark:bg-forest-950 flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 min-w-0">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-10">
            <TrishulMark size="md" color="dark" />
            <span className="font-display text-2xl font-semibold text-ink-900 dark:text-mist-50">TRISHUL</span>
          </div>

          <h1 className="font-display text-h2 text-ink-900 dark:text-mist-50 mb-2">Welcome back</h1>
          <p className="text-body text-ink-900/60 dark:text-mist-50/60 mb-8">Sign in to access the Trishul dashboard and live demo.</p>

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <Button
              variant="oauth"
              onClick={() => handleOAuth('google')}
              disabled={isLoading}
              type="button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className="mr-3">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
            <Button
              variant="oauth"
              onClick={() => handleOAuth('facebook')}
              disabled={isLoading}
              type="button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="mr-3">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.046V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Continue with Facebook
            </Button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200 dark:border-moss-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-mist-50 dark:bg-forest-950 text-ink-900/50 dark:text-mist-50/50">or</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="you@organization.org"
              required
              autoComplete="email"
            />
            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`input pr-12 ${errors.password ? 'border-rudra-evacuate focus:border-rudra-evacuate focus:ring-rudra-evacuate/20' : ''}`}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                {errors.password && (
                  <p id="password-error" className="mt-1.5 text-caption text-rudra-evacuate" role="alert">{errors.password}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <Link to="/forgot-password" className="link text-caption">Forgot password?</Link>
            </div>
            {errors.submit && (
              <p className="text-caption text-rudra-evacuate" role="alert">{errors.submit}</p>
            )}
            <Button type="submit" variant="primary-pill" className="w-full" isLoading={isLoading}>
              Log in
            </Button>
          </form>

          <p className="mt-6 text-center text-caption text-ink-900/60 dark:text-mist-50/60">
            Don't have an account?{' '}
            <Link to="/signup" className="link font-medium">Create one</Link>
          </p>
        </div>
      </div>

        <div className="hidden lg:flex lg:flex-1 relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-forest-950" />
        <ContourField opacity={0.12} drift={true} colorMode="dark" />
        <div className="absolute inset-0 bg-gradient-to-br from-forest-950 via-forest-800 to-forest-950 opacity-90" aria-hidden="true" />
        <div className="absolute inset-0 flex items-center justify-center p-12 relative z-10">
          <div className="text-center max-w-lg">
            <TrishulMark size="xl" color="light" className="mx-auto mb-8 opacity-60" />
            <h2 className="font-display text-hero-h1 font-medium text-mist-50 mb-6 leading-tight">
              Three Signals.<br />
              <span className="block">One Warning.</span>
            </h2>
            <p className="text-body text-mist-50/60">
              Varuna watches the rain. Bhumi feels the ground. Kampan listens to the mountain. Trishul fuses them into the warning the village receives.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}