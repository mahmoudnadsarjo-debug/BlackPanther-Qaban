#!/usr/bin/env python3
"""Turn a generated clip into numbered JPEG frames the renderer can address by time, plus a contact sheet.

usage: clip_extract.py <name> <url-or-file> [sheet columns=8]
       clip_extract.py --all                 rebuild every assets/ai/video/*.mp4 (frames are not kept in git)

Writes assets/ai/video/<name>.mp4 (when given a URL), assets/ai/clips/<name>/0001.jpg... + meta.json,
and cache/view/clip-<name>.jpg (about six samples per second) - read that sheet for morphing, extra limbs,
drifting designs or a camera move you did not ask for before you build on the clip.
"""
import json, pathlib, shutil, subprocess, sys

def extract(name, src, cols=8):
    raw = pathlib.Path('assets/ai/video'); raw.mkdir(parents=True, exist_ok=True)
    mp4 = raw / f'{name}.mp4'
    if str(src).startswith('http'):
        subprocess.run(['curl', '-sS', '--fail', '-m', '300', '--retry', '3', '-o', str(mp4), src], check=True)
    else:
        given = pathlib.Path(src)
        if not given.exists(): sys.exit(f'clip file not found: {src}')
        if given.resolve() != mp4.resolve(): shutil.copy2(given, mp4)      # keep the source in the project: --all rebuilds from here
    info = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate',
                                      '-of', 'json', str(mp4)], capture_output=True, text=True, check=True).stdout)['streams'][0]
    num, den = map(int, info['r_frame_rate'].split('/')); fps = num / den
    out = pathlib.Path('assets/ai/clips') / name; out.mkdir(parents=True, exist_ok=True)
    for f in out.glob('*.jpg'): f.unlink()
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(mp4), '-q:v', '2', str(out / '%04d.jpg')], check=True)
    n = len(list(out.glob('*.jpg')))
    meta = {'fps': fps, 'frames': n, 'w': info['width'], 'h': info['height'], 'seconds': round(n / fps, 3), 'source': mp4.name}
    (out / 'meta.json').write_text(json.dumps(meta))
    view = pathlib.Path('cache/view'); view.mkdir(parents=True, exist_ok=True)
    step = max(1, round(fps / 6)); rows = -(-len(range(0, n, step)) // cols)
    sheet = view / f'clip-{name}.jpg'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(mp4), '-vf', f"select='not(mod(n\\,{step}))',scale=200:-1,tile={cols}x{rows}:padding=3:color=0x202020",
                    '-frames:v', '1', '-q:v', '3', str(sheet)], check=True)
    print(f'{name}: {meta}  sheet (every {step} frames, read left-to-right) -> {sheet}')

if len(sys.argv) == 2 and sys.argv[1] == '--all':
    clips = sorted(pathlib.Path('assets/ai/video').glob('*.mp4'))
    if not clips: sys.exit('no clips in assets/ai/video')
    for f in clips: extract(f.stem, f)
elif len(sys.argv) >= 3:
    extract(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 8)
else:
    sys.exit(__doc__)
