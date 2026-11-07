"""Produce a self-contained static runtime; production never loads dependency CDNs."""
from pathlib import Path
import json, shutil, re, zipfile, gzip, sys
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
review_mode='--review' in sys.argv
selected=[game for game in data['games'] if review_mode or any(game['devices'].values())]
for item in selected:
 shutil.copytree(ROOT/'games'/item['id'],DEST/'games'/item['id'],ignore=shutil.ignore_patterns('*.zip','*.map','.DS_Store'))
# Slope 3 ships as an upstream archive. Expand runtime assets without CDN loaders.
archive=ROOT/'games/slope3/slope3.zip'
if archive.exists() and any(g['id']=='slope3' for g in selected):
 with zipfile.ZipFile(archive) as z:
  for name in z.namelist():
   if name.startswith('slope3/') and not '/cdn-cgi/' in name and not name.endswith('/') and not name.endswith('index.html'):
    p=DEST/'games'/name
    p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(z.read(name))
# Poker refers to this shared art directory.
if (ROOT/'games/avatar').exists():shutil.copytree(ROOT/'games/avatar',DEST/'games/avatar')
shutil.copytree(ROOT/'shared',DEST/'shared',ignore=shutil.ignore_patterns('*.map'))
for name in ['index.html','LICENSE','README.md','main.min.js']:
 shutil.copyfile(ROOT/name,DEST/name)
(DEST/'catalog.json').write_text(json.dumps(dict(data,games=selected),ensure_ascii=False,indent=2)+'\n')
(DEST/'.nojekyll').touch()
print(f"Built {len(selected)} games, {sum(p.stat().st_size for p in DEST.rglob('*') if p.is_file())/1e6:.1f} MB")


# Prepare upstream exports for a standalone production runtime.
def patch_runtime(name, old, new):
 target = DEST/name
 if not target.exists(): return
 text = target.read_text(encoding='utf-8-sig')
 if text.count(old) != 1: raise ValueError(f'Unexpected export layout: {name}')
 target.write_text(text.replace(old,new,1),encoding='utf-8')
 print(f'Prepared standalone runtime: {name}')

patch_runtime('games/friendlyfire/FriendlyFire.js',
 'return __webpack_require__(__webpack_require__.s = 0);',
 'return __webpack_require__(__webpack_require__.s = "./lib/FriendlyFire.js");')
patch_runtime('games/subway-surfers-ny/js/main.js',
 'o = "string" == typeof t ? this.getEntity(t) : t;',
 'o = "string" == typeof t ? this.getEntity(t, e) : t;')
patch_runtime('games/breaklock/index.html',
 '<object class="introduction-demo" data="assets/intro.svg" type="image/svg+xml"></object>',
 '<img class="introduction-demo" src="assets/intro.svg" alt="Example of a lock pattern">')
patch_runtime('games/wbwwb/index.html',
 '<script defer src="htmlgame.js" type="text/javascript"></script>', '')
tracker = DEST/'games/wbwwb/htmlgame.js'
if tracker.exists(): tracker.unlink()
music = DEST/'games/ayun/music.js'
if music.exists():
 music.write_text("window.startmusic=function(){};window.stopmusic=function(){};window.volmusic=function(){};window.playingmusic=function(){return true;};\n")
shutil.copyfile(DEST/'shared/platform.js',DEST/'main.min.js')

# Keep the available level-completion cue under the runtime's expected name.
fishing=DEST/'games/tinyfishing/html5game'
if fishing.exists() and not (fishing/'snd_levCompl.ogg').exists():
 shutil.copyfile(fishing/'snd_levComplBest.ogg',fishing/'snd_levCompl.ogg')

# This font is already present in the Fancade data package; expose it for CSS too.
font_package=DEST/'games/drivemad/webapp/index.data'
if font_package.exists():
 font=font_package.read_bytes()[76165:100237]
 if font[:4]!=b'wOFF':raise ValueError('Drive Mad font package layout changed')
 (font_package.parent/'baloo2.woff').write_bytes(font)
