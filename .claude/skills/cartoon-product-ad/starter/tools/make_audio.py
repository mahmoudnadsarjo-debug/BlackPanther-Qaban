#!/usr/bin/env python3
"""Soundtrack + sound effects for the ad, synthesized from scratch (no samples, no third-party audio),
arranged entirely from plan/beats.json - the same file the picture reads, so a retime moves both.

usage: make_audio.py [out.wav=cache/audio/mix-raw.wav]     then: python3 tools/master_audio.py <raw> <final>
       make_audio.py --list                                 print every sfx recipe and music section kind

plan/beats.json
  "bpm": 120
  "cues":  [{ "id": "drop", "t": 9.5, "sfx": ["impact_big", {"s": "title_slam", "dt": 0.4, "g": 0.8, "pan": -0.2}] }, ...]
           sfx entries are recipe names, or objects with s (recipe), g (gain multiplier), pan (-1..1), dt (seconds after the cue).
           Recipes that lead INTO a moment (riser, reverse_cymbal, cut_hit, cut_whip) end exactly on the cue.
  "audio": { "seed": 1, "root_hz": 73.42,
             "sections": [ {"kind": "drone", "from": 0, "to": 2.5}, {"kind": "sneaky", "from": 2.5, "to": 6},
                           {"kind": "hold", "from": 6, "to": 9.5},  {"kind": "beat", "from": 10, "to": 20, "no_riff_bars": [3], "bell_bars": [5]},
                           {"kind": "outro", "from": 20, "to": 24} ] }

Seeded: the same plan always gives the same file. Nobody hears this while it is made - run tools/audio_report.py,
and tell the owner the mix was measured, not auditioned.
"""
import json, sys, wave
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
TAU = 2 * np.pi
PLAN = json.load(open('plan/beats.json'))
DUR = float(PLAN['duration'])
N = int(SR * DUR)
AUDIO = PLAN.get('audio', {})
rng = np.random.default_rng(int(AUDIO.get('seed', 1)))
BEAT = 60.0 / float(PLAN.get('bpm', 120))                 # seconds per beat
ROOT = float(AUDIO.get('root_hz', 73.42))                 # bass root (73.42 Hz = D2); riffs and plucks follow it

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


def trim(gain):
    """Level trims measured on a real mix: low sources down, mids and highs up, so the track survives a phone speaker."""
    def wrap(fn):
        def inner(*a, **k): return fn(*a, **k) * gain
        inner.__name__ = fn.__name__; return inner
    return wrap
for _name, _g in dict(kick=0.45, bass808=0.5, sub_drop=0.42, thud=0.6, sack=0.8, cowbell=2.6, pluck=2.0, bell=2.2, hat=2.2, clap=1.6,
                      coin=1.6, beep=1.6, tok=1.6, pop=1.5, tick=1.6, whoosh=1.8, shing=1.2, kaching=1.5, zip_=1.6, boing=1.5,
                      fall_whistle=1.4, crash_cymbal=1.4, riser=1.4).items():
    globals()[_name] = trim(_g)(globals()[_name])

def note(semis, octave=3):
    """Pitch `semis` semitones above the root, `octave` octaves up (3 -> riff register, 2 -> pluck register)."""
    return ROOT * 2 ** octave * 2 ** (semis / 12)

# ================================================================= SFX RECIPES
# Each recipe places one or more layers at time t. g scales the tuned default level, pan is -1..1.
RECIPES = {}
def recipe(fn): RECIPES[fn.__name__] = fn; return fn
def both(sig, t, g, pan=0.0, send=0.0):
    sfx.add(sig, t, g, pan)
    if send: wet.add(sig, t, send)

@recipe
def pop_(t, g=1, pan=0):
    """Soft word pop (quiet text entrance)."""
    both(pop(700, 170), t, 0.38 * g, pan)
RECIPES['pop'] = RECIPES.pop('pop_')
@recipe
def pop_low(t, g=1, pan=0):
    """Heavier pop for a keyword."""
    both(thud(150, 60, 0.3, 0.3), t, 0.62 * g, pan); both(pop(520, 120), t, 0.3 * g, pan)
@recipe
def title_slam(t, g=1, pan=0):
    """Title / keyword slam."""
    both(slam(0.35), t, 0.5 * g, pan)
@recipe
def title_slam_big(t, g=1, pan=0):
    """Brand-name slam with a bright glint."""
    both(slam(0.4), t, 0.72 * g, pan); both(shing(0.5), t, 0.16 * g, pan)
@recipe
def glint(t, g=1, pan=0):
    """Metallic glint + sub: eyes opening, a reveal in the dark."""
    s = shing(); both(s, t - 0.004, 0.42 * g, pan, 0.3 * g); both(sub_drop(80, 34, 1.0), t, 0.75 * g)
@recipe
def soft_hit(t, g=1, pan=0):
    """Small low hit for an ordinary cut."""
    both(thud(120, 55, 0.3, 0.3), t, 0.42 * g, pan)
@recipe
def cut_hit(t, g=1, pan=0):
    """Whip that ends ON the cue + a hit: a hard cut into a new scene."""
    both(whoosh(0.22, 500, 6000), t - 0.2, 0.26 * g, pan); both(thud(130, 50, 0.4, 0.4), t, 0.85 * g, pan)
@recipe
def cut_whip(t, g=1, pan=0):
    """Light whip that ends ON the cue."""
    both(whoosh(0.2, 600, 7000), t - 0.17, 0.2 * g, pan)
@recipe
def riser_(t, g=1, pan=0):
    """One-second noise riser that ENDS on the cue."""
    both(riser(0.95), t - 0.95, 0.3 * g, pan)
RECIPES['riser'] = RECIPES.pop('riser_')
@recipe
def reverse_cymbal(t, g=1, pan=0):
    """Reversed cymbal that ENDS on the cue (use right before a drop)."""
    both(fade(crash_cymbal(0.62)[::-1], 0.05, 0.003), t - 0.62, 0.3 * g, pan)
@recipe
def impact_big(t, g=1, pan=0):
    """The one big moment: sub drop + hit + cymbal (product slams in)."""
    both(sub_drop(105, 30, 1.2), t, 1.0 * g); both(thud(160, 45, 0.5, 0.6), t, 0.9 * g)
    c = crash_cymbal(1.5); both(c, t, 0.2 * g, pan, 0.08 * g)
@recipe
def boom_tail(t, g=1, pan=0):
    """Boom with a long cymbal tail (cut to the end card)."""
    both(sub_drop(100, 32, 1.4), t, 0.95 * g); c = crash_cymbal(2.0); both(c, t, 0.22 * g, pan, 0.1 * g)
@recipe
def land(t, g=1, pan=0):
    """Character or object lands."""
    both(thud(120, 50, 0.3, 0.4), t, 0.6 * g, pan)
@recipe
def heavy_thud(t, g=1, pan=0):
    """Heavy sack / box dropped on something solid."""
    both(sack(), t, 0.9 * g, pan)
@recipe
def bump(t, g=1, pan=0):
    """Fist bump / high five."""
    both(thud(170, 60, 0.3, 0.5), t, 0.8 * g, pan); both(clap(), t, 0.5 * g, pan)
@recipe
def tap(t, g=1, pan=0):
    """Knock on a metal body."""
    both(tok(), t, 0.55 * g, pan)
@recipe
def shove(t, g=1, pan=0):
    """Push + slide-whistle fall (object sent flying)."""
    both(whoosh(0.34, 350, 4200, up=False), t - 0.03, 0.42 * g, pan); both(fall_whistle(1250, 330, 0.5), t + 0.02, 0.2 * g, pan)
@recipe
def metal_crash_(t, g=1, pan=0):
    """Metal object hits the floor off screen, bits skitter, a spring twangs."""
    m = metal_crash(); both(m, t, 0.85 * g, pan, 0.22 * g)
    for k, off in enumerate([0.16, 0.27, 0.36, 0.5]): both(tok(0.06) * 0.8, t + off, (0.3 - k * 0.05) * g, pan)
    both(boing(210, 0.55), t + 0.12, 0.22 * g, pan)
RECIPES['metal_crash'] = RECIPES.pop('metal_crash_')
@recipe
def boing_(t, g=1, pan=0):
    """Wobbly spring (something old and unreliable)."""
    both(boing(175), t, 0.3 * g, pan)
RECIPES['boing'] = RECIPES.pop('boing_')
@recipe
def coin_(t, g=1, pan=0):
    """Coin chime."""
    c = coin(1976 * 2 ** (rng.integers(-1, 2) / 12)); both(c, t, 0.3 * g, pan, 0.06 * g)
RECIPES['coin'] = RECIPES.pop('coin_')
@recipe
def coin_away(t, g=1, pan=0):
    """Coin chime + falling whistle: money leaving."""
    both(coin(1976), t, 0.3 * g, pan, 0.06 * g); both(fall_whistle(1700, 600, 0.5), t + 0.1, 0.11 * g, pan)
@recipe
def coins_rain(t, g=1, pan=0):
    """About 1.2 s of coins raining in."""
    for _ in range(15):
        both(coin(1976 * 2 ** (rng.integers(-2, 4) / 12), 0.3), t + 0.05 + rng.uniform(0, 1.15), (0.085 + rng.uniform(0, 0.05)) * g, rng.uniform(-0.7, 0.7))
@recipe
def measure_tick(t, g=1, pan=0):
    """Measure line zips on, label ticks into place."""
    both(zip_(), t, 0.12 * g, pan); both(tick(), t + 0.16, 0.34 * g, pan); both(pop(820, 260, 0.09), t + 0.14, 0.22 * g, pan)
@recipe
def tick_(t, g=1, pan=0):
    """Dry tick (small UI or label event)."""
    both(tick(), t, 0.34 * g, pan)
RECIPES['tick'] = RECIPES.pop('tick_')
@recipe
def beep_(t, g=1, pan=0):
    """Device / keypad beep."""
    both(beep(), t, 0.2 * g, pan)
RECIPES['beep'] = RECIPES.pop('beep_')
@recipe
def beep_keys(t, g=1, pan=0):
    """Three quick key presses."""
    both(beep(), t, 0.2 * g, pan); both(beep(2050, 0.05), t + 0.1, 0.16 * g, pan); both(beep(2050, 0.05), t + 0.2, 0.16 * g, pan)
@recipe
def beep_confirm(t, g=1, pan=0):
    """Two-tone confirm + cash bell: a result locks in."""
    both(beep(2440, 0.06), t, 0.2 * g, pan); both(beep(3080, 0.09), t + 0.09, 0.2 * g, pan)
    k = kaching(); both(k, t + 0.15, 0.3 * g, pan, 0.1 * g)
@recipe
def stamp_(t, g=1, pan=0):
    """Rubber stamp (limited offer, badge)."""
    both(stamp(), t, 0.72 * g, pan)
RECIPES['stamp'] = RECIPES.pop('stamp_')
@recipe
def cta_chime(t, g=1, pan=0):
    """Pop + rising four-note chime (call to action appears)."""
    both(pop(880, 220), t, 0.4 * g, pan)
    for k, semi in enumerate([0, 3, 7, 12]):
        b = bell(note(semi, 4), 0.45); both(b, t + 0.04 + k * 0.07, 0.11 * g, pan, 0.05 * g)
@recipe
def bye_chime(t, g=1, pan=0):
    """Cheeky pop + two bells (punchline caption)."""
    both(pop(900, 240), t, 0.36 * g, pan); both(bell(note(7), 0.3), t + 0.02, 0.14 * g, pan); both(bell(note(12), 0.35), t + 0.14, 0.14 * g, pan)
@recipe
def none(t, g=1, pan=0):
    """Deliberate silence (documented, not forgotten)."""

# ================================================================= MUSIC SECTIONS
SECTIONS = {}
def section(fn): SECTIONS[fn.__name__] = fn; return fn
RIFF_A = [(0, 0), (2, 0), (3, 3), (5, 0), (6, 7), (8, 5), (10, 3), (11, 0), (13, -2), (14, 0)]      # (16th step, semitone)
RIFF_B = [(0, 0), (2, 0), (3, 3), (5, 0), (6, 7), (8, 10), (10, 7), (11, 5), (13, 3), (14, 5)]
ROOT_MOVES = [0, 0, -4, -2]                                                                          # i i VI VII

@section
def drone_(s):
    """Dark held note that swells: hook, tension."""
    d = drone(ROOT, s['to'] - s['from'] + 0.2)
    music.add(fade(d * np.linspace(0.35, 1.0, len(d)), 0.4, 0.15), s['from'], 0.16 * s.get('gain', 1))
SECTIONS['drone'] = SECTIONS.pop('drone_')
@section
def sneaky(s):
    """Tiptoe pizzicato on eighth notes: the problem / mischief."""
    pizz = [0, None, 3, None, 7, None, 6, None, 0, None, 3, None, 7, 10]
    k = 0
    while s['from'] + k * BEAT / 2 < s['to'] - 0.05:
        tk, semi = s['from'] + k * BEAT / 2, pizz[k % len(pizz)]
        if semi is not None:
            p = pluck(note(semi, 2)); music.add(p, tk, 0.26, 0.15); wet.add(p, tk, 0.08)
        if k % 2 == 0: music.add(pluck(ROOT if k % 4 == 0 else ROOT * 1.498, 0.3, 0.3), tk, 0.34)
        music.add(hat(False, 0.6 if k % 2 else 0.35), tk, 0.1, -0.2); k += 1
@section
def hold(s):
    """The music holds its breath: quiet drone + a clock-like tick. Use under a gag so the Foley carries it."""
    d = drone(ROOT, min(2.0, s['to'] - s['from'])); music.add(fade(d, 0.3, 0.3), s['from'], 0.07)
    for k in range(4):
        if s['from'] + k * BEAT < s['to']: music.add(hat(False, 0.5), s['from'] + k * BEAT, 0.07)
@section
def beat(s):
    """Full groove in 4-beat bars from `from`: kick, clap, hats, 808, cowbell riff. no_riff_bars / bell_bars are 1-based."""
    bar, b = 4 * BEAT, 0
    while s['from'] + b * bar < s['to'] - 0.05:
        moves = s.get('roots', ROOT_MOVES)
        tb, root = s['from'] + b * bar, ROOT * 2 ** (moves[b % len(moves)] / 12)
        for off in (0.0, 1.5, 2.0, 3.5): music.add(kick(), tb + off * BEAT, 0.82)
        for off in (1.0, 3.0):
            c = clap(); music.add(c, tb + off * BEAT, 0.4); wet.add(c, tb + off * BEAT, 0.07)
        for k in range(8): music.add(hat(k == 7, [1, .55, .8, .55, 1, .55, .8, .7][k]), tb + k * BEAT / 2, 0.115, 0.25)
        for k in range(3): music.add(hat(False, 0.5 + 0.15 * k), tb + 3.5 * BEAT + (k + 1) * BEAT / 8, 0.085, 0.25)
        for off, ln in ((0.0, 1.4), (1.5, 0.48), (2.0, 1.44), (3.5, 0.48)): music.add(bass808(root, ln * BEAT), tb + off * BEAT, 0.5)
        if (b + 1) not in s.get('no_riff_bars', []):
            for step, semi in (RIFF_B if b % 2 else RIFF_A):
                cb = cowbell(note(semi)); music.add(cb, tb + step * BEAT / 4, 0.2, -0.12); wet.add(cb, tb + step * BEAT / 4, 0.045)
        if (b + 1) in s.get('bell_bars', []):
            for k, semi in enumerate([0, 3, 7, 12, 15, 19, 24, 19]):
                bl = bell(note(semi), 0.4); music.add(bl, tb + (0.5 + k * 0.25) * BEAT, 0.085, 0.3); wet.add(bl, tb + (0.5 + k * 0.25) * BEAT, 0.04)
        b += 1
@section
def outro(s):
    """Half-time under the end card, the riff once more (memory hook), then a clean button one beat before `to`."""
    t0, end = s['from'], s['to'] - BEAT
    for off in (0, 2, 4, 5.5, 6):
        if t0 + off * BEAT < end: music.add(kick(), t0 + off * BEAT, 0.8)
    for off in (2, 6):
        if t0 + off * BEAT < end: music.add(clap(), t0 + off * BEAT, 0.36)
    for off, ln in ((0, 1.9), (2, 1.9), (4, 1.4), (5.5, 0.48), (6, 1.2)):
        if t0 + off * BEAT < end: music.add(bass808(ROOT, ln * BEAT), t0 + off * BEAT, 0.5)
    k = 0
    while t0 + (1 + k * 0.5) * BEAT < end: music.add(hat(False, 0.6 if k % 2 else 0.9), t0 + (1 + k * 0.5) * BEAT, 0.085, 0.25); k += 1
    if t0 + 3 * BEAT + 15 * BEAT / 4 < end + BEAT:
        for step, semi in RIFF_A:
            cb = cowbell(note(semi)); music.add(cb, t0 + 3 * BEAT + step * BEAT / 4, 0.16, -0.12); wet.add(cb, t0 + 3 * BEAT + step * BEAT / 4, 0.04)
    button({'at': end})
@section
def button(s):
    """Single closing hit (kick + clap + riff root). Leave silence after it so the ad loops cleanly."""
    music.add(cowbell(note(0), 0.4), s['at'], 0.24); music.add(kick(), s['at'], 0.85); music.add(clap(), s['at'], 0.4)

if len(sys.argv) > 1 and sys.argv[1] == '--list':
    print('SFX recipes (use in the "sfx" list of a cue):')
    for k in sorted(RECIPES): print(f'  {k:16s} {(RECIPES[k].__doc__ or "").strip()}')
    print()
    print('Music section kinds (use in "audio.sections"):')
    for k in sorted(SECTIONS): print(f'  {k:16s} {(SECTIONS[k].__doc__ or "").strip()}')
    sys.exit(0)

# ================================================================= ARRANGE
for s in AUDIO.get('sections', []):
    if s['kind'] not in SECTIONS: sys.exit(f'unknown section kind "{s["kind"]}". Known: {", ".join(sorted(SECTIONS))}')
    SECTIONS[s['kind']](s)
placed = 0
for c in PLAN['cues']:
    entries = c.get('sfx', [])
    if isinstance(entries, (str, dict)): entries = [entries]
    for e in entries:
        e = {'s': e} if isinstance(e, str) else e
        if e['s'] not in RECIPES: sys.exit(f'cue "{c["id"]}": unknown sfx "{e["s"]}". Run: python3 tools/make_audio.py --list')
        RECIPES[e['s']](c['t'] + float(e.get('dt', 0)), float(e.get('g', 1)), float(e.get('pan', 0))); placed += 1

# ================================================================= MIX
ir_t = tt(0.9); ir = np.stack([noise(len(ir_t)), noise(len(ir_t))], 1) * np.exp(-ir_t / 0.22)[:, None]
ir = np.stack([lp(hp(ir[:, c], 350), 6500) for c in (0, 1)], 1); ir /= np.sqrt((ir ** 2).sum(0)).max()
rev = np.stack([fftconvolve(wet.b[:, c], ir[:, c])[:N] for c in (0, 1)], 1)

# side-chain: the music dips under loud one-shots so impacts read without raising the overall level
envl = np.abs(sfx.b).max(1); k = int(0.012 * SR)
envl = np.convolve(envl, np.ones(k) / k, mode='same')
rel = np.exp(-1 / (0.12 * SR)); env = np.zeros(N); a = 0.0
for i in range(N):
    a = envl[i] if envl[i] > a else a * rel; env[i] = a
duck = 1 - 0.42 * np.clip(env / 0.8, 0, 1)

mix = music.b * duck[:, None] * 0.9 + sfx.b * 0.85 + rev * 0.5
mix[:, 0] = hp(mix[:, 0], 28); mix[:, 1] = hp(mix[:, 1], 28)
mix = np.tanh(mix * 1.25) / np.tanh(1.25)                 # soft limiter, never hard-clips; the drive buys ~1 dB of loudness per dB of peak
tail = int(0.12 * SR); mix[-tail:] *= np.linspace(1, 0, tail)[:, None]
head = int(0.004 * SR); mix[:head] *= np.linspace(0, 1, head)[:, None]
peak = float(np.max(np.abs(mix)))
if peak < 1e-6: sys.exit('the plan produced silence: add "sfx" to cues and/or "audio.sections" to plan/beats.json')
mix *= (10 ** (-1.5 / 20)) / peak
assert np.all(np.isfinite(mix))

out = sys.argv[1] if len(sys.argv) > 1 else 'cache/audio/mix-raw.wav'
import pathlib; pathlib.Path(out).parent.mkdir(parents=True, exist_ok=True)
pcm = np.clip(np.rint(mix * (2 ** 23 - 1)), -2 ** 23, 2 ** 23 - 1).astype('<i4')
raw = np.zeros((N, 2, 3), np.uint8)
for i in range(3): raw[:, :, i] = (pcm >> (8 * i)) & 0xFF
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(3); w.setframerate(SR); w.writeframes(raw.tobytes())
rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
print(f'wrote {out}: {DUR:g} s, {placed} sfx layers from {len(PLAN["cues"])} cues, {len(AUDIO.get("sections", []))} music sections, '
      f'peak {20 * np.log10(np.max(np.abs(mix))):.2f} dBFS, rms {rms(mix):.1f} dB (unmastered - run tools/master_audio.py next)')
