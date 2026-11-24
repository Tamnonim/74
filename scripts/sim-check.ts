import {defaultProps} from '../src/config';
import {simulate} from '../src/sim';
import {makeWarp} from "../src/util";
const w = makeWarp(defaultProps);
const s = simulate(defaultProps, w.end, w);
console.log('orders', s.count, 'doneB', s.doneB.map((x) => x.toFixed(1)).join(' '));
for (let t = 0; t <= 27; t += 3) console.log(t, 'queue', s.queueAt(t));
const last = s.snaps[s.snaps.length - 1];
console.log(Array.from(last.y).filter((y) => y < 9000).map((y) => Math.round(y)).join(' '));
