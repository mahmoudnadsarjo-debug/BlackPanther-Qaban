// Small animation + drawn-effect helpers shared by the scenes. All pure functions of time/seeds.
import { E, seg, lerp, clamp, hash, snoise, TAU, taper, INK } from './ink.js';

export const PAL = {
  ink: INK, night: '#0d0a18', indigo: '#1b1636', lav: '#b9b0d8', cream: '#ffeccb', white: '#fff7ee',
  amber: '#ffd23a', amberDeep: '#e39a00', red: '#ff3b30', pink: '#f4c9e4', green: '#4caf50',
};

/** Word slams in from big with a squash on landing. Returns {scale|sx|sy, alpha} or null before t0. */
export function slam(t, t0, d = 0.2) {
  if (t < t0) return null;
  const u = seg(t, t0, t0 + d), v = seg(t, t0 + d, t0 + d + 0.18);
  const s = lerp(2.3, 1, E.outExpo(u));
  const sq = Math.sin(Math.PI * v) * (1 - v) * 0.16;
  return { sx: s * (1 + sq), sy: s * (1 - sq), alpha: Math.min(1, u * 5) };
}
/** Pop from zero with overshoot. */
export function pop(t, t0, d = 0.28) {
  if (t < t0) return null;
  const u = seg(t, t0, t0 + d);
  return { scale: Math.max(0.001, E.outBack(u, 2.2)), alpha: Math.min(1, u * 4) };
}
/** Exit: quick shrink + fade starting at t1. Multiplies an existing state. */
export function out(state, t, t1, d = 0.14) {
  if (!state || t < t1) return state;
  const u = seg(t, t1, t1 + d);
  if (u >= 1) return null;
  const k = 1 - E.inCubic(u);
  return { ...state, scale: (state.scale ?? 1) * (0.7 + 0.3 * k), sx: state.sx && state.sx * k, sy: state.sy && state.sy * k, alpha: (state.alpha ?? 1) * k };
}
/** Decaying camera shake offset. */
export function shake(t, t0, amp = 22, dur = 0.4, seed = 1) {
  if (t < t0 || t > t0 + dur) return { x: 0, y: 0 };
  const u = (t - t0) / dur, k = (1 - u) ** 2 * amp, f = Math.floor((t - t0) * 30); // stepped per frame = hand-shot feel
  return { x: (hash(f, seed) - 0.5) * 2 * k, y: (hash(f, seed + 7) - 0.5) * 2 * k };
}
/** Zoom punch: jumps to 1+amt at t0 and settles back. */
export function punch(t, t0, amt = 0.06, dur = 0.35) {
  if (t < t0 || t > t0 + dur) return 1;
  return 1 + amt * (1 - E.outCubic((t - t0) / dur));
}
/** Flash envelope 1 -> 0. */
export const flashEnv = (t, t0, dur = 0.16) => (t < t0 || t > t0 + dur ? 0 : (1 - (t - t0) / dur) ** 2);

/** Dark gradient behind headline area so text always reads (top of frame). */
export function topShade(ctx, a = 0.75, h = 760) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, `rgba(13,10,24,${a})`); g.addColorStop(0.55, `rgba(13,10,24,${a * 0.55})`); g.addColorStop(1, 'rgba(13,10,24,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1080, h);
}
export function bottomShade(ctx, a = 0.7, h = 620) {
  const g = ctx.createLinearGradient(0, 1920 - h, 0, 1920);
  g.addColorStop(0, 'rgba(13,10,24,0)'); g.addColorStop(1, `rgba(13,10,24,${a})`);
  ctx.fillStyle = g; ctx.fillRect(0, 1920 - h, 1080, h);
}

/** Radial hand-inked impact lines around (cx,cy). u = 0..1 life. */
export function impactLines(ctx, cx, cy, { r0 = 120, r1 = 420, n = 18, seed = 3, color = PAL.cream, w = 16, u = 0.5 } = {}) {
  const grow = E.outCubic(clamp(u * 1.6)), fade = 1 - clamp((u - 0.45) / 0.55);
  if (fade <= 0) return;
  ctx.save(); ctx.globalAlpha *= fade;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + (hash(i, seed) - 0.5) * 0.25;
    const ra = r0 * (0.9 + hash(i, seed + 1) * 0.5) + (r1 - r0) * 0.25 * grow;
    const rb = ra + (r1 - r0) * (0.35 + hash(i, seed + 2) * 0.65) * grow;
    taper(ctx, [[cx + Math.cos(a) * ra, cy + Math.sin(a) * ra], [cx + Math.cos(a) * (ra + rb) / 2, cy + Math.sin(a) * (ra + rb) / 2], [cx + Math.cos(a) * rb, cy + Math.sin(a) * rb]],
      w * (0.5 + hash(i, seed + 3) * 0.8), color, { a: 0.9, b: 0.02, pow: 0.4 });
  }
  ctx.restore();
}
/** Parallel speed lines (for whips / falls). angle in rad; u 0..1. */
export function speedLines(ctx, { angle = 0, n = 26, seed = 5, color = PAL.cream, u = 0.5, len = 700, w = 10, alpha = 0.8 } = {}) {
  ctx.save(); ctx.globalAlpha *= alpha * Math.sin(Math.PI * clamp(u));
  ctx.translate(540, 960); ctx.rotate(angle);
  for (let i = 0; i < n; i++) {
    const y = (hash(i, seed) - 0.5) * 2400, l = len * (0.4 + hash(i, seed + 1)), x = (hash(i, seed + 2) - 0.5) * 2200 + (u - 0.5) * 1800;
    taper(ctx, [[x, y], [x + l / 2, y], [x + l, y]], w * (0.4 + hash(i, seed + 3)), color, { a: 0.05, b: 0.05 });
  }
  ctx.restore();
}
/** Flat cel-shaded coin with ink outline. spin = rotation phase (controls apparent width). */
export function coin(ctx, x, y, r, spin = 0, tilt = 0, alpha = 1) {
  const sx = Math.max(0.16, Math.abs(Math.cos(spin)));
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.rotate(tilt); ctx.scale(sx, 1);
  ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = PAL.amber; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.beginPath(); ctx.arc(r * 0.35, r * 0.4, r * 1.05, 0, TAU); ctx.fillStyle = PAL.amberDeep; ctx.globalCompositeOperation = 'source-atop';
  ctx.globalAlpha *= 0.55; ctx.fill('evenodd'); ctx.restore();
  ctx.beginPath(); ctx.arc(0, 0, r * 0.62, 0, TAU); ctx.strokeStyle = 'rgba(120,70,0,.55)'; ctx.lineWidth = r * 0.1 / sx; ctx.stroke();
  ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.34, r * 0.16, 0, TAU); ctx.fillStyle = PAL.white; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.strokeStyle = PAL.ink; ctx.lineWidth = 7; ctx.stroke();
  ctx.restore();
}
/** Dust puff cluster. u 0..1. */
export function dust(ctx, x, y, u, { seed = 9, n = 7, size = 70, color = '#cfc6e6', spread = 220 } = {}) {
  if (u <= 0 || u >= 1) return;
  const e = E.outCubic(u), fade = 1 - E.inCubic(u);
  ctx.save(); ctx.globalAlpha *= fade * 0.5; ctx.filter = 'blur(5px)';
  for (let i = 0; i < n; i++) {
    const a = Math.PI + (i / (n - 1)) * Math.PI + (hash(i, seed) - 0.5) * 0.4; // upper half fan
    const d = spread * e * (0.5 + hash(i, seed + 1) * 0.6), r = size * (0.5 + hash(i, seed + 2) * 0.7) * (0.6 + 0.6 * e);
    ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.55, r, 0, TAU);
    ctx.fillStyle = color; ctx.fill();
  }
  ctx.restore();
}
/** 4-point comic sparkle. */
export function sparkle(ctx, x, y, r, color = PAL.white, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath();
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU, rr = i % 2 ? r * 0.22 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = PAL.ink; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.restore();
}
