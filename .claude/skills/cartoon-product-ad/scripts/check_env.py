#!/usr/bin/env python3
"""Read-only check of what the ad pipeline needs. Installs nothing, downloads nothing.

usage: check_env.py
"""
import importlib.util, json, os, shutil, subprocess, sys

def run(cmd):
    try: return subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    except Exception as e: return None

ok = True
def row(name, good, detail, need=True):
    global ok
    if need and not good: ok = False
    print(f"{'OK     ' if good else ('MISSING' if need else 'optional')}  {name:28s} {detail}")

node = shutil.which('node'); v = run(['node', '-v']) if node else None
major = int(v.stdout.strip().lstrip('v').split('.')[0]) if v and v.returncode == 0 else 0
row('Node 18+', major >= 18, v.stdout.strip() if v else 'not found')

pw = run(['node', '-e', "try{const p=require('playwright');console.log(p.chromium.executablePath())}catch(e){console.log('');process.exit(1)}"]) if node else None
exe = pw.stdout.strip() if pw and pw.returncode == 0 else ''
row('Playwright (Node package)', bool(exe), 'found' if exe else 'not resolvable from here - a project-local install also works (npm i -D playwright)')
row('Chromium for Playwright', bool(exe) and os.path.exists(exe), exe or 'unknown until Playwright resolves')

for tool in ('ffmpeg', 'ffprobe'):
    p = shutil.which(tool); r = run([tool, '-version']) if p else None
    row(tool, bool(r and r.returncode == 0), r.stdout.splitlines()[0][:60] if r and r.returncode == 0 else 'not found')
enc = run(['ffmpeg', '-hide_banner', '-encoders']) if shutil.which('ffmpeg') else None
row('ffmpeg libx264 + aac', bool(enc and 'libx264' in enc.stdout and ' aac ' in enc.stdout), 'encoders present' if enc else '')

row('Python 3.9+', sys.version_info >= (3, 9), sys.version.split()[0])
for mod, pip in (('numpy', 'numpy'), ('scipy', 'scipy'), ('PIL', 'Pillow')):
    row(f'Python: {pip}', importlib.util.find_spec(mod) is not None, 'importable' if importlib.util.find_spec(mod) else f'pip install {pip}')
row('curl', bool(shutil.which('curl')), shutil.which('curl') or 'not found')

print()
print('Ready.' if ok else 'Something required is missing. Ask the owner before installing anything, then install only what is listed MISSING.')
print('Generation also needs an image/video generator connection (Higgsfield by default) - check its tools and balance separately.')
sys.exit(0 if ok else 1)
