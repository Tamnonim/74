import React from 'react';
import {GEO} from '../config';
import {halfWidth} from '../util';

type Props = {
  ivory: string;
  gold: string;
  /** 0..1: how far non-focus parts have receded */
  recede: number;
  /** 0..1 gold takeover around the constraint */
  goldAmt: number;
  k: number; // 1 / camera scale, keeps hairlines hairline
};

const pts = (sign: 1 | -1) => {
  let d = '';
  for (let y = GEO.entryY - 30; y <= GEO.exitY; y += 8) {
    const x = GEO.cx + sign * halfWidth(y);
    d += `${d ? 'L' : 'M'}${x.toFixed(2)} ${y} `;
  }
  return d;
};
const L = pts(-1);
const Rr = pts(1);

/** The pipe: two hairlines that funnel into station 02. */
export const Channel: React.FC<Props> = ({ivory, gold, recede, goldAmt, k}) => {
  const yB = GEO.stations[1];
  const far = 1 - 0.88 * recede;
  const stops = [
    {y: GEO.entryY - 30, o: far * 0.0},
    {y: GEO.entryY + 60, o: far},
    {y: yB - 560, o: far},
    {y: yB - 260, o: 1},
    {y: yB + 260, o: 1},
    {y: yB + 560, o: far},
    {y: GEO.exitY - 60, o: far},
    {y: GEO.exitY, o: 0},
  ];
  const y0 = GEO.entryY - 30;
  const span = GEO.exitY - y0;
  const goldStops = [
    {y: yB - 330, o: 0},
    {y: yB - 90, o: 1},
    {y: yB + 90, o: 1},
    {y: yB + 200, o: 0},
  ];
  return (
    <g fill="none" strokeWidth={1.6 * k}>
      <defs>
        <linearGradient id="chIvory" gradientUnits="userSpaceOnUse" x1="0" y1={y0} x2="0" y2={GEO.exitY}>
          {stops.map((s, i) => (
            <stop key={i} offset={(s.y - y0) / span} stopColor={ivory} stopOpacity={s.o * 0.8} />
          ))}
        </linearGradient>
        <linearGradient id="chGold" gradientUnits="userSpaceOnUse" x1="0" y1={y0} x2="0" y2={GEO.exitY}>
          <stop offset={0} stopColor={gold} stopOpacity={0} />
          {goldStops.map((s, i) => (
            <stop key={i} offset={(s.y - y0) / span} stopColor={gold} stopOpacity={s.o} />
          ))}
          <stop offset={1} stopColor={gold} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={L} stroke="url(#chIvory)" />
      <path d={Rr} stroke="url(#chIvory)" />
      {goldAmt > 0 && (
        <g opacity={goldAmt}>
          <path d={L} stroke="url(#chGold)" />
          <path d={Rr} stroke="url(#chGold)" />
        </g>
      )}
    </g>
  );
};
