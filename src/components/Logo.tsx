import React from 'react';

const FONT = "'Inter Display','Inter',Helvetica,Arial,sans-serif";

type Props = {
  name: string;
  descriptor: string;
  ivory: string;
  gold: string;
  scale?: number;
  /** anchor: 'left' for the corner bug, 'center' for the end card */
  align?: 'left' | 'center';
};

/**
 * PLACEHOLDER wordmark: ring motif (echoes the stations) + letterspaced name.
 * Swap for the real Goldratt logo SVG when supplied.
 */
export const Logo: React.FC<Props> = ({name, descriptor, ivory, gold, scale = 1, align = 'left'}) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 16 * scale, fontFamily: FONT,
    flexDirection: align === 'center' ? 'column' : 'row',
  }}>
    <svg width={34 * scale} height={34 * scale} viewBox="0 0 34 34">
      <circle cx="17" cy="17" r="14" fill="none" stroke={ivory} strokeOpacity={0.85} strokeWidth="1.6" />
      <circle cx="17" cy="17" r="5" fill={gold} />
    </svg>
    <div style={{textAlign: align === 'center' ? 'center' : 'left'}}>
      <div style={{fontSize: 26 * scale, fontWeight: 500, letterSpacing: '0.34em', color: ivory, marginRight: '-0.34em'}}>{name}</div>
      <div style={{fontSize: 12 * scale, fontWeight: 400, letterSpacing: '0.5em', color: ivory, opacity: 0.55, marginTop: 4 * scale, marginRight: '-0.5em'}}>{descriptor}</div>
    </div>
  </div>
);
