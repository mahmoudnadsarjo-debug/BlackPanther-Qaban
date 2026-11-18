// S6 PANEL (14.0-16.0s): the indicator close-up. Weight x unit price = total, straight off the real panel layout
// (WEIGHT / UNIT PRICE / TOTAL PRICE windows). The left half of the panel is redrawn in code so the
// labels, LED digits and logo are crisp, correct and animatable.
import { cue } from '../data.js';
import { E, lerp, seg, hash, INK } from '../lib/ink.js';
import { line } from '../lib/text.js';
import { pop, slam, shake, punch, flashEnv, topShade, sparkle, PAL } from '../lib/fx.js';
import { seg7 } from '../lib/seg7.js';
import { COPY, KEY, cam, plate, rr } from '../lib/shot.js';

const ROWS = [
  { id: 'led1', final: '12.500' },   // kg
  { id: 'led2', final: '0.850' },    // price per kg
  { id: 'led3', final: '10.625' },   // total = 12.5 x 0.85
];
const fmt = (v, dec = 3) => v.toFixed(dec);

function rowValue(i, T) {
  const t0 = cue(ROWS[i].id), u = seg(T, t0, t0 + 0.3);
  if (T < t0) return null;
  if (i === 0) return fmt(12.5 * E.outCubic(u));                               // weight settles like a real load cell
  if (i === 1) return ['0', '0.8', '0.85', '0.850'][Math.min(3, Math.floor(u * 4))]; // keyed in digit by digit
  if (u < 0.5) return fmt(hash(Math.floor(T * 30), 77) * 20);                  // total "computes" for a few frames
  return '10.625';
}

export async function draw(ctx, t, env) {
  const T = env.T, t0 = cue('cut_panel'), t3 = cue('led3');
  const bmp = await env.img(KEY('k7-panel')), logo = await env.img('/assets/brand/emblem-placeholder.png');
  const z = lerp(1.22, 1.04, E.outExpo(seg(t, 0, 0.45))) * lerp(1, 1.04, t / 2) * punch(T, t3 + 0.15, 0.04, 0.3);
  const sh = shake(T, t0, 14, 0.25, 61);
  cam(ctx, { zoom: z, fx: 0.5, fy: 0.47, dx: sh.x, dy: sh.y + 70, rot: lerp(-0.05, 0, E.outCubic(seg(t, 0, 0.5))) }, c => {
    plate(c, bmp);
    // left half of the panel, redrawn
    c.fillStyle = '#0b0b0b'; c.fillRect(132, 690, 414, 448);
    ROWS.forEach((r, i) => {
      const y = 694 + i * 118, v = rowValue(i, T), lit = v !== null;
      c.save(); c.font = '700 29px "Almarai", sans-serif'; c.direction = 'rtl'; c.textAlign = 'right'; c.textBaseline = 'middle';
      c.fillStyle = lit ? '#f3eefc' : '#8d86a3'; c.fillText(COPY.panel_rows[i], 526, y + 17); c.restore();
      rr(c, 150, y + 36, 380, 76, 9); c.fillStyle = '#150b0c'; c.fill(); c.strokeStyle = '#7e484a'; c.lineWidth = 3.5; c.stroke();
      const glow = i === 2 && lit ? 0.9 + 0.9 * flashEnv(T, t3 + 0.15, 0.5) : 0.9;
      seg7(c, lit ? v : '', 512, y + 74, 48, { glow });
      if (!lit) seg7(c, '888888', 512, y + 74, 48, { color: 'rgba(255,60,48,0.10)', glow: 0, off: null });
    });
    // logo strip (temporary emblem until the owner's logo file is supplied)
    const lh = 62, lw = lh * logo.width / logo.height;
    c.drawImage(logo, 152, 1064, lw, lh);
    c.save(); c.font = '800 30px "Almarai", sans-serif'; c.direction = 'ltr'; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillStyle = '#f3eefc'; c.letterSpacing = '3px'; c.fillText(COPY.brand_en, 152 + lw + 14, 1098); c.restore();
    const us = seg(T, t3 + 0.15, t3 + 0.6);
    if (us > 0 && us < 1) { sparkle(c, 170, 1010, 54 * Math.sin(Math.PI * us), PAL.amber, us * 2); sparkle(c, 520, 968, 34 * Math.sin(Math.PI * us), PAL.white, -us * 2); }
  });
  topShade(ctx, 0.72, 620);
  const h = slam(T, t0 + 0.08, 0.2);
  if (h) line(ctx, COPY.panel_head.split(' ').map((w, i, a) => (i === a.length - 1 ? { t: w, fill: PAL.amber } : w)), { x: 540, y: 330, size: 116, fill: PAL.white, each: () => h });
  return { flash: flashEnv(T, t0, 0.08) * 0.15 + flashEnv(T, t3 + 0.15, 0.1) * 0.12, flashColor: '#ffe9d6', bloom: 0.36, ca: 2.0 + 5 * flashEnv(T, t0, 0.25) };
}
