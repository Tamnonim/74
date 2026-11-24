import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {Props} from '../config';

type P = {props: Props; fps: number; doneB: number[]};

/** Subtle placeholder sound design, all driven by the same timing props. */
export const Sfx: React.FC<P> = ({props, fps, doneB}) => {
  const f = (s: number) => Math.round(s * fps);
  const {queueEnd, goldStart, freezeStart} = props.timing;
  return (
    <>
      <Sequence from={0}><Audio src={staticFile('sfx/momentum.wav')} volume={0.35} /></Sequence>
      {doneB
        .filter((t) => t < freezeStart)
        .map((t, i) => (
          <Sequence key={i} from={f(t)}>
            <Audio src={staticFile('sfx/tick.wav')} volume={0.28} />
          </Sequence>
        ))}
      <Sequence from={f(queueEnd)}><Audio src={staticFile('sfx/push.wav')} volume={0.4} /></Sequence>
      <Sequence from={f(goldStart)}><Audio src={staticFile('sfx/reveal.wav')} volume={0.6} /></Sequence>
    </>
  );
};
