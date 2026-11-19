// Ink engine: seeded maths, splines with hand-drawn jitter, tapered strokes.
// Everything is a pure function of its inputs (no clocks, no Math.random).
export const TAU = Math.PI * 2;
export const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, t) => a + (b - a) * t;
/** Progress 0..1 of t inside [a,b]. */
export const seg = (t, a, b) => clamp((t - a) / (b - a));

export const E = {
  lin: t => t,
  inCubic: t => t * t * t,
  outCubic: t => 1 - (1 - t) ** 3,
  inOutCubic: t => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
  outQuart: t => 1 - (1 - t) ** 4,
  inQuart: t => t ** 4,
  outExpo: t => (t >= 1 ? 1 : 1 - 2 ** (-10 * t)),
  inExpo: t => (t <= 0 ? 0 : 2 ** (10 * t - 10)),
  outBack: (t, s = 1.70158) => 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2,
  inBack: (t, s = 1.70158) => (s + 1) * t ** 3 - s * t ** 2,
  outElastic: t => (t <= 0 ? 0 : t >= 1 ? 1 : 2 ** (-10 * t) * Math.sin(((t * 10 - 0.75) * TAU) / 3) + 1),
  inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  outBounce: t => {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
    return n * (t -= 2.625 / d) * t + 0.984375;
  },
};

/** Integer hash -> [0,1). */
export function hash(i, seed = 0) {
  let h = (Math.floor(i) | 0) ^ Math.imul((Math.floor(seed) | 0) + 0x9e3779b9, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}
/** Smooth 1-D value noise in [0,1]. */
export function vnoise(x, seed = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(hash(i, seed), hash(i + 1, seed), u);
}
/** Signed smooth noise in [-1,1]. */
export const snoise = (x, seed = 0) => vnoise(x, seed) * 2 - 1;

// ---- point helpers --------------------------------------------------------
/** Transform points: scale (s or sx/sy), rotate r (rad), then translate x,y. Keeps corner flags. */
export function tf(pts, { x = 0, y = 0, s = 1, sx = s, sy = s, r = 0 } = {}) {
  const c = Math.cos(r), n = Math.sin(r);
  return pts.map(p => {
    const px = p[0] * sx, py = p[1] * sy;
    return [x + px * c - py * n, y + px * n + py * c, p[2]];
  });
}
/** Right half (top-centre -> bottom-centre, first/last on x=0) -> closed symmetric loop. */
export function mirrorHalf(half) {
  const left = half.slice(1, -1).reverse().map(p => [-p[0], p[1], p[2]]);
  return [...half, ...left];
}
export const flipX = pts => pts.map(p => [-p[0], p[1], p[2]]).reverse();
/** Hand-drawn jitter: each anchor moves by up to amp px, stable for a given seed. */
export function jit(pts, amp, seed) {
  if (!amp) return pts;
  return pts.map((p, i) => [p[0] + (hash(i * 2, seed) - 0.5) * 2 * amp, p[1] + (hash(i * 2 + 1, seed) - 0.5) * 2 * amp, p[2]]);
}
/** Point-wise blend of two same-length point lists (pose morphing). */
export function morph(a, b, t) {
  return a.map((p, i) => [lerp(p[0], b[i][0], t), lerp(p[1], b[i][1], t), p[2]]);
}

// ---- splines ---------------------------------------------------------------
/** Catmull-Rom -> cubic segments. A point flagged 'c' is a sharp corner. */
export function segments(pts, closed = true, k = 1 / 6) {
  const n = pts.length, out = [];
  if (n < 2) return out;
  const get = i => (closed ? pts[((i % n) + n) % n] : pts[clamp(i, 0, n - 1)]);
  const m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    let c1 = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    let c2 = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    if (p1[2] === 'c') c1 = [p1[0] + (p2[0] - p1[0]) / 3, p1[1] + (p2[1] - p1[1]) / 3];
    if (p2[2] === 'c') c2 = [p2[0] - (p2[0] - p1[0]) / 3, p2[1] - (p2[1] - p1[1]) / 3];
    out.push([p1, c1, c2, p2]);
  }
  return out;
}
export function spline(pts, closed = true) {
  const p = new Path2D(), s = segments(pts, closed);
  if (!s.length) return p;
  p.moveTo(s[0][0][0], s[0][0][1]);
  for (const [, c1, c2, p2] of s) p.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], p2[0], p2[1]);
  if (closed) p.closePath();
  return p;
}
/** Sample the spline into a polyline (per = samples per segment). */
export function polyline(pts, closed = false, per = 10) {
  const out = [];
  for (const [p1, c1, c2, p2] of segments(pts, closed)) {
    for (let j = 0; j < per; j++) {
      const t = j / per, u = 1 - t;
      out.push([
        u * u * u * p1[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p2[0],
        u * u * u * p1[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p2[1],
      ]);
    }
  }
  const last = closed ? pts[0] : pts[pts.length - 1];
  out.push([last[0], last[1]]);
  return out;
}
/** Point + tangent angle at u (0..1) along an open spline. */
export function along(pts, u) {
  const pl = polyline(pts, false, 12), n = pl.length - 1;
  const f = clamp(u) * n, i = Math.min(n - 1, Math.floor(f)), t = f - i;
  const a = pl[i], b = pl[i + 1];
  return { x: lerp(a[0], b[0], t), y: lerp(a[1], b[1], t), a: Math.atan2(b[1] - a[1], b[0] - a[0]) };
}

// ---- drawing ---------------------------------------------------------------
export const INK = '#17121f';
/** Filled + outlined shape. inner(ctx) draws cel shading clipped to the shape, before the outline. */
export function blob(ctx, pts, { fill, stroke = INK, lw = 7, closed = true, inner, seed = 0, wob = 0 } = {}) {
  const p = spline(jit(pts, wob, seed), closed);
  if (fill) { ctx.fillStyle = fill; ctx.fill(p); }
  if (inner) { ctx.save(); ctx.clip(p); inner(ctx, p); ctx.restore(); }
  if (stroke && lw > 0) {
    ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.stroke(p);
  }
  return p;
}
/** Uniform ink line along a spline. */
export function line(ctx, pts, { stroke = INK, lw = 5, closed = false, seed = 0, wob = 0, dash } = {}) {
  const p = spline(jit(pts, wob, seed), closed);
  ctx.save();
  ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (dash) ctx.setLineDash(dash);
  ctx.stroke(p);
  ctx.restore();
}
/** Brush stroke with tapered ends (whiskers, hair, speed lines). a/b = end width factors 0..1. */
export function taper(ctx, pts, w, color = INK, { a = 0.08, b = 0.08, pow = 0.8, from = 0, to = 1 } = {}) {
  let pl = polyline(pts, false, 12);
  if (from > 0 || to < 1) {
    const n = pl.length - 1;
    pl = pl.slice(Math.floor(from * n), Math.max(Math.floor(from * n) + 2, Math.ceil(to * n) + 1));
  }
  const n = pl.length;
  if (n < 2) return;
  const L = [], R = [];
  for (let i = 0; i < n; i++) {
    const p0 = pl[Math.max(0, i - 1)], p1 = pl[Math.min(n - 1, i + 1)];
    let dx = p1[0] - p0[0], dy = p1[1] - p0[1];
    const d = Math.hypot(dx, dy) || 1;
    dx /= d; dy /= d;
    const u = i / (n - 1);
    const env = Math.sin(Math.PI * u) ** pow;
    const end = lerp(a, b, u);
    const hw = (w / 2) * (end + (1 - end) * env);
    L.push([pl[i][0] - dy * hw, pl[i][1] + dx * hw]);
    R.push([pl[i][0] + dy * hw, pl[i][1] - dx * hw]);
  }
  ctx.beginPath();
  ctx.moveTo(L[0][0], L[0][1]);
  for (let i = 1; i < n; i++) ctx.lineTo(L[i][0], L[i][1]);
  for (let i = n - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}
/** Clip helper: run fn with ctx clipped to a spline path. */
export function clipTo(ctx, pts, fn, closed = true) {
  ctx.save(); ctx.clip(spline(pts, closed)); fn(ctx); ctx.restore();
}
export function ellipsePts(cx, cy, rx, ry, n = 10, rot = 0) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU, x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    out.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
  }
  return out;
}
/** Rounded quad from 4 corners (any order around the shape), corners kept sharp-ish. */
export const quad = (a, b, c, d) => [[...a, 'c'], [...b, 'c'], [...c, 'c'], [...d, 'c']];
