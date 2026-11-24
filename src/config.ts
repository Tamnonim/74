import {z} from 'zod';

/**
 * Every tunable lives here. The Remotion Studio sidebar edits these live
 * (via the zod schema), and all scenes read from the same object.
 */
export const schema = z.object({
  palette: z.object({
    bg: z.string(),
    ivory: z.string(),
    gold: z.string(),
  }),
  /** Scene boundaries, in seconds. */
  timing: z.object({
    accelEnd: z.number().min(1).max(8), // end of scene 1 (momentum)
    queueEnd: z.number().min(2).max(12), // end of scene 2 (congestion) = camera push begins
    zoomEnd: z.number().min(3).max(14), // camera arrives at station 02
    fadeStart: z.number(), // other elements start receding
    fadeEnd: z.number(),
    freezeStart: z.number(), // time warp begins easing to zero
    freezeDur: z.number(),
    goldStart: z.number(), // station 02 turns gold
    goldDur: z.number(),
    textStart: z.number(), // "ONE CONSTRAINT."
  }),
  /** Flow model. Speeds in px/s, durations in s. */
  flow: z.object({
    speedStart: z.number(),
    speedEnd: z.number(),
    arrivalStart: z.number(), // seconds between orders at t=0
    arrivalEnd: z.number(), // seconds between orders once accelerated
    arrivalTaper: z.number(), // interval at the end of the film
    exitSpeed: z.number(),
    serviceB: z.number(), // time station 02 needs per order
    gap: z.number(), // min spacing between orders along the channel
  }),
  camera: z.object({
    zoom: z.number().min(1).max(5),
    focusY: z.number(),
    drift: z.number(), // extra zoom over the final hold
  }),
  copy: z.object({
    title: z.string(),
    line: z.string(),
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = {
  palette: {bg: '#101010', ivory: '#F1EEE5', gold: '#C5A269'},
  timing: {
    accelEnd: 4,
    queueEnd: 8,
    zoomEnd: 12,
    fadeStart: 8.2,
    fadeEnd: 11,
    freezeStart: 11.9,
    freezeDur: 0.6,
    goldStart: 12,
    goldDur: 1.1,
    textStart: 13,
  },
  flow: {
    speedStart: 150,
    speedEnd: 560,
    arrivalStart: 0.5,
    arrivalEnd: 0.32,
    arrivalTaper: 1.8,
    exitSpeed: 105,
    serviceB: 1.05,
    gap: 24,
  },
  camera: {zoom: 2.6, focusY: 880, drift: 0.07},
  copy: {title: 'GOLDRATT  ·  THE BOTTLENECK NOBODY SAW', line: 'ONE CONSTRAINT.'},
};

export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const DURATION = 15 * FPS;

/** Fixed geometry: one vertical channel, three stations. */
export const GEO = {
  cx: 540,
  entryY: 150,
  exitY: 1830,
  stations: [470, 960, 1450] as const,
  R: 74, // station ring radius
  hBase: 54, // channel half-width
  hThroat: 20, // half-width at the constraint
};
export const B = 1; // index of the constraint
