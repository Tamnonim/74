import {defaultProps} from '../src/config';
import {simulate} from '../src/sim';
const s = simulate(defaultProps, 12.5);
console.log('orders', s.count, 'doneB', s.doneB.map((x) => x.toFixed(1)).join(' '));
for (let t = 0; t <= 12; t += 1) console.log(t, 'queue', s.queueAt(t));
const last = s.snaps[s.snaps.length - 1];
console.log(Array.from(last.y).filter((y) => y < 9000).map((y) => Math.round(y)).join(' '));
