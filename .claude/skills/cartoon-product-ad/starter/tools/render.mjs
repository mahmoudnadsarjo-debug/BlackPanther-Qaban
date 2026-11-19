#!/usr/bin/env node
// Frame-exact renderer for the ad.
//
// It opens src/index.html in headless Chromium, asks the page to draw one absolute time at a time
// (window.AD.draw(t)), grabs the canvas, and either writes numbered frames, one still, or pipes the
// frames into FFmpeg. No real-time clock is involved, so a small preview frame is the final frame, scaled.
//
//   MP4     node tools/render.mjs --name "My Ad - Preview v1" [--audio assets/audio/mix.wav] [--out renders/previews]
//   range   node tools/render.mjs --from 6 --to 9.5 --scale 0.5 --name "Gag check v1"
//   frames  node tools/render.mjs --from 0 --to 8 --fps 4 --scale 0.25 --frames cache/frames/a
//   still   node tools/render.mjs --still 1.7 --out cache/stills/hook.png
//
//   check   node tools/render.mjs --check          lint the plan only (no browser): scenes, cues, copy
//
// Options: --fps (default plan fps) --scale 0..1 --png (lossless frames into the encoder; slower)
//          --guides (draw the safe-area lines on stills / frames / sheets - never on a delivery render)
//          --crf 17 --force (overwrite an existing MP4). AD_CHROMIUM / AD_FFMPEG override the binaries.
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const argv = process.argv.slice(2);
const opts = {};
for (let i = 0; i < argv.length; i++) {
  if (!argv[i].startsWith('--')) fail(`Unexpected argument "${argv[i]}"`);
  const key = argv[i].slice(2), next = argv[i + 1];
  if (next === undefined || next.startsWith('--')) opts[key] = true; else { opts[key] = next; i++; }
}
function fail(msg) { console.error('render: ' + msg); process.exit(1); }
const number = (key, fallback) => {
  if (opts[key] === undefined) return fallback;
  const v = Number(opts[key]);
  if (!Number.isFinite(v)) fail(`--${key} must be a number`);
  return v;
};

if (!existsSync(path.join(ROOT, 'plan/beats.json'))) fail('run from the project root (plan/beats.json not found)');
const readJson = async rel => {
  try { return JSON.parse(await fs.readFile(path.join(ROOT, rel), 'utf8')); }
  catch (e) { fail(`${rel}: ${e.message}`); }
};
const plan = await readJson('plan/beats.json');

// ---- plan lint: catch in a second what would otherwise surface as a page that never loads ----
{
  const problems = [], warnings = [];
  await readJson('plan/copy.json');
  if (!(plan.duration > 0)) problems.push('plan/beats.json: "duration" must be a positive number');
  if (!Array.isArray(plan.scenes) || !plan.scenes.length) problems.push('plan/beats.json: no "scenes"');
  for (const s of plan.scenes ?? []) {
    const mod = s.mod ?? s.id;
    if (!existsSync(path.join(ROOT, 'src/scenes', mod + '.js'))) problems.push(`scene "${s.id}": src/scenes/${mod}.js does not exist (create it, or point "mod" at an existing file)`);
    if (!(s.end > s.start) || s.start < 0 || s.end > plan.duration + 1e-6) problems.push(`scene "${s.id}": start/end must satisfy 0 <= start < end <= duration`);
  }
  const seen = new Set();
  for (const c of plan.cues ?? []) {
    if (seen.has(c.id)) problems.push(`cue "${c.id}" is defined twice`); seen.add(c.id);
    if (!(c.t >= 0 && c.t <= plan.duration)) problems.push(`cue "${c.id}": t=${c.t} is outside the film (0..${plan.duration})`);
    if (c.sfx === undefined) warnings.push(c.id);
  }
  if (warnings.length) console.warn(`render: note - cues with no "sfx" (use ["none"] when silence is deliberate): ${warnings.join(', ')}`);
  if (problems.length) fail('plan problems:\n  - ' + problems.join('\n  - '));
  if (opts.check) { console.log(`render: plan OK - ${plan.scenes.length} scenes, ${(plan.cues ?? []).length} cues, ${plan.duration} s`); process.exit(0); }
}
const scale = number('scale', 1);
if (!(scale > 0 && scale <= 1)) fail('--scale must be in (0, 1]');

// ---- what are we making? -----------------------------------------------------------------
let mode, times, fps = number('fps', plan.fps ?? 30), target;
if (opts.still !== undefined) {
  mode = 'still'; times = [number('still', 0)];
  target = path.resolve(String(opts.out ?? 'cache/stills/still.png'));
} else {
  const from = number('from', 0), to = number('to', plan.duration);
  if (!(to > from) || from < 0 || !(fps > 0)) fail('need 0 <= --from < --to and --fps > 0');
  const count = Math.ceil((to - from) * fps - 1e-8);
  times = Array.from({ length: count }, (_, i) => from + i / fps);
  if (opts.frames) { mode = 'frames'; target = path.resolve(String(opts.frames)); }
  else {
    mode = 'mp4';
    const name = String(opts.name ?? '');
    if (!name || /[\\/:*?"<>|]/.test(name)) fail('give the video a plain --name, e.g. --name "My Ad - Preview v1"');
    if (opts.guides) fail('--guides is for stills, frames and sheets only - a delivery render must not carry guide lines');
    target = path.resolve(String(opts.out ?? 'renders/previews'), name + '.mp4');
    if (existsSync(target) && !opts.force) fail(`"${path.relative(ROOT, target)}" exists - use a new version name (or --force)`);
  }
}
const audio = opts.audio ? path.resolve(String(opts.audio)) : null;
if (audio && !existsSync(audio)) fail('audio file not found: ' + opts.audio);
await fs.mkdir(mode === 'frames' ? target : path.dirname(target), { recursive: true });
if (mode === 'frames' && (await fs.readdir(target)).some(f => /^\d{5}\.jpg$/.test(f))) fail('frame folder already has frames - choose a fresh one');

// ---- loopback file server: only the folders the page needs, never dotfiles ----------------
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf' };
const SERVED = ['src', 'plan', 'assets'];
const server = createServer(async (req, res) => {
  try {
    const parts = decodeURIComponent(new URL(req.url, 'http://x').pathname).split('/').filter(Boolean);
    if (!SERVED.includes(parts[0]) || parts.some(p => p.startsWith('.'))) throw new Error('not served');
    const file = path.join(ROOT, ...parts);
    if (!file.startsWith(ROOT + path.sep)) throw new Error('outside project');
    const body = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise((ok, no) => { server.once('error', no); server.listen(0, '127.0.0.1', ok); });

// ---- browser ---------------------------------------------------------------------------------
function loadPlaywright() {
  for (const base of [path.join(ROOT, 'package.json'), import.meta.url]) {
    try { return createRequire(base)('playwright'); } catch { /* try the next location */ }
  }
  fail('Playwright not found. Install it in the project (npm i -D playwright && npx playwright install chromium) or use an environment that ships it.');
}
const { chromium } = loadPlaywright();
const browser = await chromium.launch({ headless: true, ...(process.env.AD_CHROMIUM ? { executablePath: process.env.AD_CHROMIUM } : {}) });
let encoder, encoded;
const started = Date.now();
try {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') pageErrors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) pageErrors.push(`${r.status()} ${new URL(r.url()).pathname}  (file missing or not served)`); });
  // Fail the moment the page reports a load problem instead of waiting out the ready timeout.
  let trip; const broken = new Promise((_, no) => { trip = no; });
  const watch = setInterval(() => { if (pageErrors.length) trip(new Error('page failed to load:\n  ' + pageErrors.join('\n  '))); }, 150);
  try {
    await page.goto(`http://127.0.0.1:${server.address().port}/src/index.html?scale=${scale}${opts.guides ? '&guides=1' : ''}`);
    await Promise.race([broken, page.waitForFunction(() => window.AD && window.AD.ready === true, {}, { timeout: 120000 })
      .catch(() => { throw new Error('page never became ready (no error reported - is a scene awaiting something that never resolves?)'); })]);
  } finally { clearInterval(watch); }
  broken.catch(() => {});
  pageErrors.length = 0;

  const lossless = mode === 'still' || !!opts.png;
  const mime = lossless ? 'image/png' : 'image/jpeg', quality = 0.96;
  const frame = async t => {
    const url = await page.evaluate(async ([tt, m, q]) => { await window.AD.draw(tt); return window.AD.grab(m, q); }, [t, mime, quality]);
    if (pageErrors.length) throw new Error('page error at t=' + t.toFixed(3) + ':\n' + pageErrors.join('\n'));
    return Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
  };

  if (mode === 'still') {
    await fs.writeFile(target, await frame(times[0]));
  } else if (mode === 'frames') {
    for (let i = 0; i < times.length; i++) await fs.writeFile(path.join(target, String(i).padStart(5, '0') + '.jpg'), await frame(times[i]));
  } else {
    // RGB / full-range JPEG in -> BT.709 limited-range H.264 out, tagged, so colours match on phones and in ad managers.
    const convert = lossless ? 'scale=out_color_matrix=bt709:out_range=tv' : 'scale=in_color_matrix=bt601:in_range=full:out_color_matrix=bt709:out_range=tv';
    const a = ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', lossless ? 'png' : 'mjpeg', '-i', 'pipe:0'];
    if (audio) a.push('-ss', String(times[0]), '-t', String(times.length / fps), '-i', audio);
    a.push('-map', '0:v:0');
    if (audio) a.push('-map', '1:a:0', '-af', 'apad', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000');
    a.push('-vf', convert + ',format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', String(number('crf', 17)),
      '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
      '-frames:v', String(times.length), '-t', String(times.length / fps), '-movflags', '+faststart', target);
    encoder = spawn(process.env.AD_FFMPEG || 'ffmpeg', a, { stdio: ['pipe', 'inherit', 'inherit'] });
    encoded = new Promise((ok, no) => { encoder.once('error', no); encoder.once('close', code => (code === 0 ? ok() : no(new Error('ffmpeg exited with ' + code)))); });
    encoded.catch(() => {}); encoder.stdin.on('error', () => {});
    for (let i = 0; i < times.length; i++) {
      const buf = await frame(times[i]);
      if (!encoder.stdin.write(buf)) await Promise.race([new Promise(r => encoder.stdin.once('drain', r)), encoded.then(() => { throw new Error('encoder stopped early'); })]);
      if ((i + 1) % 60 === 0 || i === times.length - 1) console.log(`  ${i + 1}/${times.length} frames  (${((Date.now() - started) / 1000).toFixed(0)} s)`);
    }
    encoder.stdin.end(); await encoded;
  }
  const what = mode === 'mp4' ? `${times.length} frames @ ${fps} fps${audio ? ' + audio' : ' (silent)'}` : mode === 'frames' ? `${times.length} frames` : 'still';
  console.log(`render: ${what} -> ${path.relative(ROOT, target)}  in ${((Date.now() - started) / 1000).toFixed(1)} s`);
} catch (err) {
  console.error('render: ' + err.message); process.exitCode = 1;
  if (encoder && encoder.exitCode === null) encoder.kill();
  if (mode === 'mp4' && existsSync(target)) await fs.rm(target).catch(() => {}); // never leave a half-written video that looks finished
} finally {
  await browser.close();
  await new Promise(r => server.close(r));
}
