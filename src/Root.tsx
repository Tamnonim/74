import React from 'react';
import {Composition} from 'remotion';
import {Bottleneck} from './Bottleneck';
import {DURATION, FPS, H, W, defaultProps, schema} from './config';

export const Root: React.FC = () => (
  <Composition
    id="Bottleneck"
    component={Bottleneck}
    schema={schema}
    defaultProps={defaultProps}
    width={W}
    height={H}
    fps={FPS}
    durationInFrames={DURATION}
  />
);
