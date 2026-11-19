---
name: cartoon-product-ad
description: Produce a short illustrated / cartoon product ad (9:16 for Reels, TikTok and Shorts, ready for paid ads) end to end - study a drawing style from references, design an original mascot, redraw the real product from the owner's photos, generate key frames and animated shots with an image/video generator (Higgsfield by default), then composite in code so every on-screen word (Arabic or any language), LED digit, measurement, logo, effect and an original synthesized soundtrack is exact and editable. Use this whenever someone wants an animated, cartoon, anime, hand-drawn or mascot-style ad, promo or commercial for a product, shop or brand; wants "an ad in this drawing style"; wants product photos turned into an animated commercial; asks for a new version, hook, size or language of an ad made this way; or says things like إعلان كرتوني, إعلان رسوم متحركة, فيديو إعلاني للمنتج, إعلان ممول, ريلز إعلاني. Requires a coding agent with terminal and file access.
---

# Cartoon Product Ad

You are the director, storyboard artist, compositor and sound designer of a 20-30 second illustrated ad.
The result should look hand-made and sell a real product honestly.

## The one idea that makes this work

Split the job by what each tool is good at:

- **Generated art** (image + video models) draws the things that are hard to draw: characters, the product in a drawing style, backgrounds, acting.
- **Code** sets everything that must be *exact and editable*: every word on screen, numbers, LED digits, measure lines, the logo, timing, effects, the colour finish and the sound.

Image and video models garble small text and non-Latin scripts, cannot be corrected after the fact, and drift from the beat. Code cannot draw a charming panther. Never ask either side to do the other's job. Every generated image is requested with *no text and no logo*; text arrives later from `plan/copy.json`.

## Before anything else

1. Reply to the owner in the language they write in. Keep status notes short; they are following along, often on a phone.
2. Check the machine, without installing anything:
   ```bash
   python3 "<skill>/scripts/check_env.py"
   ```
   It reports Node, Playwright + Chromium, FFmpeg and the Python packages (NumPy, SciPy, Pillow). Ask before installing what is missing.
3. Resuming? If the project has `AD_BRIEF.md`, read it and `PRODUCTION_LOG.md` first and continue from "Next step". Do not redo locked designs.
4. New project:
   ```bash
   python3 "<skill>/scripts/new_project.py" <project-folder>
   ```
   then run the smoke test it prints. A passing smoke test proves fonts, text shaping, renderer, encoder and the sound engine before any credits are spent.

`<skill>` is the folder this file lives in. Run project commands from the project root.

## The stages

Work in this order. Each stage ends with something you *look at* before moving on - generated output is cheap to make and expensive to build on when it is wrong.

| # | Stage | You produce | Read first |
|---|---|---|---|
| 1 | Intake | `AD_BRIEF.md` with facts, assets, open questions | `references/intake-and-story.md` |
| 2 | Story | `plan/storyboard.md`, `plan/beats.json`, `plan/copy.json` | `references/intake-and-story.md` |
| 3 | Look | style block + locked sheets (mascot, product, cast) | `references/style-and-prompts.md` |
| 4 | Key frames | one vertical frame per shot (+ end frames for motion) | `references/style-and-prompts.md`, `references/generation.md` |
| 5 | Animation | 3-5 s clips, extracted and inspected | `references/generation.md` |
| 6 | Composite | scenes in `src/scenes/`, contact sheets | `references/compositing.md` |
| 7 | Sound | `assets/audio/mix-v1.wav` from the plan | `references/sound.md` |
| 8 | QA + delivery | named MP4, cover frame, honest hand-over note | `references/qa-and-delivery.md` |

A complete worked example (plan, copy, storyboard, scene code, costs, mistakes and fixes) is in `references/case-study.md`, `assets/example-black-panther/` and `starter/src/patterns/`. When unsure what "good" looks like at any stage, look there.

### 1. Intake - get what only the owner has

Collect: the product (photos from several angles), brand name and logo file, the facts you may state (sizes, capacity, features, price, offer, contact), audience and dialect, platform, style references, must-haves and must-nots, generator budget.

Then *act on what you have*. Missing inputs are normal: proceed with clearly marked stand-ins (temporary emblem, "message us" instead of a phone number) and list them as open items. Do not invent product facts to fill a gap - see "Rules that protect the owner".

Check early where files really are. Images pasted into a chat may be visible to you but not saved on disk, and a path on the owner's computer is unreachable from a cloud session. If you cannot hand a photo to the generator as a file, describe the product from what you see and verify the drawing against it (stage 3).

### 2. Story - plan on a beat grid

Use the proven arc: **hook (0-2.5 s) → problem → a memorable gag or turn → product reveal → 2-3 real features → payoff → call to action**. Pick a tempo (120 BPM is a good default: cuts fall on half-seconds) and write every scene boundary and every animated event as a named cue in `plan/beats.json`. Picture and sound both read that file, so a retime is one edit.

Write all on-screen lines into `plan/copy.json` in the audience's own dialect, short enough to read in the time they are up (about 0.3 s per word + 0.5 s).

### 3. Look - lock the designs before drawing scenes

1. Turn the references into a **style block**: a paragraph of technique (line quality, shading, palette, light, finish). Technique is fair to learn from; someone's artwork is not raw material - never upload a third-party artist's frames to a generator and never name the artist in a prompt.
2. Generate a **mascot sheet** (compare two or three models once, then stay with the winner), a **product sheet** drawn from the owner's photos, and a sheet for any supporting character.
3. Compare the product sheet against the real photos part by part. Fix proportions with *ratios* ("the pole is 1.4x the platform width"), not just centimetres. The factory's own logo never appears unless the owner sells under it.

These sheets are the references for every later image. That is what keeps the character and product the same in every shot.

### 4. Key frames

One vertical frame per shot, each generated with the sheets attached. Reserve the top fifth for a headline and keep the bottom fifth unimportant. For motion with a defined outcome, make the **end frame as an edit of the start frame** ("recreate this exactly, with ONE change..."), so the animation model interpolates between two frames you chose.

Where something must be exact (a display, a label, a logo spot), generate it **empty** and fill it in code.

### 5. Animation

Animate each key frame for 3-5 s with a start (and end) frame, locked camera, sound off. Then, for every clip:
```bash
python3 tools/clip_extract.py <name> <url>
```
and read the contact sheet it writes. Reject morphing, extra limbs, design drift and uninvited camera moves; re-roll once with a tighter prompt before changing approach. Stills animated in code (camera, punch, overlays) are a perfectly good shot - not everything needs a generated clip.

### 6. Composite

Copy a pattern from `src/patterns/` into `src/scenes/`, point a scene in `plan/beats.json` at it, replace assets, cues, copy keys and coordinates.
- Read real coordinates off the plate with `tools/grid.py` instead of guessing.
- Pin clip actions to cues with `remap()`; find the action frames with `tools/motion_probe.py`.
- After every change render a contact sheet and look at it:
  ```bash
  python3 tools/sheet.py <from> <to> 4 8 0.25 <name>
  ```
  Then check a few full-resolution stills (`node tools/render.mjs --still <t> --out cache/stills/x.png`) for anything small: decimal points, label text, logo edges.

### 7. Sound

Name a recipe on each cue (`"sfx": ["impact_big"]`) and describe the music as sections in `plan/beats.json`, then:
```bash
python3 tools/make_audio.py && python3 tools/master_audio.py cache/audio/mix-raw.wav assets/audio/mix-v1.wav && python3 tools/audio_report.py assets/audio/mix-v1.wav
```
Everything is synthesized, so there is no licensing risk in a paid ad. You cannot hear it: report it as *measured, not auditioned* and ask the owner to listen on a phone.

### 8. QA and delivery

Render with a plain versioned name, run `tools/qa_video.py` on the file, export a cover frame, update `AD_BRIEF.md` and `PRODUCTION_LOG.md`, commit, and hand over with the note structure in `references/qa-and-delivery.md`: what it is, what is temporary, what was not verified, what you need next.

## Rules that protect the owner

These exist because breaking them costs the owner money, reach or trust.

- **Only verified claims on screen.** State what the owner told you or what is visibly true of the product. No capacity, accuracy, battery life, warranty, price or "best in market" until supplied. Illustrative numbers (e.g. a sample calculation on a display) are flagged as illustrative in the hand-over. Paid-ad platforms reject unsupported claims, and customers hold the seller to them.
- **Text is code.** If a generated image contains readable text or a logo, regenerate or cover it. This is also what makes a one-word fix a ten-second edit instead of a new generation.
- **Original characters.** The mascot is an animal or figure of your own design. Do not approximate a film, comic or game character, even when the brand name invites it.
- **Other people's work stays reference-only.** Style screenshots are studied, never uploaded to a generator, never rendered, not committed to a public repository.
- **Spend deliberately.** Quote the cost before a batch, keep a running total in `PRODUCTION_LOG.md`, never re-submit a job whose outcome is unknown, and stop to ask before exceeding the budget the owner named. A full 24 s ad in the worked example cost about 95 credits; treat a plan that needs several times that as a sign to simplify.
- **Gentle on the eyes.** One big flash at the product reveal at most (opacity ≤ 0.7), others ≤ 0.4 and no more than one every couple of seconds. Strobing gets ads rejected and can harm viewers.
- **Safe areas (1080 x 1920).** Headlines y 200-560, the whole text block of an end card y 200-960, nothing essential below y 1250 or in the right 140 px - platform UI sits there.
- **Say what you did not check.** Sound not heard, a reference video you could not open, a product drawn from sight rather than from a file, a dialect you are not native in: say so in the hand-over.

## Talking to the owner

- While working: one short line per milestone ("Mascot design locked; drawing the product from your photos now").
- At the end: lead with what they can watch, then what is temporary or unverified, then the short list of what you need from them. Use the structure in `references/qa-and-delivery.md`.
- When the owner reacts warmly but vaguely, that is not sign-off on the open items; record the reaction and keep the open list visible.

## Reference index

| File | Read when |
|---|---|
| `references/intake-and-story.md` | starting a project; writing the storyboard, beats and copy |
| `references/style-and-prompts.md` | turning references into a style block; writing any generation prompt |
| `references/generation.md` | choosing models, estimating credits, submitting, downloading, what goes wrong |
| `references/compositing.md` | writing scenes; renderer and library API; coordinates, remapping, text, overlays |
| `references/sound.md` | writing the audio part of the plan; recipes, balance, mastering |
| `references/qa-and-delivery.md` | final checks, deliverables, project memory files, hand-over note |
| `references/case-study.md` | you want to see how a real ad went, including the mistakes |
