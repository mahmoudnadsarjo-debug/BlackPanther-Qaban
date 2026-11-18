// S1 HOOK (0-2.5s): eyes in the dark -> snap open. "There's a thief in your shop..."
import { cue } from '../data.js';
import { E, lerp, seg } from '../lib/ink.js';
import { line } from '../lib/text.js';
import { pop, slam, shake, punch, flashEnv, topShade, PAL } from '../lib/fx.js';
import { COPY, remap } from '../lib/shot.js';

export async function draw(ctx, t, env) {
  const T = env.T, tOpen = cue('eyes_open');
  // clip: eyes close fully at ~1.25s and snap open at 1.417s; align that snap to the cue, then ease to 0.7x
  const tc = remap(t, [[0, 1.417 - tOpen], [tOpen + 0.2, 1.617], [2.5, 3.0]]);
  const bmp = await env.clip('v1-eyes-k4', tc);
  const z = lerp(1.0, 1.1, E.inOutSine(t / 2.5)) * punch(T, tOpen, 0.08, 0.45);
  const sh = shake(T, tOpen, 16, 0.32, 3);
  env.cover(ctx, bmp, { zoom: z, fx: 0.5, fy: 0.66, dx: sh.x, dy: sh.y });
  topShade(ctx, 0.5, 680);

  const w1 = pop(T, cue('hook_w1'), 0.26), w2 = slam(T, cue('hook_w2'), 0.2);
  if (w1) { ctx.save(); line(ctx, [COPY.hook[0]], { x: 540, y: 330, size: 150, fill: PAL.white, each: () => ({ ...w1, rot: -0.035 }) }); ctx.restore(); }
  if (w2) line(ctx, [COPY.hook[1]], { x: 540, y: 520, size: 188, fill: PAL.amber, glow: 34, each: () => ({ ...w2, rot: 0.02 }) });

  const open = seg(T, tOpen, tOpen + 0.5);
  return { flash: flashEnv(T, tOpen, 0.14) * 0.3, flashColor: '#ffd98a', bloom: lerp(0.2, 0.42, open), ca: 2.2 + 5 * flashEnv(T, tOpen, 0.3), vig: 0.6 };
}
