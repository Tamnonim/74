import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {outCubic, seg} from '../util';

type Props = {
  text: string;
  start: number; // seconds
  ivory: string;
  gold: string;
  top: number;
};

const FONT = "'Inter Display','Inter',Helvetica,Arial,sans-serif";

/** Per-character masked rise, then a hairline gold rule draws out beneath. */
export const ConstraintText: React.FC<Props> = ({text, start, ivory, gold, top}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const chars = Array.from(text);
  const rule = outCubic(seg(t, start + 0.9, start + 1.9));
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top, textAlign: 'center'}}>
      <div style={{
        display: 'inline-flex', fontFamily: FONT, fontWeight: 300, fontSize: 62,
        letterSpacing: '0.3em', marginRight: '-0.3em', color: ivory, lineHeight: 1.2,
      }}>
        {chars.map((c, i) => {
          const p = outCubic(seg(t, start + i * 0.045, start + i * 0.045 + 0.7));
          const isDot = c === '.';
          return (
            <span key={i} style={{display: 'inline-block', overflow: 'hidden', whiteSpace: 'pre', paddingBottom: 6}}>
              <span style={{
                display: 'inline-block', color: isDot ? gold : ivory, opacity: p,
                transform: `translateY(${interpolate(p, [0, 1], [62, 0])}px)`,
              }}>{c}</span>
            </span>
          );
        })}
      </div>
      <div style={{
        margin: '30px auto 0', height: 1.5, width: 260 * rule, background: gold, opacity: 0.9,
      }} />
    </div>
  );
};
