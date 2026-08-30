import { clsx } from 'clsx';

export interface TrishulLogoProps {
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

export function TrishulLogo({ size = 'md', color = 'dark', className, animate = false }: TrishulLogoProps) {
  const dimension = sizeMap[size];
  const strokeColor = color === 'light' ? '#F3F5EE' : '#0B1A12';

  return (
    <svg
      width={dimension}
      height={dimension}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx(className, animate && 'animate-logo-draw')}
      aria-hidden="true"
      role="img"
      aria-label="Trishul logo"
    >
      <defs>
        <path id="trishul-path" d="
          M50 85
          L50 25
          M30 45
          L50 25
          L70 45
          M50 35
          Q50 30 55 28
          Q60 26 55 24
          Q50 22 45 24
          Q40 26 45 28
          Q50 30 50 35
        " />
      </defs>
      <path
        d="
          M50 85
          L50 25
          M30 45
          L50 25
          L70 45
          M50 35
          Q50 30 55 28
          Q60 26 55 24
          Q50 22 45 24
          Q40 26 45 28
          Q50 30 50 35
        "
        stroke={strokeColor}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={animate ? 300 : 'none'}
        strokeDashoffset={animate ? 300 : 'none'}
      />
    </svg>
  );
}