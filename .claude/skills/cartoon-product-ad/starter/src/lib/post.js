// Post chain that gives every shot (AI clip or code drawing) the same finish:
// soft bloom -> lateral + radial chromatic aberration -> film grain -> vignette (+ optional flash / tint).
// Pure function of (source pixels, frame index, options).
import { hash } from './ink.js';

function noiseTile(size, seed) {
  const c = new OffscreenCanvas(size, size), x = c.getContext('2d');
  const img = x.createImageData(size, size), d = img.data;
  for (let i = 0; i < size * size; i++) {
    const v = 128 + (hash(i, seed) - 0.5) * 2 * 110;
    d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return c;
}

export function makePost(PW, PH) {
  const a = new OffscreenCanvas(PW, PH), actx = a.getContext('2d');
  const b = new OffscreenCanvas(PW, PH), bctx = b.getContext('2d');
  const sw = Math.max(2, Math.round(PW / 4)), sh = Math.max(2, Math.round(PH / 4));
  const small = new OffscreenCanvas(sw, sh), sctx = small.getContext('2d');
  const tiles = [noiseTile(256, 11), noiseTile(256, 23), noiseTile(256, 37), noiseTile(256, 51)];
  const k = PW / 1080; // design px -> device px

  /**
   * @param src   canvas with the finished scene (PW x PH)
   * @param out   2d context of the destination canvas (PW x PH)
   * @param o     { frame, ca, bloom, grain, vig, flash, flashColor, soft }
   */
  return function post(src, out, o = {}) {
    const { frame = 0, ca = 2.2, bloom = 0.28, grain = 0.09, vig = 0.5, flash = 0, flashColor = '#fff', soft = 0.25 } = o;
    // 1) base + soft bloom into b
    bctx.globalCompositeOperation = 'copy'; bctx.globalAlpha = 1; bctx.filter = 'none';
    bctx.drawImage(src, 0, 0);
    if (bloom > 0 || soft > 0) {
      sctx.globalCompositeOperation = 'copy';
      sctx.filter = 'none';
      sctx.drawImage(src, 0, 0, sw, sh);
      if (soft > 0) { // gentle overall softness (the reference is slightly diffused)
        bctx.globalCompositeOperation = 'source-over'; bctx.globalAlpha = soft;
        bctx.filter = `blur(${1.4 * k}px)`; bctx.drawImage(src, 0, 0); bctx.filter = 'none';
      }
      if (bloom > 0) {
        bctx.globalCompositeOperation = 'screen'; bctx.globalAlpha = bloom;
        bctx.filter = `blur(${22 * k}px) contrast(1.5) brightness(0.9)`;
        bctx.drawImage(small, 0, 0, PW, PH);
        bctx.filter = 'none';
      }
      bctx.globalAlpha = 1; bctx.globalCompositeOperation = 'source-over';
    }
    // 2) chromatic aberration: R left / B right + slight radial spread, summed with 'lighter'
    out.save();
    out.setTransform(1, 0, 0, 1, 0, 0);
    out.globalCompositeOperation = 'source-over'; out.globalAlpha = 1; out.filter = 'none';
    out.fillStyle = '#000'; out.fillRect(0, 0, PW, PH);
    if (ca > 0) {
      const d = ca * k, chans = [['#ff0000', -d, 1.0045], ['#00ff00', 0, 1.003], ['#0000ff', d, 1.0015]];
      out.globalCompositeOperation = 'lighter';
      for (const [col, dx, sc] of chans) {
        actx.globalCompositeOperation = 'copy'; actx.drawImage(b, 0, 0);
        actx.globalCompositeOperation = 'multiply'; actx.fillStyle = col; actx.fillRect(0, 0, PW, PH);
        const w = PW * sc + Math.abs(d) * 2, h = PH * sc;
        out.drawImage(a, (PW - w) / 2 + dx, (PH - h) / 2, w, h);
      }
      out.globalCompositeOperation = 'source-over';
    } else out.drawImage(b, 0, 0);
    // 3) grain
    if (grain > 0) {
      const tile = tiles[frame % tiles.length];
      const ox = Math.floor(hash(frame, 101) * 256), oy = Math.floor(hash(frame, 202) * 256);
      out.globalCompositeOperation = 'overlay'; out.globalAlpha = grain;
      const g = Math.max(1, Math.round(2 * k)) * 256; // grain cell ~2 design px
      for (let y = -oy * (g / 256); y < PH; y += g) for (let x = -ox * (g / 256); x < PW; x += g) out.drawImage(tile, x, y, g, g);
      out.globalAlpha = 1; out.globalCompositeOperation = 'source-over';
    }
    // 4) vignette
    if (vig > 0) {
      const r = Math.hypot(PW, PH) / 2;
      const gr = out.createRadialGradient(PW / 2, PH / 2, r * 0.45, PW / 2, PH / 2, r * 1.02);
      gr.addColorStop(0, 'rgba(12,6,28,0)'); gr.addColorStop(1, `rgba(12,6,28,${vig})`);
      out.fillStyle = gr; out.fillRect(0, 0, PW, PH);
    }
    if (flash > 0) { out.globalAlpha = Math.min(1, flash); out.fillStyle = flashColor; out.fillRect(0, 0, PW, PH); out.globalAlpha = 1; }
    out.restore();
  };
}
