import {GEO, B, Props} from './config';

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const smooth = (x: number) => {
  const c = clamp(x);
  return c * c * (3 - 2 * c);
};
export const inOutCubic = (x: number) => {
  const c = clamp(x);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};
export const outCubic = (x: number) => 1 - Math.pow(1 - clamp(x), 3);

/** Throat half-widths for the two stations that can be the constraint. */
export type Throats = {b: number; c: number};

export const throatsAt = (t: number, props: Props): Throats => {
  const {steps, shiftStart} = props.timing;
  const widen = smooth(seg(t, steps[3] + 0.2, steps[3] + 2.6)); // step 4
  const narrowC = smooth(seg(t, shiftStart + 0.4, shiftStart + 2.2)); // step 5
  return {
    b: lerp(GEO.hThroat, GEO.hBase - 4, widen),
    c: lerp(GEO.hBase, GEO.hThroat, narrowC),
  };
};

/** Channel half-width: wide, funnels into a constraint, releases quickly. */
export const halfWidth = (y: number, th: Throats) => {
  const funnel = (yc: number, throat: number) => {
    const sig = y < yc ? 215 : 120;
    const d = (y - yc) / sig;
    return (GEO.hBase - throat) * Math.exp(-d * d);
  };
  return GEO.hBase - funnel(GEO.stations[B], th.b) - funnel(GEO.stations[2], th.c);
};

/** 1 away from stations, 0 at their centres: orders thread onto the axis. */
export const laneScale = (y: number) => {
  let w = 0;
  for (const s of GEO.stations) {
    const d = (y - s) / 46;
    w = Math.max(w, Math.exp(-d * d));
  }
  return 1 - w;
};

/**
 * Time warp: real time -> simulation time.
 * 1x, eases to a full stop (the freeze), holds, then eases back to 1x.
 */
export type Warp = {fwd: (t: number) => number; inv: (T: number) => number; end: number};
export const makeWarp = (props: Props, total = 34): Warp => {
  const {freezeStart: fs, freezeDur: fd, resumeAt: ra, resumeDur: rd} = props.timing;
  const m = (t: number) => {
    if (t < fs) return 1;
    if (t < fs + fd) return 1 - smooth((t - fs) / fd);
    if (t < ra) return 0;
    return smooth((t - ra) / rd);
  };
  const N = 600;
  const tab: number[] = [0];
  for (let i = 1; i <= total * N; i++) tab.push(tab[i - 1] + m((i - 0.5) / N) / N);
  const fwd = (t: number) => {
    const x = clamp(t, 0, total) * N;
    const i = Math.min(tab.length - 2, Math.floor(x));
    return lerp(tab[i], tab[i + 1], x - i);
  };
  const inv = (T: number) => {
    let lo = 0;
    let hi = tab.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (tab[mid] <= T) lo = mid;
      else hi = mid;
    }
    return lo / N;
  };
  return {fwd, inv, end: tab[tab.length - 1]};
};

export const cameraAt = (t: number, props: Props) => {
  const {queueEnd, zoomEnd, resumeAt, pullEnd} = props.timing;
  const {zoom, focusY, drift, wide} = props.camera;
  let z: number;
  let cy: number;
  if (t < queueEnd) {
    z = 1 + 0.05 * seg(t, 0, queueEnd);
    cy = GEO.stations[B];
  } else {
    const u = inOutCubic(seg(t, queueEnd, zoomEnd));
    z = Math.exp(lerp(Math.log(1.05), Math.log(zoom), u));
    cy = lerp(GEO.stations[B], focusY, u);
    const hold = zoom * (1 + drift);
    z *= 1 + drift * outCubic(seg(t, zoomEnd, resumeAt));
    const p = inOutCubic(seg(t, resumeAt + 0.3, pullEnd));
    if (p > 0) {
      z = Math.exp(lerp(Math.log(hold), Math.log(wide), p));
      cy = lerp(focusY, GEO.stations[B], p);
    }
  }
  return {z, cy};
};
