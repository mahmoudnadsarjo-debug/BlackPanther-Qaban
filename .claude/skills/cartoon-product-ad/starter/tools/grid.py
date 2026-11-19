#!/usr/bin/env python3
"""Overlay the 1080x1920 design grid on a plate (cover-fitted exactly as the renderer does) so callouts, measure
lines and code overlays can be placed by reading real coordinates instead of guessing.

usage: grid.py <plate image> <out.jpg> [step=120] [x0 y0 x1 y1 zoom]
       step is the grid spacing in design px; the optional crop box is in design px and zoom enlarges it for a close read.
e.g.   grid.py assets/ai/keys/k4-hero.png cache/view/grid-hero.jpg
       grid.py assets/ai/keys/k7-panel.png cache/view/grid-panel.jpg 60 0 560 1080 1320 1.3
"""
import pathlib, sys
from PIL import Image, ImageDraw, ImageFont

if len(sys.argv) < 3: sys.exit(__doc__)
src, out = sys.argv[1], pathlib.Path(sys.argv[2])
step = int(sys.argv[3]) if len(sys.argv) > 3 else 120
W, H = 1080, 1920
im = Image.open(src).convert('RGB')
s = max(W / im.width, H / im.height)
im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
l, t = (im.width - W) // 2, (im.height - H) // 2
im = im.crop((l, t, l + W, t + H))
x0, y0, x1, y1, z = 0, 0, W, H, 1.0
if len(sys.argv) > 8:
    x0, y0, x1, y1 = map(int, sys.argv[4:8]); z = float(sys.argv[8])
    im = im.crop((x0, y0, x1, y1)); im = im.resize((round(im.width * z), round(im.height * z)), Image.LANCZOS)
d = ImageDraw.Draw(im)
try: f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 18)
except OSError: f = ImageFont.load_default()
first = lambda a: (a // step + (1 if a % step else 0)) * step
for gx in range(first(x0), x1 + 1, step):                    # labels sit in the margins of the picture, lines stay thin
    px = (gx - x0) * z; d.line([(px, 0), (px, im.height)], fill=(0, 255, 255), width=1)
    d.text((px + 3, 3), str(gx), fill=(255, 255, 0), font=f, stroke_width=2, stroke_fill=(0, 0, 0))
    d.text((px + 3, im.height - 24), str(gx), fill=(255, 255, 0), font=f, stroke_width=2, stroke_fill=(0, 0, 0))
for gy in range(first(y0), y1 + 1, step):
    py = (gy - y0) * z; d.line([(0, py), (im.width, py)], fill=(0, 255, 255), width=1)
    d.text((3, py + 3), str(gy), fill=(255, 160, 255), font=f, stroke_width=2, stroke_fill=(0, 0, 0))
    d.text((im.width - 58, py + 3), str(gy), fill=(255, 160, 255), font=f, stroke_width=2, stroke_fill=(0, 0, 0))
out.parent.mkdir(parents=True, exist_ok=True)
im.save(out, quality=90)
print(f'{out} {im.size}  x labels (yellow) top+bottom, y labels (pink) left+right, every {step} design px')
