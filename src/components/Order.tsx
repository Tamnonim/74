import React from 'react';

type Props = {
  x: number;
  y: number;
  speed: number;
  opacity: number;
  color: string;
  streakColor: string;
  r?: number;
  k: number;
};

/** An order: one dot, one identity. Fast orders trail a hairline streak. */
export const Order: React.FC<Props> = ({x, y, speed, opacity, color, streakColor, r = 6.5, k}) => {
  const len = Math.min(44, Math.max(0, speed - 130) * 0.1);
  return (
    <g opacity={opacity}>
      {len > 3 && (
        <line x1={x} y1={y - len} x2={x} y2={y - r} stroke={streakColor} strokeOpacity={0.4}
          strokeWidth={1.6 * k} strokeLinecap="round" />
      )}
      <circle cx={x} cy={y} r={r} fill={color} />
    </g>
  );
};
