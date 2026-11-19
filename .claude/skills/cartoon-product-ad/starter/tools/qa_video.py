#!/usr/bin/env python3
"""Check a rendered MP4 against the delivery spec and pull frames back out of the encoded file for a last look.

usage: qa_video.py <video.mp4> [frames=14] [--final]
A reduced-size 9:16 preview passes with a NOTE; --final insists on 1080 x 1920 (use it on anything the owner will post).
Prints PASS/FAIL per item and writes cache/view/qa-<name>.jpg (frames taken from the file the owner will actually receive).
"""
import json, pathlib, re, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

if len(sys.argv) < 2: sys.exit(__doc__)
final = '--final' in sys.argv; argv = [a for a in sys.argv if a != '--final']
video = argv[1]; shots = int(argv[2]) if len(argv) > 2 else 14
plan = json.load(open('plan/beats.json'))
probe = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', video], capture_output=True, text=True, check=True).stdout)
v = next(s for s in probe['streams'] if s['codec_type'] == 'video')
a = next((s for s in probe['streams'] if s['codec_type'] == 'audio'), None)
dur = float(probe['format']['duration']); num, den = map(int, v['r_frame_rate'].split('/'))
ok = True
def check(label, passed, detail=''):
    global ok; ok = ok and passed
    print(f"{'PASS' if passed else 'FAIL'}  {label}{'  - ' + detail if detail else ''}")
check('video codec H.264 / yuv420p', v['codec_name'] == 'h264' and v['pix_fmt'] == 'yuv420p', f"{v['codec_name']} {v['pix_fmt']}")
full = (v['width'], v['height']) == (1080, 1920)
if final or full: check('size 1080 x 1920', full, f"{v['width']}x{v['height']}")
else:
    check('9:16 frame', abs(v['width'] / v['height'] - 9 / 16) < 0.01, f"{v['width']}x{v['height']}")
    print(f"NOTE  reduced-size preview ({v['width']}x{v['height']}) - fine for review, render --scale 1 and run with --final before delivery")
check(f"frame rate {plan.get('fps', 30)}", abs(num / den - plan.get('fps', 30)) < 0.01, f'{num / den:g}')
check('duration matches the plan', abs(dur - plan['duration']) < 0.05, f"{dur:.3f} s vs {plan['duration']} s")
head = open(video, 'rb').read(1 << 16)
check('faststart (plays before fully downloaded)', head.find(b'moov') != -1 and (head.find(b'mdat') == -1 or head.find(b'moov') < head.find(b'mdat')))
if a:
    check('audio AAC 48 kHz stereo', a['codec_name'] == 'aac' and a['sample_rate'] == '48000' and a['channels'] == 2, f"{a['codec_name']} {a['sample_rate']} Hz {a['channels']} ch")
    log = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', video, '-map', '0:a', '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    tail = log[log.rindex('Summary:'):]
    lufs = float(re.search(r'I:\s+(-?[\d.]+) LUFS', tail).group(1)); peak = float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', tail).group(1))
    check('loudness -14 LUFS (+/- 1)', abs(lufs + 14) <= 1, f'{lufs} LUFS')
    check('true peak <= -1 dBTP', peak <= -1.0, f'{peak} dBTP')
else:
    print('NOTE  no audio stream (fine for a silent range check, not for delivery)')
d = pathlib.Path('cache/qa'); d.mkdir(parents=True, exist_ok=True)
times = [round(dur * (i + 0.5) / shots, 2) for i in range(shots)]
cols = -(-shots // 2); tw = 360
for i, t in enumerate(times):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-i', video, '-frames:v', '1', '-vf', f'scale={tw}:-1', '-q:v', '3', str(d / f'{i:02d}.jpg')], check=True)
th = Image.open(d / '00.jpg').height
sheet = Image.new('RGB', (cols * (tw + 4), 2 * (th + 4)), '#202020'); dr = ImageDraw.Draw(sheet)
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 18)
except OSError: font = ImageFont.load_default()
for i, t in enumerate(times):
    x, y = (i % cols) * (tw + 4), (i // cols) * (th + 4)
    sheet.paste(Image.open(d / f'{i:02d}.jpg'), (x, y)); dr.text((x + 6, y + 5), f'{t:.1f}s', fill=(255, 255, 0), font=font, stroke_width=2, stroke_fill=(0, 0, 0))
out = pathlib.Path('cache/view'); out.mkdir(parents=True, exist_ok=True); out = out / f'qa-{pathlib.Path(video).stem}.jpg'
sheet.save(out, quality=88)
print(f'frames from the encoded file -> {out}')
print('ALL CHECKS PASSED' if ok else 'SOME CHECKS FAILED'); sys.exit(0 if ok else 1)
