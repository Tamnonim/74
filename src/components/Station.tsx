import React from 'react';
import {GEO} from '../config';

export type Arc = {from: number; to: number}; // degrees, 0 = 12 o'clock, clockwise

type Props = {
  y: number;
  index: number;
  bg: string;
  ivory: string;
  gold: string;
  opacity: number; // overall presence (receding)
  goldAmt: number; // 0..1
  rotation: number; // degrees, driven by simulation time
  arcs: Arc[];
  k: number;
  ripple?: number; // 0..1 progress of the one-shot gold ripple, undefined = none
};

const pol = (r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [GEO.cx + r * Math.cos(a), r * Math.sin(a)] as const;
};
const arcPath = (r: number, a0: number, a1: number) => {
  if (a1 - a0 >= 359.9) a1 = a0 + 359.9;
  const [x0, y0] = pol(r, a0);
  const [x1, y1] = pol(r, a1);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
};

const TICKS = 72;
const tickPath = (() => {
  let d = '';
  for (let i = 0; i < TICKS; i++) {
    const major = i % 6 === 0;
    const r0 = GEO.R + 12;
    const r1 = GEO.R + (major ? 26 : 19);
    const [x0, y0] = pol(r0, (i * 360) / TICKS);
    const [x1, y1] = pol(r1, (i * 360) / TICKS);
    d += `M${x0.toFixed(2)} ${y0.toFixed(2)}L${x1.toFixed(2)} ${y1.toFixed(2)}`;
  }
  return d;
})();

/** One station. Identical geometry for all three; only state differs. */
export const Station: React.FC<Props> = ({
  y, index, bg, ivory, gold, opacity, goldAmt, rotation, arcs, k, ripple,
}) => {
  const R = GEO.R;
  const col = goldAmt > 0.5 ? gold : ivory;
  const circ = 2 * Math.PI * R;
  return (
    <g transform={`translate(0 ${y})`} opacity={opacity}>
      {/* occlude the channel inside the station */}
      <circle cx={GEO.cx} cy={0} r={R} fill={bg} />
      <circle cx={GEO.cx} cy={0} r={R} fill={gold} fillOpacity={0.07 * goldAmt} />
      {/* outer + inner rings */}
      <circle cx={GEO.cx} cy={0} r={R} fill="none" stroke={ivory} strokeOpacity={0.85 * (1 - 0.75 * goldAmt)} strokeWidth={1.8 * k} />
      <circle cx={GEO.cx} cy={0} r={R * 0.58} fill="none" stroke={ivory} strokeOpacity={0.22 * (1 - goldAmt)} strokeWidth={1.2 * k} />
      <circle cx={GEO.cx} cy={0} r={R * 0.58} fill="none" stroke={gold} strokeOpacity={0.5 * goldAmt} strokeWidth={1.2 * k} />
      {/* axis crosshair */}
      <path d={`M${GEO.cx - 8} 0H${GEO.cx + 8}M${GEO.cx} -8V8`} stroke={ivory} strokeOpacity={0.3} strokeWidth={1.2 * k} />
      {/* rotating tick ring */}
      <g transform={`rotate(${rotation} ${GEO.cx} 0)`}>
        <path d={tickPath} stroke={ivory} strokeOpacity={0.4 * (1 - goldAmt)} strokeWidth={1.2 * k} />
        <path d={tickPath} stroke={gold} strokeOpacity={0.9 * goldAmt} strokeWidth={1.2 * k} />
      </g>
      {/* gold ring drawing itself around station 02 */}
      {goldAmt > 0 && (
        <circle
          cx={GEO.cx} cy={0} r={R} fill="none" stroke={gold} strokeWidth={2.6 * k}
          strokeDasharray={`${circ * goldAmt} ${circ}`}
          transform={`rotate(-90 ${GEO.cx} 0)`} strokeLinecap="round"
        />
      )}
      {/* activity arcs */}
      {arcs.map((a, i) => (
        <path key={i} d={arcPath(R, a.from, a.to)} fill="none" stroke={col} strokeOpacity={0.95}
          strokeWidth={2.8 * k} strokeLinecap="round" />
      ))}
      {ripple !== undefined && ripple > 0 && ripple < 1 && (
        <circle cx={GEO.cx} cy={0} r={R + 8 + 150 * ripple} fill="none" stroke={gold}
          strokeOpacity={0.55 * (1 - ripple) * (1 - ripple)} strokeWidth={1.4 * k} />
      )}
      <text x={GEO.cx + R + 34} y={7} fill={ivory} fillOpacity={0.42} fontSize={20}
        letterSpacing={5} fontFamily="'Inter Display','Inter',Helvetica,Arial,sans-serif" fontWeight={400}>
        {String(index + 1).padStart(2, '0')}
      </text>
    </g>
  );
};
