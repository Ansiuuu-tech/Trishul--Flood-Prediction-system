import { CSSProperties } from 'react';
import { clsx } from 'clsx';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { rudraColors, rudraLabels } from './RudraRing';

type RudraLevel = 'safe' | 'watch' | 'warn' | 'evacuate';

export interface RudraBannerProps {
  level: RudraLevel;
  shaktiScore?: number;
  pulse?: boolean;
  className?: string;
  children?: React.ReactNode;
  style?: CSSProperties;
}

export function RudraBanner({
  level,
  shaktiScore,
  pulse = false,
  className,
  children,
  style,
}: RudraBannerProps) {
  const prefersReducedMotion = useReducedMotion();
  const color = rudraColors[level];
  const label = rudraLabels[level];
  const shouldPulse = pulse && (level === 'warn' || level === 'evacuate') && !prefersReducedMotion;

  const bgClass = {
    safe: 'bg-rudra-safe/15 border-rudra-safe/30',
    watch: 'bg-rudra-watch/15 border-rudra-watch/30',
    warn: 'bg-rudra-warn/15 border-rudra-warn/30',
    evacuate: 'bg-rudra-evacuate/15 border-rudra-evacuate/30',
  }[level];

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-3 px-4 py-2 rounded-lg border',
        bgClass,
        shouldPulse && 'animate-pulse',
        className
      )}
      style={{ borderColor: `${color}60`, ...style }}
      role="status"
      aria-live={shouldPulse ? 'assertive' : 'polite'}
    >
      <span
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{
          backgroundColor: color,
          animation: shouldPulse ? `pulse 1.8s ease-in-out infinite` : undefined,
        }}
        aria-hidden="true"
      />

      <span className="font-display text-h3 font-medium" style={{ color }}>
        {label.toUpperCase()}
      </span>

      {shaktiScore !== undefined && (
        <span className="font-mono text-sm text-ink-900/50 dark:text-mist-50/50">
          Shakti: {shaktiScore}/100
        </span>
      )}

      {children}
    </div>
  );
}
