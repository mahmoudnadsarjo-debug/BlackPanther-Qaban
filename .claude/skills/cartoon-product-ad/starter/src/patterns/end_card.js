// PATTERN: end card. Brand lockup, product name, one scarcity or offer line, ONE call to action, pack shot underneath.
// Adapt: pack-shot plate, logo file, copy keys. Text block stays in y 200-960; the pack shot may run into the lower third
// because platform UI covers that area and nothing essential lives there.
// Keep the call to action on screen for at least 2 seconds.
import { cue } from '../data.js';
import { E, lerp, seg, INK } from '../lib/ink.js';
import { line, label } from '../lib/text.js';
import { pop, slam, shake, flashEnv, PAL } from '../lib/fx.js';
import { COPY, KEY, rr } from '../lib/shot.js';

let pack; // feathered pack-shot layer, built once (pure function of the plate)
function buildPack(bmp) {
  const w = 650, h = Math.round(w * bmp.height / bmp.width), c = new OffscreenCanvas(w, h), x = c.getContext('2d');
  x.imageSmoothingQuality = 'high'; x.drawImage(bmp, 0, 0, w, h);
  x.globalCompositeOperation = 'destination-in';
  const fade = (g, a, b) => { g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(a, 'rgba(0,0,0,1)'); g.addColorStop(b, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); return g; };
  x.fillStyle = fade(x.createLinearGradient(0, 0, w, 0), 0.2, 0.8); x.fillRect(0, 0, w, h);
  x.fillStyle = fade(x.createLinearGradient(0, 0, 0, h), 0.16, 0.9); x.fillRect(0, 0, w, h);
  return c;
}

export async function draw(ctx, t, env) {
  const T = env.T, t0 = cue('cut_end');
  const bmp = await env.img(KEY('k4b-panther-on-scale')), logo = await env.img('/assets/brand/logo.png');
  pack ??= buildPack(bmp);
  // backdrop: the same plate, blurred and dimmed, so the card lives in the same world
  ctx.save(); ctx.filter = 'blur(26px) brightness(0.5) saturate(1.1)'; env.cover(ctx, bmp, { zoom: 1.5, fx: 0.5, fy: 0.75 }); ctx.restore();
  ctx.fillStyle = 'rgba(13,10,24,0.42)'; ctx.fillRect(0, 0, 1080, 1920);
  const rise = E.outExpo(seg(t, 0, 0.6)), sh = shake(T, t0, 16, 0.3, 121);
  const pw = 650 * lerp(1.12, 1.0, rise), ph = pw * pack.height / pack.width;
  ctx.drawImage(pack, 540 - pw / 2 + sh.x, 724 + lerp(140, 0, rise) + sh.y + Math.sin(t * 1.6) * 5, pw, ph);

  // brand lockup
  const lg = pop(T, cue('logo') - 0.12, 0.26);
  if (lg) {
    ctx.save(); ctx.translate(540, 222); ctx.scale(lg.scale, lg.scale); ctx.globalAlpha = lg.alpha;
    const lh = 96, lw = lh * logo.width / logo.height;
    ctx.font = '800 40px "Almarai", sans-serif'; ctx.direction = 'ltr'; ctx.letterSpacing = '6px';
    const tw = ctx.measureText(COPY.brand_en).width, total = lw + 22 + tw, x0 = -total / 2;
    ctx.beginPath(); ctx.arc(x0 + lw / 2, 0, lh * 0.62, 0, Math.PI * 2); ctx.fillStyle = PAL.amber; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.stroke();
    ctx.drawImage(logo, x0, -lh / 2, lw, lh);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 10; ctx.strokeText(COPY.brand_en, x0 + lw + 22, 3);
    ctx.fillStyle = PAL.white; ctx.fillText(COPY.brand_en, x0 + lw + 22, 3);
    ctx.restore();
  }
  const b = slam(T, cue('logo'), 0.2), k = pop(T, cue('logo') + 0.25, 0.24);
  if (b) line(ctx, [COPY.brand_ar], { x: 540, y: 378, size: 168, fill: PAL.amber, glow: 38, each: () => b });
  if (k) line(ctx, [COPY.kicker], { x: 540, y: 508, size: 64, fill: PAL.white, sw: 13, each: () => k });

  // scarcity stamp
  const st = slam(T, cue('limited'), 0.18);
  if (st) {
    ctx.save(); ctx.translate(540, 628); ctx.rotate(-0.045); ctx.scale(st.sx, st.sy); ctx.globalAlpha = st.alpha;
    ctx.font = '800 66px "Almarai", sans-serif'; ctx.direction = 'rtl';
    const w = ctx.measureText(COPY.limited).width + 84, h = 112;
    rr(ctx, -w / 2 + 7, -h / 2 + 9, w, h, 20); ctx.fillStyle = INK; ctx.fill();
    rr(ctx, -w / 2, -h / 2, w, h, 20); ctx.fillStyle = '#e8362b'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.stroke();
    rr(ctx, -w / 2 + 12, -h / 2 + 12, w - 24, h - 24, 12); ctx.setLineDash([14, 10]); ctx.strokeStyle = 'rgba(255,247,238,0.85)'; ctx.lineWidth = 3.5; ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = PAL.white; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(COPY.limited, 0, 4);
    ctx.restore();
  }
  // call to action
  const c = pop(T, cue('cta'), 0.3);
  if (c) {
    const pulse = 1 + 0.035 * Math.sin((T - cue('cta')) * 7.5);
    ctx.save(); ctx.translate(540, 790); ctx.scale(c.scale * pulse, c.scale * pulse); ctx.globalAlpha = c.alpha;
    ctx.font = '800 100px "Almarai", sans-serif'; ctx.direction = 'rtl';
    const w = ctx.measureText(COPY.cta).width + 150, h = 176;
    rr(ctx, -w / 2 + 9, -h / 2 + 12, w, h, h / 2); ctx.fillStyle = INK; ctx.fill();
    rr(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fillStyle = PAL.amber; ctx.shadowColor = 'rgba(255,210,58,0.75)'; ctx.shadowBlur = 44; ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.stroke();
    ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(COPY.cta, 0, 6);
    ctx.restore();
    const s2 = pop(T, cue('cta') + 0.3, 0.24);
    if (s2) line(ctx, [COPY.cta_sub], { x: 540, y: 926, size: 60, fill: PAL.white, sw: 13, each: () => s2 });
  }
  return { flash: flashEnv(T, t0, 0.12) * 0.35 + flashEnv(T, cue('logo'), 0.08) * 0.12, flashColor: '#fff3e0', bloom: 0.34, vig: 0.62, ca: 2.2 + 6 * flashEnv(T, t0, 0.3) };
}
