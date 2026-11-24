import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {Props} from '../config';

type P = {props: Props; fps: number; doneB: number[]};

/** Narration cue sheet: file, start (s). Lines are placed, never stretched. */
export const VO: Record<'en' | 'he', {file: string; at: number}[]> = {
  en: [
    {file: 'l1.mp3', at: 0.0}, // hook
    {file: 'l2.mp3', at: 5.65},
    {file: 'l3.mp3', at: 8.7}, // "...Which?" lands on the gold reveal
    {file: 'l4.mp3', at: 12.45},
    {file: 'l5.mp3', at: 15.6}, // steps follow props.timing.steps
    {file: 'l6.mp3', at: 19.0},
    {file: 'l7.mp3', at: 21.4},
    {file: 'l8.mp3', at: 24.5},
    {file: 'l9.mp3', at: 27.55},
    {file: 'l10.mp3', at: 30.5}, // call to action
  ],

  he: [
    {file: 'l1.mp3', at: 0.8},
    {file: 'l2.mp3', at: 8.4},
    {file: 'l3.mp3', at: 15.6},
    {file: 'l4.mp3', at: 19.0},
    {file: 'l5.mp3', at: 21.4},
    {file: 'l6.mp3', at: 24.5},
    {file: 'l7.mp3', at: 27.55},
  ],
};

/** Narration plus subtle placeholder sound design, driven by the same timing props. */
export const Sfx: React.FC<P> = ({props, fps, doneB}) => {
  const f = (s: number) => Math.round(s * fps);
  const {queueEnd, goldStart, shiftStart, steps, freezeStart, resumeAt} = props.timing;
  return (
    <>
      {VO[props.copy.voice].map((v) => (
        <Sequence key={v.file} from={f(v.at)}>
          <Audio src={staticFile(`vo-${props.copy.voice}/${v.file}`)} volume={1} />
        </Sequence>
      ))}
      <Sequence from={0} durationInFrames={f(4.2)}><Audio src={staticFile('sfx/momentum.wav')} volume={0.2} /></Sequence>
      {doneB
        .filter((t) => t < freezeStart || t > resumeAt)
        .map((t, i) => (
          <Sequence key={i} from={f(t)}>
            <Audio src={staticFile('sfx/tick.wav')} volume={0.14} />
          </Sequence>
        ))}
      <Sequence from={f(queueEnd)}><Audio src={staticFile('sfx/push.wav')} volume={0.28} /></Sequence>
      <Sequence from={f(goldStart)}><Audio src={staticFile('sfx/reveal.wav')} volume={0.45} /></Sequence>
      {steps.map((s, i) => (
        <Sequence key={i} from={f(s - 0.1)}><Audio src={staticFile('sfx/step.wav')} volume={0.22} /></Sequence>
      ))}
      <Sequence from={f(shiftStart + 0.9)}><Audio src={staticFile('sfx/reveal.wav')} volume={0.3} /></Sequence>
    </>
  );
};
