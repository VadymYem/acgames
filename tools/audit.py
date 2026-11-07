"""Check every registered entry, local resource, duplicate and network boundary."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import json,re,sys
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'dist' if '--dist' in sys.argv else ROOT
class Page(HTMLParser):
 def __init__(self,s):super().__init__();self.nodes=[];self.feed(s)
 def handle_starttag(self,t,a):self.nodes.append((t,dict(a)))
data=json.loads((BASE/'catalog.json').read_text());errors=[];resources=[];ids=set()
for g in data['games']:
 if g['id'] in ids:errors.append('Duplicate ID: '+g['id'])
 ids.add(g['id'])
 entry=BASE/g['entry']
 if not entry.is_file():errors.append('Missing entry: '+g['entry']);continue
 if not (BASE/g['cover']).is_file():errors.append('Missing cover: '+g['id'])
 if set(g['devices'])!={'desktop','android','ios'}:errors.append('Incomplete device support: '+g['id'])
 for p in (BASE/'games'/g['id']).rglob('*.html'):
  s=p.read_text(errors='replace');page=Page(s)
  if "Content-Security-Policy" not in s or 'shared/platform.js' not in s:errors.append('Missing platform boundary: '+str(p.relative_to(BASE)))
  for tag,a in page.nodes:
   if tag not in ['script','img','iframe','source','video','audio','link']:continue
   if tag=='link' and a.get('rel') not in ['stylesheet','icon','shortcut icon','apple-touch-icon','manifest','preload']:continue
   value=a.get('src') or a.get('href') or ''
   if not value or value.startswith(('data:','blob:','#')):continue
   if value.startswith(('http:','https:','//')):errors.append(f'External {tag}: {p.relative_to(BASE)}: {value}');continue
   target=BASE/unquote(urlsplit(value).path).lstrip('/') if value.startswith('/') else p.parent/unquote(urlsplit(value).path)
   if target.is_dir():target=target/'index.html'
   if not target.is_file():resources.append({'game':g['id'],'file':str(p.relative_to(BASE)),'tag':tag,'url':value})
 for p in (BASE/'games'/g['id']).rglob('*'):
  if p.is_file() and p.stat().st_size<250 and p.read_bytes().startswith(b'version https://git-lfs'):errors.append('Git LFS pointer in runtime: '+str(p.relative_to(BASE)))
report={'games':len(ids),'errors':errors,'missingResources':resources}
(ROOT/'reports').mkdir(exist_ok=True)
(ROOT/'reports/dependencies.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'games':len(ids),'errors':len(errors),'missingResources':len(resources)},ensure_ascii=False))
for e in errors[:30]:print(e)
for e in resources[:30]:print(e)
sys.exit(bool(errors or resources))
