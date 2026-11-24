import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {seg, smooth} from '../util';

type Props = {text: string; at: number; end: number; color: string; top: number};

const FONT = "'Inter Display','Inter',Helvetica,Arial,sans-serif";

/** One subtitle: the narration, verbatim. Soft fade, never competes with the picture. */
export const Subtitle: React.FC<Props> = ({text, at, end, color, top}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (t < at - 0.05 || t > end + 0.05) return null;
  const o = smooth(seg(t, at, at + 0.18)) * (1 - smooth(seg(t, end - 0.15, end)));
  return (
    <div style={{
      position: 'absolute', left: 90, right: 90, top, textAlign: 'center', opacity: o,
      fontFamily: FONT, fontWeight: 400, fontSize: 46, lineHeight: 1.3, letterSpacing: '0.01em', color,
      transform: `translateY(${(1 - smooth(seg(t, at, at + 0.25))) * 10}px)`,
    }}>{text}</div>
  );
};
