#!/usr/bin/env python3
"""Download (optional) + extract an AI clip into numbered JPEG frames for the deterministic renderer,
write meta.json, and build a contact sheet for review.
usage: clip_extract.py <name> <url-or-file> [sheet_cols]"""
import json, pathlib, subprocess, sys
name, src = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 8
raw = pathlib.Path('assets/ai/video'); raw.mkdir(parents=True, exist_ok=True)
mp4 = raw / f'{name}.mp4'
if src.startswith('http'):
    subprocess.run(['curl', '-sS', '--fail', '-m', '300', '--retry', '3', '-o', str(mp4), src], check=True)
else:
    mp4 = pathlib.Path(src)
p = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate,nb_frames,duration', '-of', 'json', str(mp4)], capture_output=True, text=True, check=True).stdout)['streams'][0]
num, den = map(int, p['r_frame_rate'].split('/')); fps = num / den
out = pathlib.Path('assets/ai/clips') / name
out.mkdir(parents=True, exist_ok=True)
for f in out.glob('*.jpg'): f.unlink()
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(mp4), '-q:v', '2', str(out / '%04d.jpg')], check=True)
n = len(list(out.glob('*.jpg')))
meta = {'fps': fps, 'frames': n, 'w': p['width'], 'h': p['height'], 'source': mp4.name}
(out / 'meta.json').write_text(json.dumps(meta))
view = pathlib.Path('cache/view'); view.mkdir(parents=True, exist_ok=True)
step = max(1, round(fps / 6))  # ~6 samples per second
rows = -(-len(range(0, n, step)) // cols)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(mp4), '-vf', f"select='not(mod(n\\,{step}))',scale=200:-1,tile={cols}x{rows}:padding=3:color=0x202020", '-frames:v', '1', '-q:v', '3', str(view / f'clip-{name}.jpg')], check=True)
print(name, meta, 'sheet step', step, 'frames ->', view / f'clip-{name}.jpg')
