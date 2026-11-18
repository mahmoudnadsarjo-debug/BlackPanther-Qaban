# TASTE - Black Panther back-rail scale ad   (status: v1 preview, NOT yet approved by the owner)

Read this first in every new chat, then PROGRESS.md, then the end of LOG.md.

## 1. Brief + concept
- **Product:** electronic price-computing platform scale with a back rail ("قبان ظهر"), sold under the owner's brand **Black Panther**.
  Facts given by the owner: base 50 x 40 cm, 70 cm from platform to indicator head. Seen in the owner's photos: black diamond-plate steel
  platform, tubular back rail with crossbar, folding pole, indicator with three red LED windows (weight / unit price / total) and a keypad
  (digits, ZERO, TARE, SAVE, ADD, C, light, M1-M6, PCS). The factory "J.B.C" mark must never appear; the owner's panther logo replaces it.
- **Audience:** shop owners in Jordan (groceries, roasteries, produce, wholesale). Copy is Jordanian dialect.
- **Format:** 9:16, 1080x1920, 30 fps, 24.0 s, sound on but fully readable muted. Must be usable as a paid ad.
- **Pipeline:** B (mixed). Illustration + character animation generated on Higgsfield; ALL Arabic text, LED digits, logo, measure lines,
  effects, grade and sound are code (so Arabic is always correct and editable).
- **Story (one line):** "There's a thief in your shop..." - glowing eyes in the dark - but the thief is the old scale. The panther does what
  every cat does and shoves it off the counter, the Black Panther scale slams in, three real features, happy shopkeeper, order now.

## 2. Theme + feel
- Reference: the owner's screenshots of an indie hand-drawn animatic (kept in assets/refs/style, reference-only, never used as generation input).
  What we take is technique: bold dark ink outlines, flat two-tone cel shading, muted lavender-grey night palette, pinkish-white window glow,
  cream rim light, light chromatic fringe + bloom + grain, snappy held poses, big expressive eyes.
- Mood words: sneaky, funny, confident, premium-cartoon. Must NOT feel: photoreal, 3D, stock-template, AI-collage, childish.

## 3. Visual system
| Role | Value |
|---|---|
| Ink line / text outline | `#17121f` |
| Night background | `#0d0a18`, indigo `#1b1636` |
| Brand accent (eyes, keywords, CTA) | amber `#ffd23a`, deep `#e39a00` |
| Text | warm white `#fff7ee`, cream `#ffeccb` |
| Scarcity stamp / LED | red `#e8362b` / `#ff3b30` |
- **Fonts:** Almarai 800 for every headline and label, Almarai 700 for the small panel labels (owner asked for modern faces like Almarai;
  **IBM Plex is banned**). Tajawal / Alexandria files are in assets/fonts as approved-style alternates only. All OFL.
- **Text treatment:** flat fill + 0.2 em ink outline + offset ink block shadow; keyword in amber with a soft amber glow; slight +/-2 deg tilt.
  Lines auto-shrink to 940 px max width (never clip). Latin wordmark letter-spaced.
- **Safe areas:** headlines y 200-560; CTA block y 200-960; nothing essential below y 1250 or in the right 140 px.
- **Characters (locked):** panther = assets/ai/design/panther-sheet-nanobanana.png (real melanistic leopard, charcoal-violet coat, big amber
  eyes, round pupils, no accessories). Shopkeeper = assets/ai/design/merchant-sheet.png. Product = assets/ai/design/scale-sheet-v2.png.
  Every new shot must be generated with these sheets attached as references.
- **Finish (src/lib/post.js):** soft 0.25 blur mix, bloom 0.28-0.42, lateral chromatic aberration 2.2 px (+ up to 9 px for a few frames on
  impacts), grain 0.09, vignette 0.5.

## 4. Motion language
- Hard cuts on the beat (120 BPM, cuts on half-seconds). Entrances: pop (outBack 0.26 s) for quiet words, slam (2.3x -> 1, 0.2 s, squash) for
  keywords. Exits faster than entrances (0.14 s).
- Signature devices: zoom punch + stepped shake on every impact, hand-inked impact lines, measure brackets that grow from the middle,
  winged coins, three-step pull-back on the load shot.
- Flashes are capped (<= 0.7 once at the drop, <= 0.4 elsewhere, never more than one per ~2 s).
- AI clips are time-remapped to the cue file, never the other way round.

## 5. Sound identity
- 100 % synthesized in tools/make_audio.py (no samples, no third-party music) -> safe for paid ads.
- 120 BPM. Hook: drone + metallic glint + sub. Problem: sneaky pizzicato. Swipe: music holds its breath (taps, slide whistle, metal crash).
  Drop at 9.5 s into kick / clap / hats / 808 / cowbell riff in D minor. Indicator shot drops the riff so the beeps read. Button ending at 23.5 s.
- Master: -14 LUFS integrated, true peak <= -1.5 dBTP. Measured only; nobody has auditioned it yet.

## 6. Voice
- None in v1 (text-driven, works muted). Optional later: Jordanian-dialect VO, would need the owner's go-ahead for the extra generation cost.

## 7. Technical setup
- Timing: `plan/beats.json` (scenes + cues) is the only timing source for picture and sound. Copy: `plan/copy.json`.
- Render: `node src/render.js --from 0 --to 24 --fps 30 --scale 1 --out renders/previews --name "<name>" --audio assets/audio/mix-v1.wav`
- Sound: `python3 tools/make_audio.py cache/audio/mix-raw.wav` then gain to -14 LUFS (see LOG).
- Review sheets: `python3 tools/sheet.py <from> <to> 4 8 0.25 <name>` -> cache/view.
- New clip: `python3 tools/clip_extract.py <name> <url>` -> assets/ai/clips/<name>/ (frames + meta.json).

## 8. Do / don't
- DO keep every on-screen claim to what the owner stated or what is visible on the device.
- DON'T state capacity (kg), accuracy class, battery life, warranty or price until the owner supplies them.
- DON'T let any AI image contain text or a logo; text is always code.
- DON'T reference or imitate any existing film/comic character; the mascot is the animal.

## 9. Feedback rules (append-only)
- 2026-11-18 owner: never use IBM Plex; use modern Arabic fonts such as Almarai.
- 2026-11-18 owner: the panther must look tidy and anatomically logical, not "AI slop".
- 2026-11-18 owner: the J.B.C logo must not be visible; use the Black Panther logo instead.
- 2026-11-18 owner: use Higgsfield with whichever model gives the best result, 600-credit budget; fall back to code if it cannot do Arabic.

## 10. Decision history
- 2026-11-18 Image model: GPT Image 2.6 (high, 2K) for scenes - cleanest multi-reference result; Nano Banana sheet kept as the panther design.
- 2026-11-18 Animation model: Kling 3.0 Pro (start/end frames) for 6 shots, Kling 4.0 for the eye-open shot (cleaner blink).
- 2026-11-18 Arabic handled entirely in code (AI models garble Arabic and cannot be edited later).

## 11. Continue in a new chat
1. Read this file, PROGRESS.md, tail of LOG.md. 2. `npm install` is not needed for rendering (fonts are in assets/fonts; Playwright must exist).
3. Check PROGRESS "Open issues" - the owner's real logo file and missing product facts come first.
