// Smoke-test scene: needs no generated assets. It proves fonts, text shaping, the finish chain,
// cue lookups and the renderer all work before any credits are spent. Delete it once real scenes exist.
import { cue } from '../data.js';
import { E, lerp, seg } from '../lib/ink.js';
import { line } from '../lib/text.js';
import { pop, slam, shake, flashEnv, coin, impactLines, PAL } from '../lib/fx.js';
import { COPY, pill } from '../lib/shot.js';

export async function draw(ctx, t, env) {
  const T = env.T, hit = cue('smoke_hit');
  const g = ctx.createRadialGradient(540, 1150, 80, 540, 1150, 1300);
  g.addColorStop(0, '#4b3f7a'); g.addColorStop(1, '#0d0a18');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1080, 1920);
  const sh = shake(T, hit, 24, 0.4, 5);
  ctx.save(); ctx.translate(sh.x, sh.y);
  const u = seg(T, hit, hit + 0.45);
  if (u > 0 && u < 1) impactLines(ctx, 540, 1150, { r0: 190, r1: 640, n: 18, u });
  const drop = E.outBounce(seg(t, 0.15, hit + 0.1 - env.scene.start));
  coin(ctx, 540, lerp(-200, 1150, drop), 150, 0, 0, 1);
  ctx.restore();
  const a = pop(T, cue('smoke_w1'), 0.26), b = slam(T, cue('smoke_w2'), 0.2);
  if (a) line(ctx, [COPY.smoke_line1], { x: 540, y: 330, size: 120, fill: PAL.white, each: () => a });
  if (b) line(ctx, [COPY.smoke_line2], { x: 540, y: 500, size: 150, fill: PAL.amber, glow: 30, each: () => ({ ...b, rot: -0.02 }) });
  pill(ctx, COPY.smoke_pill, 540, 1560, { state: pop(T, cue('smoke_pill'), 0.25) });
  return { flash: flashEnv(T, hit, 0.12) * 0.35, bloom: 0.34 };
}
