// S4+S5 REVEAL & DIMENSIONS (9.5-14.0s, one continuous shot): the new scale slams in, the panther lands on it
// with the brand name, then the three real dimensions draw on.
import { cue } from '../data.js';
import { E, lerp, seg, clamp, INK } from '../lib/ink.js';
import { line } from '../lib/text.js';
import { pop, slam, out, shake, punch, flashEnv, topShade, dust, impactLines, speedLines, PAL } from '../lib/fx.js';
import { COPY, remap, cam, plate, pill } from '../lib/shot.js';

const MAP = [[0, 0.2], [0.62, 0.69], [1.0, 1.06], [1.7, 1.78], [2.5, 2.55], [4.5, 3.0]]; // panther lands at clip 1.06s
const T0 = 9.5;

/** Hand-inked measure bracket from A to B with end ticks; u = draw-on progress. */
function bracket(ctx, ax, ay, bx, by, u, { tick = 26, w = 9 } = {}) {
  if (u <= 0) return;
  const e = E.outCubic(clamp(u)), mx = lerp(ax, bx, 0.5), my = lerp(ay, by, 0.5);
  const x0 = lerp(mx, ax, e), y0 = lerp(my, ay, e), x1 = lerp(mx, bx, e), y1 = lerp(my, by, e); // grows from the middle
  const len = Math.hypot(bx - ax, by - ay), nx = -(by - ay) / len, ny = (bx - ax) / len;
  const path = () => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
    if (e > 0.9) { ctx.moveTo(ax - nx * tick, ay - ny * tick); ctx.lineTo(ax + nx * tick, ay + ny * tick); ctx.moveTo(bx - nx * tick, by - ny * tick); ctx.lineTo(bx + nx * tick, by + ny * tick); } };
  ctx.save(); ctx.lineCap = 'round';
  path(); ctx.strokeStyle = INK; ctx.lineWidth = w + 9; ctx.stroke();
  path(); ctx.strokeStyle = PAL.amber; ctx.lineWidth = w; ctx.stroke();
  ctx.restore();
}
function leader(ctx, ax, ay, bx, by, u) {
  if (u <= 0) return;
  const e = E.outCubic(clamp(u));
  ctx.save(); ctx.lineCap = 'round'; ctx.setLineDash([2, 18]);
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(lerp(ax, bx, e), lerp(ay, by, e));
  ctx.strokeStyle = INK; ctx.lineWidth = 15; ctx.stroke(); ctx.strokeStyle = PAL.cream; ctx.lineWidth = 7; ctx.stroke();
  ctx.setLineDash([]);
  if (e > 0.95) { ctx.beginPath(); ctx.arc(bx, by, 13, 0, Math.PI * 2); ctx.fillStyle = PAL.amber; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.stroke(); }
  ctx.restore();
}

export async function draw(ctx, _t, env) {
  const T = env.T, t = T - T0, tDrop = cue('drop'), tOn = cue('panther_on'), tDims = cue('cut_dims');
  const bmp = await env.clip('v4-jump', remap(t, MAP));
  const z = lerp(1.7, 1.0, E.outExpo(seg(T, tDrop, tDrop + 0.38))) * punch(T, tOn, 0.04, 0.3) * punch(T, tDims, 0.05, 0.3) * lerp(1, 1.03, seg(T, tDims, 14));
  const s1 = shake(T, tDrop + 0.1, 34, 0.5, 31), s2 = shake(T, tOn, 16, 0.3, 32);
  cam(ctx, { zoom: z, fx: 0.5, fy: 0.72, dx: s1.x + s2.x, dy: s1.y + s2.y }, c => {
    plate(c, bmp);
    dust(c, 300, 1700, seg(T, tDrop + 0.1, tDrop + 0.8), { seed: 51, n: 6, size: 60, spread: 250 });
    dust(c, 700, 1690, seg(T, tDrop + 0.14, tDrop + 0.84), { seed: 52, n: 6, size: 54, spread: 230 });
    const ui = seg(T, tDrop + 0.08, tDrop + 0.5);
    if (ui > 0 && ui < 1) impactLines(c, 480, 1640, { r0: 330, r1: 900, n: 22, seed: 13, color: PAL.cream, w: 20, u: ui });
    const ul = seg(T, tOn, tOn + 0.3);
    if (ul > 0 && ul < 1) impactLines(c, 480, 1540, { r0: 250, r1: 520, n: 12, seed: 17, color: PAL.cream, w: 13, u: ul });

    // ---- dimensions (drawn in plate space so they stick to the product) ----
    const d1 = seg(T, cue('dim1'), cue('dim1') + 0.28), d2 = seg(T, cue('dim2'), cue('dim2') + 0.28), d3 = seg(T, cue('dim3'), cue('dim3') + 0.28);
    // pole height: head underside (y~705) down to the platform top (y~1445), bracket set to the right of the rail
    bracket(c, 842, 705, 842, 1445, d1);
    pill(c, COPY.dim_pole, 858, 1040, { size: 50, state: pop(T, cue('dim1') + 0.12, 0.24) });
    // base: front edge = 50 cm, right edge = 40 cm
    bracket(c, 178, 1668, 628, 1708, d2, { tick: 20 });
    bracket(c, 706, 1668, 838, 1500, d2, { tick: 20 });
    leader(c, 250, 1470, 196, 1632, seg(T, cue('dim2') + 0.1, cue('dim2') + 0.35));
    pill(c, COPY.dim_base, 232, 1420, { size: 48, state: pop(T, cue('dim2') + 0.12, 0.24) });
    // back rail
    leader(c, 250, 1120, 350, 1176, d3);
    pill(c, COPY.dim_rail, 206, 1066, { size: 50, fill: PAL.cream, state: pop(T, cue('dim3') + 0.1, 0.24) });
  });
  const uv = seg(T, tDrop, tDrop + 0.2);
  if (uv > 0 && uv < 1) speedLines(ctx, { angle: Math.PI / 2, u: uv, n: 28, seed: 9, color: PAL.cream, w: 12, alpha: 0.7, len: 900 });

  topShade(ctx, 0.62, 560);
  // titles (leave before the dimension labels arrive)
  const k = out(pop(T, cue('title1'), 0.24), T, tDims - 0.12), b = out(slam(T, cue('title2'), 0.2), T, tDims - 0.12);
  if (k) line(ctx, [COPY.kicker], { x: 540, y: 208, size: 68, fill: PAL.white, sw: 14, each: () => k });
  if (b) line(ctx, [COPY.brand_ar], { x: 540, y: 346, size: 158, fill: PAL.amber, glow: 34, each: () => ({ ...b, rot: -0.02 }) });
  const h = pop(T, tDims + 0.05, 0.24);
  if (h) line(ctx, [COPY.dims_head], { x: 540, y: 300, size: 112, fill: PAL.white, each: () => h });

  return { flash: flashEnv(T, tDrop, 0.14) * 0.7 + flashEnv(T, cue('title2'), 0.1) * 0.18 + flashEnv(T, tDims, 0.08) * 0.12, flashColor: '#fff3e0',
    ca: 2.2 + 9 * flashEnv(T, tDrop, 0.4), bloom: 0.34 };
}
