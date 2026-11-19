#!/usr/bin/env python3
"""Bring a raw mix to the delivery loudness with plain gain (no hidden compression), then verify it.

usage: master_audio.py <raw.wav> <out.wav> [--lufs -14] [--peak -1.5] [--force]

An existing <out.wav> is not overwritten without --force: a changed mix gets a new version name (mix-v2.wav)
so a render made earlier can always be traced to the audio it used.

If hitting the loudness target would push the true peak over the ceiling, the gain is reduced to respect the
ceiling and the shortfall is reported - fix that in the mix (tools/make_audio.py levels), not with a limiter here.
"""
import os, re, subprocess, sys

if len(sys.argv) < 3: sys.exit(__doc__)
src, out = sys.argv[1], sys.argv[2]
arg = lambda name, default: float(sys.argv[sys.argv.index(name) + 1]) if name in sys.argv else default
target, ceiling = arg('--lufs', -14.0), arg('--peak', -1.5)
if os.path.exists(out) and '--force' not in sys.argv: sys.exit(f'{out} exists - use the next version name (e.g. mix-v2.wav) or pass --force')

def measure(path):
    log = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    tail = log[log.rindex('Summary:'):]
    return float(re.search(r'I:\s+(-?[\d.]+) LUFS', tail).group(1)), float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', tail).group(1))

i0, p0 = measure(src)
gain = target - i0
limited = p0 + gain > ceiling
if limited: gain = ceiling - p0
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', src, '-af', f'volume={gain:.2f}dB', '-c:a', 'pcm_s24le', out], check=True)
i1, p1 = measure(out)
print(f'in  {i0:6.1f} LUFS  true peak {p0:5.1f} dBTP')
print(f'out {i1:6.1f} LUFS  true peak {p1:5.1f} dBTP   gain {gain:+.2f} dB -> {out}')
if limited: print(f'NOTE: peak ceiling {ceiling} dBTP reached first; {target - i1:.1f} LU short of {target} LUFS. Rebalance the mix (loud lows eat headroom).')
if abs(i1 - target) <= 1.0 and p1 <= ceiling + 0.1: print('PASS loudness and peak')
else: print('FAIL loudness or peak outside tolerance'); sys.exit(1)
