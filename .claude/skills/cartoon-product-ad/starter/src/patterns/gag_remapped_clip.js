// PATTERN: a physical gag from a start+end-frame clip, time-remapped so each action lands on its cue.
// Worked example: the mascot taps the old product twice, shoves it off the counter, it crashes off screen.
// Adapt: MAP anchors (tools/motion_probe.py on the region where the object sits), tick position, crash corner, caption.
// The off-screen crash is sold by code: shake, dust, debris and sound - the clip only has to show the push.
import { cue } from '../data.js';
import { E, lerp, seg, hash, taper, TAU, INK } from '../lib/ink.js';
import { line } from '../lib/text.js';
import { pop, shake, punch, flashEnv, topShade, dust, sparkle, speedLines, impactLines, PAL } from '../lib/fx.js';
import { COPY, remap, cam, plate } from '../lib/shot.js';

// scene-local time -> clip time; anchors measured from the clip's motion energy (taps at 0.9s / 1.65s, shove 2.96s, scale gone 3.7s)
const MAP = [[0, 0.4], [0.5, 0.9], [1.0, 1.65], [1.5, 2.96], [1.95, 3.7], [3.5, 5.0]];

function debris(ctx, T, t0) {
  const u = seg(T, t0, t0 + 1.1);
  if (u <= 0 || u >= 1) return;
  const g = 2600; // px/s^2
  for (let i = 0; i < 5; i++) {
    const tt = (T - t0), vx = 40 + hash(i, 41) * 170, vy = -(900 + hash(i, 42) * 520);
    const x = 40 + vx * tt, y = 1900 + vy * tt + 0.5 * g * tt * tt, r = hash(i, 43) * TAU + tt * (6 + hash(i, 44) * 10);
    if (y > 1960) continue;
    ctx.save(); ctx.translate(x, y); ctx.rotate(r);
    ctx.lineJoin = 'round'; ctx.lineWidth = 7; ctx.strokeStyle = INK;
    const kind = i % 3;
    if (kind === 0) { // spring
      ctx.beginPath(); for (let k = 0; k <= 8; k++) ctx.lineTo((k % 2 ? 22 : -22), -60 + k * 15);
      ctx.strokeStyle = INK; ctx.lineWidth = 16; ctx.stroke(); ctx.strokeStyle = '#c9c2d6'; ctx.lineWidth = 7; ctx.stroke();
    } else if (kind === 1) { // nut
      ctx.beginPath(); for (let k = 0; k < 6; k++) ctx.lineTo(Math.cos(k / 6 * TAU) * 30, Math.sin(k / 6 * TAU) * 30); ctx.closePath();
      ctx.fillStyle = '#9fb59a'; ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.fillStyle = INK; ctx.fill();
    } else { // dial needle shard
      ctx.beginPath(); ctx.moveTo(-8, 34); ctx.lineTo(8, 34); ctx.lineTo(0, -44); ctx.closePath(); ctx.fillStyle = '#e0483f'; ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }
}

export async function draw(ctx, t, env) {
  const T = env.T, tCrash = cue('crash'), tShove = cue('shove');
  const bmp = await env.clip('v3-swipe', remap(t, MAP));
  const z = lerp(1.06, 1.0, E.outExpo(seg(t, 0, 0.4))) * punch(T, cue('tap1'), 0.025, 0.2) * punch(T, cue('tap2'), 0.035, 0.2) * punch(T, tCrash, 0.07, 0.4);
  const s1 = shake(T, tCrash, 34, 0.5, 11), s2 = shake(T, cue('cut_swipe'), 12, 0.25, 12);
  cam(ctx, { zoom: z, fx: 0.42, fy: 0.62, dx: s1.x + s2.x, dy: s1.y + s2.y }, c => {
    plate(c, bmp);
    for (const id of ['tap1', 'tap2']) { // little "tok" ticks where the paw meets the scale
      const u = seg(T, cue(id), cue(id) + 0.22);
      if (u > 0 && u < 1) impactLines(c, 318, 1300, { r0: 44, r1: 150, n: 7, seed: id === 'tap1' ? 3 : 8, color: PAL.cream, w: 12, u });
    }
  });
  const us = seg(T, tShove, tShove + 0.4);
  if (us > 0 && us < 1) speedLines(ctx, { angle: Math.PI, u: us, n: 22, seed: 6, color: PAL.cream, w: 9, alpha: 0.55, len: 620 });
  // off-screen crash: dust + parts fly up from the lower-left corner
  dust(ctx, 120, 1930, seg(T, tCrash, tCrash + 0.9), { seed: 21, n: 8, size: 110, spread: 360 });
  debris(ctx, T, tCrash);
  const uc = seg(T, tCrash, tCrash + 0.35);
  if (uc > 0 && uc < 1) { impactLines(ctx, 60, 1900, { r0: 160, r1: 620, n: 12, seed: 5, color: PAL.cream, w: 22, u: uc }); sparkle(ctx, 300, 1640, 70 * (1 - uc) + 20, PAL.amber, uc * 2); sparkle(ctx, 150, 1500, 46 * (1 - uc) + 12, PAL.white, -uc * 3); }

  topShade(ctx, 0.6, 640);
  const b = pop(T, cue('bye'), 0.26);
  if (b) line(ctx, [COPY.bye], { x: 540, y: 330, size: 156, fill: PAL.amber, glow: 26, each: () => ({ ...b, rot: -0.04 + Math.sin((T - cue('bye')) * 9) * 0.012 }) });
  return { flash: flashEnv(T, tCrash, 0.12) * 0.32 + flashEnv(T, cue('cut_swipe'), 0.08) * 0.15, ca: 2.2 + 8 * flashEnv(T, tCrash, 0.35), bloom: 0.3 };
}
