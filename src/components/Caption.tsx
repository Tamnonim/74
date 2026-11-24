import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {outCubic, seg, smooth} from '../util';

type Props = {
  text: string;
  gold: string; // substring to pick out
  at: number;
  end: number;
  ivory: string;
  goldColor: string;
  top: number;
};

const FONT = "'Inter Display','Inter',Helvetica,Arial,sans-serif";

/** One caption line: masked per-character rise in, quick fade out. Size fits the line. */
export const Caption: React.FC<Props> = ({text, gold, at, end, ivory, goldColor, top}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (t < at - 0.05 || t > end + 0.1) return null;
  const chars = Array.from(text);
  const size = Math.max(34, Math.min(58, 900 / (chars.length * 0.9)));
  const g0 = text.indexOf(gold);
  const out = 1 - smooth(seg(t, end - 0.25, end));
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top, textAlign: 'center', opacity: out}}>
      <div style={{
        display: 'inline-flex', fontFamily: FONT, fontWeight: 300, fontSize: size,
        letterSpacing: '0.24em', marginRight: '-0.24em', lineHeight: 1.2, color: ivory,
      }}>
        {chars.map((c, i) => {
          const p = outCubic(seg(t, at + i * 0.028, at + i * 0.028 + 0.5));
          const isGold = g0 >= 0 && i >= g0 && i < g0 + gold.length;
          return (
            <span key={i} style={{display: 'inline-block', overflow: 'hidden', whiteSpace: 'pre', paddingBottom: 6}}>
              <span style={{
                display: 'inline-block', color: isGold ? goldColor : ivory, opacity: p,
                fontWeight: isGold ? 400 : 300,
                transform: `translateY(${interpolate(p, [0, 1], [size, 0])}px)`,
              }}>{c}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
};
