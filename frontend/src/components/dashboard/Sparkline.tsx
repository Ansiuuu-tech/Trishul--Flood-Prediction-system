import { useEffect, useRef, useState } from 'react';

interface SparklineProps {
  value: number;
  color?: string;
  height?: number;
  width?: number;
  bufferSize?: number;
  /** Amount of gentle simulated drift per tick, so the line visibly breathes
   *  between real updates. Set to 0 once wired to a genuine live data stream. */
  jitter?: number;
}

export function Sparkline({
  value,
  color = '#4C8B5A',
  height = 28,
  width = 96,
  bufferSize = 24,
  jitter = 0,
}: SparklineProps) {
  const [points, setPoints] = useState<number[]>(() => Array(bufferSize).fill(value));
  const lastRealValue = useRef(value);

  // Real value changed (e.g. a new reading arrived) — push it into the buffer
  useEffect(() => {
    if (value === lastRealValue.current) return;
    lastRealValue.current = value;
    setPoints((prev) => [...prev.slice(1), value]);
  }, [value]);

  // Gentle simulated drift so the line stays visibly alive between real ticks
  useEffect(() => {
    if (!jitter) return;
    const id = setInterval(() => {
      setPoints((prev) => {
        const last = prev[prev.length - 1];
        const next = Math.max(0, last + (Math.random() - 0.5) * jitter);
        return [...prev.slice(1), next];
      });
    }, 1400);
    return () => clearInterval(id);
  }, [jitter]);

  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);

  const path = points
    .map((p, i) => {
      const x = i * step;
      const y = height - ((p - min) / range) * height * 0.8 - height * 0.1;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const lastY = height - ((points[points.length - 1] - min) / range) * height * 0.8 - height * 0.1;

  return (
    <svg width={width} height={height} className="overflow-visible" aria-hidden="true">
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
      <circle cx={width} cy={lastY} r="2.5" fill={color}>
        <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
