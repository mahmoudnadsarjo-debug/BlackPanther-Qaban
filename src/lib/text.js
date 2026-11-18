// Arabic kinetic type. Shaping is done by the browser (HarfBuzz); we only lay words out right-to-left
// so each word can animate on its own. All sizes are design px (1080 x 1920 space).
import { INK } from './ink.js';

export const FONT = { head: 'Almarai', alt: 'Tajawal' };
export const fontStr = (size, weight = 800, family = FONT.head) => `${weight} ${size}px "${family}", "Almarai", sans-serif`;

/**
 * Draw one styled text run centred at (0,0) of the current transform.
 * Style = comic lettering: offset block shadow, thick ink outline, flat fill.
 */
export function label(ctx, str, { size = 96, weight = 800, family = FONT.head, fill = '#fff', stroke = INK, sw = size * 0.2,
  shadow = size * 0.07, shadowColor = INK, glow = 0, glowColor = '#ffd23a', align = 'center', alpha = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.font = fontStr(size, weight, family);
  ctx.direction = 'rtl'; ctx.textAlign = align; ctx.textBaseline = 'middle';
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
export function measure(ctx, str, size, weight = 800, family = FONT.head) {
  ctx.save(); ctx.font = fontStr(size, weight, family); ctx.direction = 'rtl';
  const w = ctx.measureText(str).width; ctx.restore();
  return w;
}

/**
 * Lay a line of words out RTL around centre x and call per-word style/animation.
 * words: array of strings or {t, fill, size} objects (logical order = reading order).
 * each(i, word) -> { scale, dy, dx, rot, alpha, ...style overrides }  (return null to hide the word)
 */
export function line(ctx, words, { x = 540, y = 400, size = 96, gap, weight = 800, family = FONT.head, maxW = 940, each = () => ({}), ...style } = {}) {
  let items = words.map(w => (typeof w === 'string' ? { t: w } : w));
  const layout = sz => {
    const g = gap ?? sz * 0.3, ws = items.map(w => measure(ctx, w.t, (w.size || size) * (sz / size), w.weight || weight, w.family || family));
    return { g, ws, total: ws.reduce((a, b) => a + b, 0) + g * (items.length - 1) };
  };
  let L = layout(size);
  if (L.total > maxW) { // shrink to the safe width instead of clipping
    const k = maxW / L.total; items = items.map(w => ({ ...w, size: (w.size || size) * k })); size *= k; L = layout(size);
  }
  const widths = L.ws, total = L.total; gap = L.g;
  let right = x + total / 2;
  items.forEach((w, i) => {
    const cx = right - widths[i] / 2;
    right -= widths[i] + gap;
    const a = each(i, w) || null;
    if (!a || a.alpha === 0) return;
    const { scale = 1, sx = scale, sy = scale, dx = 0, dy = 0, rot = 0, alpha = 1, ...over } = a;
    ctx.save();
    ctx.translate(cx + dx, y + dy); ctx.rotate(rot); ctx.scale(sx, sy);
    label(ctx, w.t, { size: w.size || size, weight: w.weight || weight, family: w.family || family, ...style, ...(w.fill ? { fill: w.fill } : {}), ...over, alpha });
    ctx.restore();
  });
  return total;
}
