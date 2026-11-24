import {GEO, B, Props} from './config';
import {Warp} from './util';

/**
 * Deterministic order-flow simulation. Pure function of props, so every
 * frame is reproducible (required for Remotion renders) and each order
 * keeps one identity from spawn to exit.
 */
const STEP = 1 / 60;
const TAU = 0.14; // follow-the-leader smoothing
const TAU_S = 0.16; // station approach smoothing

export type Snap = {
  /** per order id: y, speed, serviceProgress (-1 if not being served) */
  y: Float32Array;
  v: Float32Array;
  p: Float32Array;
};
export type Sim = {
  count: number;
  spawn: number[]; // spawn time per order
  snaps: Snap[];
  maxT: number;
  /** times at which station 02 completes an order */
  doneB: number[];
  queueAt: (t: number) => number;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

export function simulate(props: Props, maxT: number, warp: Warp): Sim {
  const {flow, timing} = props;
  const [yA, yB, yC] = GEO.stations;
  void yA;
  void yC;
  const R = GEO.R;
  const yE = yB - R - 14; // waiting point outside the ring

  // Focusing-step events, converted from film time to simulation time.
  const subT = warp.fwd(timing.steps[2]);
  const elevT = warp.fwd(timing.steps[3]);
  const shiftT = warp.fwd(timing.shiftStart);
  const vUp = (t: number) =>
    lerp(
      flow.speedStart + (flow.speedEnd - flow.speedStart) * smooth(t / timing.accelEnd),
      flow.subSpeed,
      smooth((t - subT) / 1.2),
    );
  const serviceB = (t: number) => lerp(flow.serviceB, flow.elevService, smooth((t - elevT) / 1.0));
  const exitV = (t: number) => lerp(flow.exitSpeed, flow.elevExit, smooth((t - elevT) / 1.5));
  const tauS = (t: number) => lerp(TAU_S, 0.07, smooth((t - elevT) / 1.0));
  const cFactor = (t: number) => lerp(0.62, flow.laterCSlow, smooth((t - shiftT) / 1.5));
  const interval = (t: number) => {
    if (t < timing.accelEnd) {
      return (
        flow.arrivalStart +
        (flow.arrivalEnd - flow.arrivalStart) * smooth(t / timing.accelEnd)
      );
    }
    return (
      flow.arrivalEnd +
      (flow.arrivalTaper - flow.arrivalEnd) *
        smooth((t - timing.accelEnd) / (timing.zoomEnd - timing.accelEnd))
    );
  };

  type O = {y: number; v: number; phase: 0 | 1 | 2; rem: number; svc: number; done: boolean; passedB: boolean};
  const orders: O[] = [];
  const spawn: number[] = [];
  const doneB: number[] = [];
  // Pre-roll: the film opens mid-motion, so the hook never starts on an empty frame.
  const PRE = 1.6;
  let nextSpawn = -PRE;

  const steps = Math.ceil(maxT / STEP);
  const snaps: Snap[] = [];
  const queueLen: number[] = [];

  for (let s = -Math.round(PRE / STEP); s <= steps; s++) {
    const t = s * STEP;
    // spawn
    while (t >= nextSpawn) {
      orders.push({y: GEO.entryY, v: vUp(t), phase: 0, rem: 0, svc: 1, done: false, passedB: false});
      spawn.push(nextSpawn);
      nextSpawn += interval(nextSpawn);
    }
    // is B busy?
    const bBusy = orders.some((o) => o.phase === 1);
    let q = 0;
    for (let i = 0; i < orders.length; i++) {
      const o = orders[i];
      if (o.done) continue;
      const leader = i > 0 ? orders[i - 1] : null;
      const leaderY = leader && !leader.done ? leader.y : Infinity;

      if (o.phase === 1) {
        o.v = 0;
        o.rem -= STEP;
        if (o.rem <= 0) {
          o.phase = 0;
          o.passedB = true;
          doneB.push(t);
        }
        continue;
      }
      // desired speed
      let vTarget = o.passedB ? exitV(t) : vUp(t);
      // ring slows the flow slightly for stations 01 and 03
      if (Math.abs(o.y - GEO.stations[0]) < R) vTarget *= 0.62;
      if (Math.abs(o.y - GEO.stations[2]) < R) vTarget *= cFactor(t);
      // follow the leader
      const room = Math.max(0, leaderY - flow.gap - o.y);
      vTarget = Math.min(vTarget, room / TAU);
      // approach / hold at station 02
      if (!o.passedB) {
        const stop = bBusy ? yE : yB;
        const toStop = Math.max(0, stop - o.y);
        vTarget = Math.min(vTarget, toStop / tauS(t));
        if (!bBusy && stop - o.y < 2.5 && room > 0) {
          // admit into the station (only the head of the queue gets here)
          o.y = yB;
          o.phase = 1;
          o.svc = serviceB(t);
          o.rem = o.svc;
          o.v = 0;
          continue;
        }
        if (o.y > yB - R - 40 && o.y < yB - 4) q++;
      }
      o.v = vTarget;
      o.y += o.v * STEP;
      if (o.y >= GEO.exitY) o.done = true;
    }
    if (s < 0) continue;
    queueLen.push(q);

    const n = orders.length;
    const y = new Float32Array(n);
    const v = new Float32Array(n);
    const p = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      y[i] = orders[i].y;
      v[i] = orders[i].v;
      p[i] = orders[i].phase === 1 ? 1 - orders[i].rem / orders[i].svc : -1;
      if (orders[i].done) y[i] = 99999;
    }
    snaps.push({y, v, p});
  }

  return {
    count: orders.length,
    spawn,
    snaps,
    maxT,
    doneB,
    queueAt: (t) => queueLen[Math.min(queueLen.length - 1, Math.round(t / STEP))],
  };
}
