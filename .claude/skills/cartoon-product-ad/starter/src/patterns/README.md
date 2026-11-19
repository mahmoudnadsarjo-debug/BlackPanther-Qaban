# Scene patterns

Working scenes from a delivered ad, kept as patterns. They are not loaded by the starter.
To use one: copy it into `src/scenes/`, point a scene in `plan/beats.json` at it (`"id"` or `"mod"` = file name without `.js`),
then replace the asset names, cue ids, copy keys and coordinates with your own. Also check any `remap()` anchors and `STEPS`/`PACK`/`ROWS` constants at the top of a file - they describe the example's clips and plates, not yours. `code_panel_overlay.js` and `end_card.js` load `assets/brand/logo.png`.

| File | Use it for |
|---|---|
| `hook_clip.js` | first 2-3 s: one clip, key moment pinned to a cue, two-stage headline |
| `problem_clip_overlay.js` | character clip + code-drawn objects leaving on the beat |
| `gag_remapped_clip.js` | physical gag from a start/end-frame clip, remapped to cues, off-screen crash sold in code |
| `hero_slam_callouts.js` | product slam-in, brand title, measured callouts glued to the product |
| `code_panel_overlay.js` | close-up where code redraws labels, LED digits and logo over a generated plate |
| `step_pullback.js` | one still played as three widening hits |
| `payoff_impact_rain.js` | impact on the cut + reward particles + equation headline |
| `end_card.js` | brand lockup, scarcity stamp, single call to action, pack shot |

The matching plan (`beats.json`, `copy.json`, storyboard) is in the skill under `assets/example-black-panther/`.
