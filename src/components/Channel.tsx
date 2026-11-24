import React from 'react';
import {GEO} from '../config';
import {Throats, halfWidth} from '../util';

type Props = {
  ivory: string;
  gold: string;
  /** 0..1: how far non-focus parts have receded */
  recede: number;
  /** gold takeover around each station: [amount for 01, 02, 03] */
  goldAmt: number[];
  throats: Throats;
  k: number; // 1 / camera scale, keeps hairlines hairline
};

const build = (sign: 1 | -1, th: Throats) => {
  let d = '';
  for (let y = GEO.entryY - 30; y <= GEO.exitY; y += 8) {
    const x = GEO.cx + sign * halfWidth(y, th);
    d += `${d ? 'L' : 'M'}${x.toFixed(2)} ${y} `;
  }
  return d;
};

/** The pipe: two hairlines that funnel into whichever station constrains. */
export const Channel: React.FC<Props> = ({ivory, gold, recede, goldAmt, throats, k}) => {
  const yB = GEO.stations[1];
  const far = 1 - 0.88 * recede;
  const y0 = GEO.entryY - 30;
  const span = GEO.exitY - y0;
  const off = (y: number) => (y - y0) / span;
  const stops = [
    {y: y0, o: 0},
    {y: GEO.entryY + 60, o: far},
    {y: yB - 560, o: far},
    {y: yB - 260, o: 1},
    {y: yB + 260, o: 1},
    {y: yB + 560, o: far},
    {y: GEO.exitY - 60, o: far},
    {y: GEO.exitY, o: 0},
  ];
  const L = build(-1, throats);
  const R = build(1, throats);
  const centers = [1, 2].filter((i) => goldAmt[i] > 0);
  return (
    <g fill="none" strokeWidth={1.6 * k}>
      <defs>
        <linearGradient id="chIvory" gradientUnits="userSpaceOnUse" x1="0" y1={y0} x2="0" y2={GEO.exitY}>
          {stops.map((s, i) => (
            <stop key={i} offset={off(s.y)} stopColor={ivory} stopOpacity={s.o * 0.8} />
          ))}
        </linearGradient>
        {centers.map((i) => {
          const yc = GEO.stations[i];
          return (
            <linearGradient key={i} id={`chGold${i}`} gradientUnits="userSpaceOnUse" x1="0" y1={y0} x2="0" y2={GEO.exitY}>
              <stop offset={0} stopColor={gold} stopOpacity={0} />
              <stop offset={off(yc - 330)} stopColor={gold} stopOpacity={0} />
              <stop offset={off(yc - 90)} stopColor={gold} stopOpacity={1} />
              <stop offset={off(yc + 90)} stopColor={gold} stopOpacity={1} />
              <stop offset={off(yc + 200)} stopColor={gold} stopOpacity={0} />
              <stop offset={1} stopColor={gold} stopOpacity={0} />
            </linearGradient>
          );
        })}
      </defs>
      <path d={L} stroke="url(#chIvory)" />
      <path d={R} stroke="url(#chIvory)" />
      {centers.map((i) => (
        <g key={i} opacity={goldAmt[i]}>
          <path d={L} stroke={`url(#chGold${i})`} />
          <path d={R} stroke={`url(#chGold${i})`} />
        </g>
      ))}
    </g>
  );
};
