"""Build the reviewable game registry from local entrypoints, never from directory names alone."""
from pathlib import Path
from html.parser import HTMLParser
from PIL import Image,ImageOps
import json,re,html,hashlib,shutil
ROOT=Path(__file__).resolve().parents[1]
GAMES=ROOT/'games'
EXCLUDED={
 'cookieclicker':'Publisher notice explicitly forbids rehosting; excluded from publication.',
 'flappybird':'PlayCanvas scene and asset files are missing; local 3D variant is available.',
 'avatar':'Shared poker artwork, not a game.',
 '1v1lol':'Empty AlgebraHelper page; no game runtime.',
 '8ball':'Missing proxy endpoint; no local pool game.',
 'bloonstd4':'Broken proxy duplicate of Bloons TD 4.',
 'awesometanks':'Incomplete TurboWarp export: engine and project data are missing.',
 'cuttherope':'Remote GamePix loader without local game assets.',
 'cuttherope2':'Remote GamePix loader without local game assets.',
 'fnaf':'Empty proxy page without game files.', 'fnaf2':'Empty proxy page without game files.',
 'fnaf3':'Empty proxy page without game files.', 'fnaf4':'Empty proxy page without game files.',
 'elasticmorty':'Empty proxy page without game files.', 'survivio':'Empty proxy page without game files.',
 'pvz':'Third-party iframe; no self-hosted runtime.',
 'webretro':'Emulator requiring external ROMs, not a standalone game.',
 'supersmashbros':'Missing emulator runtime.',
 'slope':'Unity assets are Git LFS pointers, not playable binaries.',
 'yohoho':'Entry HTML is missing the game interface and initialization.',
 'gif':'GIF utility, not a game.',
 'basketball-stars':'Duplicate of basketballstars.',
 'driftboss':'Duplicate of drift-boss.',
 'firewater':'Duplicate of fireboy-and-watergirl-1.',
 'chrome-dino':'Duplicate dinosaur runner; use dino.',
 'dinosaur':'Duplicate dinosaur runner; use dino.',
 'doodle-jump':'Duplicate of dj.', 'doodlejump':'Duplicate of dj.',
 'flappy_bird':'Duplicate flappy game; use flappybird.',
 'snake':'Duplicate of snake-retro.', 'tetris':'Duplicate of tetris-retro.', 'tictactoe':'Duplicate of tictactoe-retro.'
}
TITLES={
 'connect-four':'Чотири в ряд','sudoku':'Судоку','nonogram':'Нонограми','simon-memory':'Світлова пам’ять',
 '1on1soccer':'1 on 1 Soccer','2drocketleague':'Rocket League 2D','60sburgerrun':'60 Seconds Burger Run',
 'achieveunlocked':'Achievement Unlocked','achieveunlocked2':'Achievement Unlocked 2','adarkroom':'A Dark Room',
 'adofai':'A Dance of Fire and Ice','agario-offline':'Agar Arena Offline','ageofwar':'Age of War','amongus':'Among Us',
 'asciispace':'ASCII Space','astray':'Astray','audio-game':'Audio Game','badicecream':'Bad Ice Cream',
 'badicecream2':'Bad Ice Cream 2','badicecream3':'Bad Ice Cream 3','badpiggies':'Bad Piggies',
 'badtimesimulator':'Bad Time Simulator','basketballstars':'Basketball Stars','basketbros':'Basket Bros',
 'basketrandom':'Basket Random','boxingrandom':'Boxing Random','blackholesquare':'Black Hole Square',
 'bobtherobber2':'Bob the Robber 2','bp':'Block the Pig','breaker':'Neon Breaker','breaklock':'BreakLock',
 'btd':'Bloons Tower Defense','btd2':'Bloons Tower Defense 2','btd3':'Bloons Tower Defense 3',
 'btd4':'Bloons Tower Defense 4','btd5':'Bloons Tower Defense 5','canvas-untangle-game':'Untangle',
 'captaincallisto':'Captain Callisto','chromaincident':'Chroma Incident','clicker':'Cyber Hack',
 'clickerheroes':'Clicker Heroes','connect3':'Connect 3','cookieclicker':'Cookie Clicker',
 'css3-matching-game':'Memory Match','cuttheropeholiday':'Cut the Rope: Holiday',
 'cuttheropetimetravel':'Cut the Rope: Time Travel','dj':'Doodle Jump','dino':'Dino Runner',
 'doctor-acorn2':'Doctor Acorn 2','doctor-acorn3':'Doctor Acorn 3','doge2048':'Doge 2048',
 'drift-boss':'Drift Boss','drivemad':'Drive Mad','ducklife':'Duck Life','ducklife2':'Duck Life 2','ducklife3':'Duck Life 3',
 'edgenotfound':'Edge Not Found','escapingtheprison':'Escaping the Prison',
 'factoryballsforever':'Factory Balls Forever','fireboy-and-watergirl-1':'Fireboy & Watergirl: Forest Temple',
 'fireboy-and-watergirl-2':'Fireboy & Watergirl: Light Temple',
 'fireboy-and-watergirl-3':'Fireboy & Watergirl: Ice Temple',
 'fireboy-and-watergirl-4':'Fireboy & Watergirl: Crystal Temple',
 'flappybird':'Flappy Bird','flappybird-retro':'Flappy Bird 3D','flappydot':'Flappy Dot','gh':'Ghost Hunt',
 'gn':'Guess the Number','gopher':'Gopher Kart','gorilla':'Gorillas','gunmayhem2':'Gun Mayhem 2',
 'holeio':'Hole.io','icypurplehead2':'Icy Purple Head 2','icypurplehead3':'Icy Purple Head 3',
 'jetpackjoyride':'Jetpack Joyride','learntofly':'Learn to Fly','mc':'Memory Cards',
 'mcbeta1.3':'Eaglercraft Beta','minecraft':'Block World','motox3m':'Moto X3M',
 'ninjavsevilcorp':'Ninja vs Evilcorp','paperio':'Paper.io 2','particleclicker':'Particle Clicker',
 'physicsplayground':'Physics Playground','pingpoing':'Ping Pong','radiusraid':'Radius Raid',
 'rb':'Rocket Battles','rcs':'Rock Paper Scissors','retrobowl':'Retro Bowl','roadblocks':'Roadblocks',
 'rooftopsniper':'Rooftop Snipers','run3':'Run 3','sh':'Stickman Hero','shuttledeck':'Shuttledeck',
 'skibiditoilet':'Skibidi Toilet 1v100','skibiditoiletattack':'Skibidi Toilet Attack',
 'slitherio-offline':'Snake Arena Offline','snowrider3d':'Snow Rider 3D','spacecompany':'Space Company',
 'spacegarden':'Space Garden','spacehuggers':'Space Huggers','spaceinvaders':'Space Invaders',
 'stacktower':'Stack Tower','subway-surfers':'Subway Surfers','subway-surfers-ny':'Subway Surfers: New York',
 'supermeatboy':'Super Meat Boy','supersmashflash':'Super Smash Flash','sw':'Alien Invasion',
 'tabs':'Battle Simulator','tetris-retro':'Tamatris','theimpossiblegame':'The Impossible Game',
 'thereisnogame':'There Is No Game','thisistheonlylevel':'This Is the Only Level',
 'thisistheonlylevel2':'This Is the Only Level 2','tictactoe-retro':'Tic Tac Toe',
 'timeshooter1':'Time Shooter','tinyfishing':'Tiny Fishing','towermaster':'Tower Master',
 'ts':'Typing Speed','wbwwb':'We Become What We Behold','wg':'Guess the Word',
 'worldshardestgame':"The World’s Hardest Game",'xx142-b2exe':'xx142-b2.exe'
}
MOBILE=set('connect-four sudoku nonogram simon-memory 2048 adarkroom amongus badicecream badicecream2 badicecream3 ball-shooting basketballstars basketrandom boxingrandom bitlife blackholesquare bp breaker breaklock canvas-untangle-game chess clicker clickerheroes coloron connect3 cookieclicker count-99 css3-matching-game cube cuttheropeholiday cuttheropetimetravel dino dj doctor-acorn2 doctor-acorn3 doge2048 dogeminer drift-boss drivemad edge-surf factoryballsforever flappy-2048 flappybird flappybird-retro flappydot gh gn gorilla hangman hextris holeio icypurplehead2 icypurplehead3 jetpackjoyride maze mc menja minesweeper motox3m multiply-defense packabunchas pacman paperio particleclicker physicsplayground poker pushback rcs roadblocks rush sandbox sh shuttledeck skibiditoiletattack slitherio-offline spacecompany spacegarden spacehuggers spaceinvaders stack stacktower subway-surfers subway-surfers-ny sw tetris-retro tictactoe-retro tinyfishing towermaster vex3 vex4 vex5 walls wbwwb weavesilk wg wordle'.split())
PUZZLE=set('connect-four sudoku nonogram simon-memory 2048 blackholesquare bp breaklock canvas-untangle-game chess connect3 count-99 css3-matching-game cube doge2048 factoryballsforever flappy-2048 gn hangman hextris konnekt maze mc minesweeper packabunchas poker roadblocks rcs tictactoe-retro wg wordle'.split())
RACING=set('2drocketleague box2d-car-game drift-boss drivemad gopher motox3m racer snowrider3d subway-surfers subway-surfers-ny'.split())
STRATEGY=set('adarkroom ageofwar btd btd2 btd3 btd4 btd5 clicker clickerheroes cookieclicker dogeminer particleclicker spacecompany universal-paperclips'.split())
ACTION=set('asciispace asteroids bounceback captaincallisto gh gunmayhem2 menja multiply-defense q1k3 radiusraid rb skibiditoilet skibiditoiletattack spacehuggers spaceinvaders sw timeshooter1 underrun xx142-b2exe'.split())
COVERS=ROOT/'shared/covers';COVERS.mkdir(parents=True,exist_ok=True)
previous={}
if (ROOT/'catalog.json').exists():previous={x['id']:x for x in json.loads((ROOT/'catalog.json').read_text())['games']}
rows=[]
for folder in sorted(GAMES.iterdir()):
 if not folder.is_dir() or folder.name in EXCLUDED:continue
 gid=folder.name;entry=folder/'play/index.html' if (folder/'play/index.html').exists() else folder/'index.html'
 if not entry.exists():continue
 src=entry.read_text(errors='replace');t=re.search(r'<title[^>]*>(.*?)</title>',src,re.I|re.S)
 title=TITLES.get(gid,html.unescape(t.group(1)).split('|')[0].strip() if t else gid.replace('-',' ').title())
 if title.lower() in ['document','index','']:title=gid.replace('-',' ').title()
 kind='flash' if 'ruffle/ruffle.js' in src else 'html5'
 category='puzzle' if gid in PUZZLE else 'racing' if gid in RACING else 'strategy' if gid in STRATEGY else 'action' if gid in ACTION else 'arcade'
 controls='touch' if gid in MOBILE else 'keyboard'
 if gid in MOBILE:instructions='Торкання або миша; підказки керування — у грі.'
 else:instructions='Клавіатура й миша. Стрілки або WASD — рух; Space — дія. Деталі — у грі.'
 if kind=='flash':instructions='Миша й клавіатура. Натисніть на гру для активації керування.'
 cover=None
 candidates=[folder/'cover.svg',folder/'icon.png',folder/'cover.png',folder/'splash.png',folder/'favicon.png']
 candidates+=list(folder.glob('*.webp'))+list(folder.glob('*.jpg'))+list(folder.glob('*.png'))
 for p in candidates:
  if not p.exists():continue
  try:
   if p.suffix=='.svg':
    text=p.read_text()
    if '<svg' in text and not re.search(r'(?:href|url)\s*[=(]\s*[\'"]?https?:',text):
     cover=f'shared/covers/{gid}.svg';shutil.copyfile(p,ROOT/cover);break
   im=Image.open(p)
   if im.width<48 or im.height<48:continue
   im=ImageOps.fit(im.convert('RGB'),(480,270),method=Image.Resampling.LANCZOS)
   cover=f'shared/covers/{gid}.webp';im.save(ROOT/cover,quality=80);break
  except Exception:continue
 if not cover:
  cover=f'shared/covers/{gid}.svg';color={'arcade':'#86d4c1','puzzle':'#e4c98e','racing':'#e59e83','strategy':'#b8b2ed','action':'#89b6e8'}[category]
  title_xml=html.escape(title)
  (ROOT/cover).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="480" height="270" viewBox="0 0 480 270"><rect width="480" height="270" fill="#101a2b"/><circle cx="330" cy="65" r="140" fill="{color}" opacity=".1"/><path d="M204 58h72v72h-72z M168 94h72v72h-72z" fill="none" stroke="{color}" stroke-width="5"/><text x="28" y="206" fill="{color}" font-family="system-ui,sans-serif" font-size="22">{title_xml}</text><text x="28" y="241" fill="#c1c9d5" font-family="system-ui,sans-serif" font-size="12">AUTHORCHE GAMES</text></svg>')
 row={'id':gid,'title':title,'category':category,'entry':str(entry.relative_to(ROOT)),'cover':cover,'kind':kind,'controls':controls,'instructions':instructions,'devices':{'desktop':True,'android':gid in MOBILE and kind!='flash','ios':gid in MOBILE and kind!='flash'},'review':'candidate'}
 if previous.get(gid,{}).get('review')=='verified':
  row['review']='verified';row['devices']=previous[gid]['devices']
 rows.append(row)
(ROOT/'catalog.json').write_text(json.dumps({'version':2,'games':rows,'excluded':EXCLUDED},ensure_ascii=False,indent=2)+'\n')
print(len(rows),'unique game candidates;',len(EXCLUDED),'excluded entries')
