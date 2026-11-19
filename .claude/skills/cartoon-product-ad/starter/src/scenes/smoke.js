// Smoke-test scene. It exercises every part of the pipeline with no generated art: fonts and text shaping,
// a plate through the camera, cue lookups, drawn effects, a callout pill and the finish chain.
// When it renders and sounds right, the machine is ready. Remove it from plan/beats.json once real scenes exist.
import { cue } from '../data.js';
import { E, lerp, seg } from '../lib/ink.js';
import { line } from '../lib/text.js';
import { pop, slam, shake, punch, flashEnv, topShade, coin, impactLines, bracket, PAL } from '../lib/fx.js';
import { COPY, KEY, cam, plate, pill } from '../lib/shot.js';

export async function draw(ctx, t, env) {
  const T = env.T, hit = cue('smoke_hit');
  const bmp = await env.img(KEY('smoke'));                          // assets/ai/keys/smoke.png (a grey-box placeholder)
  const sh = shake(T, hit, 24, 0.4, 5);
  cam(ctx, { zoom: lerp(1.08, 1.02, t / env.dur) * punch(T, hit, 0.06, 0.35), fx: 0.5, fy: 0.66, dx: sh.x, dy: sh.y }, c => {
    plate(c, bmp);
    const u = seg(T, hit, hit + 0.45);
    if (u > 0 && u < 1) impactLines(c, 540, 1270, { r0: 240, r1: 700, n: 18, u });
    coin(c, 540, lerp(-200, 900, E.outBounce(seg(T, 0.15, hit + 0.1))), 110);
    bracket(c, 800, 960, 800, 1574, seg(T, cue('smoke_pill'), cue('smoke_pill') + 0.3));   // drawn inside cam(): glued to the plate
    pill(c, COPY.smoke_pill, 936, 1270, { size: 44, anchor: 'right', state: pop(T, cue('smoke_pill') + 0.1, 0.25) });
  });
  topShade(ctx, 0.6, 620);
  const a = pop(T, cue('smoke_w1'), 0.26), b = slam(T, cue('smoke_w2'), 0.2);
  if (a) line(ctx, [COPY.smoke_line1], { x: 540, y: 300, size: 120, fill: PAL.white, each: () => a });
  if (b) line(ctx, [COPY.smoke_line2], { x: 540, y: 470, size: 150, fill: PAL.amber, glow: 30, each: () => ({ ...b, rot: -0.02 }) });
  return { flash: flashEnv(T, hit, 0.12) * 0.35, bloom: 0.34 };
}
