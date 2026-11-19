// Seven-segment LED readout drawn as vector segments (crisp at any zoom, animatable digit by digit).
const MAP = { '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc', '5': 'afgcd', '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abfgcd', '-': 'g', ' ': '' };
function segPath(ctx, x, y, len, th, vertical) {
  const h = th / 2;
  ctx.beginPath();
  if (!vertical) { ctx.moveTo(x + h, y); ctx.lineTo(x + th, y - h); ctx.lineTo(x + len - th, y - h); ctx.lineTo(x + len - h, y); ctx.lineTo(x + len - th, y + h); ctx.lineTo(x + th, y + h); }
  else { ctx.moveTo(x, y + h); ctx.lineTo(x + h, y + th); ctx.lineTo(x + h, y + len - th); ctx.lineTo(x, y + len - h); ctx.lineTo(x - h, y + len - th); ctx.lineTo(x - h, y + th); }
  ctx.closePath();
}
/**
 * Draw str right-aligned so its right edge is at (x,y = vertical centre). h = digit height.
 * Unlit segments stay faintly visible like a real LED window.
 */
export function seg7(ctx, str, x, y, h, { color = '#ff3b30', off = 'rgba(255,60,48,0.10)', glow = 0.9, skew = -0.1, gap = 0.26 } = {}) {
  const w = h * 0.52, th = h * 0.13, adv = w + h * gap;
  ctx.save(); ctx.translate(x, y); ctx.transform(1, 0, skew, 1, 0, 0);
  let cx = 0;
  const chars = [...str].reverse();
  for (const ch of chars) {
    if (ch === '.') { // decimal point: its own narrow cell at the baseline
      cx -= h * 0.2;
      ctx.beginPath(); ctx.arc(cx + h * 0.02, h / 2 - th * 0.2, th * 0.85, 0, Math.PI * 2);
      ctx.fillStyle = color; if (glow) { ctx.shadowColor = color; ctx.shadowBlur = h * 0.22 * glow; } ctx.fill(); ctx.shadowBlur = 0;
      continue;
    }
    cx -= adv;
    const on = MAP[ch] ?? '', x0 = cx, top = -h / 2, mid = 0, bot = h / 2, half = h / 2;
    const segs = { a: [x0, top, w, false], g: [x0, mid, w, false], d: [x0, bot, w, false], f: [x0, top, half, true], b: [x0 + w, top, half, true], e: [x0, mid, half, true], c: [x0 + w, mid, half, true] };
    for (const k of 'abcdefg') {
      const [sx, sy, len, vert] = segs[k];
      segPath(ctx, sx, sy, len, th, vert);
      if (on.includes(k)) { ctx.fillStyle = color; if (glow) { ctx.shadowColor = color; ctx.shadowBlur = h * 0.22 * glow; } ctx.fill(); ctx.shadowBlur = 0; }
      else if (off) { ctx.fillStyle = off; ctx.fill(); }
    }
  }
  ctx.restore();
}
