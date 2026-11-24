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

/** Channel half-width: wide, funnels into the constraint, releases quickly. */
export const halfWidth = (y: number) => {
  const yB = GEO.stations[B];
  const sig = y < yB ? 215 : 120;
  const d = (y - yB) / sig;
  return GEO.hBase - (GEO.hBase - GEO.hThroat) * Math.exp(-d * d);
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
 * Time warp. Real time passes at 1x, then eases to a full stop
 * (the "freeze"). Closed form of the integral of 1 - smoothstep.
 */
export const warp = (t: number, props: Props) => {
  const {freezeStart: fs, freezeDur: d} = props.timing;
  if (t <= fs) return t;
  const u = t - fs;
  const z = Math.min(1, u / d);
  const S = u >= d ? 0.5 : z * z * z - (z * z * z * z) / 2;
  return fs + Math.min(u, d) - d * S;
};
export const maxSimTime = (props: Props) =>
  props.timing.freezeStart + props.timing.freezeDur / 2 + 0.1;

export const cameraAt = (t: number, props: Props) => {
  const {queueEnd, zoomEnd} = props.timing;
  const {zoom, focusY, drift} = props.camera;
  const pre = 1 + 0.05 * seg(t, 0, queueEnd);
  const u = inOutCubic(seg(t, queueEnd, zoomEnd));
  let z = Math.exp(lerp(Math.log(pre > 1.05 ? 1.05 : pre), Math.log(zoom), u));
  if (t < queueEnd) z = pre;
  z *= 1 + drift * outCubic(seg(t, zoomEnd, 15));
  const cy = lerp(GEO.stations[B], focusY, u);
  return {z, cy};
};
