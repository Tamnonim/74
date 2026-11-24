import React, {useMemo} from 'react';
import {AbsoluteFill, interpolateColors, useCurrentFrame, useVideoConfig} from 'remotion';
import {B, GEO, H, Props, W} from './config';
import {simulate, Sim} from './sim';
import {maxSimTime, cameraAt, clamp, halfWidth, laneScale, lerp, outCubic, seg, smooth, warp} from './util';
import {Channel} from './components/Channel';
import {Station, Arc} from './components/Station';
import {Order} from './components/Order';
import {ConstraintText} from './components/ConstraintText';
import {Sfx} from './components/Sfx';

const FONT = "'Inter Display','Inter',Helvetica,Arial,sans-serif";

const sample = (sim: Sim, T: number) => {
  const x = clamp(T / 1, 0, sim.maxT) * 60;
  const i0 = Math.min(sim.snaps.length - 1, Math.floor(x));
  const i1 = Math.min(sim.snaps.length - 1, i0 + 1);
  const f = x - i0;
  const a = sim.snaps[i0];
  const b = sim.snaps[i1];
  const n = a.y.length;
  const out: {y: number; v: number; p: number}[] = [];
  for (let i = 0; i < n; i++) {
    const yb = i < b.y.length ? b.y[i] : a.y[i];
    const gone = a.y[i] > 9000 || yb > 9000;
    out.push({
      y: gone ? 99999 : lerp(a.y[i], yb, f),
      v: lerp(a.v[i], i < b.v.length ? b.v[i] : a.v[i], f),
      p: a.p[i] >= 0 ? a.p[i] : -1,
    });
  }
  return out;
};

export const Bottleneck: React.FC<Props> = (props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const {palette: pal, timing: tm} = props;

  const simKey = JSON.stringify([props.flow, props.timing]);
  const sim = useMemo(() => simulate(props, maxSimTime(props)), [simKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const T = warp(t, props);
  const orders = sample(sim, T);
  const {z, cy} = cameraAt(t, props);
  const k = 1 / z;

  const recede = smooth(seg(t, tm.fadeStart, tm.fadeEnd));
  const g = smooth(seg(t, tm.goldStart, tm.goldStart + tm.goldDur));
  const ripple = seg(t, tm.goldStart + 0.1, tm.goldStart + 1.7);
  const yB = GEO.stations[B];

  // Station activity, derived from the same snapshot that places the orders.
  const stationArcs = (idx: number): Arc[] => {
    const ys = GEO.stations[idx];
    const arcs: Arc[] = [];
    orders.forEach((o) => {
      if (idx === B) {
        if (o.p >= 0) arcs.push({from: 0, to: Math.max(2, 360 * o.p)});
      } else if (Math.abs(o.y - ys) < GEO.R) {
        const p = (o.y - (ys - GEO.R)) / (2 * GEO.R);
        const c = 360 * p;
        arcs.push({from: Math.max(0, c - 38), to: c});
      }
    });
    return arcs;
  };
  const rotRate = [9, 4.5, 13];
  const stOpacity = (i: number) => (i === B ? 1 : 1 - 0.88 * recede);

  const dotOpacity = (y: number) => {
    const spawn = smooth((y - GEO.entryY) / 36);
    const exit = 1 - smooth((y - (GEO.exitY - 140)) / 130);
    const d = Math.abs(y - yB);
    const keep = 1 - smooth((d - 330) / 260);
    return spawn * exit * (1 - recede * (1 - keep) * 0.88);
  };

  const titleOp = smooth(seg(t, 0.3, 1.3)) * (1 - smooth(seg(t, 3.2, 4.2)));
  const hair = (y: number, op: number) => (
    <line x1={56} x2={W - 56} y1={y} y2={y} stroke={pal.ivory} strokeOpacity={op}
      strokeWidth={1 * k} />
  );

  return (
    <AbsoluteFill style={{background: pal.bg}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
        <g transform={`translate(${W / 2} ${H / 2}) scale(${z}) translate(${-GEO.cx} ${-cy})`}>
          {/* axis + station levels: the mathematical scaffolding */}
          <line x1={GEO.cx} x2={GEO.cx} y1={GEO.entryY - 60} y2={GEO.exitY + 40}
            stroke={pal.ivory} strokeOpacity={0.07 * (1 - recede * 0.7)} strokeWidth={1 * k}
            strokeDasharray={`${4 * k} ${10 * k}`} />
          {GEO.stations.map((y, i) => (
            <g key={i} opacity={i === B ? 1 : 1 - recede}>{hair(y, 0.09)}</g>
          ))}

          <Channel ivory={pal.ivory} gold={pal.gold} recede={recede} goldAmt={g} k={k} />

          {GEO.stations.map((y, i) => (
            <Station
              key={i}
              y={y}
              index={i}
              bg={pal.bg}
              ivory={pal.ivory}
              gold={pal.gold}
              opacity={stOpacity(i)}
              goldAmt={i === B ? g : 0}
              rotation={T * rotRate[i]}
              arcs={stationArcs(i)}
              k={k}
              ripple={i === B ? ripple : undefined}
            />
          ))}

          {/* terminals */}
          <g opacity={1 - recede} fontFamily={FONT} fontSize={17} letterSpacing={6}
            fill={pal.ivory} fillOpacity={0.4} textAnchor="middle">
            <text x={GEO.cx} y={GEO.entryY - 44}>ORDERS</text>
            <text x={GEO.cx} y={GEO.exitY + 52}>COMPLETED</text>
          </g>

          {orders.map((o, i) => {
            if (o.y > 9000) return null;
            const lane = ((i * 5) % 3) - 1;
            const x = GEO.cx + lane * 0.62 * halfWidth(o.y) * laneScale(o.y);
            const inB = o.p >= 0;
            return (
              <Order
                key={i}
                x={x}
                y={o.y}
                speed={o.v}
                opacity={dotOpacity(o.y)}
                color={inB ? interpolateColors(g, [0, 1], [pal.ivory, pal.gold]) : pal.ivory}
                streakColor={pal.ivory}
                k={k}
              />
            );
          })}
        </g>
      </svg>

      <div style={{
        position: 'absolute', top: 205, left: 0, right: 0, textAlign: 'center',
        fontFamily: FONT, fontSize: 21, fontWeight: 400, letterSpacing: '0.34em',
        color: pal.ivory, opacity: titleOp * 0.6, whiteSpace: 'pre',
      }}>{props.copy.title}</div>

      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: 620,
        background: `linear-gradient(to bottom, transparent, ${pal.bg} 55%)`,
        opacity: smooth(seg(t, tm.textStart - 0.8, tm.textStart + 0.4)),
      }} />
      <ConstraintText text={props.copy.line} start={tm.textStart} ivory={pal.ivory} gold={pal.gold} top={1610} />

      <Sfx props={props} fps={fps} doneB={sim.doneB} />
    </AbsoluteFill>
  );
};
