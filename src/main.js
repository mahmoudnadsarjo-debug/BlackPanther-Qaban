// Deterministic renderer entry. window.renderFrame(t) draws absolute time t (seconds) and nothing else:
// no clocks, no carried state, seeded randomness only -> a preview frame equals the final frame.
import { W, H, FPS, scenes, BEATS, cue, DURATION } from './data.js';
import { makePost } from './lib/post.js';

const q = new URLSearchParams(location.search);
const scale = Number(q.get('scale')) || 1;
const canvas = document.getElementById('c');
const PW = Math.max(2, 2 * Math.round((W * scale) / 2)), PH = Math.max(2, 2 * Math.round((H * scale) / 2));
canvas.width = PW; canvas.height = PH;
const out = canvas.getContext('2d');
const stage = new OffscreenCanvas(PW, PH), ctx = stage.getContext('2d');
const post = makePost(PW, PH);

// ---- fonts (local files only; subsets joined by unicode-range) -------------
const AR = 'U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC';
const LA = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const faces = [];
for (const [family, dir, slug, weights] of [['Almarai', 'Almarai', 'almarai', [700, 800]], ['Tajawal', 'Tajawal', 'tajawal', [800, 900]], ['Alexandria', 'Alexandria', 'alexandria', [800, 900]]]) {
  for (const w of weights) for (const [sub, range] of [['arabic', AR], ['latin', LA]]) {
    faces.push(new FontFace(family, `url(/assets/fonts/${dir}/${slug}-${sub}-${w}-normal.woff2)`, { weight: String(w), unicodeRange: range }));
  }
}
await Promise.all(faces.map(async f => { document.fonts.add(f); await f.load(); }));
await document.fonts.ready;

// ---- assets ------------------------------------------------------------------
const bitmaps = new Map(); // path -> Promise<ImageBitmap>, small LRU so long clips never exhaust memory
const LRU_MAX = 48;
async function img(path) {
  if (bitmaps.has(path)) { const p = bitmaps.get(path); bitmaps.delete(path); bitmaps.set(path, p); return p; }
  const p = (async () => {
    const r = await fetch(path);
    if (!r.ok) throw new Error('Missing asset: ' + path);
    return createImageBitmap(await r.blob());
  })();
  bitmaps.set(path, p);
  if (bitmaps.size > LRU_MAX) {
    const [old, op] = bitmaps.entries().next().value;
    bitmaps.delete(old); op.then(b => b.close()).catch(() => {});
  }
  return p;
}
const metas = new Map();
async function clipMeta(name) {
  if (!metas.has(name)) metas.set(name, fetch(`/assets/ai/clips/${name}/meta.json`).then(r => { if (!r.ok) throw new Error('Missing clip: ' + name); return r.json(); }));
  return metas.get(name);
}
/** Frame of an extracted clip at clip-time tc seconds (clamped). */
async function clip(name, tc) {
  const m = await clipMeta(name);
  const i = Math.min(m.frames - 1, Math.max(0, Math.floor(tc * m.fps + 1e-6)));
  return img(`/assets/ai/clips/${name}/${String(i + 1).padStart(4, '0')}.jpg`);
}
/** Draw a bitmap cover-fitted to the 1080x1920 frame. zoom>=1, (fx,fy) = focus point 0..1 kept in place. */
function cover(c, bmp, { zoom = 1, fx = 0.5, fy = 0.5, dx = 0, dy = 0, rot = 0, alpha = 1 } = {}) {
  const s = Math.max(W / bmp.width, H / bmp.height) * zoom;
  const w = bmp.width * s, h = bmp.height * s;
  // keep the focus point where it sits in the un-zoomed cover fit
  const s0 = Math.max(W / bmp.width, H / bmp.height), w0 = bmp.width * s0, h0 = bmp.height * s0;
  const px = (W - w0) / 2 + fx * w0, py = (H - h0) / 2 + fy * h0;
  c.save();
  c.globalAlpha *= alpha;
  c.translate(px + dx, py + dy); c.rotate(rot);
  c.imageSmoothingQuality = 'high';
  c.drawImage(bmp, -fx * w, -fy * h, w, h);
  c.restore();
}

const mods = await Promise.all(scenes.map(s => import(`./scenes/${s.mod || s.id}.js`)));
const env0 = { W, H, FPS, scale, img, clip, cover, cue, BEATS, DURATION };
await Promise.all(mods.map((m, i) => m.init?.({ ...env0, scene: scenes[i] })));

window.renderFrame = async t => {
  const frame = Math.round(t * FPS);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  ctx.fillStyle = '#0d0a18'; ctx.fillRect(0, 0, PW, PH);
  let fx = {};
  for (let i = 0; i < scenes.length; i++) {
    const s = scenes[i];
    if (t < s.start || t >= s.end) continue;
    const env = { ...env0, scene: s, T: t, frame, dur: s.end - s.start };
    ctx.save();
    ctx.setTransform(PW / W, 0, 0, PH / H, 0, 0);
    const r = await mods[i].draw(ctx, t - s.start, env);
    ctx.restore();
    if (r) fx = { ...fx, ...r };
  }
  post(stage, out, { frame, ...fx });
};
window.grab = (type, quality = 0.95) => canvas.toDataURL(type, quality);
window.__ready = true;
