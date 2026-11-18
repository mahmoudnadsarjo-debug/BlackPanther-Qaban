#!/usr/bin/env python3
"""Original, fully synthesized soundtrack + SFX for the ad (no samples, no third-party audio).
Every hit is placed from plan/beats.json, the same cue file the picture reads, so retiming stays in sync.
Seeded: the same inputs always give the same file.

usage: make_audio.py <out.wav>   (48 kHz stereo float -> PCM24; master with ffmpeg loudnorm afterwards)
"""
import json, sys, wave
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
B = json.load(open('plan/beats.json'))
CUE = {c['id']: c['t'] for c in B['cues']}
DUR = float(B['duration'])
N = int(SR * DUR)
rng = np.random.default_rng(20261118)
TAU = 2 * np.pi

# ---------------------------------------------------------------- helpers
def tt(d): return np.arange(int(SR * d)) / SR
def bp(x, lo, hi, order=2): return sosfilt(butter(order, [lo, hi], fs=SR, btype='bandpass', output='sos'), x)
def lp(x, f, order=2): return sosfilt(butter(order, f, fs=SR, btype='lowpass', output='sos'), x)
def hp(x, f, order=2): return sosfilt(butter(order, f, fs=SR, btype='highpass', output='sos'), x)
def noise(n): return rng.standard_normal(n)
def osc(freq):  # freq = array of Hz per sample -> sine
    return np.sin(TAU * np.cumsum(freq) / SR)
def fade(x, a=0.002, r=0.01):
    n = len(x); e = np.ones(n)
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    e[:na] *= np.linspace(0, 1, na); e[-nr:] *= np.linspace(1, 0, nr)
    return x * e
def norm(x, peak=1.0): return x * (peak / max(1e-9, np.max(np.abs(x))))

class Bus:
    def __init__(self): self.b = np.zeros((N, 2))
    def add(self, sig, t, gain=1.0, pan=0.0):
        """Place sig with its first sample at time t. pan -1..1 (constant power)."""
        i = int(round(t * SR))
        if i >= N or i + len(sig) <= 0: return
        if i < 0: sig = sig[-i:]; i = 0
        sig = sig[: N - i]
        a = (pan + 1) * np.pi / 4
        self.b[i:i + len(sig), 0] += sig * gain * np.cos(a) * 1.414
        self.b[i:i + len(sig), 1] += sig * gain * np.sin(a) * 1.414

music, sfx, wet = Bus(), Bus(), Bus()   # wet = reverb send

# ---------------------------------------------------------------- instruments
def kick(punch=1.0):
    t = tt(0.4); f = 46 + 120 * np.exp(-t / 0.032)
    body = osc(f) * np.exp(-t / 0.17)
    click = hp(noise(len(t)), 2500) * np.exp(-t / 0.0035) * 0.45
    knock = np.sin(TAU * 190 * t) * np.exp(-t / 0.022) * 0.55        # mid 'knock' so the kick reads on small speakers
    return fade(np.tanh(1.7 * punch * (body + click + knock)), 0.0005, 0.03)

def bass808(f0, dur):
    t = tt(dur); f = f0 * (1 + 0.5 * np.exp(-t / 0.02))
    y = osc(f) * np.minimum(1, t / 0.004) * np.exp(-t / (dur * 0.55))
    y = np.tanh(2.6 * y)                       # harmonics so it survives phone speakers
    y = y + 0.55 * osc(f * 2) * np.exp(-t / (dur * 0.4)) + 0.3 * osc(f * 3) * np.exp(-t / (dur * 0.3))   # audible on small speakers
    return fade(lp(y, 1400), 0.002, 0.04)

def clap():
    t = tt(0.32); n = len(t); y = np.zeros(n)
    for k, off in enumerate([0, 0.009, 0.019, 0.03]):
        j = int(off * SR); e = np.zeros(n); e[j:] = np.exp(-t[: n - j] / 0.007)
        y += bp(noise(n), 900, 3600) * e * (0.8 if k < 3 else 1.0)
    y += bp(noise(n), 1100, 2800) * np.exp(-t / 0.085) * 0.45
    return fade(norm(y, 1.0), 0.0005, 0.03)

def hat(open_=False, vel=1.0):
    t = tt(0.3 if open_ else 0.07)
    return fade(hp(noise(len(t)), 7500, 4) * np.exp(-t / (0.085 if open_ else 0.018)) * vel, 0.0005, 0.01)

def cowbell(f, dur=0.24):
    t = tt(dur)
    sq = np.sign(np.sin(TAU * f * t)) + np.sign(np.sin(TAU * f * 1.48 * t))
    y = bp(sq, f * 0.85, min(9000, f * 3.4))
    y = y * (0.55 * np.exp(-t / 0.018) + 0.45 * np.exp(-t / 0.11))
    return fade(np.tanh(1.3 * norm(y)), 0.0005, 0.02)

def pluck(f, dur=0.22, bright=1.0):
    t = tt(dur)
    y = (np.sin(TAU * f * t) + 0.45 * bright * np.sin(TAU * 2 * f * t) + 0.2 * bright * np.sin(TAU * 3 * f * t)) * np.exp(-t / 0.055)
    y += hp(noise(len(t)), 3000) * np.exp(-t / 0.002) * 0.12
    return fade(norm(y), 0.001, 0.02)

def bell(f, dur=0.5):
    t = tt(dur)
    y = np.sin(TAU * f * t) * np.exp(-t / (dur * 0.3)) + 0.4 * np.sin(TAU * f * 2.76 * t) * np.exp(-t / (dur * 0.12)) + 0.2 * np.sin(TAU * f * 5.4 * t) * np.exp(-t / (dur * 0.05))
    return fade(norm(y), 0.001, 0.03)

def drone(f, dur):
    t = tt(dur); y = np.zeros(len(t))
    for det in (-0.006, 0, 0.007):
        ph = TAU * f * (1 + det) * t
        y += sum(np.sin(k * ph) / k for k in range(1, 9))          # soft saw
    y = lp(y, 420) + 0.6 * np.sin(TAU * f / 2 * t)
    return norm(y)

# ---------------------------------------------------------------- sound effects
def pop(f0=780, f1=150, dur=0.11):
    t = tt(dur); f = f1 + (f0 - f1) * np.exp(-t / 0.016)
    y = osc(f) * np.exp(-t / 0.028) + 0.08 * bp(noise(len(t)), 500, 4500) * np.exp(-t / 0.008)
    return fade(norm(y), 0.001, 0.02)

def thud(f0=110, f1=48, dur=0.4, grit=0.3):
    t = tt(dur); f = f1 + (f0 - f1) * np.exp(-t / 0.03)
    y = osc(f) * np.exp(-t / (dur * 0.3)) + grit * lp(noise(len(t)), 900) * np.exp(-t / 0.03)
    return fade(np.tanh(1.5 * norm(y)), 0.001, 0.05)

def slam(dur=0.35):                                    # title hits: thud + short bright smack
    t = tt(dur)
    y = thud(140, 55, dur, 0.35) + 0.35 * bp(noise(len(t)), 1500, 6000) * np.exp(-t / 0.012)
    return norm(y)

def whoosh(dur=0.4, lo=300, hi=5000, up=True):
    t = tt(dur); n = len(t); x = noise(n); y = np.zeros(n)
    for k in range(6):                                 # bank of moving bands = swept filter
        c = lo * (hi / lo) ** ((k + 0.5) / 6)
        pos = (k + 0.5) / 6 if up else 1 - (k + 0.5) / 6
        e = np.exp(-((t / dur - pos) ** 2) / 0.045)
        y += bp(x, c * 0.7, min(c * 1.4, 20000)) * e
    return fade(norm(y) * np.sin(np.pi * t / dur) ** 1.2, 0.01, 0.03)

def riser(dur=1.0):
    t = tt(dur); n = len(t); x = noise(n); y = np.zeros(n)
    for k in range(8):
        c = 500 * (9000 / 500) ** ((k + 0.5) / 8)
        e = np.exp(-((t / dur - (k + 0.5) / 8) ** 2) / 0.03)
        y += bp(x, c * 0.75, min(c * 1.3, 20000)) * e
    tone = osc(180 * (4 ** (t / dur))) * 0.25
    return fade(norm(y + tone) * (t / dur) ** 2.2, 0.02, 0.004)

def shing(dur=0.7):                                    # eyes snap open: bright metallic glint
    t = tt(dur); y = np.zeros(len(t))
    for f, a, d in [(3120, 1, 0.22), (4370, 0.8, 0.18), (5630, 0.6, 0.14), (7410, 0.45, 0.1), (9050, 0.3, 0.07)]:
        y += a * np.sin(TAU * f * t + rng.uniform(0, TAU)) * np.exp(-t / d)
    y += 0.5 * hp(noise(len(t)), 6000) * np.exp(-t / 0.02)
    return fade(norm(y), 0.001, 0.05)

def sub_drop(f0=95, f1=32, dur=1.1):
    t = tt(dur); f = f1 + (f0 - f1) * np.exp(-t / 0.22)
    y = np.tanh(2.2 * osc(f) * np.exp(-t / (dur * 0.42)))
    return fade(y + 0.3 * osc(f * 2) * np.exp(-t / (dur * 0.25)), 0.002, 0.1)

def crash_cymbal(dur=1.6):
    t = tt(dur); y = hp(noise(len(t)), 3500, 2) * np.exp(-t / (dur * 0.28))
    y += 0.5 * bp(noise(len(t)), 900, 3000) * np.exp(-t / 0.06)
    return fade(norm(y), 0.001, 0.2)

def coin(base=1976.0, dur=0.42):                       # classic two-note coin chime
    n1 = int(0.07 * SR); t = tt(dur)
    f = np.where(np.arange(len(t)) < n1, base, base * 1.335)
    y = (osc(f) + 0.3 * np.sign(osc(f)) * 0.5) * np.exp(-t / 0.13)
    return fade(lp(norm(y), 9000), 0.001, 0.03)

def fall_whistle(f0=1500, f1=420, dur=0.45):           # money / scale falling away
    t = tt(dur); f = f0 * (f1 / f0) ** (t / dur) * (1 + 0.012 * np.sin(TAU * 13 * t))
    y = (osc(f) + 0.25 * osc(2 * f)) * np.sin(np.pi * t / dur) ** 0.6
    return fade(norm(y), 0.01, 0.04)

def boing(f=170, dur=0.6):                             # old scale's needle spring
    t = tt(dur); fm = f * (1 + 0.5 * np.exp(-t / 0.2) * np.sin(TAU * 11 * t))
    y = (osc(fm) + 0.4 * osc(2.01 * fm)) * np.exp(-t / 0.18)
    return fade(norm(y), 0.002, 0.05)

def tok(dur=0.09):                                     # paw tapping metal body
    t = tt(dur)
    y = np.sin(TAU * 410 * t) * np.exp(-t / 0.014) + 0.6 * np.sin(TAU * 1130 * t) * np.exp(-t / 0.008) + 0.3 * hp(noise(len(t)), 2500) * np.exp(-t / 0.003)
    return fade(norm(y), 0.0005, 0.02)

def metal_crash(dur=1.1):                              # the old scale hitting the floor
    t = tt(dur); y = np.zeros(len(t))
    for f, a, d in [(311, 1, 0.3), (523, 0.9, 0.42), (811, 0.8, 0.36), (1234, 0.7, 0.3), (1777, 0.6, 0.22), (2411, 0.5, 0.18), (3320, 0.4, 0.12)]:
        y += a * np.sin(TAU * f * (1 + rng.uniform(-0.01, 0.01)) * t + rng.uniform(0, TAU)) * np.exp(-t / d)
    y += 1.2 * bp(noise(len(t)), 400, 7000) * np.exp(-t / 0.05) + thud(120, 50, dur, 0.5)[: len(t)] * 1.3
    return fade(np.tanh(1.4 * norm(y)), 0.0005, 0.1)

def tick(dur=0.05):
    t = tt(dur); return fade(norm(bp(noise(len(t)), 1800, 7000) * np.exp(-t / 0.005)), 0.0005, 0.01)

def zip_(dur=0.16):                                    # measure line drawing on
    t = tt(dur); f = 700 * (4.5 ** (t / dur))
    y = np.sign(osc(f)) * 0.3 + osc(f)
    return fade(lp(norm(y), 6000) * np.sin(np.pi * t / dur) ** 0.8, 0.005, 0.02)

def beep(f=2050, dur=0.075):                           # keypad / indicator beep
    t = tt(dur); y = np.sin(TAU * f * t) + 0.25 * np.sign(np.sin(TAU * f * t))
    return fade(lp(norm(y), 7000), 0.003, 0.012)

def kaching(dur=0.7):                                  # total locks in
    t = tt(dur); y = np.zeros(len(t))
    for f, a, d in [(2637, 1, 0.3), (3951, 0.7, 0.22), (5274, 0.5, 0.16), (7040, 0.3, 0.1)]:
        y += a * np.sin(TAU * f * t) * np.exp(-t / d)
    y += 0.5 * bp(noise(len(t)), 2500, 8000) * np.exp(-t / 0.012)
    return fade(norm(y), 0.001, 0.05)

def sack(dur=0.45):                                    # heavy burlap sack landing
    t = tt(dur)
    y = thud(95, 42, dur, 0.2) * 1.2 + 0.7 * bp(noise(len(t)), 180, 900) * np.exp(-t / 0.045) + 0.25 * bp(noise(len(t)), 1500, 5000) * np.exp(-t / 0.02)
    return fade(np.tanh(1.3 * norm(y)), 0.001, 0.05)

def stamp(dur=0.25):
    t = tt(dur); y = thud(160, 70, dur, 0.4) + 0.6 * bp(noise(len(t)), 700, 4000) * np.exp(-t / 0.018)
    return fade(norm(y), 0.0005, 0.03)

NOTE = lambda semis, base=587.33: base * 2 ** (semis / 12)   # D5 reference

# Balance pass (measured, not guessed): the first mix put ~20 dB more energy below 120 Hz than in the 0.5-6 kHz
# band, which disappears on phone speakers. Low sources come down, melodic/percussive mids and highs come up.
_TRIM = dict(kick=0.45, bass808=0.5, sub_drop=0.42, thud=0.6, sack=0.8, cowbell=2.6, pluck=2.0, bell=2.2, hat=2.2, clap=1.6,
             coin=1.6, beep=1.6, tok=1.6, pop=1.5, tick=1.6, whoosh=1.8, shing=1.2, kaching=1.5, zip_=1.6, boing=1.5,
             fall_whistle=1.4, crash_cymbal=1.4, riser=1.4)
for _name, _g in _TRIM.items():
    globals()[_name] = (lambda f, g: (lambda *a, **k: f(*a, **k) * g))(globals()[_name], _g)

# ================================================================= ARRANGEMENT
# ---- 0.0 - 2.5  hook: darkness, eyes snap open ----------------------------------------------
d = drone(73.42, 2.7)
music.add(fade(d * np.linspace(0.35, 1.0, len(d)), 0.4, 0.15), 0.0, 0.16)
sfx.add(shing(), CUE['eyes_open'] - 0.004, 0.42); wet.add(shing(), CUE['eyes_open'], 0.3)
sfx.add(sub_drop(80, 34, 1.0), CUE['eyes_open'], 0.75)
sfx.add(pop(700, 170), CUE['hook_w1'], 0.38)
sfx.add(thud(150, 60, 0.3, 0.3), CUE['hook_w2'], 0.62); sfx.add(pop(520, 120), CUE['hook_w2'], 0.3)
r = riser(0.95); sfx.add(r, CUE['cut_problem'] - 0.95, 0.3)

# ---- 2.5 - 6.0  problem: sneaky pizzicato groove ---------------------------------------------
t0 = CUE['cut_problem']
sfx.add(thud(130, 50, 0.4, 0.4), t0, 0.85); sfx.add(whoosh(0.22, 500, 6000), t0 - 0.2, 0.26)
sfx.add(slam(0.3), CUE['prob_title'], 0.5)
sfx.add(boing(175), t0 + 0.42, 0.3, -0.25); sfx.add(boing(150, 0.5), t0 + 0.95, 0.22, -0.25)
PIZZ = [0, None, 3, None, 7, None, 6, None, 0, None, 3, None, 7, 10]       # 8ths from the cut (D F A G# | D F A C)
for k, s in enumerate(PIZZ):
    tk = t0 + k * 0.25
    if tk >= 6.0 - 0.05: break
    if s is not None:
        music.add(pluck(NOTE(s, 293.66)), tk, 0.26, 0.15); wet.add(pluck(NOTE(s, 293.66)), tk, 0.08)
    if k % 2 == 0: music.add(pluck(73.42 if k % 4 == 0 else 110.0, 0.3, 0.3), tk, 0.34)   # upright-bass pluck on the beat
    music.add(hat(False, 0.6 if k % 2 else 0.35), tk, 0.1, -0.2)
for i, cid in enumerate(['coin1', 'coin2', 'coin3']):
    sfx.add(coin(1976 * [1, 0.94, 0.89][i]), CUE[cid], 0.3, 0.3); wet.add(coin(1976), CUE[cid], 0.06)
    sfx.add(fall_whistle(1700 - i * 150, 600 - i * 60, 0.5), CUE[cid] + 0.1, 0.11, 0.45)

# ---- 6.0 - 9.5  swipe: the music holds its breath --------------------------------------------
sfx.add(thud(120, 55, 0.3, 0.3), CUE['cut_swipe'], 0.42)
d2 = drone(73.42, 2.0); music.add(fade(d2, 0.3, 0.3), 6.0, 0.07)
for k in range(4): music.add(hat(False, 0.5), 6.0 + k * 0.5, 0.07)                 # a clock-like tick: waiting...
sfx.add(tok(), CUE['tap1'], 0.5, -0.3); sfx.add(tok(), CUE['tap2'], 0.62, -0.3)
sfx.add(whoosh(0.34, 350, 4200, up=False), CUE['shove'] - 0.03, 0.42, -0.35)
sfx.add(fall_whistle(1250, 330, 0.5), CUE['shove'] + 0.02, 0.2, -0.45)
mc = metal_crash(); sfx.add(mc, CUE['crash'], 0.85, -0.45); wet.add(mc, CUE['crash'], 0.22)
for k, off in enumerate([0.16, 0.27, 0.36, 0.5]):                                   # bits skittering across the floor
    sfx.add(tok(0.06) * 0.8, CUE['crash'] + off, 0.3 - k * 0.05, -0.5 + k * 0.1)
sfx.add(boing(210, 0.55), CUE['crash'] + 0.12, 0.22, -0.4)
sfx.add(pop(900, 240), CUE['bye'], 0.36); sfx.add(bell(NOTE(7), 0.3), CUE['bye'] + 0.02, 0.14); sfx.add(bell(NOTE(12), 0.35), CUE['bye'] + 0.14, 0.14)
rv = crash_cymbal(0.62)[::-1]; sfx.add(fade(rv, 0.05, 0.003), CUE['drop'] - 0.62, 0.3)   # reversed cymbal into the drop

# ---- 9.5  DROP + 10.0 - 20.0 full beat ------------------------------------------------------
sfx.add(sub_drop(105, 30, 1.2), CUE['drop'], 1.0); sfx.add(thud(160, 45, 0.5, 0.6), CUE['drop'], 0.9)
cc = crash_cymbal(1.5); sfx.add(cc, CUE['drop'], 0.2); wet.add(cc, CUE['drop'], 0.08)
sfx.add(slam(), CUE['title1'], 0.5)
sfx.add(thud(120, 50, 0.3, 0.4), CUE['panther_on'], 0.6)
sfx.add(slam(0.4), CUE['title2'], 0.72); sfx.add(shing(0.5), CUE['title2'], 0.16)

BAR0, BARLEN, NBARS = 10.0, 2.0, 5
ROOTS = [73.42, 73.42, 58.27, 65.41, 73.42]                                          # D D Bb C D
RIFF_A = [(0, 0), (2, 0), (3, 3), (5, 0), (6, 7), (8, 5), (10, 3), (11, 0), (13, -2), (14, 0)]
RIFF_B = [(0, 0), (2, 0), (3, 3), (5, 0), (6, 7), (8, 10), (10, 7), (11, 5), (13, 3), (14, 5)]
for b in range(NBARS):
    tb = BAR0 + b * BARLEN
    for off in (0.0, 0.75, 1.0, 1.75): music.add(kick(), tb + off, 0.82)
    for off in (0.5, 1.5):
        music.add(clap(), tb + off, 0.4); wet.add(clap(), tb + off, 0.07)
    for k in range(8):
        music.add(hat(k == 7, [1, .55, .8, .55, 1, .55, .8, .7][k]), tb + k * 0.25, 0.115, 0.25)
    for k in range(3): music.add(hat(False, 0.5 + 0.15 * k), tb + 1.75 + (k + 1) * 0.0625, 0.085, 0.25)   # 16th roll into the next bar
    for off, ln in ((0.0, 0.7), (0.75, 0.24), (1.0, 0.72), (1.75, 0.24)): music.add(bass808(ROOTS[b], ln), tb + off, 0.5)
    if b != 2:                                                                          # bar 3 = indicator close-up: leave room for the beeps
        for step, semi in (RIFF_B if b % 2 else RIFF_A):
            cb = cowbell(NOTE(semi)); music.add(cb, tb + step * 0.125, 0.2, -0.12); wet.add(cb, tb + step * 0.125, 0.045)
    if b == 4:                                                                          # payoff bar: bright bell run on top
        for k, semi in enumerate([0, 3, 7, 12, 15, 19, 24, 19]):
            bl = bell(NOTE(semi), 0.4); music.add(bl, tb + 0.25 + k * 0.125, 0.085, 0.3); wet.add(bl, tb + 0.25 + k * 0.125, 0.04)

sfx.add(whoosh(0.2, 600, 7000), CUE['cut_dims'] - 0.17, 0.2)
for cid in ('dim1', 'dim2', 'dim3'):
    sfx.add(zip_(), CUE[cid], 0.12, 0.3); sfx.add(tick(), CUE[cid] + 0.16, 0.34, 0.3); sfx.add(pop(820, 260, 0.09), CUE[cid] + 0.14, 0.22)
sfx.add(whoosh(0.2, 600, 7000), CUE['cut_panel'] - 0.17, 0.2)
sfx.add(beep(), CUE['led1'], 0.2); sfx.add(beep(), CUE['led2'], 0.2); sfx.add(beep(2050, 0.05), CUE['led2'] + 0.1, 0.16); sfx.add(beep(2050, 0.05), CUE['led2'] + 0.2, 0.16)
sfx.add(beep(2440, 0.06), CUE['led3'], 0.2); sfx.add(beep(3080, 0.09), CUE['led3'] + 0.09, 0.2)
kc = kaching(); sfx.add(kc, CUE['led3'] + 0.15, 0.3); wet.add(kc, CUE['led3'] + 0.15, 0.1)
for cid, g in (('cut_load', 0.9), ('load_hit2', 0.8), ('load_hit3', 0.95)): sfx.add(sack(), CUE[cid], g)
sfx.add(thud(170, 60, 0.3, 0.5), CUE['bump'], 0.8); sfx.add(clap(), CUE['bump'], 0.5)
for k in range(15):                                                                    # coins raining in
    tc = CUE['coins_in'] + 0.05 + rng.uniform(0, 1.15)
    sfx.add(coin(1976 * 2 ** (rng.integers(-2, 4) / 12), 0.3), tc, 0.085 + rng.uniform(0, 0.05), rng.uniform(-0.7, 0.7))

# ---- 20.0 - 24.0  end card: big hit, half-time, riff reprise, clean button ending -------------
te = CUE['cut_end']
sfx.add(sub_drop(100, 32, 1.4), te, 0.95); cc2 = crash_cymbal(2.0); sfx.add(cc2, te, 0.22); wet.add(cc2, te, 0.1)
for off in (0.0, 1.0, 2.0, 2.75, 3.0): music.add(kick(), te + off, 0.8)
for off in (1.0, 3.0): music.add(clap(), te + off, 0.36)
for off, ln in ((0.0, 0.95), (1.0, 0.95), (2.0, 0.7), (2.75, 0.24), (3.0, 0.6)): music.add(bass808(73.42, ln), te + off, 0.5)
for k in range(12): music.add(hat(False, 0.6 if k % 2 else 0.9), te + 0.5 + k * 0.25, 0.085, 0.25)
for step, semi in RIFF_A:                                                               # the riff comes back once, quieter = memory hook
    cb = cowbell(NOTE(semi)); music.add(cb, te + 1.5 + step * 0.125, 0.16, -0.12); wet.add(cb, te + 1.5 + step * 0.125, 0.04)
cb = cowbell(NOTE(0), 0.4); music.add(cb, te + 3.5, 0.24); music.add(kick(), te + 3.5, 0.85); music.add(clap(), te + 3.5, 0.4)   # button
sfx.add(slam(0.4), CUE['logo'], 0.7)
sfx.add(stamp(), CUE['limited'], 0.72)
sfx.add(pop(880, 220), CUE['cta'], 0.4)
for k, semi in enumerate([0, 3, 7, 12]):
    bl = bell(NOTE(semi + 12), 0.45); sfx.add(bl, CUE['cta'] + 0.04 + k * 0.07, 0.11); wet.add(bl, CUE['cta'] + 0.04 + k * 0.07, 0.05)

# ================================================================= MIX
ir_t = tt(0.9); ir = np.stack([noise(len(ir_t)), noise(len(ir_t))], 1) * np.exp(-ir_t / 0.22)[:, None]
ir = np.stack([lp(hp(ir[:, c], 350), 6500) for c in (0, 1)], 1); ir /= np.sqrt((ir ** 2).sum(0)).max()
rev = np.stack([fftconvolve(wet.b[:, c], ir[:, c])[:N] for c in (0, 1)], 1)

# gentle side-chain: music dips under the loud one-shots so impacts read without raising the overall level
envl = np.abs(sfx.b).max(1); k = int(0.012 * SR)
envl = np.convolve(envl, np.ones(k) / k, mode='same')
rel = np.exp(-1 / (0.12 * SR)); e = np.zeros(N); a = 0.0
for i in range(N):                                   # peak follower with 120 ms release
    a = envl[i] if envl[i] > a else a * rel; e[i] = a
duck = 1 - 0.42 * np.clip(e / 0.8, 0, 1)

mix = music.b * duck[:, None] * 0.9 + sfx.b * 0.85 + rev * 0.5
mix[:, 0] = hp(mix[:, 0], 28); mix[:, 1] = hp(mix[:, 1], 28)
mix = np.tanh(mix * 0.95) / np.tanh(0.95)            # soft limiter, no hard clipping
tail = int(0.12 * SR); mix[-tail:] *= np.linspace(1, 0, tail)[:, None]
head = int(0.004 * SR); mix[:head] *= np.linspace(0, 1, head)[:, None]
mix *= (10 ** (-1.5 / 20)) / np.max(np.abs(mix))
assert np.all(np.isfinite(mix))

out = sys.argv[1] if len(sys.argv) > 1 else 'cache/audio/mix-raw.wav'
pcm = np.clip(np.rint(mix * (2 ** 23 - 1)), -2 ** 23, 2 ** 23 - 1).astype('<i4')
raw = np.zeros((N, 2, 3), np.uint8)
for bidx in range(3): raw[:, :, bidx] = (pcm >> (8 * bidx)) & 0xFF
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(3); w.setframerate(SR); w.writeframes(raw.tobytes())
rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
print(f'wrote {out}  {DUR}s  peak {20 * np.log10(np.max(np.abs(mix))):.2f} dBFS  rms {rms(mix):.1f} dB  music {rms(music.b):.1f}  sfx {rms(sfx.b):.1f}')
