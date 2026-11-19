#!/usr/bin/env python3
"""Create a new ad project from the starter. Never overwrites an existing file.

usage: new_project.py <project-folder>
"""
import pathlib, shutil, sys

if len(sys.argv) != 2: sys.exit(__doc__)
starter = pathlib.Path(__file__).resolve().parent.parent / 'starter'
dest = pathlib.Path(sys.argv[1]).resolve()
copied = skipped = 0
for src in sorted(starter.rglob('*')):
    if src.is_dir() or '__pycache__' in src.parts or src.name == '.DS_Store': continue
    out = dest / src.relative_to(starter)
    if out.exists(): skipped += 1; continue
    out.parent.mkdir(parents=True, exist_ok=True); shutil.copy2(src, out); copied += 1
print(f'{copied} files copied to {dest}' + (f' ({skipped} already existed and were left alone)' if skipped else ''))
print('''
Next, from the project folder:
  1. python3 tools/make_audio.py
  2. python3 tools/master_audio.py cache/audio/mix-raw.wav assets/audio/mix-v1.wav
  3. node tools/render.mjs --from 0 --to 4 --scale 0.5 --name "Smoke test" --audio assets/audio/mix-v1.wav --force
  4. look at the result (python3 tools/sheet.py 0 4 4 8 0.25 smoke), then fill in AD_BRIEF.md and replace the smoke plan.
Scene patterns to copy from: src/patterns/   ·   worked example plan: <skill>/assets/example-black-panther/
''')
