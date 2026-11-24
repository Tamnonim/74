import {GEO, B, Props} from './config';

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

const smooth = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

export function simulate(props: Props, maxT: number): Sim {
  const {flow, timing} = props;
  const [yA, yB, yC] = GEO.stations;
  void yA;
  void yC;
  const R = GEO.R;
  const yE = yB - R - 14; // waiting point outside the ring

  const vUp = (t: number) =>
    flow.speedStart +
    (flow.speedEnd - flow.speedStart) * smooth(t / timing.accelEnd);
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

  type O = {y: number; v: number; phase: 0 | 1 | 2; rem: number; done: boolean; passedB: boolean};
  const orders: O[] = [];
  const spawn: number[] = [];
  const doneB: number[] = [];
  let nextSpawn = 0.25;

  const steps = Math.ceil(maxT / STEP);
  const snaps: Snap[] = [];
  const queueLen: number[] = [];

  for (let s = 0; s <= steps; s++) {
    const t = s * STEP;
    // spawn
    while (t >= nextSpawn) {
      orders.push({y: GEO.entryY, v: vUp(t), phase: 0, rem: 0, done: false, passedB: false});
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
      let vTarget = o.passedB ? flow.exitSpeed : vUp(t);
      // ring slows the flow slightly for stations 01 and 03
      for (const k of [0, 2]) {
        if (Math.abs(o.y - GEO.stations[k]) < R) vTarget *= 0.62;
      }
      // follow the leader
      const room = Math.max(0, leaderY - flow.gap - o.y);
      vTarget = Math.min(vTarget, room / TAU);
      // approach / hold at station 02
      if (!o.passedB) {
        const stop = bBusy ? yE : yB;
        const toStop = Math.max(0, stop - o.y);
        vTarget = Math.min(vTarget, toStop / TAU_S);
        if (!bBusy && stop - o.y < 2.5 && room > 0) {
          // admit into the station (only the head of the queue gets here)
          o.y = yB;
          o.phase = 1;
          o.rem = flow.serviceB;
          o.v = 0;
          continue;
        }
        if (o.y > yB - R - 40 && o.y < yB - 4) q++;
      }
      o.v = vTarget;
      o.y += o.v * STEP;
      if (o.y >= GEO.exitY) o.done = true;
    }
    queueLen.push(q);

    const n = orders.length;
    const y = new Float32Array(n);
    const v = new Float32Array(n);
    const p = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      y[i] = orders[i].y;
      v[i] = orders[i].v;
      p[i] = orders[i].phase === 1 ? 1 - orders[i].rem / flow.serviceB : -1;
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
