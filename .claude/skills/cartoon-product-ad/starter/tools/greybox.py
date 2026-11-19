#!/usr/bin/env python3
"""Make a grey-box placeholder plate, so the whole film can be blocked out, timed and laid out BEFORE any credits are spent.
Layout problems (no room for callouts, headline over the product, subject under the platform buttons) show up for free.

usage: greybox.py <name> "<label>" [--subject x0,y0,x1,y1] [--tone dark|mid|light]
       subject box is in fractions of the frame; writes assets/ai/keys/<name>.png (1520 x 2688, same as a generated key frame)
e.g.   greybox.py k4-hero "product hero" --subject 0.17,0.25,0.72,0.89
"""
import pathlib, sys
from PIL import Image, ImageDraw, ImageFont

if len(sys.argv) < 3: sys.exit(__doc__)
name, label = sys.argv[1], sys.argv[2]
opt = lambda k, d: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d
box = [float(v) for v in opt('--subject', '0.25,0.3,0.75,0.85').split(',')]
bg, fg = {'dark': ((30, 26, 54), (92, 84, 130)), 'mid': ((74, 70, 96), (140, 134, 168)), 'light': ((170, 164, 190), (96, 90, 120))}[opt('--tone', 'dark')]
W, H = 1520, 2688
im = Image.new('RGB', (W, H), bg); d = ImageDraw.Draw(im)
for y in range(0, H, 168): d.line([(0, y), (W, y)], fill=tuple(min(255, c + 10) for c in bg), width=2)      # faint floor/shelf lines so camera moves read
x0, y0, x1, y1 = box[0] * W, box[1] * H, box[2] * W, box[3] * H
d.rounded_rectangle([x0, y0, x1, y1], radius=40, fill=fg, outline=(23, 18, 31), width=10)
d.line([(x0, y0), (x1, y1)], fill=(23, 18, 31), width=4); d.line([(x0, y1), (x1, y0)], fill=(23, 18, 31), width=4)
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 64)
except OSError: font = ImageFont.load_default()
d.text(((x0 + x1) / 2, (y0 + y1) / 2), label, fill=(255, 236, 203), font=font, anchor='mm', stroke_width=6, stroke_fill=(23, 18, 31))
out = pathlib.Path('assets/ai/keys') / f'{name}.png'; out.parent.mkdir(parents=True, exist_ok=True); im.save(out)
print(f'{out} {im.size}  subject box {box}  (placeholder - replace with the generated key frame of the same name)')
