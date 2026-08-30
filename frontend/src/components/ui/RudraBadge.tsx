import { clsx } from 'clsx';
import { CSSProperties } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type RudraLevel = 'safe' | 'watch' | 'warn' | 'evacuate';

export interface RudraBadgeProps {
  level: RudraLevel;
  pulse?: boolean;
  showDot?: boolean;
  className?: string;
  style?: CSSProperties;
  size?: 'sm' | 'md' | 'lg';
}

const levelConfig = {
  safe: { bg: 'bg-rudra-safe/15', text: 'text-rudra-safe', border: 'border-rudra-safe/30', label: 'Safe' },
  watch: { bg: 'bg-rudra-watch/15', text: 'text-rudra-watch', border: 'border-rudra-watch/30', label: 'Watch' },
  warn: { bg: 'bg-rudra-warn/15', text: 'text-rudra-warn', border: 'border-rudra-warn/30', label: 'Warning' },
  evacuate: { bg: 'bg-rudra-evacuate/15', text: 'text-rudra-evacuate', border: 'border-rudra-evacuate/30', label: 'Evacuate' },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-3 py-1 text-caption gap-2',
  lg: 'px-4 py-1.5 text-sm gap-2',
};

export function RudraBadge({ level, pulse = false, showDot = true, className, style, size = 'md' }: RudraBadgeProps) {
  const prefersReducedMotion = useReducedMotion();
  const config = levelConfig[level];
  const shouldPulse = pulse && (level === 'warn' || level === 'evacuate') && !prefersReducedMotion;

  return (
    <span
      className={clsx(
        'inline-flex items-center font-sans font-medium rounded-btn',
        sizeClasses[size],
        config.bg,
        config.text,
        config.border,
        shouldPulse && 'rudra-badge-pulse',
        className
      )}
      style={style}
      role="status"
      aria-live={shouldPulse ? 'assertive' : 'polite'}
    >
      {showDot && (
        <span
          className={clsx(
            level === 'safe' && 'bg-rudra-safe',
            level === 'watch' && 'bg-rudra-watch',
            level === 'warn' && 'bg-rudra-warn',
            level === 'evacuate' && 'bg-rudra-evacuate',
            shouldPulse && 'rudra-badge-pulse',
            size === 'sm' && 'w-1.5 h-1.5',
            size === 'md' && 'w-2 h-2',
            size === 'lg' && 'w-2.5 h-2.5',
            'rounded-full'
          )}
          aria-hidden="true"
        />
      )}
      <span>{config.label}</span>
    </span>
  );
}