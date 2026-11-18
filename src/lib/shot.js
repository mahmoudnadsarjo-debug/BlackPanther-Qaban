// Helpers shared by scene files: plates (stills / extracted clips), time remapping, copy.
import COPY from '../../plan/copy.json' with { type: 'json' };
import { clamp, lerp } from './ink.js';
export { COPY };
export const KEY = n => `/assets/ai/keys/${n}.png`;

/** Piecewise-linear remap scene time -> clip time. pairs = [[sceneT, clipT], ...] ascending. */
export function remap(t, pairs) {
  if (t <= pairs[0][0]) return pairs[0][1];
  for (let i = 1; i < pairs.length; i++) {
    const [a, ca] = pairs[i - 1], [b, cb] = pairs[i];
    if (t <= b) return lerp(ca, cb, clamp((t - a) / (b - a)));
  }
  return pairs[pairs.length - 1][1];
}
/** Rounded-rect path. */
export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

/**
 * Camera wrapper: everything drawn inside fn uses 1080x1920 design coordinates that stay glued to a
 * cover-fitted plate. zoom scales about the focus point (fx,fy as 0..1 of the frame); rot in rad.
 */
export function cam(ctx, { zoom = 1, fx = 0.5, fy = 0.5, dx = 0, dy = 0, rot = 0 } = {}, fn) {
  const px = fx * 1080, py = fy * 1920;
  ctx.save();
  ctx.translate(px + dx, py + dy); ctx.rotate(rot); ctx.scale(zoom, zoom); ctx.translate(-px, -py);
  fn(ctx);
  ctx.restore();
}
/** Draw a bitmap cover-fitted at zoom 1 (use inside cam()). */
export function plate(ctx, bmp) {
  const s = Math.max(1080 / bmp.width, 1920 / bmp.height), w = bmp.width * s, h = bmp.height * s;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bmp, (1080 - w * 1.14) / 2, (1920 - h * 1.14) / 2, w * 1.14, h * 1.14); // underlay: covers any edge a shake exposes
  ctx.drawImage(bmp, (1080 - w) / 2, (1920 - h) / 2, w, h);
}
/** Amber pill label with ink outline, text centred. Returns nothing; scale/alpha come from the caller's state. */
export function pill(ctx, text, x, y, { size = 58, padX = 34, padY = 20, fill = '#ffd23a', color = '#17121f', state = { scale: 1, alpha: 1 }, rot = 0 } = {}) {
  if (!state) return;
  ctx.save();
  ctx.font = `800 ${size}px "Almarai", sans-serif`; ctx.direction = 'rtl';
  const w = ctx.measureText(text).width + padX * 2, h = size + padY * 2;
  ctx.translate(x, y); ctx.rotate(rot); ctx.scale(state.sx ?? state.scale ?? 1, state.sy ?? state.scale ?? 1); ctx.globalAlpha *= state.alpha ?? 1;
  rr(ctx, -w / 2 + 7, -h / 2 + 9, w, h, h / 2); ctx.fillStyle = '#17121f'; ctx.fill();
  rr(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = '#17121f'; ctx.lineWidth = 7; ctx.stroke();
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, size * 0.04);
  ctx.restore();
}
