# Compositing in code

## Contents
- Project layout
- Renderer commands
- How a scene works
- Library reference
- Measuring coordinates on a plate
- Pinning a clip to the beat
- Text
- Redrawing exact parts over a plate
- Finish and flashes
- Fonts
- Review loop
- Problems seen and their fixes

## Project layout

```
plan/beats.json      timing: scenes, cues, sound plan      (single source of truth)
plan/copy.json       every on-screen line
plan/storyboard.md   the idea, for people
src/stage.js         loads fonts + scenes, exposes window.AD (do not edit per project)
src/fonts.js         font files and default family / direction
src/lib/             ink (maths, easing) · fx (motion + drawn effects) · text · shot (camera, plates, pills) · seg7 (LED digits) · post (finish)
src/scenes/          one module per scene, named in beats.json
src/patterns/        working scenes from a delivered ad, to copy from
tools/               render, sheets, clips, grid, motion probe, cut-out, sound, QA
assets/ai/keys/      still key frames (PNG)      assets/ai/video/  source clips      assets/ai/clips/  extracted frames (not in git)
assets/brand/        logo.png                    assets/fonts/     font files + licences        assets/audio/  mixes
renders/previews/    review videos               renders/final/    approved versions            cache/  everything regenerable
```

Design space is always **1080 x 1920**. Every coordinate in a scene is in those pixels regardless of render scale.

## Renderer commands

```bash
node tools/render.mjs --name "Brand Ad - Preview v1" --audio assets/audio/mix-v1.wav
```
```bash
node tools/render.mjs --from 6 --to 9.5 --scale 0.5 --name "Gag check v1"
```
```bash
node tools/render.mjs --still 13.7 --out cache/stills/dims.png
```
```bash
python3 tools/sheet.py 0 8 4 8 0.25 part-a
```

- Output goes to `renders/previews/` unless `--out` says otherwise. An existing file is never overwritten: bump the version in the name.
- Frames are piped as high-quality JPEG (about 2.8 frames/s at full size on a small cloud machine - roughly 4-5 minutes for 24 s). `--png` is lossless and about 40 % slower; use it only if you see banding.
- The encode is H.264 yuv420p, BT.709 tagged, AAC 48 kHz, faststart.
- Long renders: run in the background and wait for the process, do not poll with sleeps.

## How a scene works

A scene module exports `draw(ctx, t, env)`:
- `ctx` - 2D context already scaled to design space;
- `t` - seconds since the scene started; `env.T` - absolute time (use this with `cue()`);
- `env.img(url)`, `env.clip(name, clipSeconds)`, `env.cover(...)`, `env.scene`, `env.dur`, `env.frame`;
- return value (optional) - finish overrides for this frame: `{ flash, flashColor, bloom, ca, grain, vig, soft }`.

The one law: **a frame depends only on time and inputs.** No `Date`, no `Math.random`, no variables that remember the previous frame. Use `hash(i, seed)` for randomness. This is why a quarter-size contact sheet is trustworthy and why re-renders are identical. A module-level cache of something derived purely from an asset (like a feathered cut-out) is fine.

Minimal scene:
```js
import { cue } from '../data.js';
import { E, lerp, seg } from '../lib/ink.js';
import { line } from '../lib/text.js';
import { slam, shake, punch, flashEnv, topShade, PAL } from '../lib/fx.js';
import { COPY, cam, plate } from '../lib/shot.js';

export async function draw(ctx, t, env) {
  const T = env.T, hit = cue('reveal');
  const bmp = await env.clip('v4-jump', t);                         // or: await env.img(KEY('k4-hero'))
  const sh = shake(T, hit, 30, 0.5, 7);
  cam(ctx, { zoom: lerp(1.6, 1.02, E.outExpo(seg(T, hit, hit + 0.38))), fx: 0.5, fy: 0.72, dx: sh.x, dy: sh.y }, c => {
    plate(c, bmp);
    // anything drawn here stays glued to the plate
  });
  topShade(ctx, 0.6, 560);
  const s = slam(T, cue('title'), 0.2);
  if (s) line(ctx, [COPY.brand], { x: 540, y: 350, size: 160, fill: PAL.amber, glow: 34, each: () => s });
  return { flash: flashEnv(T, hit, 0.14) * 0.7, bloom: 0.34 };
}
```

## Library reference

**`lib/ink.js`** - `clamp`, `lerp`, `seg(t, a, b)` (0..1 progress inside a window), easings `E.outExpo / outBack / outCubic / inCubic / inOutSine / outBounce / ...`, `hash(i, seed)`, `snoise`, `taper()` (brush stroke with tapered ends), spline helpers (`spline`, `blob`, `line`) for drawing shapes by hand, `INK` colour.

**`lib/fx.js`**
- entrances: `pop(T, t0, d)` (quiet words, pills), `slam(T, t0, d)` (keywords: big → 1 with a squash). Both return `null` before `t0`, so `if (state) draw...`.
- exit: `out(state, T, t1, d)`.
- camera feel: `shake(T, t0, amp, dur, seed)` → `{x, y}`, `punch(T, t0, amount, dur)` → zoom multiplier, `flashEnv(T, t0, dur)` → 1..0.
- readability: `topShade(ctx, alpha, height)`, `bottomShade(...)`.
- drawn effects: `impactLines`, `speedLines`, `dust`, `sparkle`, `coin`.
- palette: `PAL` (ink, night, cream, white, amber, red...). Change it to the brand's accent; keep one accent.

**`lib/shot.js`** - `COPY`, `KEY(name)`, `cam(ctx, {zoom, fx, fy, dx, dy, rot}, fn)`, `plate(ctx, bmp)`, `cover(ctx, bmp, opts)`, `remap(t, pairs)`, `pill(ctx, text, x, y, opts)`, `rr()` rounded rect.

**`lib/text.js`** - `line(ctx, words, opts)`, `label(ctx, str, opts)`, `measure()`.

**`lib/seg7.js`** - `seg7(ctx, '12.500', rightX, centreY, height, { color, glow })` seven-segment digits, right-aligned, with a readable decimal point.

**`lib/post.js`** - the finish (see below). Not called from scenes.

## Measuring coordinates on a plate

Callouts, brackets and overlays must point at real places. Do not eyeball them.

```bash
python3 tools/grid.py assets/ai/keys/k4-hero.png cache/view/grid-hero.jpg 120
```
```bash
python3 tools/grid.py assets/ai/keys/k7-panel.png cache/view/grid-panel.jpg 60 0 560 1080 1320 1.3
```

The first draws the 1080 x 1920 grid over the plate exactly as the renderer will fit it; the second crops a region and enlarges it for precise reads (design px for the crop box, then a zoom factor). Read corner coordinates from the image, write them into the scene, render a still, adjust once.

Draw plate-anchored things **inside `cam()`** so they move with the camera. Draw headlines **outside** so they stay put.

## Pinning a clip to the beat

Generated clips never land on your cues. Find when things happen, then map.

```bash
python3 tools/motion_probe.py v3-gag 0 0.45 0.5 0.9
```
(region = fractions of the frame where the action is; add `--raw` for per-frame values). Confirm each burst against the clip's contact sheet, then:

```js
// scene-local time -> clip time. Anchors: taps at 0.9 s / 1.65 s, shove 2.96 s, object gone 3.7 s
const MAP = [[0, 0.4], [0.5, 0.9], [1.0, 1.65], [1.5, 2.96], [1.95, 3.7], [3.5, 5.0]];
const bmp = await env.clip('v3-gag', remap(t, MAP));
```

Guidelines: speeding a quiet stretch up to about 2.5x reads as snappy limited animation; keep the action itself within about 0.7-1.6x; holding the last frame for half a second under a camera push is fine; never reverse.

## Text

```js
line(ctx, [COPY.a, { t: COPY.b, fill: PAL.amber }], { x: 540, y: 330, size: 150, fill: PAL.white,
  each: i => ({ ...slam(T, t0 + i * 0.2), rot: i ? 0.03 : -0.03 }) });
```

- Lines auto-shrink to `maxW` (940 px). Still check the sheet: a shrunken headline may now be too small - shorten the copy instead.
- Two-line pattern: quiet line ~110-150 px in white, keyword line ~130-190 px in the accent with `glow`.
- Small tilts (±0.02-0.04 rad) keep it hand-placed. `topShade` behind text over busy plates.
- Direction comes from `src/fonts.js` (`DEFAULT_DIR`). Pass `dir: 'ltr'` for a Latin wordmark; set `ctx.letterSpacing` for tracking.
- Pills (`pill()`) for callout labels; one or two words plus a number.

## Redrawing exact parts over a plate

Pattern: `src/patterns/code_panel_overlay.js`.
1. Generate the plate with the exact part empty and no perspective (prompt in `style-and-prompts.md`).
2. Measure the rectangle with `tools/grid.py`; sample its fill colour from the plate.
3. Paint over it and draw labels, `seg7` digits, logo in code, inside `cam()`.
4. Animate values from cues: a weight that settles, a price keyed in digit by digit, a total that "computes" for a few frames then locks with a glint.
5. Logo: `assets/brand/logo.png` with transparency. Until the owner supplies it, make a stand-in from the mascot sheet with `tools/cutout.py` and list it as temporary.

## Finish and flashes

`post.js` gives every frame - generated or drawn - the same finish: slight softness, bloom, lateral chromatic fringe, grain, vignette. That shared finish is what makes clips, stills and code drawings read as one film. Defaults: `ca 2.2, bloom 0.28, grain 0.09, vig 0.5, soft 0.25`. Set project-wide values with a `"finish": {...}` object in `plan/beats.json`; return per-frame overrides from a scene.

On impacts, raise `ca` for a few frames (`2.2 + 8 * flashEnv(T, hit, 0.35)`) rather than adding a brighter flash. Flash limits: one ≤ 0.7 at the reveal, others ≤ 0.4, at least ~2 s apart.

## Fonts

`src/fonts.js` lists files in `assets/fonts/`. The starter ships Almarai (700, 800; Arabic + Latin subsets; SIL OFL). To add a family, take the `.woff2` files and licence from the font's own source (for OFL families the `@fontsource/<family>` npm package carries both), add rows, and render a still to confirm no fallback glyphs. Respect any font the owner bans or requires; record it in `AD_BRIEF.md`.

Glyphs outside the font (✓, emoji, arrows) fall back to a system font or a box. Draw such marks as shapes instead.

## Review loop

After each scene change: contact sheet of that range → fix → again. Before delivery: sheets over the whole film in three chunks, then 4-6 full-size stills at the densest moments. What to look for:

- text clipped by the frame edge, or sitting on a busy area without a shade;
- text or pills inside the unsafe bands (top ~200 px, below y 1250, right 140 px);
- an overlay covering a face;
- the cut frame: is the flash too strong, is the old scene's text still up;
- edges of the plate showing during a shake or tilt;
- callouts pointing at the wrong place after a camera change;
- anything code-drawn that looks like a different art style from the plates.

## Problems seen and their fixes

| Seen | Fix |
|---|---|
| Headline wider than the frame | `line()` auto-fits; shorten copy if it gets small |
| Dust drawn as outlined circles looked like bubbles | soft blurred fills, no outline (`dust()` does this) |
| Whole-frame flashes too frequent and too white | cap opacity, one per ~2 s, prefer a `ca` burst |
| Black strip at the frame edge during shake at zoom 1.0 | `plate()` draws an enlarged underlay; keep resting zoom ≥ 1.02 on shots that shake |
| LED decimal points invisible | decimal has its own cell in `seg7`; check a full-size still |
| A tight zoom on a 1080-wide clip looked soft | use the 1520-wide still for steps above ~1.3x |
| Headline covered the product's head unit | move the line into y 230-450 or reframe; check the widest step of a pull-back |
| Cut-out pack shot showed a visible rectangle | feather all four edges with gradient masks (`end_card.js`) |
| Objects flew through the headline | route them off an edge below the headline band |
| Rendering an edit of a held shot twice (text change) | keep text in `copy.json` and re-render only once all copy is checked |
