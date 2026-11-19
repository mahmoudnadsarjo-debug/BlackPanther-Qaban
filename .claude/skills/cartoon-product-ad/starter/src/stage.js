// Stage: loads fonts and scene modules, then exposes window.AD for the renderer.
// AD.draw(t) paints absolute time t and nothing else - no clocks, no state carried between frames,
// seeded randomness only - which is what makes previews trustworthy and re-renders identical.
import { W, H, FPS, scenes, BEATS, cue, DURATION } from './data.js';
import { FONTS } from './fonts.js';
import { makePost } from './lib/post.js';
import { cover } from './lib/shot.js';

const scale = Number(new URLSearchParams(location.search).get('scale')) || 1;
const even = n => Math.max(2, 2 * Math.round(n / 2));          // H.264 needs even dimensions
const PW = even(W * scale), PH = even(H * scale);
const canvas = document.getElementById('stage');
canvas.width = PW; canvas.height = PH;
const screen = canvas.getContext('2d');
const scene = new OffscreenCanvas(PW, PH), ctx = scene.getContext('2d');
const post = makePost(PW, PH);

// ---- fonts ---------------------------------------------------------------------------------
await Promise.all(FONTS.map(async f => {
  const face = new FontFace(f.family, `url(/assets/fonts/${f.file})`, { weight: String(f.weight), ...(f.range ? { unicodeRange: f.range } : {}) });
  document.fonts.add(face);
  await face.load();
}));
await document.fonts.ready;

// ---- assets: a small LRU of decoded bitmaps so long clips never exhaust memory ---------------
const LIMIT = 48, bitmaps = new Map();
async function img(url) {
  if (bitmaps.has(url)) { const hit = bitmaps.get(url); bitmaps.delete(url); bitmaps.set(url, hit); return hit; }
  const pending = fetch(url).then(r => { if (!r.ok) throw new Error('Missing asset: ' + url); return r.blob(); }).then(createImageBitmap);
  bitmaps.set(url, pending);
  if (bitmaps.size > LIMIT) {
    const [oldUrl, old] = bitmaps.entries().next().value;
    bitmaps.delete(oldUrl); old.then(b => b.close()).catch(() => {});
  }
  return pending;
}
const clipMeta = new Map();
/** Frame of an extracted clip (assets/ai/clips/<name>/) at clip time tc seconds, clamped to the clip. */
async function clip(name, tc) {
  if (!clipMeta.has(name)) {
    clipMeta.set(name, fetch(`/assets/ai/clips/${name}/meta.json`).then(r => {
      if (!r.ok) throw new Error(`Clip "${name}" is not extracted - run: python3 tools/clip_extract.py ${name} <file-or-url>`);
      return r.json();
    }));
  }
  const m = await clipMeta.get(name);
  const index = Math.min(m.frames - 1, Math.max(0, Math.floor(tc * m.fps + 1e-6)));
  return img(`/assets/ai/clips/${name}/${String(index + 1).padStart(4, '0')}.jpg`);
}

// ---- scenes ----------------------------------------------------------------------------------
const moduleIds = [...new Set(scenes.map(s => s.mod ?? s.id))];
const loaded = Object.fromEntries(await Promise.all(moduleIds.map(async id => [id, await import(`./scenes/${id}.js`)])));
const shared = { W, H, FPS, scale, img, clip, cover, cue, BEATS, DURATION };
await Promise.all(moduleIds.map(id => loaded[id].init?.(shared)));

async function draw(t) {
  const frame = Math.round(t * FPS);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  ctx.fillStyle = BEATS.background ?? '#0d0a18'; ctx.fillRect(0, 0, PW, PH);
  let finish = {};
  for (const s of scenes) {
    if (t < s.start || t >= s.end) continue;
    ctx.save();
    ctx.setTransform(PW / W, 0, 0, PH / H, 0, 0);
    // a scene returns optional finish overrides for this frame: { flash, flashColor, bloom, ca, grain, vig, soft }
    const out = await loaded[s.mod ?? s.id].draw(ctx, t - s.start, { ...shared, scene: s, T: t, frame, dur: s.end - s.start });
    ctx.restore();
    if (out) finish = { ...finish, ...out };
  }
  post(scene, screen, { frame, ...(BEATS.finish ?? {}), ...finish });
}

window.AD = { ready: true, draw, grab: (type = 'image/png', quality = 0.96) => canvas.toDataURL(type, quality) };
