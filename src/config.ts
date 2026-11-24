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
    resumeAt: z.number(), // time starts again after the freeze
    resumeDur: z.number(),
    pullEnd: z.number(), // camera back to the full system
    steps: z.array(z.number()).length(5), // start of each focusing step
    shiftStart: z.number(), // step 5: the constraint moves to station 03
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
    subSpeed: z.number(), // step 3: upstream calms to the constraint's pace
    elevService: z.number(), // step 4: station 02 service time after elevation
    elevExit: z.number(), // step 4: exit speed after elevation
    laterCSlow: z.number(), // step 5: pass-through factor at station 03
  }),
  camera: z.object({
    zoom: z.number().min(1).max(5),
    focusY: z.number(),
    drift: z.number(), // extra zoom over the final hold
    wide: z.number(), // zoom of the full-system view after the pull back
  }),
  copy: z.object({
    title: z.string(),
    line: z.string(),
    voice: z.enum(['en', 'he']), // narration language (files in public/vo-en, public/vo-he)
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
    resumeAt: 15,
    resumeDur: 0.7,
    pullEnd: 17.8,
    steps: [15.3, 18.2, 21.2, 24.2, 27.2],
    shiftStart: 27.6,
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
    subSpeed: 130,
    elevService: 0.25,
    elevExit: 240,
    laterCSlow: 0.2,
  },
  camera: {zoom: 2.6, focusY: 880, drift: 0.07, wide: 1.05},
  copy: {title: 'GOLDRATT  ·  THE BOTTLENECK NOBODY SAW', line: 'ONE CONSTRAINT.', voice: 'en'},
};

export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const DURATION = 30 * FPS;

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
