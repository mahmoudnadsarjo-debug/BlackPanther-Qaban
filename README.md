# BlackPanther-Qaban

Animated ad for the Black Panther back-rail platform scale (قبان ظهر), 9:16, 24 s.

- Watch: `renders/previews/Black Panther Scale Ad - Preview v1.mp4`
- Change any Arabic line: edit `plan/copy.json`, then re-render.
- Change timing: edit `plan/beats.json` (picture and sound both follow it), re-run the sound script, re-render.
- Style memory: `TASTE.md` · status and open items: `PROGRESS.md` · history: `LOG.md` · asset credits: `manifest.json`

```bash
python3 tools/make_audio.py cache/audio/mix-raw.wav
```

```bash
node src/render.js --from 0 --to 24 --fps 30 --scale 1 --out renders/previews --name "Black Panther Scale Ad - Preview v2" --audio assets/audio/mix-v1.wav
```

The extracted clip frames are not stored in git. After cloning, rebuild them once:

```bash
bash tools/rebuild_clips.sh
```

Rendering needs Node 18+, Playwright with Chromium, and FFmpeg. The sound script needs Python 3 with NumPy and SciPy.
