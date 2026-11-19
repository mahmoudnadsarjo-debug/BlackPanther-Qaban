#!/usr/bin/env python3
"""Render a time range small and tile it into one time-stamped contact sheet.
One image shows the whole move, so framing, clipped text, overlaps and pops between stills become visible.

usage: sheet.py <from> <to> [fps=4] [cols=8] [scale=0.25] [name]
Output: cache/view/<name>.jpg   (frames in cache/sheets/<name>/)
"""
import glob, pathlib, shutil, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

if len(sys.argv) < 3: sys.exit(__doc__)
a, b = float(sys.argv[1]), float(sys.argv[2])
fps = float(sys.argv[3]) if len(sys.argv) > 3 else 4
cols = int(sys.argv[4]) if len(sys.argv) > 4 else 8
scale = float(sys.argv[5]) if len(sys.argv) > 5 else 0.25
name = sys.argv[6] if len(sys.argv) > 6 else f'sheet-{a:g}-{b:g}'
d = pathlib.Path('cache/sheets') / name
shutil.rmtree(d, ignore_errors=True)
r = subprocess.run(['node', 'tools/render.mjs', '--from', str(a), '--to', str(b), '--fps', str(fps), '--scale', str(scale), '--frames', str(d)], capture_output=True, text=True)
if r.returncode: sys.exit((r.stdout + r.stderr)[-3000:])
files = sorted(glob.glob(str(d / '*.jpg'))); w, h = Image.open(files[0]).size
rows = -(-len(files) // cols)
sheet = Image.new('RGB', (cols * (w + 4), rows * (h + 4)), '#202020'); dr = ImageDraw.Draw(sheet)
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 16)
except OSError: font = ImageFont.load_default()
for i, p in enumerate(files):
    x, y = (i % cols) * (w + 4), (i // cols) * (h + 4)
    sheet.paste(Image.open(p), (x, y))
    dr.text((x + 5, y + 4), f'{a + i / fps:.2f}', fill=(255, 255, 0), font=font, stroke_width=2, stroke_fill=(0, 0, 0))
out = pathlib.Path('cache/view'); out.mkdir(parents=True, exist_ok=True); out = out / f'{name}.jpg'
sheet.save(out, quality=86)
print(f'{out}  {sheet.size}  {len(files)} frames, {1 / fps:.3f} s apart')
