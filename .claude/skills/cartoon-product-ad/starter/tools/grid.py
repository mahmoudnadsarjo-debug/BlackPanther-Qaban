#!/usr/bin/env python3
"""Overlay the 1080x1920 design grid on a plate (cover-fitted exactly as the renderer does) so callouts, measure
lines and code overlays can be placed by reading real coordinates instead of guessing.

usage: grid.py <plate image> <out.jpg> [step=120] [x0 y0 x1 y1 zoom]   (crop box in design px, zoom factor for a close read)
"""
import sys
from PIL import Image, ImageDraw, ImageFont
src, out = sys.argv[1], sys.argv[2]
step = int(sys.argv[3]) if len(sys.argv) > 3 else 120
im = Image.open(src).convert('RGB')
W, H = 1080, 1920
s = max(W / im.width, H / im.height)
im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
l, t = (im.width - W) // 2, (im.height - H) // 2
im = im.crop((l, t, l + W, t + H))
d = ImageDraw.Draw(im)
f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 20)
for x in range(0, W, step):
    d.line([(x, 0), (x, H)], fill=(0, 255, 255), width=1)
    for y in range(0, H, step * 2): d.text((x + 3, y + 3), str(x), fill=(255, 255, 0), font=f, stroke_width=2, stroke_fill=(0, 0, 0))
for y in range(0, H, step):
    d.line([(0, y), (W, y)], fill=(0, 255, 255), width=1)
    for x in range(0, W, step * 3): d.text((x + 3, y + 22), str(y), fill=(255, 160, 255), font=f, stroke_width=2, stroke_fill=(0, 0, 0))
if len(sys.argv) > 8:
    x0, y0, x1, y1 = map(int, sys.argv[4:8])
    im = im.crop((x0, y0, x1, y1))
    z = float(sys.argv[8]); im = im.resize((round(im.width * z), round(im.height * z)), Image.LANCZOS)
im.save(out, quality=90)
print(out, im.size)
