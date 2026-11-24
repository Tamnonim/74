# The Bottleneck Nobody Saw: motion POC

15s, 1080x1920, 30fps. Remotion + React SVG.

- `npm run dev`: Studio. Edit timing, flow, camera, palette, copy in the Props sidebar.
- `npm run render`: export `out/bottleneck-review.mp4` (render `Bottleneck` to `out/bottleneck-30s.mp4` for the 30s cut).
- `npm run sfx`: regenerate placeholder sounds in `public/sfx`.
- Sandboxed machines: set `REMOTION_BROWSER=/path/to/chromium`.

Structure: `src/config.ts` (all parameters), `src/sim.ts` (deterministic order flow, stable IDs), `src/components/*` (Station, Channel, Order, ConstraintText, Sfx), `src/Bottleneck.tsx` (composition).
