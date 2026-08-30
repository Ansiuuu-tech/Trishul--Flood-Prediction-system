import { clsx } from 'clsx';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface TrishulMarkProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'light' | 'dark';
  className?: string;
  animate?: boolean;
}

const sizeMap = {
  sm: 28,
  md: 48,
  lg: 80,
  xl: 200,
};

const logoPaths = [
  { d: 'M100 18 L110 100 L100 122 L90 100 Z', delay: '0ms' },
  { d: 'M96 148 L88 148 C70 148 56 134 54 114 C53 100 58 86 68 76 L78 66 C72 82 74 98 82 110 C86 116 91 120 96 122 Z', delay: '100ms' },
  { d: 'M104 148 L112 148 C130 148 144 134 146 114 C147 100 142 86 132 76 L122 66 C128 82 126 98 118 110 C114 116 109 120 104 122 Z', delay: '200ms' },
  { d: 'M74 140 Q100 156 126 140 L126 150 Q100 166 74 150 Z', delay: '300ms' },
  { d: 'M93 145 L107 250', delay: '400ms' },
];

export function TrishulMark({
  size = 'md',
  color = 'dark',
  className,
  animate = false,
}: TrishulMarkProps) {
  const dimension = sizeMap[size];
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = animate && !prefersReducedMotion;

  return (
    <svg
      width={dimension}
      height={dimension}
      viewBox="0 0 200 260"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx(
        className,
        color === 'light' ? 'text-mist-50' : 'text-ink-900 dark:text-mist-50',
        shouldAnimate && 'trishul-mark-draw'
      )}
      aria-hidden="true"
      role="img"
      aria-label="Trishul mark"
    >
      {logoPaths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          className={shouldAnimate ? 'trishul-path-draw' : ''}
          style={shouldAnimate ? { animationDelay: p.delay } : undefined}
        />
      ))}
    </svg>
  );
}
