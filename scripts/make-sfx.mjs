// Placeholder sound effects, synthesised. Replace with real sound design later.
import {writeFileSync, mkdirSync} from 'node:fs';

const SR = 44100;
mkdirSync('public/sfx', {recursive: true});

const buf = (sec) => new Float32Array(Math.floor(sec * SR));
const smooth = (x) => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c); };
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

function write(name, data, peak = 0.9) {
  let m = 0;
  for (const v of data) m = Math.max(m, Math.abs(v));
  const g = m > 0 ? peak / m : 1;
  const out = Buffer.alloc(44 + data.length * 2);
  out.write('RIFF', 0); out.writeUInt32LE(36 + data.length * 2, 4); out.write('WAVE', 8);
  out.write('fmt ', 12); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(1, 22);
  out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 2, 28); out.writeUInt16LE(2, 32); out.writeUInt16LE(16, 34);
  out.write('data', 36); out.writeUInt32LE(data.length * 2, 40);
  for (let i = 0; i < data.length; i++) out.writeInt16LE(Math.round(data[i] * g * 32767), 44 + i * 2);
  writeFileSync(`public/sfx/${name}.wav`, out);
  console.log('wrote', name);
}

// 1. momentum: soft rising drone + air, 4 s
{
  const d = buf(4); let ph = 0, lp = 0;
  for (let i = 0; i < d.length; i++) {
    const t = i / SR;
    const f = 90 * Math.pow(2, t / 4 * 1.1);
    ph += (2 * Math.PI * f) / SR;
    lp += 0.04 * (rnd() - lp);
    const env = smooth(t / 3) * (1 - smooth((t - 3.5) / 0.5));
    d[i] = (Math.sin(ph) * 0.5 + Math.sin(ph * 2) * 0.12 + lp * 1.4) * env;
  }
  write('momentum', d, 0.5);
}
// 2. tick: tiny low pulse when station 02 releases an order
{
  const d = buf(0.35); let ph = 0;
  for (let i = 0; i < d.length; i++) {
    const t = i / SR;
    ph += (2 * Math.PI * (210 - 90 * Math.min(1, t * 8))) / SR;
    d[i] = Math.sin(ph) * Math.exp(-t * 22) + (t < 0.004 ? rnd() * 0.3 : 0);
  }
  write('tick', d, 0.6);
}
// 3. push: filtered air swell as the camera closes in, 4 s
{
  const d = buf(4.2); let lp = 0, ph = 0;
  for (let i = 0; i < d.length; i++) {
    const t = i / SR;
    const a = 0.01 + 0.18 * smooth(t / 3.6);
    lp += a * (rnd() - lp);
    ph += (2 * Math.PI * (55 + 20 * smooth(t / 4))) / SR;
    const env = smooth(t / 1.5) * (1 - smooth((t - 3.6) / 0.6));
    d[i] = (lp * 3 + Math.sin(ph) * 0.35) * env;
  }
  write('push', d, 0.55);
}
// 4. reveal: sub hit + gold shimmer, 3.5 s
{
  const d = buf(3.5); let ph = 0;
  const partials = [523.25, 783.99, 1046.5, 1567.98];
  for (let i = 0; i < d.length; i++) {
    const t = i / SR;
    ph += (2 * Math.PI * (52 + 60 * Math.exp(-t * 9))) / SR;
    let s = Math.sin(ph) * Math.exp(-t * 2.2) * 1.0;
    const att = smooth(t / 0.12);
    partials.forEach((f, k) => {
      s += Math.sin(2 * Math.PI * f * t) * 0.07 / (k + 1) * att * Math.exp(-t * (1.1 + k * 0.4));
    });
    d[i] = s;
  }
  write('reveal', d, 0.7);
}
