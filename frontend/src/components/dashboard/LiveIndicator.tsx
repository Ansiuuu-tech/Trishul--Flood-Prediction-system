import { useEffect, useState } from 'react';

interface LiveIndicatorProps {
  /** Change this value whenever new data actually arrives (e.g. zone.id, or a data version/timestamp)
   *  to reset the "updated Ns ago" counter. */
  resetKey: string | number;
  label?: string;
  className?: string;
}

/**
 * Deliberately calm — no pulsing animation here. Pulsing is reserved
 * exclusively for Warning/Evacuate elsewhere in the app (see RudraRing).
 * "Live" at Safe/Watch is communicated by visibly ticking time instead,
 * so the alert hierarchy stays unambiguous.
 */
export function LiveIndicator({ resetKey, label = 'Live', className = '' }: LiveIndicatorProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    setSeconds(0);
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [resetKey]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-rudra-safe" aria-hidden="true" />
      <span className="font-mono text-caption text-ink-900/60 dark:text-mist-50/60 tabular-nums">
        {label} · updated {seconds}s ago
      </span>
    </div>
  );
}
