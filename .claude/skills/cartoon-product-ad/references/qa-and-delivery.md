# QA and delivery

## Contents
- Final checks
- Deliverables and naming
- Project memory files
- Keeping the work
- Hand-over note
- After the first reaction

## Final checks

Run them on the file the owner will receive, not on your memory of the scenes.

```bash
python3 tools/qa_video.py "renders/previews/<Name> - Preview v1.mp4" --final
```

Half-size renders are for your own checks while building; anything the owner receives is rendered at `--scale 1` and checked with `--final` (without that flag a reduced 9:16 file passes with a note). An optional number after the file sets how many frames go on the sheet.

It verifies H.264 yuv420p, 1080 x 1920, frame rate, duration against the plan, faststart, AAC 48 kHz stereo, loudness near -14 LUFS, true peak, and writes a sheet of frames pulled back out of the encoded file. Look at that sheet.

Then go through this list honestly; "not checked" is an acceptable answer as long as it reaches the hand-over note.

- [ ] Hook lands inside 3 s; first frame is not a blank or a logo.
- [ ] Every on-screen claim traces to the fact table in `AD_BRIEF.md`.
- [ ] No text or logo inside any generated image; the factory mark is nowhere.
- [ ] Copy read once more in full, in the audience's dialect; numbers and units correct.
- [ ] Text inside safe areas (check a `--guides` sheet): nothing essential below y 1250, or right of x 940 from y 850 down.
- [ ] Call to action on screen ≥ 2 s; one action only.
- [ ] Flashes within limits (see `compositing.md`).
- [ ] Characters and product on-model in every shot.
- [ ] Every cue has a sound or a deliberate `none`; mix report has no silent or runaway scene.
- [ ] Temporary items listed (stand-in logo, illustrative numbers, missing contact).
- [ ] Credits spent recorded; `balance` confirms the total.

## Deliverables and naming

- `renders/previews/<Brand> <Product> Ad - Preview v1.mp4` - review version. Bump the number for every re-render the owner sees; never overwrite.
- `renders/final/<Brand> <Product> Ad - Final v1.mp4` - only after the owner has approved a preview and the temporary items are resolved.
- Cover frame for the post thumbnail:
  ```bash
  ffmpeg -v error -y -ss 1.7 -i "<video>" -frames:v 1 -q:v 2 "renders/previews/<Brand> <Product> Ad - Cover v1.jpg"
  ```
  Pick the moment with the hook line and the mascot both readable.
- Send the files to the owner with whatever file-delivery tool the session has; a path alone is not delivery.

Other sizes (4:5 feed, 1:1, 16:9) are new layouts, not crops: text and callouts must be re-placed for the new frame. Offer them; do them when asked.

## Project memory files

Two files keep a project resumable by someone who never saw the chat. Templates are in the starter.

**`AD_BRIEF.md`** - what we are making and the rules of this project. Overwrite as things change.
- Product facts in three columns: stated by owner / seen in photos / unknown.
- Audience, dialect, platform, length.
- Story in one paragraph.
- Locked look: style block, palette hex values, fonts (required and banned), sheet files and their generation ids.
- Owner rules, dated, in their words ("never use font X", "factory mark must not show").
- Open items and temporary stand-ins.
- Phase and next step.

**`PRODUCTION_LOG.md`** - append-only. One line per meaningful action: time, what, why, files, result. Every generation gets a line with model, job id, purpose and credits, and a running total. Every decision between alternatives gets a line with the reason.

Read both before doing anything in a resumed session. Update both before a long render and before ending a turn.

## Keeping the work

A cloud workspace disappears; only what is committed and pushed survives.

- Commit sources, plan, sheets, key frames, source clips, audio masters and delivered renders.
- Do not commit extracted clip frames (rebuild with `python3 tools/clip_extract.py --all`), caches, or third-party reference screenshots.
- Follow the session's branch rules; do not open a pull request unless asked.

## Hand-over note

Write it in the owner's language. Lead with what they can watch; keep it short enough to read on a phone. Structure:

1. **What is ready** - one sentence: length, format, sound.
2. **Know before posting** - the short list of what is temporary or unverified. Typical items:
   - stand-in logo;
   - sound measured, not listened to;
   - product drawn by eye from photos;
   - reference video not opened;
   - numbers on a display are illustrative;
   - dialect not checked by a native reader.
3. **The story** - six or seven numbered beats with the on-screen lines, so they can check wording without scrubbing.
4. **How it was made** - generator and credits used / left, text set in code (editable), font, original sound.
5. **What I need from you** - the few inputs that unlock the final version (logo file, price / contact, capacity and other facts, a listen).

Do not claim results you did not measure ("it will go viral", "it will sell out"). You can say what the film is built to do - stop the scroll, make the problem felt, give a reason to believe - and offer a second hook to test against the first.

## After the first reaction

- Praise without specifics is encouragement, not approval of open items. Log it, keep the open list in front of them, and ask for the missing inputs again - briefly.
- For each change request: restate it in one line, change the plan/copy/scene, re-sheet the affected range, render a new version number.
- When the same note comes twice, write it into `AD_BRIEF.md` as a rule so the next scene obeys it without being told.
- A cheap, valuable follow-up to offer: the same film with a different first 2.5 seconds, to test hooks in paid distribution.
