"""Produce a self-contained static runtime; production never loads dependency CDNs."""
from pathlib import Path
import json, shutil, re, zipfile, gzip
ROOT=Path(__file__).resolve().parents[1]
VENDOR=ROOT/'shared/vendor';VENDOR.mkdir(parents=True,exist_ok=True)
packed=VENDOR/'playcanvas.min.js.gz'
if packed.exists():(VENDOR/'playcanvas.min.js').write_bytes(gzip.decompress(packed.read_bytes()))
MODULES={
 'underscore/underscore-umd-min.js':'underscore.min.js',
 'jquery/dist/jquery.min.js':'jquery.min.js','jquery-classic/dist/jquery.min.js':'jquery-classic.min.js',
 'jquery-legacy/dist/jquery.min.js':'jquery-legacy.min.js','jquery-migrate/dist/jquery-migrate.min.js':'jquery-migrate.min.js',
 'mathjs/dist/math.min.js':'math.min.js','angular/angular.min.js':'angular.min.js',
 'bootstrap/dist/js/bootstrap.min.js':'bootstrap.min.js','gsap/src/minified/TweenMax.min.js':'TweenMax.min.js',
 'three/build/three.min.js':'three.min.js','three-legacy/build/three.min.js':'three-legacy.min.js',
 'processing-js/processing.min.js':'processing.min.js'
}
for src,dest in MODULES.items():shutil.copyfile(ROOT/'node_modules'/src,VENDOR/dest)
ruffle=ROOT/'node_modules/@ruffle-rs/ruffle';target=VENDOR/'ruffle';target.mkdir(exist_ok=True)
for p in ruffle.iterdir():
 if p.suffix in ['.js','.wasm'] or p.name.startswith('LICENSE'):shutil.copyfile(p,target/p.name)
# Retain notices beside vendored libraries.
notices=VENDOR/'LICENSES';notices.mkdir(exist_ok=True)
for package in ['jquery','jquery-classic','jquery-legacy','jquery-migrate','mathjs','angular','bootstrap','gsap','three','three-legacy','processing-js','underscore']:
 folder=ROOT/'node_modules'/package
 for p in folder.iterdir():
  if p.is_file() and re.match(r'licen[cs]e|copying',p.name,re.I):shutil.copyfile(p,notices/(package+'-'+p.name))
DEST=ROOT/'dist'
if DEST.exists():shutil.rmtree(DEST)
DEST.mkdir()
data=json.loads((ROOT/'catalog.json').read_text())
for item in data['games']:
 shutil.copytree(ROOT/'games'/item['id'],DEST/'games'/item['id'],ignore=shutil.ignore_patterns('*.zip','*.map','.DS_Store'))
# Slope 3 ships as an upstream archive. Expand runtime assets without CDN loaders.
archive=ROOT/'games/slope3/slope3.zip'
if archive.exists() and any(g['id']=='slope3' for g in data['games']):
 with zipfile.ZipFile(archive) as z:
  for name in z.namelist():
   if name.startswith('slope3/') and not '/cdn-cgi/' in name and not name.endswith('/') and not name.endswith('index.html'):
    p=DEST/'games'/name
    p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(z.read(name))
# Poker refers to this shared art directory.
if (ROOT/'games/avatar').exists():shutil.copytree(ROOT/'games/avatar',DEST/'games/avatar')
shutil.copytree(ROOT/'shared',DEST/'shared',ignore=shutil.ignore_patterns('*.map'))
for name in ['index.html','catalog.json','LICENSE','README.md','main.min.js']:
 shutil.copyfile(ROOT/name,DEST/name)
(DEST/'.nojekyll').touch()
print(f"Built {len(data['games'])} games, {sum(p.stat().st_size for p in DEST.rglob('*') if p.is_file())/1e6:.1f} MB")
