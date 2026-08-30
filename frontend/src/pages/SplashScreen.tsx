import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrishulMark, ContourField } from '@/components/core';

export function SplashScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const [logoDrawn, setLogoDrawn] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('trishul-splash-seen');
    if (hasSeenSplash) {
      navigate('/home', { replace: true });
      return;
    }

    sessionStorage.setItem('trishul-splash-seen', 'true');

    const minDuration = 1800;
    const maxDuration = 2500;
    const startTime = Date.now();

    let currentProgress = 0;

    const progressInterval = setInterval(() => {
      currentProgress = Math.min(currentProgress + Math.random() * 15, 95);
      setProgress(currentProgress);
    }, 120);

    const logoTimer = setTimeout(() => {
      setLogoDrawn(true);
    }, 100);

    const checkComplete = () => {
      const elapsed = Date.now() - startTime;
      if ((elapsed >= minDuration && currentProgress >= 95) || elapsed >= maxDuration) {
        clearInterval(progressInterval);
        clearInterval(progressCheck);
        setProgress(100);
        setTimeout(() => {
          setShowSplash(false);
          navigate('/home', { replace: true });
        }, 400);
      }
    };

    const progressCheck = setInterval(checkComplete, 50);

    return () => {
      clearInterval(progressInterval);
      clearInterval(progressCheck);
      clearTimeout(logoTimer);
    };
   }, [navigate]);

  if (!showSplash) return null;

  return (
      <div className="fixed inset-0 z-[100] bg-forest-950 flex items-center justify-center overflow-hidden"
        role="status"
        aria-label="Loading Trishul"
        aria-live="polite"
      >
      <ContourField opacity={0.12} drift={true} colorMode="dark" aria-hidden="true" />

      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <TrishulMark size="xl" color="light" animate={true} />

        <div className="mt-8 animate-fade-in" style={{ animationDelay: '1.3s', animationFillMode: 'forwards', opacity: 0 }}>
          <h1 className="font-display text-hero-h1 font-medium text-mist-50 tracking-widest leading-none">
            TRISHUL
          </h1>
        </div>

        <p className="mt-4 font-mono text-caption text-mist-50/40 tracking-wider animate-fade-in" style={{ animationDelay: '1.6s', animationFillMode: 'forwards', opacity: 0 }}>
          THREE SIGNALS. ONE WARNING.
        </p>

        <div className="mt-10 w-full max-w-md animate-fade-in" style={{ animationDelay: '1.8s', animationFillMode: 'forwards', opacity: 0 }}>
          <div className="h-1 bg-forest-800 rounded-full overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Loading assets">
            <div
              className="h-full bg-fern-400 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}