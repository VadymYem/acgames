"""Generate a bounded local resource manifest for the optional offline library."""
from pathlib import Path
import json,sys
base=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path(__file__).resolve().parents[1]/'dist'
data=json.loads((base/'catalog.json').read_text())
original={'klondike','spider','mahjong','sokoban','wordsearch','draughts','reversi','battleship','fruit-merge','music-lab'}
classic={'connect-four','sudoku','nonogram','simon-memory'}
games=[]
for game in data['games']:
 if game['id'] not in original|classic or not any(game['devices'].values()):continue
 files=[str(p.relative_to(base)) for p in (base/'games'/game['id']).rglob('*') if p.is_file() and p.suffix not in ['.map','.zip']]
 deps=['shared/platform.js','shared/controls.js','shared/controls.css']+(['shared/arcade-core.js','shared/arcade.js','shared/arcade.css'] if game['id'] in original else ['shared/classics-core.js','shared/classics.js','shared/classics.css'])
 files=sorted(set(files+deps+[game['cover']]))
 if len(files)>80 or any(not(base/file).is_file() for file in files):raise ValueError('Incomplete offline game: '+game['id'])
 size=sum((base/file).stat().st_size for file in files)
 if size>5*1024*1024:raise ValueError('Offline game exceeds budget: '+game['id'])
 games.append({'id':game['id'],'title':game['title'],'files':files,'bytes':size})
(base/'offline-manifest.json').write_text(json.dumps({'buildRevision':data.get('buildRevision','source'),'games':games},ensure_ascii=False,indent=2)+'\n')
print('Offline resources verified for',len(games),'small local games')
