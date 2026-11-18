#!/usr/bin/env python3
"""Render a time range small and tile it into one labelled contact sheet (review only, lives in cache/).
usage: sheet.py <from> <to> [fps=4] [cols=8] [scale=0.3] [name]"""
import glob, pathlib, shutil, subprocess, sys
from PIL import Image, ImageDraw, ImageFont
a, b = float(sys.argv[1]), float(sys.argv[2])
fps = float(sys.argv[3]) if len(sys.argv) > 3 else 4
cols = int(sys.argv[4]) if len(sys.argv) > 4 else 8
scale = float(sys.argv[5]) if len(sys.argv) > 5 else 0.3
name = sys.argv[6] if len(sys.argv) > 6 else f'sheet-{a:g}-{b:g}'
d = pathlib.Path('cache/sheets') / name
shutil.rmtree(d, ignore_errors=True); d.mkdir(parents=True)
r = subprocess.run(['node', 'src/render.js', '--from', str(a), '--to', str(b), '--fps', str(fps), '--scale', str(scale), '--out', str(d), '--jpg'], capture_output=True, text=True)
if r.returncode: print(r.stdout[-1500:], r.stderr[-3000:]); sys.exit(1)
fs = sorted(glob.glob(str(d / '*.jpg'))); im0 = Image.open(fs[0]); w, h = im0.size
rows = -(-len(fs) // cols)
s = Image.new('RGB', (cols * (w + 4), rows * (h + 4)), '#202020')
f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 16)
dr = ImageDraw.Draw(s)
for i, p in enumerate(fs):
    x, y = (i % cols) * (w + 4), (i // cols) * (h + 4)
    s.paste(Image.open(p), (x, y)); dr.text((x + 5, y + 4), f'{a + i / fps:.2f}', fill=(255, 255, 0), font=f, stroke_width=2, stroke_fill=(0, 0, 0))
out = pathlib.Path('cache/view') / f'{name}.jpg'; s.save(out, quality=86); print(out, s.size, len(fs), 'frames')
