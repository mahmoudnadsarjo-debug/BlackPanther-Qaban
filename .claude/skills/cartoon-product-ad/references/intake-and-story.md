# Intake and story

## Contents
- What to collect
- Where the files really are
- The ad arc
- Hooks that fit a mascot brand
- The beat grid and `plan/beats.json`
- Copy rules and `plan/copy.json`
- Storyboard format

## What to collect

Ask only for what is missing, in one message, and keep working on whatever does not depend on the answer.

| Need | Why | If missing |
|---|---|---|
| Product photos, several angles, one close-up of any panel/label | the drawing must match the thing being sold | describe from one photo; flag "drawn by eye" |
| Brand name + logo file (PNG/SVG, transparent) | goes on the product and the end card | temporary emblem cut from the mascot sheet; flag it |
| Facts you may state: sizes, capacity, key features, price, offer, guarantee | every on-screen claim must be true | leave the claim out; ask |
| Contact / action: phone, WhatsApp, link, "message us" | the call to action | "message us" needs no number |
| Audience, country, dialect | wording and humour | ask; never guess a dialect you cannot write naturally |
| Platform + whether it will run as a paid ad | format, safe areas, claim strictness | assume 9:16, paid-ad safe |
| Style references | the look | propose one in words and get a yes |
| Budget for generation (credits) | plan the number of shots | quote first, ask before spending |
| Must-haves / must-nots (fonts, colours, a mark that must not show) | saves a re-do | - |

Write the answers into `AD_BRIEF.md` (template in the project). Separate **stated by the owner**, **seen in the photos** and **unknown** - that table is what you check every on-screen claim against.

## Where the files really are

Do not assume a file exists because someone mentioned it.

- A path on the owner's computer (`C:\Users\...`) is not reachable from a cloud session. Say so in one line and ask them to drop the files into the chat or the repository.
- Images sent in the middle of a running task may be visible to you but never written to disk. Check the upload folder before planning to pass them to a generator. If they are not files, you can still work from what you see - describe the product precisely in the prompt and compare the result against the photo - and say in the hand-over that it was drawn by eye.
- A reference link may be blocked by the session's network policy. Work from screenshots and state that the video itself was not opened.

## The ad arc

Seven beats in 20-30 seconds. Each one has a job; if a beat cannot do its job, cut it rather than pad it.

| Beat | Length | Job | Notes |
|---|---|---|---|
| Hook | 0-2.5 s | stop the scroll | a visual surprise in the first half second, then a short line that opens a question |
| Problem | 3-4 s | make the viewer feel the cost of the old way | loss is stronger than gain: money leaving, time wasted, embarrassment |
| Gag / turn | 3-4 s | the moment people replay and share | physical, wordless, in character; the music steps back so the action carries it |
| Reveal | 2-3 s | product + brand name in one frame | the single biggest hit of the film; mascot touches the product |
| Features | 2 s each, 2-3 of them | reasons to believe | one idea per shot, each a different framing; only verified facts |
| Payoff | 2 s | the feeling after buying | a human reaction, an equation-style line |
| Call to action | 3-4 s | one action | brand lockup, one offer or scarcity line, one button, on screen ≥ 2 s |

Useful structure for the story itself: a **misdirect in the hook** (the viewer assumes one thing, the cut reveals another) gives the problem beat a free punchline. In the worked example: glowing eyes in a dark shop + "There's a thief in your shop..." → cut: the thief is the old scale.

## Hooks that fit a mascot brand

- **Threat that turns out to be the helper** - the mascot looks like the danger, then removes the real one.
- **The mascot does what its species is known for** - a cat pushing an object off a table, a fox being sly, a camel carrying everything. Instantly readable, no words needed.
- **A question the viewer answers with "yes, that's me"** - phrase it the way the audience would say it to a colleague.
- **Result first** - open on the happy ending, rewind.

Test: describe the first two seconds in one sentence. If the sentence is not intriguing on its own, the hook is not there yet.

## The beat grid and `plan/beats.json`

At 120 BPM a beat is 0.5 s. Put every cut on a beat and every hit on a beat or half-beat. The file is the only place a time is written:

```json
{
  "bpm": 120, "fps": 30, "duration": 24.0,
  "scenes": [
    { "id": "s1_hook", "mod": "hook_clip", "start": 0.0, "end": 2.5 },
    { "id": "s4_reveal", "mod": "hero_slam_callouts", "start": 9.5, "end": 12.0 },
    { "id": "s5_dims",   "mod": "hero_slam_callouts", "start": 12.0, "end": 14.0 }
  ],
  "cues": [
    { "id": "eyes_open", "t": 0.35, "sfx": ["glint"] },
    { "id": "drop", "t": 9.5, "sfx": ["reverse_cymbal", "impact_big"] }
  ],
  "audio": { "seed": 1, "root_hz": 73.42, "sections": [ { "kind": "drone", "from": 0, "to": 2.5 } ] }
}
```

- `id` names the scene; `mod` is the file in `src/scenes/` (omit it when it equals the id). Two entries can share a `mod` to make one continuous shot that the sound and review tools still see as two beats.
- A cue is any moment something visibly happens: a word lands, a paw taps, a digit locks. Scenes look times up by id (`cue('drop')`), so a typo fails loudly instead of rendering wrong.
- Give every cue an `sfx` list, or `["none"]` when the silence is deliberate. `references/sound.md` lists the recipes.

Rhythm that works: fast-fast-hold. Two or three quick beats, then one that lasts. Leave the bar before the reveal nearly empty - the contrast is what makes the hit feel big.

## Copy rules and `plan/copy.json`

- All on-screen text lives in `plan/copy.json`; scenes read it by key. Nothing is typed into scene code.
- At most 6-8 words on screen at once. Two stacked lines: a quiet line in white, the keyword line in the accent colour.
- Write in the audience's spoken dialect, not formal language, and have it checked by a native reader when you are not one. In the worked example one word had the wrong regional form and had to be corrected before delivery - say plainly when you are unsure.
- Features are stated as outcomes when the fact supports it ("works out the price for you") and as plain facts when it is a measurement ("base 50 x 40 cm").
- The call to action is a single verb phrase plus where to do it.
- For right-to-left text mixed with numbers ("50×40"), render a still and read it the way the audience reads; the browser's ordering is usually right but must be seen.

Before any line goes in, find its support in the brief's fact table. No support, no line.

## Storyboard format

`plan/storyboard.md`, one row per shot:

| # | Time | Picture | Motion | On-screen text | Sound |
|---|---|---|---|---|---|

Keep it to what someone needs to judge the idea. Timings in the table are for reading only; the truth is `plan/beats.json`. A filled example is in `assets/example-black-panther/storyboard.md`.
