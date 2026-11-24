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
    /** On-screen captions, synced to narration. `gold` is the word picked out in gold. */
    captions: z.array(z.object({at: z.number(), end: z.number(), text: z.string(), gold: z.string()})),
  }),
  brand: z.object({
    name: z.string(), // placeholder wordmark until the real logo SVG is supplied
    descriptor: z.string(),
    ctaHeadline: z.string(),
    ctaSub: z.string(),
    ctaUrl: z.string(), // empty hides the line
    endStart: z.number(), // end card begins
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
    steps: [15.6, 19.0, 21.4, 24.5, 27.55],
    shiftStart: 27.8,
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
  copy: {title: '', line: 'ONE CONSTRAINT.',
    voice: 'en',
    captions: [
      {at: 0.2, end: 5.5, text: 'ONE HIDDEN THROTTLE', gold: 'THROTTLE'},
      {at: 5.6, end: 8.6, text: 'EVERYTHING ELSE: ZERO GAIN', gold: 'ZERO'},
      {at: 8.7, end: 12.0, text: 'WHICH ONE?', gold: 'ONE'},
      {at: 15.6, end: 18.9, text: '01  FIND IT', gold: 'FIND'},
      {at: 19.0, end: 21.3, text: '02  NEVER LET IT IDLE', gold: 'IDLE'},
      {at: 21.4, end: 24.4, text: '03  SLOW THE REST', gold: 'SLOW'},
      {at: 24.5, end: 27.5, text: '04  THEN ELEVATE', gold: 'ELEVATE'},
      {at: 27.55, end: 28.9, text: '05  REPEAT', gold: 'REPEAT'},
      {at: 29.0, end: 30.2, text: 'IT JUST MOVED', gold: 'MOVED'},
    ],  },
  brand: {
    name: 'GOLDRATT',
    descriptor: 'CONSULTING',
    ctaHeadline: 'FIND YOUR CONSTRAINT',
    ctaSub: 'Talk to Goldratt Consulting',
    ctaUrl: '',
    endStart: 30.2,
  },
};

export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const DURATION = 34 * FPS;

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
