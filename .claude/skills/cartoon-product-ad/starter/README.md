# Illustrated product ad

- Timing (picture + sound): `plan/beats.json` · on-screen text: `plan/copy.json` · brief and rules: `AD_BRIEF.md` · history: `PRODUCTION_LOG.md`
- Scenes: `src/scenes/` (patterns to copy from: `src/patterns/`)

Smoke test (no generated assets needed):

```bash
python3 tools/make_audio.py cache/audio/smoke-raw.wav
```

```bash
python3 tools/master_audio.py cache/audio/smoke-raw.wav cache/audio/smoke.wav --force
```

```bash
node tools/render.mjs --from 0 --to 4 --scale 0.5 --name "Smoke test" --audio cache/audio/smoke.wav --force
```

After cloning, rebuild clip frames once: `python3 tools/clip_extract.py --all`

Needs Node 18+, Playwright with Chromium, FFmpeg, Python 3 with NumPy, SciPy and Pillow.
