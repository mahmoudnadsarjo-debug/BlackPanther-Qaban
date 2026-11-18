// S7 LOAD (16.0-18.0s): three thuds, each cut wider - sack, stack, and the panther lounging on top.
import { cue } from '../data.js';
import { E, lerp, seg } from '../lib/ink.js';
import { line } from '../lib/text.js';
import { pop, slam, shake, flashEnv, topShade, dust, PAL } from '../lib/fx.js';
import { COPY, KEY, cam, plate } from '../lib/shot.js';

const STEPS = [ { z: 1.62, fy: 1.0 }, { z: 1.27, fy: 1.0 }, { z: 1.03, fy: 1.0 } ]; // visible plate = bottom 62% -> 79% -> all

export async function draw(ctx, t, env) {
  const T = env.T, hits = [cue('cut_load'), cue('load_hit2'), cue('load_hit3')];
  const k = T >= hits[2] ? 2 : T >= hits[1] ? 1 : 0, th = hits[k], st = STEPS[k];
  const bmp = k === 2 ? await env.clip('v6-load', Math.min(2.9, T - hits[2])) : await env.img(KEY('k5-load'));
  const settle = E.outExpo(seg(T, th, th + 0.3));
  const z = st.z * lerp(1.1, 1.0, settle) * lerp(1, 1.025, seg(T, th, th + 1));
  const sh = shake(T, th, [22, 26, 30][k], 0.35, 70 + k);
  cam(ctx, { zoom: z, fx: 0.44, fy: st.fy, dx: sh.x, dy: sh.y + lerp(44, 0, settle) }, c => {
    plate(c, bmp);
    dust(c, 170, 1700, seg(T, th, th + 0.6), { seed: 81 + k, n: 5, size: 34, spread: 150 });
    dust(c, 760, 1690, seg(T, th + 0.03, th + 0.63), { seed: 91 + k, n: 5, size: 32, spread: 140 });
  });
  topShade(ctx, 0.72, 640);
  const a = pop(T, hits[0] + 0.08, 0.24), b = slam(T, hits[2] + 0.05, 0.2);
  if (a) line(ctx, [COPY.load_head[0]], { x: 540, y: 236, size: 94, fill: PAL.white, each: () => a });
  if (b) line(ctx, [COPY.load_head[1]], { x: 540, y: 374, size: 128, fill: PAL.amber, glow: 26, each: () => ({ ...b, rot: -0.02 }) });
  return { flash: flashEnv(T, hits[0], 0.08) * 0.15, ca: 2.2 + 6 * flashEnv(T, th, 0.25), bloom: 0.32 };
}
