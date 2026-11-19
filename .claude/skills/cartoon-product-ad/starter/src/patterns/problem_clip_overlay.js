// PATTERN: character clip + code-drawn overlay objects that leave on the beat (here: winged coins = money flying away).
// Adapt: clip name, where the objects start (read the plate with tools/grid.py), where they exit, the two headline stages.
// Keep overlay objects out of the headline band; send them off an edge below it.
import { cue } from '../data.js';
import { E, lerp, seg, clamp, hash, taper, INK } from '../lib/ink.js';
import { line } from '../lib/text.js';
import { pop, slam, out, shake, punch, flashEnv, topShade, coin, PAL } from '../lib/fx.js';
import { COPY } from '../lib/shot.js';

function wing(ctx, side, flap) {
  ctx.save(); ctx.scale(side, 1); ctx.rotate(-0.5 + flap * 0.9);
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.bezierCurveTo(30, -70, 110, -80, 135, -30);
  ctx.bezierCurveTo(112, -28, 104, -8, 96, 4);
  ctx.bezierCurveTo(80, -2, 70, 8, 62, 18);
  ctx.bezierCurveTo(44, 8, 20, 14, 0, 0); ctx.closePath();
  ctx.fillStyle = PAL.white; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.restore();
}
function flyingCoin(ctx, T, t0, i) {
  const u = seg(T, t0, t0 + 1.25);
  if (u <= 0 || u >= 1) return;
  const e = E.outCubic(u);
  const x0 = 405, y0 = 1160;                       // the old scale's pan
  const tx = [1190, 1210, 1170][i], ty = [690, 930, 560][i];
  const x = lerp(x0, tx, e) + Math.sin(u * 9 + i) * 26;
  const y = lerp(y0, ty, e) - Math.sin(Math.PI * u) * 150;
  const s = lerp(0.5, 1.1, Math.min(1, u * 4)), a = 1 - seg(u, 0.78, 1);
  const flap = Math.sin(T * 30 + i * 2) * 0.5 + 0.5; // ~5 flaps/s, deterministic in T
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(0.25 - u * 0.2);
  wing(ctx, -1, flap); wing(ctx, 1, flap);
  coin(ctx, 0, 0, 58, 0, 0, 1);
  ctx.restore();
  // little trail ticks
  for (let k = 1; k <= 3; k++) {
    const uk = clamp(u - k * 0.05); if (uk <= 0) continue;
    const ek = E.outCubic(uk), xk = lerp(x0, tx, ek), yk = lerp(y0, ty, ek) - Math.sin(Math.PI * uk) * 150;
    ctx.save(); ctx.globalAlpha = a * (0.5 - k * 0.12);
    taper(ctx, [[xk - 18, yk + 40], [xk, yk + 70], [xk - 8, yk + 104]], 10, PAL.cream); ctx.restore();
  }
}

export async function draw(ctx, t, env) {
  const T = env.T, t0 = cue('cut_problem');
  const bmp = await env.clip('v2-problem', t * 1.0 + 0.15);
  let z = lerp(1.14, 1.0, E.outExpo(seg(T, t0, t0 + 0.45))) * lerp(1.0, 1.05, t / 3.5);
  for (const c of ['coin1', 'coin2', 'coin3']) z *= punch(T, cue(c), 0.025, 0.25);
  const sh = shake(T, t0, 20, 0.35, 5);
  env.cover(ctx, bmp, { zoom: z, fx: 0.45, fy: 0.62, dx: sh.x, dy: sh.y });
  topShade(ctx, 0.62, 700);

  ['coin1', 'coin2', 'coin3'].forEach((c, i) => flyingCoin(ctx, T, cue(c), i));

  const tSwap = cue('prob_line2');
  const a = out(slam(T, cue('prob_title'), 0.2), T, tSwap - 0.16);
  if (a) line(ctx, COPY.problem1.map((w, i) => (i ? { t: w, fill: PAL.amber } : w)), { x: 540, y: 340, size: 164, fill: PAL.white, each: i => ({ ...a, rot: i ? 0.03 : -0.03, dy: i ? 16 : 0 }) });
  const b1 = pop(T, tSwap, 0.24), b2 = slam(T, tSwap + 0.35, 0.2);
  if (b1) line(ctx, [COPY.problem2[0]], { x: 540, y: 290, size: 124, fill: PAL.white, each: () => ({ ...b1, rot: -0.02 }) });
  if (b2) line(ctx, [COPY.problem2[1]], { x: 540, y: 455, size: 132, fill: PAL.amber, glow: 22, each: () => ({ ...b2, rot: 0.02 }) });

  return { flash: flashEnv(T, t0, 0.1) * 0.3, ca: 2.4 + 6 * flashEnv(T, t0, 0.3), bloom: 0.3 };
}
