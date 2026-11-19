#!/usr/bin/env python3
"""Cut a subject off a flat background (e.g. a head from a character sheet, or a logo on a plain colour) -> PNG with alpha.
The background is whatever is connected to the border of the crop and close to its corner colour.

usage: cutout.py <image> <out.png> [--box x0,y0,x1,y1 as fractions] [--tol 46]
"""
import sys
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

if len(sys.argv) < 3: sys.exit(__doc__)
src, out = sys.argv[1], sys.argv[2]
box, tol = None, 46.0
for i, a in enumerate(sys.argv):
    if a == '--box': box = [float(v) for v in sys.argv[i + 1].split(',')]
    if a == '--tol': tol = float(sys.argv[i + 1])
im = Image.open(src).convert('RGB')
if box: im = im.crop((int(box[0] * im.width), int(box[1] * im.height), int(box[2] * im.width), int(box[3] * im.height)))
a = np.asarray(im).astype(float); h, w = a.shape[:2]
dist = np.sqrt(((a - a[4, 4]) ** 2).sum(-1))
bg = np.zeros((h, w), bool); q = deque([(y, x) for x in range(w) for y in (0, h - 1)] + [(y, x) for y in range(h) for x in (0, w - 1)])
while q:
    y, x = q.popleft()
    if y < 0 or x < 0 or y >= h or x >= w or bg[y, x] or dist[y, x] > tol: continue
    bg[y, x] = True; q.extend(((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)))
rgba = im.convert('RGBA'); rgba.putalpha(Image.fromarray((~bg * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.2)))
rgba = rgba.crop(rgba.getbbox()); rgba.save(out)
print(out, rgba.size)
