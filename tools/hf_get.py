#!/usr/bin/env python3
"""Download a generated asset and write a small review copy.
usage: hf_get.py <url> <dest path> [view width]"""
import subprocess, sys, pathlib
from PIL import Image

url, dest = sys.argv[1], pathlib.Path(sys.argv[2])
vw = int(sys.argv[3]) if len(sys.argv) > 3 else 1100
dest.parent.mkdir(parents=True, exist_ok=True)
subprocess.run(["curl", "-sS", "--fail", "-m", "180", "--retry", "3", "-o", str(dest), url], check=True)
if dest.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp"):
    im = Image.open(dest)
    view = pathlib.Path("cache/view"); view.mkdir(parents=True, exist_ok=True)
    w, h = im.size
    if w >= h: size = (vw, round(vw * h / w))
    else: size = (round(vw * 0.62), round(vw * 0.62 * h / w))
    im.convert("RGB").resize(size, Image.LANCZOS).save(view / (dest.stem + ".jpg"), quality=88)
    print(dest, im.size, "->", view / (dest.stem + ".jpg"), size)
else:
    print(dest, dest.stat().st_size)
