// PATTERN: emotional payoff - the contact frame IS the first frame, so the impact lands on the cut, then a reward rains in.
// Adapt: clip, contact point (tools/grid.py), copy, what rains (coins here) and where (keep it to the sides, off the faces).
import { cue } from '../data.js';
import { E, lerp, seg, hash } from '../lib/ink.js';
import { line } from '../lib/text.js';
import { slam, shake, punch, flashEnv, topShade, coin, impactLines, sparkle, PAL } from '../lib/fx.js';
import { COPY, cam, plate } from '../lib/shot.js';

function rain(ctx, T, t0) {
  for (let i = 0; i < 16; i++) {
    const d = hash(i, 201) * 0.75, tt = T - t0 - d;
    if (tt <= 0) continue;
    const side = i % 2 ? 1 : -1, x = 540 + side * (385 + hash(i, 202) * 150), r = 26 + hash(i, 203) * 20;
    const y = -80 + 620 * tt + 1500 * tt * tt * 0.5;
    if (y > 2050) continue;
    coin(ctx, x + Math.sin(tt * 5 + i) * 18, y, r, tt * (7 + hash(i, 204) * 6) + i, (hash(i, 205) - 0.5) * 0.6);
  }
}

export async function draw(ctx, t, env) {
  const T = env.T, tb = cue('bump');
  const bmp = await env.clip('v5-payoff', t * 0.95);
  const z = lerp(1.2, 1.0, E.outExpo(seg(T, tb, tb + 0.4))) * lerp(1, 1.04, t / env.dur);
  const sh = shake(T, tb, 26, 0.4, 101);
  cam(ctx, { zoom: z, fx: 0.52, fy: 0.535, dx: sh.x, dy: sh.y }, c => {
    plate(c, bmp);
    const u = seg(T, tb, tb + 0.42);
    if (u > 0 && u < 1) { impactLines(c, 566, 1024, { r0: 110, r1: 430, n: 16, seed: 23, color: PAL.cream, w: 20, u }); sparkle(c, 566, 1024, 120 * (1 - u), PAL.white, u); }
  });
  rain(ctx, T, cue('coins_in'));
  topShade(ctx, 0.66, 620);
  const ts = tb + 0.3;
  line(ctx, [COPY.payoff[0], { t: COPY.payoff[1], fill: PAL.amber }, { t: COPY.payoff[2], fill: PAL.amber }], { x: 540, y: 330, size: 122, fill: PAL.white,
    each: i => { const s = slam(T, ts + i * 0.22, 0.2); return s && { ...s, rot: i === 2 ? 0.02 : -0.01, glow: i === 2 ? 26 : 0 }; } });
  return { flash: flashEnv(T, tb, 0.12) * 0.4, flashColor: '#fff3e0', ca: 2.2 + 8 * flashEnv(T, tb, 0.35), bloom: 0.36 };
}
