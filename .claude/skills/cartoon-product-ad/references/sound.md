# Sound

## Contents
- Principle
- Describing the sound in `plan/beats.json`
- SFX recipes
- Music sections
- Commands
- Reading the report
- Changing the sound
- Voice-over and other sources
- What to tell the owner

## Principle

The soundtrack is synthesized by `tools/make_audio.py` from the same cue file the picture reads. There are no samples and no third-party music, so nothing can trigger a copyright claim on a paid ad, and a retime moves sound and picture together.

Sound marks **changes** - a cut, a landing, a word that matters - not every frame. Leave the moment before the big hit almost empty. Under a physical gag let the music step back (`hold`) so the Foley carries the joke.

## Describing the sound in `plan/beats.json`

```json
"bpm": 120,
"cues": [
  { "id": "eyes_open", "t": 0.35, "sfx": ["glint"] },
  { "id": "drop",      "t": 9.5,  "sfx": ["reverse_cymbal", "impact_big"] },
  { "id": "tap2",      "t": 7.0,  "sfx": [{ "s": "tap", "g": 1.15, "pan": -0.3 }] },
  { "id": "needle",    "t": 2.92, "sfx": [{ "s": "boing" }, { "s": "boing", "dt": 0.53, "g": 0.7 }] },
  { "id": "line2",     "t": 3.9,  "sfx": ["none"] }
],
"audio": {
  "seed": 1, "root_hz": 73.42,
  "sections": [
    { "kind": "drone",  "from": 0.0,  "to": 2.5 },
    { "kind": "sneaky", "from": 2.5,  "to": 6.0 },
    { "kind": "hold",   "from": 6.0,  "to": 9.5 },
    { "kind": "beat",   "from": 10.0, "to": 20.0, "no_riff_bars": [3], "bell_bars": [5] },
    { "kind": "outro",  "from": 20.0, "to": 24.0 }
  ]
}
```

An `sfx` entry is a recipe name, or an object: `s` recipe, `g` gain multiplier (1 = tuned default), `pan` -1..1 (match the side of the screen the action is on), `dt` seconds after the cue. Unknown names stop the script with the list of valid ones.

## SFX recipes

Print the current list with `python3 tools/make_audio.py --list`.

| Moment on screen | Recipe |
|---|---|
| quiet word appears | `pop` |
| keyword lands | `pop_low`, `title_slam` |
| brand name lands | `title_slam_big` |
| reveal in the dark, eyes open | `glint` |
| ordinary cut | `soft_hit`, `cut_whip` (ends on the cue) |
| hard cut into a new scene | `cut_hit` (whip ends on the cue + hit) |
| build-up into a cut or drop | `riser`, `reverse_cymbal` (both end on the cue) |
| **the** big moment (product slams in) | `impact_big` - once per film |
| cut to the end card | `boom_tail` |
| something lands | `land`; heavy load: `heavy_thud` |
| knock, push, object sent flying | `tap`, `shove` |
| metal object crashes off screen | `metal_crash` |
| something old and wobbly | `boing` |
| money: one coin, money leaving, coins raining | `coin`, `coin_away`, `coins_rain` |
| measure line / label | `measure_tick`, `tick` |
| device: key, several keys, result locks | `beep`, `beep_keys`, `beep_confirm` |
| contact between characters | `bump` |
| badge / limited-offer stamp | `stamp` |
| punchline caption, call to action appears | `bye_chime`, `cta_chime` |
| deliberate silence | `none` |

Need a sound that is not here? Add a recipe function in `tools/make_audio.py` next to the others (they are 2-4 lines built from the generators above them), give it a docstring, and use its name. Keep new sounds short and dry.

## Music sections

| Kind | Feel | Use for |
|---|---|---|
| `drone` | dark held note that swells | hook, tension |
| `sneaky` | tiptoe pizzicato on eighth notes | the problem, mischief |
| `hold` | near-silence with a clock tick | under a gag; before the drop |
| `beat` | kick, clap, hats, 808, cowbell riff in 4-beat bars | reveal through payoff. `no_riff_bars` (1-based) clears the melody where device beeps or a quiet shot need room; `bell_bars` adds a bright run for the payoff; `roots` overrides the bass movement per bar (semitones) |
| `outro` | half-time, the riff once more, a button one beat before `to` | end card |
| `button` | single closing hit at `at` | when you end without an `outro` |

Start `beat` on the beat *after* the big impact (impact at 9.5 s, groove from 10.0 s) so the hit rings alone for a moment. End with silence after the button so the ad loops cleanly.

`bpm` sets every musical duration; `root_hz` transposes everything (73.42 = D). Changing `seed` re-rolls the random details (coin pitches, noise), nothing structural.

Every section takes `"gain"` (1 = default). `"low_gain"` in `audio` (e.g. 0.8) thins the kick, 808 and sub everywhere - the first thing to try when the report shows a low-heavy film.

## Commands

```bash
python3 tools/make_audio.py
```
```bash
python3 tools/master_audio.py cache/audio/mix-raw.wav assets/audio/mix-v1.wav
```
```bash
python3 tools/audio_report.py assets/audio/mix-v1.wav
```

`master_audio.py` applies plain gain to reach -14 LUFS with a -1.5 dBTP ceiling, prints PASS or FAIL, and refuses to overwrite an existing output (pass `--force` only for throwaway files). New mix after a change = new version name (`mix-v2.wav`); pass it to the renderer with `--audio`. `make_audio.py --help` prints the plan format.

## Reading the report

`audio_report.py` prints level and five frequency bands per scene. It cannot tell you whether the track is pleasant, but it catches the failures that matter on a phone:

- **Low end swallowing everything.** Compare the `<120 Hz` column with `500-2k`. Where the riff plays (`beat` bars) expect a gap of about 5-10 dB. Sections without a melody - `drone`, `hold`, `outro`, bars listed in `no_riff_bars` - normally sit at 10-13 dB and that is fine. Above ~15 dB anywhere, act: lower `low_gain`, lower that section's `gain`, or lower `g` on the low one-shot in it (`impact_big`, `boom_tail`). The first mix of the worked example had a 20 dB gap - loud in headphones, nearly silent on a phone speaker. If you add a new low instrument, trim it like the others at the top of the recipe section.
- **A silent scene** (rms below about -35 dB) that was not meant to be silent.
- **A scene much louder than its neighbours** (more than ~8 dB) that is not the reveal.
- Peak at the ceiling in many scenes means the lows are eating headroom; the master will come up short of -14 LUFS.

Also confirm every sounding cue actually sounds: the script reports how many layers it placed; a cue with an empty `sfx` list is a silent animation.

## Changing the sound

- "Too much / too little of X": change `g` on that cue, or the default inside the recipe.
- "Calmer overall": use `sneaky` or `drone` in place of `beat` for the feature shots, or add all feature bars to `no_riff_bars`.
- "No music, effects only": remove `audio.sections`.
- Different energy: change `bpm` (and move cuts to the new grid), or edit `RIFF_A` / `RIFF_B` (16th-note step, semitone above the root).

## Voice-over and other sources

The default film is text-led and works muted, which is how most feed video is watched. A voice-over is an upgrade, not a requirement:
- It needs the owner's explicit go-ahead when it costs credits, and a native speaker's ear for dialect.
- Lock scene timing to the finished recording, not the other way round: record first, then move cues.
- Mix it as a separate file; duck the music under it.

If the owner supplies licensed music or effects, record source, author and licence in `PRODUCTION_LOG.md` and keep the files in `assets/audio/`. Never lift audio from a reference video.

## What to tell the owner

Say it plainly: the soundtrack is original and safe for paid ads; it was measured (loudness, peak, balance, every cue present) but not listened to by anyone; please play it on a phone and say what is too loud, too quiet or annoying.
