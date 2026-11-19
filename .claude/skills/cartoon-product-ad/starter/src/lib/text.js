// Kinetic lettering. The browser shapes the text (so Arabic joins correctly); this module only lays words
// out along the reading direction so each word can animate on its own. Sizes are design px (1080 x 1920).
import { INK } from './ink.js';
import { DEFAULT_FAMILY, DEFAULT_DIR } from '../fonts.js';

export const fontStr = (size, weight = 800, family = DEFAULT_FAMILY) => `${weight} ${size}px "${family}", sans-serif`;

/**
 * One styled run centred on (0,0) of the current transform.
 * Look = comic lettering: offset ink block shadow, thick ink outline, flat fill, optional glow.
 */
export function label(ctx, str, { size = 96, weight = 800, family = DEFAULT_FAMILY, dir = DEFAULT_DIR, fill = '#fff', stroke = INK, sw = size * 0.2,
  shadow = size * 0.07, shadowColor = INK, glow = 0, glowColor = '#ffd23a', align = 'center', alpha = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.font = fontStr(size, weight, family);
  ctx.direction = dir; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.miterLimit = 2;
  if (shadow) {
    ctx.fillStyle = shadowColor; ctx.strokeStyle = shadowColor; ctx.lineWidth = sw;
    if (sw) ctx.strokeText(str, shadow, shadow * 1.25);
    ctx.fillText(str, shadow, shadow * 1.25);
  }
  if (sw) { ctx.strokeStyle = stroke; ctx.lineWidth = sw; ctx.strokeText(str, 0, 0); }
  if (glow) { ctx.shadowColor = glowColor; ctx.shadowBlur = glow; }
  ctx.fillStyle = fill; ctx.fillText(str, 0, 0);
  ctx.restore();
}

/** Width of a run in design px. */
export function measure(ctx, str, size, weight = 800, family = DEFAULT_FAMILY, dir = DEFAULT_DIR) {
  ctx.save(); ctx.font = fontStr(size, weight, family); ctx.direction = dir;
  const w = ctx.measureText(str).width; ctx.restore();
  return w;
}

/**
 * A line of words centred on x. words = strings or { t, fill, size, weight, family } in reading order.
 * each(i, word) returns that word's animation state { scale | sx, sy, dx, dy, rot, alpha, ...style overrides },
 * or null to hide it. If the line is wider than maxW it shrinks to fit - a headline must never clip at the frame edge.
 */
export function line(ctx, words, { x = 540, y = 400, size = 96, gap, weight = 800, family = DEFAULT_FAMILY, dir = DEFAULT_DIR, maxW = 940, each = () => ({}), ...style } = {}) {
  let items = words.map(w => (typeof w === 'string' ? { t: w } : w));
  const layout = sz => {
    const g = gap ?? sz * 0.3;
    const ws = items.map(w => measure(ctx, w.t, (w.size || size) * (sz / size), w.weight || weight, w.family || family, dir));
    return { g, ws, total: ws.reduce((a, b) => a + b, 0) + g * (items.length - 1) };
  };
  let L = layout(size);
  if (L.total > maxW) {
    const k = maxW / L.total;
    items = items.map(w => ({ ...w, size: (w.size || size) * k })); size *= k; L = layout(size);
  }
  const sign = dir === 'rtl' ? -1 : 1;                  // rtl: first word sits at the right edge
  let edge = x - sign * L.total / 2;
  items.forEach((w, i) => {
    const cx = edge + sign * L.ws[i] / 2;
    edge += sign * (L.ws[i] + L.g);
    const a = each(i, w) || null;
    if (!a || a.alpha === 0) return;
    const { scale = 1, sx = scale, sy = scale, dx = 0, dy = 0, rot = 0, alpha = 1, ...over } = a;
    ctx.save();
    ctx.translate(cx + dx, y + dy); ctx.rotate(rot); ctx.scale(sx, sy);
    label(ctx, w.t, { size: w.size || size, weight: w.weight || weight, family: w.family || family, dir, ...style, ...(w.fill ? { fill: w.fill } : {}), ...over, alpha });
    ctx.restore();
  });
  return L.total;
}
