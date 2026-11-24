# Handoff: TOC explainer (Remotion)

**Latest cut:** `review/bottleneck-v4.mp4` (34s, 1080x1920, 30fps, English VO + subtitles).

## What it is
A 30s Theory of Constraints explainer plus a 4s CTA end card. Orders (ivory dots) flow through three stations; a queue forms at 02; it turns gold ("ONE CONSTRAINT."); then the five focusing steps play out on the same geometry; the gold moves to 03; end card.

## Script (narration = subtitles)
1. Every business has one hidden throttle. And it's probably not the one you're fixing.
2. Speed up anything else, and you gain nothing.
3. Everything moves at the speed of one point. Which?
4. That's the constraint. The Theory of Constraints.
5. One: find it. Not where the noise is.
6. Two: never let it idle.
7. Three: slow everything else to match it.
8. Four: only now, add capacity.
9. Then it moves. Did you see where?
10. Every business has one. Find yours. (CTA)

Voice: ElevenLabs "Elliot - Light & Professional" (`8gNL8wXI7PQOc82yBLOg`), model eleven_v4. Lines 4-9 sped up 10% with ffmpeg atempo to fit. Files: `public/vo-en/l1..l10.mp3`. Hebrew alt in `public/vo-he/` (older script).

## Where to edit
- `src/config.ts`: palette, all timings, flow model, camera, subtitles (`copy.captions`), brand + CTA (`brand.*`).
- `src/components/Sfx.tsx`: narration cue sheet (`VO`) + placeholder SFX.
- `src/components/`: Station, Channel, Order, Subtitle, Logo, ConstraintText.
- `src/sim.ts`: deterministic order simulation (stable IDs per dot).

## Run
- `npm i && npm run dev` (Studio, all props editable in the sidebar)
- Render: `npx remotion render src/index.ts Bottleneck out/x.mp4 --codec=h264 --crf=16`
- Sandboxed Linux: add `--browser-executable=<chromium headless shell>`.

## Open items
- **Style is not house style.** Owner asked for it to be restyled to Goldratt's look (typography, palette, layout).
- **Logo is a placeholder** wordmark (`src/components/Logo.tsx`). Needs the real SVG.
- **CTA has no destination** (`brand.ctaUrl` empty).
- Subtitle timing is proportional to characters, not word-aligned. Check by ear.
- Runtime is 34s (30s + end card).
