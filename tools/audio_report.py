#!/usr/bin/env python3
"""Per-section level and band balance of a mix (metrics only: this is not a listening test)."""
import sys, wave, numpy as np
from scipy.signal import butter, sosfilt
w = wave.open(sys.argv[1]); n = w.getnframes(); sw = w.getsampwidth(); SR = w.getframerate()
raw = np.frombuffer(w.readframes(n), np.uint8).reshape(n, 2, sw).astype(np.int32)
x = sum(raw[..., i] << (8 * i) for i in range(sw)); x = np.where(x >= 2 ** (8 * sw - 1), x - 2 ** (8 * sw), x) / 2 ** (8 * sw - 1); m = x.mean(1)
secs = [('hook', 0, 2.5), ('problem', 2.5, 6), ('swipe', 6, 9.5), ('drop', 9.5, 12), ('dims', 12, 14), ('panel', 14, 16), ('load', 16, 18), ('payoff', 18, 20), ('end', 20, 24)]
band = lambda lo, hi, y: sosfilt(butter(4, [lo, hi], fs=SR, btype='bandpass', output='sos'), y)
r = lambda z: 20 * np.log10(np.sqrt(np.mean(z ** 2)) + 1e-9)
print('section      rms    peak   <120Hz 120-500 500-2k  2k-6k    6k+')
for name, a, b in secs:
    y = m[int(a * SR):int(b * SR)]
    print(f'{name:9s} {r(y):6.1f} {20 * np.log10(np.abs(y).max() + 1e-9):6.1f}  {r(band(30, 120, y)):6.1f} {r(band(120, 500, y)):6.1f} {r(band(500, 2000, y)):6.1f} {r(band(2000, 6000, y)):6.1f} {r(band(6000, 16000, y)):6.1f}')
print('L/R correlation', round(float(np.corrcoef(x[:, 0], x[:, 1])[0, 1]), 3))
