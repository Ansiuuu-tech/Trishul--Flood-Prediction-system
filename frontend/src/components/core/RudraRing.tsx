import { useMemo, CSSProperties } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type RudraLevel = 'safe' | 'watch' | 'warn' | 'evacuate';

export const rudraColors: Record<RudraLevel, string> = {
  safe: '#4C8B5A',
  watch: '#C9A227',
  warn: '#D67C2B',
  evacuate: '#B23A2E',
};

export const rudraLabels: Record<RudraLevel, string> = {
  safe: 'Safe',
  watch: 'Watch',
  warn: 'Warning',
  evacuate: 'Evacuate',
};

export interface RudraRingProps {
  level: RudraLevel;
  shaktiScore?: number;
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function RudraRing({
  level,
  shaktiScore,
  pulse = false,
  size = 'md',
  showLabel = true,
  className,
  style,
}: RudraRingProps) {
  const prefersReducedMotion = useReducedMotion();
  const color = rudraColors[level];

  const sizeConfig = {
    sm: { ring: 24, dot: 8 },
    md: { ring: 40, dot: 12 },
    lg: { ring: 56, dot: 16 },
  };

  const sz = sizeConfig[size];
  const shouldPulse = pulse && (level === 'warn' || level === 'evacuate') && !prefersReducedMotion;

  return (
    <div
      className={`inline-flex items-center gap-2 font-sans font-medium ${className || ''}`}
      role="status"
      aria-live={shouldPulse ? 'assertive' : 'polite'}
      style={style}
    >
      <svg
        width={sz.ring}
        height={sz.ring}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden={showLabel ? undefined : true}
      >
        <circle
          cx="20"
          cy="20"
          r={(sz.ring / 2) - 3}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeOpacity={shouldPulse ? 0.4 : 0.2}
        />
        <circle
          cx="20"
          cy="20"
          r={sz.dot / 2}
          fill={color}
          style={{
            animation: shouldPulse ? `pulse 1.8s ease-in-out infinite` : undefined,
          }}
        />
      </svg>

      {showLabel && (
        <span style={{ color }} className="text-caption font-medium">
          {rudraLabels[level]}
        </span>
      )}

      {shaktiScore !== undefined && (
        <span className="font-mono text-xs text-ink-900/50 dark:text-mist-50/50">
          {shaktiScore}/100
        </span>
      )}
    </div>
  );
}

export const rudraColorsMap = rudraColors;
export const rudraLabelsMap = rudraLabels;
