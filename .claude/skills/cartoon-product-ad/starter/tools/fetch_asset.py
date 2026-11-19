#!/usr/bin/env python3
"""Download a generated image/clip into the project and write a small review copy to cache/view/.
Look at the review copy before spending more credits on anything that depends on this asset.

usage: fetch_asset.py <url> <dest path> [review width=1100]
"""
import pathlib, subprocess, sys
from PIL import Image

if len(sys.argv) < 3: sys.exit(__doc__)
url, dest = sys.argv[1], pathlib.Path(sys.argv[2])
vw = int(sys.argv[3]) if len(sys.argv) > 3 else 1100
dest.parent.mkdir(parents=True, exist_ok=True)
subprocess.run(['curl', '-sS', '--fail', '-m', '300', '--retry', '3', '-o', str(dest), url], check=True)
if dest.suffix.lower() in ('.png', '.jpg', '.jpeg', '.webp'):
    im = Image.open(dest); w, h = im.size
    view = pathlib.Path('cache/view'); view.mkdir(parents=True, exist_ok=True)
    size = (vw, round(vw * h / w)) if w >= h else (round(vw * 0.62), round(vw * 0.62 * h / w))
    out = view / (dest.stem + '.jpg')
    im.convert('RGB').resize(size, Image.LANCZOS).save(out, quality=88)
    print(f'{dest} {im.size} -> review copy {out} {size}')
else:
    print(f'{dest} {dest.stat().st_size} bytes')
