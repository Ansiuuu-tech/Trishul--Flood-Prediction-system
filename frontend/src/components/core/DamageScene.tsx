import { useMemo, CSSProperties } from 'react';
import { clsx } from 'clsx';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { rudraColors } from './RudraRing';

type RudraLevel = 'safe' | 'watch' | 'warn' | 'evacuate';

function scoreToLevel(score: number): RudraLevel {
  if (score < 20) return 'safe';
  if (score < 50) return 'watch';
  if (score < 80) return 'warn';
  return 'evacuate';
}

function sineRoughPath(xStart: number, yBase: number, xEnd: number, segments: number, roughness: number, amplitude: number, phase: number = 0): string {
  const pts: string[] = [`M${xStart},${yBase}`];
  const span = xEnd - xStart;
  const segLen = span / segments;
  for (let i = 1; i <= segments; i++) {
    const x = xStart + segLen * i;
    const t = i / segments;
    const noise = (Math.random() * 2 - 1) * roughness;
    const y = yBase + Math.sin(t * Math.PI * 2 + phase) * amplitude + noise;
    pts.push(`L${x},${y}`);
  }
  return pts.join(' ');
}

export interface DamageSceneProps {
  shaktiScore?: number;
  className?: string;
  style?: CSSProperties;
  width?: number;
  height?: number;
  showWater?: boolean;
  animate?: boolean;
}

export function DamageScene({
  shaktiScore = 0,
  className,
  style,
  width = 800,
  height = 400,
  showWater = true,
  animate = true,
}: DamageSceneProps) {
  const level = scoreToLevel(shaktiScore);
  const levelColor = rudraColors[level];
  const prefersReducedMotion = useReducedMotion();

  const scene = useMemo(() => {
    const scoreNorm = Math.min(shaktiScore / 100, 1);
    const waterLevel = 280 + scoreNorm * 60;
    const roughness = scoreNorm * 8;
    const waveAmplitude = 2 + scoreNorm * 6;
    const floodExtent = scoreNorm * 80;

    const riverPath = sineRoughPath(0, waterLevel, 800, 40, roughness, waveAmplitude, 0);
    const riverPath2 = sineRoughPath(0, waterLevel + 4, 800, 30, roughness * 0.7, waveAmplitude * 0.5, 1.2);
    const riverPath3 = sineRoughPath(0, waterLevel + 8, 800, 50, roughness * 0.5, waveAmplitude * 0.3, 2.5);

    const hill1 = 'M0,300 Q50,260 100,280 T200,265 T300,280 T400,260 T500,285 T600,260 T700,280 T800,260 L800,400 L0,400 Z';
    const hill2 = 'M0,320 Q80,290 160,310 T320,295 T480,320 T640,300 T800,315 L800,400 L0,400 Z';
    const hill3 = 'M0,340 Q60,320 120,335 T240,325 T360,340 T480,320 T600,338 T720,325 L720,400 L0,400 Z';

    const villageRoofCount = 8;
    const villageStart = 540;
    const villageEnd = 760;
    const roofs: string[] = [];
    for (let i = 0; i < villageRoofCount; i++) {
      const x = villageStart + (villageEnd - villageStart) * (i / (villageRoofCount - 1));
      const w = 12 + Math.random() * 6;
      const h = 8 + Math.random() * 4;
      const y = 270 + Math.sin(i * 0.5) * 3 - floodExtent * 0.3;
      roofs.push(`M${x - w / 2},${y} L${x},${y - h} L${x + w / 2},${y} Z`);
    }

    return {
      waterLevel,
      roughness,
      riverPath,
      riverPath2,
      riverPath3,
      hill1,
      hill2,
      hill3,
      roofs,
      scoreNorm,
      floodExtent,
    };
  }, [shaktiScore]);

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 800 400"
      preserveAspectRatio="none"
      className={clsx(className, 'damage-scene')}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'visible',
        ...style,
      }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="damage-scene-hill-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0B1A12" />
          <stop offset="100%" stopColor="#173626" />
        </linearGradient>
        <linearGradient id="damage-scene-water-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#B23A2E" />
          <stop offset="100%" stopColor="#4C8B5A" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="800" height="400" fill="#0B1A12" />

      <path d={scene.hill3} fill="url(#damage-scene-hill-gradient)" />
      <path d={scene.hill2} fill="url(#damage-scene-hill-gradient)" opacity={0.85} />
      <path d={scene.hill1} fill="url(#damage-scene-hill-gradient)" />

      {scene.roofs.map((roof, i) => (
        <path
          key={i}
          d={roof}
          fill="#3F6B49"
          opacity={0.6 + scene.scoreNorm * 0.2}
          stroke={levelColor}
          strokeWidth="0.5"
          strokeOpacity={scene.scoreNorm * 0.8}
        />
      ))}

      {showWater && (
        <>
          <path d={scene.riverPath3} fill="none" stroke="#4A7C59" strokeWidth="3" opacity={0.3} strokeLinecap="round" />
          <path d={scene.riverPath2} fill="none" stroke="#4A7C59" strokeWidth="4" opacity={0.5} strokeLinecap="round" />
          <path
            d={scene.riverPath2 + ' L800,400 L0,400 Z'}
            fill="url(#damage-scene-water-gradient)"
            opacity={0.5 + scene.scoreNorm * 0.4}
          />
          <path
            d={scene.riverPath + ' L800,400 L0,400 Z'}
            fill={levelColor}
            opacity={0.2 + scene.scoreNorm * 0.5}
            style={{
              animation: animate && !prefersReducedMotion
                ? `damagePulse 3s ease-in-out infinite`
                : undefined,
            }}
          />
        </>
      )}

      {scene.scoreNorm > 0.3 && (
        <path
          d={`M0,${scene.waterLevel - 20} Q100,${scene.waterLevel - 30} 200,${scene.waterLevel - 15} T400,${scene.waterLevel - 25} T600,${scene.waterLevel - 20} T800,${scene.waterLevel - 10} L800,400 L0,400 Z`}
          fill="#12180F"
          opacity={scene.scoreNorm * 0.5}
        />
      )}
    </svg>
  );
}
