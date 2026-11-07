"""Normalize local game entrypoints and remove publisher advertising integrations.

Only executable/resource elements are changed. Copyright and license notices remain.
Run after adding a game, then run the dependency and browser audits.
"""
from pathlib import Path
import html, json, os, re, shutil, zipfile
ROOT = Path(__file__).resolve().parents[1]
GAMES = ROOT / 'games'
VENDOR = {
 'three.js/r128/three.min.js':'three.min.js', 'three.js/95/three.min.js':'three-legacy.min.js',
 'jquery-2.2.3.js':'jquery-classic.min.js', 'jquery/2.1.1/jquery.min.js':'jquery-classic.min.js',
 'jquery-3.1.1.min.js':'jquery.min.js', 'jquery-1.11.0.min.js':'jquery-legacy.min.js',
 'jquery-migrate-1.2.1.min.js':'jquery-migrate.min.js',
 'mathjs/3.2.1/math.min.js':'math.min.js', 'angularjs/1.3.0-beta.17/angular.min.js':'angular.min.js',
 'bootstrap/3.3.1/js/bootstrap.min.js':'bootstrap.min.js', 'gsap/1.19.0/TweenMax.min.js':'TweenMax.min.js',
 'processing.js/1.4.8/processing.min.js':'processing.min.js',
 '@ruffle-rs/ruffle':'ruffle/ruffle.js',
 'playcanvas-stable.min.js':'playcanvas.min.js'
}
CSP = "default-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' data: blob:; worker-src 'self' blob:; frame-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'none'"
TRACKER = re.compile(r'googletagmanager|google-analytics|cloudflareinsights|analytics_ubg|analytics_games235|imasdk\.googleapis|3kh0\.github\.io/js/main|ven0myt\.github\.io/js/main|cdn-cgi/|/assets/js/prefixfree|^/js/main\.js', re.I)
REPORT = []
def rel(p, target): return os.path.relpath(ROOT / target, p.parent).replace(os.sep,'/')
def resource_script(match, p):
 tag = match.group(0)
 m = re.search(r'\bsrc\s*=\s*([\'"])(.*?)\1', tag, re.S|re.I)
 if not m: return tag
 src = html.unescape(m.group(2))
 if TRACKER.search(src):
  REPORT.append({'path':str(p.relative_to(ROOT)), 'removed':src}); return ''
 if src.startswith(('http:','https:','//')):
  for key, target in VENDOR.items():
   if key in src: return tag[:m.start(2)] + rel(p,'shared/vendor/'+target) + tag[m.end(2):]
  # GIF Maker and CodePen are tools/demos, not standalone game dependencies.
  REPORT.append({'path':str(p.relative_to(ROOT)), 'removed':src}); return ''
 return tag

def clean_html(p):
 s=p.read_text(errors='replace')
 s=re.sub(r'<script\b[^>]*>\s*// AuthorChe Clean Game Wrapper.*?</script>', '', s, flags=re.S|re.I)
 s=re.sub(r'<script\b[^>]*>\s*window\.open\s*=.*?</script>', '', s, flags=re.S|re.I)
 s=re.sub(r'<script\b(?![^>]*\bsrc=)[^>]*>[^<]*(?:\bgtag\(|google-analytics\.com|googletagmanager\.com)[\s\S]*?</script>', '', s, flags=re.I)
 s=re.sub(r'<script\b[^>]*\bsrc\s*=\s*[\'"][^\'"]+[\'"][^>]*>\s*</script>', lambda m:resource_script(m,p),s,flags=re.S|re.I)
 s=re.sub(r'<link\b[^>]*>',lambda m:'' if re.search(r'(?:fonts\.googleapis|fonts\.gstatic|rawgit|greghub\.github|weavesilk\.com|g\.eags\.us)',m.group(0),re.I) else m.group(0),s,flags=re.I)
 s=re.sub(r'<meta\b[^>]*http-equiv=[\'"]Content-Security-Policy[\'"][^>]*>','',s,flags=re.I)
 s=re.sub(r'<base\b[^>]*>','',s,flags=re.I)
 # Retain attribution text without sending visitors to publisher/advertiser sites.
 s=re.sub(r'(<a\b[^>]*?)\s+href=([\'"])(?:https?:)?//(?!authorche\.top(?:/|\2)).*?\2',r'\1',s,flags=re.I)
 # Canonical metadata is handled by the main website; game runtimes stay noindex.
 s=re.sub(r'<meta\b[^>]*name=[\'"]robots[\'"][^>]*>','',s,flags=re.I)
 s=re.sub(r'<script\b[^>]*\bsrc=[\'"][^\'"]*shared/platform\.js[\'"][^>]*>\s*</script>','',s,flags=re.I)
 s=re.sub(r'<link\b[^>]*href=[\'"][^\'"]*shared/game\.css[\'"][^>]*>','',s,flags=re.I)
 bootstrap = '<meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="'+CSP+'"><meta name="robots" content="noindex,follow"><script src="'+rel(p,'shared/platform.js')+'"></script><link rel="stylesheet" href="'+rel(p,'shared/game.css')+'">'
 head = re.search(r'<head\b[^>]*>',s,re.I)
 if head: s=s[:head.end()]+'\n'+bootstrap+'\n'+s[head.end():]
 elif re.search(r'<html\b',s,re.I): s=re.sub(r'(<html\b[^>]*>)',r'\1<head>'+bootstrap+'</head>',s,count=1,flags=re.I)
 else: s='<!doctype html><html lang="en"><head>'+bootstrap+'</head><body>'+s+'</body></html>'
 # Local scripts that had been replaced with nonexistent website bootstrap paths.
 if p.parent.name=='dj': s=s.replace('src="/js/main.js"','src="main.js"')
 if p.parent.name=='poker':
  s=s.replace('src="static/js/jquery.js"','src="'+rel(p,'shared/vendor/jquery-classic.min.js')+'"').replace('src="casino.ogg"','src="sounds/casino.ogg"')
 p.write_text(s)

# Slope 3 contains its complete runtime in an archive; unpack it once for normal HTTP loading.
p=GAMES/'slope3/slope3.zip'
if p.exists():
 with zipfile.ZipFile(p) as z:
  for name in z.namelist():
   if name.startswith('slope3/') and not '/cdn-cgi/' in name and not name.endswith('/'):
    target=GAMES/'slope3'/name[len('slope3/'):]
    target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(z.read(name))
 # Keep the source archive for reproducible production builds.

# Fix the Doodle Jump entry before dropping unrelated /js/main.js includes.
p=GAMES/'dj/index.html'
p.write_text(p.read_text().replace('src="/js/main.js"','src="main.js"'))

# Lightweight publisher API replacements retain callbacks needed by game logic.
platform=(ROOT/'shared/platform.js').read_text()
for p in GAMES.rglob('*.js'):
 name=p.name.lower()
 if name in ['poki.js','poki-sdk.js','poki-sdk-core.js','gm-sdk.js','gm-sdk-mobile.js']:
  p.write_text(platform)
 elif name.startswith(('analytics_ubg','analytics_games')):
  p.write_text('/* Analytics is managed by the consent-aware AuthorChe parent page. */\n')
 elif name=='nitromepreloader.js' or name=='unityprogress.js':
  p.write_text((ROOT/'shared/preloader.js').read_text())

# Particle Clicker calls this public facade throughout its interface.
p=GAMES/'particleclicker/js/analytics.js'
s=p.read_text();s=re.sub(r'enabled:\s*true','enabled: false',s)
s=re.sub(r'init:\s*function\(\)\s*\{.*?\n    \},', 'init: function() {},', s, count=1, flags=re.S)
# Keep the named methods, disable sending even when a game calls one directly.
s=s.replace("ga(", "void(")
p.write_text(s)

for p in GAMES.rglob('*.css'):
 s=p.read_text(errors='replace')
 s=re.sub(r'@import\s+(?:url\()?\s*[\'"]?https?://fonts\.googleapis[^;]*;','',s,flags=re.I)
 p.write_text(s)
for p in GAMES.rglob('*.html'): clean_html(p)
(ROOT/'reports').mkdir(exist_ok=True)
(ROOT/'reports/sanitization.json').write_text(json.dumps(REPORT,ensure_ascii=False,indent=2)+'\n')
print('Normalized',len(list(GAMES.rglob('*.html'))),'HTML files; removed',len(REPORT),'remote script integrations')
