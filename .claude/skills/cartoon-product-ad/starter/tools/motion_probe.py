#!/usr/bin/env python3
"""Find WHEN things happen inside an extracted clip, so the clip can be pinned to the beat with remap().

usage: motion_probe.py <clip-name> [x0 y0 x1 y1] [--raw]   region as fractions of the frame (default: whole frame)
e.g.   motion_probe.py v3-gag 0 0.45 0.5 0.9          watch the lower-left quarter where the object sits

Prints frame-to-frame change inside the region and the frames where a burst of motion starts.
Limited ("on twos") animation shows as alternating high/low values - read the bursts, not single frames.
Then look at those frames on the clip's contact sheet to name each burst (tap, push, landing...).
"""
import json, pathlib, sys
import numpy as np
from PIL import Image

if len(sys.argv) < 2: sys.exit(__doc__)
name = sys.argv[1]
nums = [a for a in sys.argv[2:] if not a.startswith('--')]
box = [float(v) for v in nums[:4]] if len(nums) >= 4 else [0, 0, 1, 1]
d = pathlib.Path('assets/ai/clips') / name
if not (d / 'meta.json').exists(): sys.exit(f'clip "{name}" is not extracted. Run: python3 tools/clip_extract.py {name} <file-or-url>')
meta = json.loads((d / 'meta.json').read_text()); fps, n = meta['fps'], meta['frames']
W, H = 270, 480
x0, y0, x1, y1 = int(box[0] * W), int(box[1] * H), int(box[2] * W), int(box[3] * H)
prev, energy = None, []
for i in range(1, n + 1):
    a = np.asarray(Image.open(d / f'{i:04d}.jpg').convert('L').resize((W, H))).astype(float)[y0:y1, x0:x1]
    if prev is not None: energy.append(float(np.abs(a - prev).mean()))
    prev = a
e = np.array(energy)
smooth = np.convolve(e, np.ones(5) / 5, mode='same')            # bridges the twos / threes
thr = max(0.8, float(np.median(smooth)) * 1.5)
print(f'{name}: {n} frames @ {fps:g} fps, region {box}, burst threshold {thr:.2f}')
if '--raw' in sys.argv: print('frame:energy  ' + ' '.join(f'{i + 2}:{v:.1f}' for i, v in enumerate(e)))
bursts, active, start = [], False, 0
for i, v in enumerate(smooth):
    if v > thr and not active: active, start = True, i
    if v <= thr and active:
        active = False
        if i - start >= 2: bursts.append((start, i))
if active: bursts.append((start, len(smooth)))
print('bursts (clip seconds):')
for s, t in bursts:
    kind = 'STRONG' if smooth[s:t].max() > thr * 3 else 'small'
    print(f'  {(s + 1) / fps:6.2f} -> {(t + 1) / fps:6.2f} s   frames {s + 2}-{t + 1}   peak {smooth[s:t].max():5.1f}  {kind}')
if not bursts: print('  none above threshold - widen the region or the clip is nearly still')
