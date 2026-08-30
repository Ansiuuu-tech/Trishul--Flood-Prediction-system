import { useMemo, CSSProperties } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface ContourFieldProps {
  className?: string;
  opacity?: number;
  drift?: boolean;
  lineCount?: number;
  amplitude?: number;
  frequency?: number;
  colorMode?: 'dark' | 'light';
  style?: CSSProperties;
}

function sinePath(y: number, width: number, amplitude: number, frequency: number, phase: number): string {
  const points: string[] = [];
  const step = Math.max(4, Math.floor(width / 80));
  for (let x = 0; x <= width; x += step) {
    const yVal = y + Math.sin((x / width) * Math.PI * frequency + phase) * amplitude;
    points.push(`${x},${yVal}`);
  }
  return `M${points.join(' ')}`;
}

export function ContourField({
  className = '',
  opacity = 0.1,
  drift = true,
  lineCount = 5,
  amplitude = 6,
  frequency = 1.5,
  colorMode = 'dark',
  style,
}: ContourFieldProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldDrift = drift && !prefersReducedMotion;

  const paths = useMemo(() => {
    const arr: { d: string; y: number; opacity: number }[] = [];
    const viewBoxW = 800;
    const viewBoxH = 600;
    for (let i = 0; i < lineCount; i++) {
      const y = 80 + (i * (viewBoxH / (lineCount + 1)));
      const baseOpacity = opacity * (1 - i * 0.1);
      arr.push({
        d: sinePath(y, viewBoxW, amplitude * (1 + i * 0.3), frequency + i * 0.4, (i * 0.5) * Math.PI),
        y,
        opacity: baseOpacity,
      });
    }
    return arr;
  }, [opacity, lineCount, amplitude, frequency]);

  const strokeColor = colorMode === 'dark' ? '#7FA872' : '#3F6B49';

  return (
    <svg
      className={className}
      viewBox="0 0 800 600"
      preserveAspectRatio="none"
      style={{
        ...style,
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
      }}
      aria-hidden="true"
    >
      <defs>
        {shouldDrift && (
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 0,-5; -5,0; 0,5; 0,0"
            dur="20s"
            repeatCount="indefinite"
          />
        )}
      </defs>
      {paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          stroke={strokeColor}
          strokeWidth="0.8"
          fill="none"
          opacity={p.opacity}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
