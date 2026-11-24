import React, {useMemo} from 'react';
import {AbsoluteFill, interpolateColors, useCurrentFrame, useVideoConfig} from 'remotion';
import {B, GEO, H, Props, W} from './config';
import {simulate, Sim} from './sim';
import {cameraAt, clamp, halfWidth, laneScale, lerp, makeWarp, outCubic, seg, smooth, throatsAt} from './util';
import {Channel} from './components/Channel';
import {Station, Arc} from './components/Station';
import {Order} from './components/Order';
import {ConstraintText} from './components/ConstraintText';
import {Sfx} from './components/Sfx';
import {Subtitle} from './components/Subtitle';
import {Logo} from './components/Logo';

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
  const {sim, warp} = useMemo(() => {
    const w = makeWarp(props);
    return {sim: simulate(props, w.end, w), warp: w};
  }, [simKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const T = warp.fwd(t);
  const orders = sample(sim, T);
  const {z, cy} = cameraAt(t, props);
  const k = 1 / z;

  const th = throatsAt(t, props);
  const recede = smooth(seg(t, tm.fadeStart, tm.fadeEnd)) * (1 - smooth(seg(t, tm.resumeAt + 0.2, tm.pullEnd - 0.3)));
  // gold: constraint is station 02 from goldStart, hands over to station 03 at shiftStart
  const gB = smooth(seg(t, tm.goldStart, tm.goldStart + tm.goldDur)) * (1 - smooth(seg(t, tm.shiftStart, tm.shiftStart + 1)));
  const gC = smooth(seg(t, tm.shiftStart + 0.9, tm.shiftStart + 0.9 + tm.goldDur));
  const goldAmt = [0, gB, gC];
  const rippleB = (() => {
    const a = seg(t, tm.goldStart + 0.1, tm.goldStart + 1.7);
    const b = seg(t, tm.steps[0] + 0.1, tm.steps[0] + 1.7);
    return t < tm.resumeAt ? a : b > 0 && b < 1 ? b : undefined;
  })();
  const rippleC = seg(t, tm.shiftStart + 1.0, tm.shiftStart + 2.6);
  const stepNow = tm.steps.filter((s) => t >= s - 0.05).length; // 0..5
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
  const calm = 1 - 0.7 * smooth(seg(t, tm.steps[2], tm.steps[2] + 1.5));
  const rotRate = [9 * calm, 4.5, 13];
  const stOpacity = (i: number) => (i === B ? 1 : 1 - 0.88 * recede);
  const ropeAmt = smooth(seg(t, tm.steps[2], tm.steps[2] + 1)) * (1 - smooth(seg(t, tm.steps[3] + 1.5, tm.steps[3] + 2.5)));
  const exploitAmt = smooth(seg(t, tm.steps[1], tm.steps[1] + 1.3)) * (1 - smooth(seg(t, tm.steps[3], tm.steps[3] + 1)));

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
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}
        style={{position: 'absolute', opacity: 1 - 0.94 * smooth(seg(t, props.brand.endStart - 0.2, props.brand.endStart + 0.7))}}>
        <g transform={`translate(${W / 2} ${H / 2}) scale(${z}) translate(${-GEO.cx} ${-cy})`}>
          {/* axis + station levels: the mathematical scaffolding */}
          <line x1={GEO.cx} x2={GEO.cx} y1={GEO.entryY - 60} y2={GEO.exitY + 40}
            stroke={pal.ivory} strokeOpacity={0.07 * (1 - recede * 0.7)} strokeWidth={1 * k}
            strokeDasharray={`${4 * k} ${10 * k}`} />
          {GEO.stations.map((y, i) => (
            <g key={i} opacity={i === B ? 1 : 1 - recede}>{hair(y, 0.09)}</g>
          ))}

          {/* step 3: the rope, a gold tether from station 01 to the constraint */}
          {ropeAmt > 0 && (
            <line x1={GEO.cx} x2={GEO.cx} y1={GEO.stations[0] + GEO.R} y2={yB - GEO.R} stroke={pal.gold}
              strokeOpacity={0.8 * ropeAmt} strokeWidth={1.6 * k} strokeDasharray={`${3 * k} ${9 * k}`} />
          )}
          {/* step 2: the constraint is never allowed to idle, one unbroken outer ring */}
          {exploitAmt > 0 && (
            <circle cx={GEO.cx} cy={yB} r={GEO.R + 36} fill="none" stroke={pal.gold}
              strokeOpacity={0.55 * exploitAmt} strokeWidth={1.4 * k}
              strokeDasharray={`${2 * Math.PI * (GEO.R + 36) * smooth(seg(t, tm.steps[1], tm.steps[1] + 1.3))} 9999`}
              transform={`rotate(-90 ${GEO.cx} ${yB})`} />
          )}
          <Channel ivory={pal.ivory} gold={pal.gold} recede={recede} goldAmt={goldAmt} throats={th} k={k} />

          {GEO.stations.map((y, i) => (
            <Station
              key={i}
              y={y}
              index={i}
              bg={pal.bg}
              ivory={pal.ivory}
              gold={pal.gold}
              opacity={stOpacity(i)}
              goldAmt={goldAmt[i]}
              rotation={T * rotRate[i]}
              arcs={stationArcs(i)}
              k={k}
              ripple={i === B ? rippleB : i === 2 ? rippleC : undefined}
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
            const x = GEO.cx + lane * 0.62 * halfWidth(o.y, th) * laneScale(o.y);
            const inB = o.p >= 0;
            return (
              <Order
                key={i}
                x={x}
                y={o.y}
                speed={o.v}
                opacity={dotOpacity(o.y)}
                color={inB ? interpolateColors(gB, [0, 1], [pal.ivory, pal.gold]) : pal.ivory}
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

      {/* caption veil keeps text legible over the channel */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: 520,
        background: `linear-gradient(to bottom, transparent, ${pal.bg} 70%)`,
        opacity: 0.9 * smooth(seg(t, 0.1, 0.8)) * (1 - smooth(seg(t, tm.resumeAt - 0.4, tm.resumeAt))) +
          0.9 * smooth(seg(t, tm.resumeAt + 0.2, tm.resumeAt + 0.9)),
      }} />

      {/* logo bug */}
      <div style={{position: 'absolute', left: 64, top: 88, opacity: 0.9 * smooth(seg(t, 0.2, 1)) * (1 - smooth(seg(t, props.brand.endStart, props.brand.endStart + 0.5)))}}>
        <Logo name={props.brand.name} descriptor={props.brand.descriptor} ivory={pal.ivory} gold={pal.gold} scale={0.85} />
      </div>

      {/* end card: logo + call to action */}
      {t >= props.brand.endStart && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 70, fontFamily: FONT,
        }}>
          <div style={{opacity: smooth(seg(t, props.brand.endStart + 0.3, props.brand.endStart + 1))}}>
            <Logo name={props.brand.name} descriptor={props.brand.descriptor} ivory={pal.ivory} gold={pal.gold} scale={2} align="center" />
          </div>
          <div style={{
            opacity: smooth(seg(t, props.brand.endStart + 0.7, props.brand.endStart + 1.4)),
            transform: `translateY(${(1 - outCubic(seg(t, props.brand.endStart + 0.7, props.brand.endStart + 1.4))) * 24}px)`,
            textAlign: 'center',
          }}>
            <div style={{
              display: 'inline-block', border: `1.5px solid ${pal.gold}`, borderRadius: 100, padding: '30px 64px',
              fontSize: 36, fontWeight: 400, letterSpacing: '0.24em', marginRight: '-0.24em', color: pal.ivory,
            }}>{props.brand.ctaHeadline}  <span style={{color: pal.gold}}>→</span></div>
            <div style={{marginTop: 34, fontSize: 24, letterSpacing: '0.14em', color: pal.ivory, opacity: 0.6}}>{props.brand.ctaSub}</div>
            {props.brand.ctaUrl && (
              <div style={{marginTop: 14, fontSize: 28, letterSpacing: '0.12em', color: pal.gold}}>{props.brand.ctaUrl}</div>
            )}
          </div>
        </div>
      )}

      <div style={{opacity: 1 - smooth(seg(t, tm.resumeAt, tm.resumeAt + 0.5))}}>
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: 620,
          background: `linear-gradient(to bottom, transparent, ${pal.bg} 55%)`,
          opacity: smooth(seg(t, tm.textStart - 0.8, tm.textStart + 0.4)),
        }} />
        <ConstraintText text={props.copy.line} start={tm.textStart} ivory={pal.ivory} gold={pal.gold} top={1480} />
      </div>

      {props.copy.captions.map((c, i, all) => (
        // never overlap the next line, even if the timings in props do
        <Subtitle key={i} text={c.text} at={c.at} end={Math.min(c.end, all[i + 1] ? all[i + 1].at : c.end)} color={pal.ivory} top={1690} />
      ))}


      {/* five focusing steps: a quiet progress row, no words */}
      <svg width={W} height={H} style={{position: 'absolute', opacity: smooth(seg(t, tm.steps[0] - 0.4, tm.steps[0] + 0.4)) * (1 - smooth(seg(t, props.brand.endStart - 0.2, props.brand.endStart + 0.4)))}}>
        {[0, 1, 2, 3, 4].map((i) => {
          const x = W / 2 + (i - 2) * 54;
          const done = stepNow > i + 1 || (stepNow === i + 1 && false);
          const cur = stepNow === i + 1;
          const pop = cur ? smooth(seg(t, tm.steps[i], tm.steps[i] + 0.5)) : 0;
          return (
            <g key={i}>
              <circle cx={x} cy={1790} r={6} fill={cur || done ? pal.gold : 'none'}
                fillOpacity={cur ? 1 : 0.55} stroke={pal.ivory} strokeOpacity={cur || done ? 0 : 0.3} strokeWidth={1.4} />
              {cur && <circle cx={x} cy={1790} r={6 + 8 * pop} fill="none" stroke={pal.gold} strokeOpacity={0.7 * (1 - pop)} strokeWidth={1.2} />}
            </g>
          );
        })}
      </svg>

      <Sfx props={props} fps={fps} doneB={sim.doneB.map((d) => warp.inv(d))} />
    </AbsoluteFill>
  );
};
