# Generation: models, credits, calls, pitfalls

## Contents
- The call sequence (Higgsfield)
- Model choices that worked
- Measured costs
- Budgeting a film
- Getting files in and out
- What goes wrong
- Using another generator

Model line-ups and prices change. Treat the names and numbers here as a dated starting point (measured in November 2026) and **re-quote before every batch** with the estimate tools.

## The call sequence (Higgsfield)

Tools are prefixed `mcp__Higgsfield__`. If they are not loaded, search for them by name first.

1. `balance` - credits available. Tell the owner the number and your planned spend.
2. `get_preferences` - if `auto_create_project` is false, generate without a project folder.
3. `models_explore` (`action: "get"`, `model_id`) - parameters, aspect ratios and media roles of a model you have not used yet.
4. `estimate_image_cost` / `estimate_video_cost` - same params as the generation call. Do this for each distinct configuration.
5. `generate_image_batch` / `generate_video_batch` - 1-12 independent requests, each with a stable `index`. Returns job ids immediately.
6. `jobs_wait` (up to 15 s per call) - repeat until `all_terminal`. Do other work between polls (write scenes, docs).
7. Download each `result_url`:
   - images: `python3 tools/fetch_asset.py <url> assets/ai/keys/<name>.png`
   - clips: `python3 tools/clip_extract.py <name> <url>`
8. Look at the review copy / contact sheet. Log job id, model, purpose and credits in `PRODUCTION_LOG.md`.

Passing references: a completed **job id is a valid media reference** - put it in `medias: [{ "role": "<role>", "value": "<job id>" }]`. No download-and-reupload is needed to chain generations. Roles differ per model (`image_references` for the image models used here; `start_image` / `end_image` for video) - read them from `models_explore`.

Example image request:
```json
{ "index": 3, "params": { "model": "gpt_image_2_6", "aspect_ratio": "9:16", "resolution": "2k", "quality": "high",
  "medias": [ { "role": "image_references", "value": "<product sheet job id>" }, { "role": "image_references", "value": "<mascot sheet job id>" } ],
  "prompt": "..." } }
```
Example clip request:
```json
{ "index": 4, "params": { "model": "kling3_0", "aspect_ratio": "9:16", "duration": 5, "mode": "pro", "sound": "off",
  "medias": [ { "role": "start_image", "value": "<start frame job id>" }, { "role": "end_image", "value": "<end frame job id>" } ],
  "prompt": "..." } }
```

## Model choices that worked

| Job | Model | Why |
|---|---|---|
| Mascot sheet (design exploration) | compare `nano_banana_pro`, `gpt_image_2_6` (high), `seedream_5_5` once | Nano Banana gave the cleanest bold-outline, flat-fill cartoon; GPT Image was the most polished; Seedream the sketchiest. Pick by the style block, not by habit |
| Product sheet, supporting character, **all key frames and edits** | `gpt_image_2_6`, `quality: "high"`, `resolution: "2k"` | best at following long structured prompts and at using several references without bleeding them into the picture; consistent across ten frames |
| Shot animation from start (+ end) frame | `kling3_0`, `mode: "pro"`, `sound: "off"` | held the flat 2D style and character designs, cheap, 1080 x 1912 at 24 fps |
| Very subtle motion (an eye opening) | `kling4_0`, `mode: "image-to-video"`, 1080p | slightly cleaner on tiny facial motion; about double the price, use sparingly |

Not recommended from experience: asking `nano_banana_pro` to use a character sheet "for style only" while drawing a different object - the sheet ghosted into the result. `seedance_2_5` at 1080p was roughly ten times the price of Kling 3.0 Pro for the same length.

## Measured costs

| Item | Credits |
|---|---|
| `gpt_image_2_6` high, 2k | 2.75 |
| `gpt_image_2_6` medium, 2k | 1.0 |
| `nano_banana_pro` 2k | 2.0 |
| `seedream_5_5` 2k | 3.5 |
| `kling3_0` pro, silent, 3 s | 5.25 |
| `kling3_0` pro, silent, 5 s | 8.75 |
| `kling4_0` 1080p, 3 s | about 9.75 |
| `kling4_0` 1080p, 5 s | 16.25 |
| `seedance_2_5` 1080p, 5 s | 80 |

The worked example (24 s, 9 scenes): 17 images + 7 clips = **94.25 credits**, including three model-comparison sheets, one superseded product sheet and one alternative clip.

## Budgeting a film

Rough plan for a 20-30 s ad: 3 sheets + (1 key frame per shot, +1 end frame for each motion shot) + 1 clip per shot that needs acting. Add 30-40 % for re-rolls. Present it as a table before spending:

| Stage | Items | Each | Subtotal |
|---|---|---|---|

Rules:
- Stop and ask if the plan exceeds the budget the owner named. "Use the credits well" is not "use them all".
- Never re-submit after a timeout or unknown outcome; look the job up first. A duplicate is a silent double charge.
- Do the cheap, design-defining items first (sheets), the expensive dependent ones last (clips).
- Keep the running total in `PRODUCTION_LOG.md` and confirm with `balance` at the end.

## Getting files in and out

- Results download from the URL in `jobs_wait` with `curl`. If the session's network policy blocks the host, read the environment's network documentation and request the specific host; do not work around it.
- Your own files (a code-drawn blueprint, a logo) go in with `media_upload` → `curl -X PUT` to the returned URL → `media_confirm`.
- Owner photos that exist only as chat images cannot be uploaded from the sandbox. Options, in order: ask the owner to attach them again in a fresh message or add them to the repository; use the generator's upload widget if the client supports it; otherwise describe from sight (see `style-and-prompts.md`).
- Keep source clips in `assets/ai/video/` (tracked) and extracted frames out of git (`python3 tools/clip_extract.py --all` rebuilds them).

## What goes wrong

| Symptom | Cause | Fix |
|---|---|---|
| `429 rate_limit_reached` on one item of a batch | too many requests to one model at once | resubmit just that index after the others return |
| Reference image "ghosts" into the result | model blends instead of following "style only" | use the model that handles multi-reference cleanly (GPT Image here) |
| Product proportions wrong | absolute units mean little to the model | give ratios; correct with a numbered-corrections pass on the previous sheet |
| Garbled text on labels/keys | models cannot letter | ask for blank; draw it in code |
| Clip adds a camera move or cut | prompt did not forbid it | "Locked static camera, single continuous shot. No camera movement, no zoom, no cuts." |
| Action happens at the wrong time | models ignore timing | fine - remap in code (`references/compositing.md`) |
| Clip barely moves | prompt was a description, not a sequence | write "first ..., then ..., then ..." |
| Character drifts off-model mid-clip | too long or too much action | 3 s, one action, start + end frame |
| Result job model name differs from the one requested | provider-side aliasing | judge the picture, log what was returned |

## Using another generator

Nothing in the compositing or sound pipeline depends on Higgsfield. With a different service (or art supplied by the owner or drawn by a person):
- keep the same deliverables: sheets → vertical key frames → short locked-camera clips;
- name files the same way (`assets/ai/keys/*.png`, `assets/ai/video/*.mp4`);
- check that the service's terms allow commercial use on the owner's plan, and note that in the hand-over.

If no generator is available at all, say so, and offer the reduced version: stills from the owner + code animation (camera, overlays, type, sound). It is a different, simpler film - do not present it as the same thing.
