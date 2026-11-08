"""Build the original local game pages and retain reviewed compatibility flags."""
from pathlib import Path
import html, json
ROOT=Path(__file__).resolve().parents[1]
games=[
 ('klondike','Косинка','puzzle','Пасьянс із колодою 52 карти та відкриттям по одній карті.','Складайте основи від туза до короля за мастю. У стовпцях карти йдуть за спаданням із чергуванням кольорів. Порожній стовпець починається з короля. Оберіть карту, потім потрібний стовпець або основу. Доступні скасування ходу та збереження партії.'),
 ('spider','Павук','puzzle','Пасьянс «Павук» з однією мастю, 104 картами й вісьмома послідовностями.','Зберіть вісім послідовностей від короля до туза. Переміщуйте спадні послідовності на карту на один ранг старшу або в порожній стовпець. Для нової роздачі заповніть усі десять стовпців. На вузькому екрані поле можна гортати горизонтально.'),
 ('mahjong','Маджонг-пасьянс','puzzle','Компактна головоломка з 36 плитками й гарантовано розв’язним початковим полем.','Прибирайте пари однакових плиток. Плитка вільна, коли її не накриває інша і хоча б один бічний край відкритий. Якщо доступних пар не залишилося, скасуйте попередню пару. Підказка показує доступну пару, але не гарантує успішного завершення обраного шляху.'),
 ('sokoban','Сокобан','puzzle','Десять авторських рівнів із ящиками та локальний редактор власних головоломок.','Пересуньте всі ящики на цілі. Ящик можна штовхати, але не тягнути; два ящики одночасно не рухаються. Керуйте стрілками, WASD або кнопками під полем. У редакторі оберіть інструмент і торкніться клітинки. Власні рівні зберігаються лише у вашому браузері.'),
 ('wordsearch','Пошук слів','puzzle','Знаходьте слова українською, німецькою та англійською.','Оберіть першу, а потім останню літеру слова. Слова можуть читатися у восьми напрямках. На клавіатурі переміщуйте фокус стрілками та обирайте літери Enter або пробілом. Мову можна змінити над полем; це починає нову головоломку.'),
 ('draughts','Шашки 8 × 8','strategy','Англійські шашки проти комп’ютера або друга на одному пристрої.','Світлі починають. Прості шашки ходять і б’ють уперед; дамки — на одну клітинку по діагоналі в обидва боки. Взяття обов’язкове, ланцюжок взяттів потрібно завершити. Перетворення на дамку завершує хід. Оберіть шашку, потім послідовно клітинки маршруту. За 40 ходів кожного без взяття чи руху простої шашки настає нічия.'),
 ('reversi','Реверсі','strategy','Стратегія на полі 8 × 8 з комп’ютером та локальним режимом удвох.','Поставте фішку так, щоб затиснути ряд фішок суперника між своєю новою та вже наявною фішкою. Усі затиснуті ряди перевертаються. Якщо ходів немає, хід пропускається автоматично. Коли обоє не можуть ходити, перемагає той, хто має більше фішок.'),
 ('battleship','Морський бій','strategy','Класичний флот із десяти кораблів проти локального комп’ютерного суперника.','Перед початком можна змінити автоматичну розстановку власного флоту. Кораблі не торкаються навіть кутами. Натисніть «Почати бій» і стріляйте на полі суперника. Влучання дає додатковий постріл. Уся партія виконується локально без підключення до іншого гравця.'),
 ('fruit-merge','Фруктовий кошик','arcade','Об’єднуйте однакові фрукти й створюйте більші у власному кошику.','Оберіть позицію повзунком або стрілками та скиньте фрукт кнопкою, пробілом чи торканням кошика. Однакові фрукти при зіткненні об’єднуються. Не допускайте заповнення кошика вище пунктирної лінії. Гру можна призупинити та скасувати останнє скидання.'),
 ('music-lab','Музична майстерня','puzzle','Тренуйте музичний слух та відчуття ритму в коротких вправах.','Оберіть вправу й натисніть «Прослухати». У нотах перший звук — До, потрібно впізнати другий. В інтервалах визначте відстань між двома звуками. У ритмі прослухайте чотири удари й відтворіть темп чотирма натисканнями. Почніть із комфортної гучності. Мікрофон не потрібний.')
]
data=json.loads((ROOT/'catalog.json').read_text())
existing={g['id']:g for g in data['games']}
for index,(slug,title,category,description,rules) in enumerate(games):
 folder=ROOT/'games'/slug;folder.mkdir(parents=True,exist_ok=True)
 page=f'''<!doctype html>
<html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta http-equiv="Content-Security-Policy" content="default-src 'self' data: blob:; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'"><meta name="robots" content="noindex,follow"><title>{html.escape(title)} — AuthorChe Games</title><meta name="description" content="{html.escape(description)}"><link rel="stylesheet" href="../../shared/arcade.css"><script src="../../shared/platform.js"></script></head>
<body><main class="arcade-shell" id="arcade" data-game="{slug}"><header class="arcade-head"><a href="../../">AuthorChe Games</a><small>Локальна гра · без реклами</small></header><h1>{html.escape(title)}</h1><p class="arcade-rules">{html.escape(description)}</p><p id="daily"></p><div class="arcade-tools" id="tools"></div><p class="arcade-status" id="status" role="status" aria-live="polite"></p><div id="board"></div><p id="record" class="arcade-footnote"></p><details class="arcade-help"><summary>Правила та керування</summary><p>{html.escape(rules)}</p></details><p class="arcade-footnote" id="storage-note">Прогрес і рекорди зберігаються у цьому браузері. Для гри не потрібен акаунт.</p></main><script src="../../shared/arcade-core.js"></script><script src="../../shared/arcade.js"></script></body></html>'''
 (folder/'index.html').write_text(page+'\n')
 game=existing.get(slug)
 if game is None:
  game={'id':slug,'title':title,'category':category,'entry':f'games/{slug}/index.html','cover':f'shared/covers/{slug}.svg','kind':'html5','controls':'touch','instructions':rules,'devices':dict.fromkeys(['desktop','android','ios'],False),'candidateDevices':dict.fromkeys(['desktop','android','ios'],True),'verification':dict.fromkeys(['desktop','android','ios'],'needs-review'),'review':'original-awaiting-gameplay-test'}
  data['games'].append(game)
 game.update(description=description,rules=rules,features={'touch':True,'keyboard':True,'gamepad':False,'local2p':slug in ['draughts','reversi'],'quick':slug not in ['spider','klondike','battleship'],'offline':True,'progress':True,'daily':slug in ['wordsearch','sokoban','music-lab','mahjong']},author='AuthorChe',license='MIT')
 # Original SVG board artwork, not an upstream screenshot.
 art=[]
 if slug in ['klondike','spider']:
  for i in range(5):art.append(f'<g transform="translate({114+i*45},{57+(i%2)*12}) rotate({(i-2)*5})"><rect width="75" height="102" rx="7" fill="#f5f0dc"/><text x="12" y="30" fill="{("#a52e46" if i%2 else "#122c3b")}" font-size="25">{["A","K","Q","J","10"][i]}</text><text x="38" y="75" fill="{("#a52e46" if i%2 else "#122c3b")}" font-size="35">{["♠","♥","♣","♦","♠"][i]}</text></g>')
 elif slug=='music-lab':
  art.append('<path d="M128 104H352M128 116H352M128 128H352M128 140H352M128 152H352" stroke="#7694a9" stroke-width="2"/><g fill="#8be4d2"><ellipse cx="190" cy="142" rx="15" ry="10" transform="rotate(-20 190 142)"/><ellipse cx="290" cy="117" rx="15" ry="10" transform="rotate(-20 290 117)"/></g><path d="M203 138V73L303 48V113M203 84L303 59" fill="none" stroke="#8be4d2" stroke-width="8"/>')
 elif slug=='fruit-merge':
  for x,y,r,c in [(180,151,39,'#eda254'),(249,148,31,'#9fc95c'),(304,162,25,'#e45f87'),(222,89,24,'#e8c85b'),(280,100,18,'#58aeca')]:art.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}" stroke="#e4efdb" stroke-width="2"/><ellipse cx="{x+5}" cy="{y-r}" rx="10" ry="4" fill="#94d389" transform="rotate(-30 {x+5} {y-r})"/>')
  art.append('<path d="M129 58V192H351V58" fill="none" stroke="#8fa5b6" stroke-width="4"/>')
 elif slug=='mahjong':
  for i in range(12):
   x=135+i%4*53;y=56+i//4*43;art.append(f'<rect x="{x}" y="{y}" width="45" height="38" rx="5" fill="#f2eddb" stroke="#789293" stroke-width="2"/><text x="{x+23}" y="{y+26}" text-anchor="middle" fill="{["#164c4b","#ab3450","#26334c"][i%3]}" font-size="24">{["●","✦","▰"][i%3]}</text>')
 else:
  for y in range(6):
   for x in range(8):
    px=139+x*26;py=47+y*26;color='#346161' if (x+y)%2 else '#244753'
    art.append(f'<rect x="{px}" y="{py}" width="24" height="24" rx="3" fill="{color}"/>')
    if slug in ['reversi','draughts'] and (x+y)%3==0:art.append(f'<circle cx="{px+12}" cy="{py+12}" r="9" fill="{("#f0edda" if x%2 else "#0b192c")}" stroke="#9caeb7"/>')
    elif slug=='wordsearch':art.append(f'<text x="{px+12}" y="{py+18}" text-anchor="middle" fill="#e6f0e6" font-size="16">{"AUTHORCHEGAMES"[(x+y*8)%13]}</text>')
    elif slug=='sokoban' and (x,y) in [(3,2),(5,3),(3,4)]:art.append(f'<rect x="{px+3}" y="{py+3}" width="18" height="18" rx="2" fill="#e9b963"/><path d="M{px+4} {py+4}l16 16m0-16l-16 16" stroke="#76613e"/>')
    elif slug=='battleship' and ((y==2 and 1<x<6) or (y==4 and 3<x<7)):art.append(f'<rect x="{px+3}" y="{py+4}" width="18" height="16" fill="#8fb0bc" rx="4"/>')
 cover=f'<svg xmlns="http://www.w3.org/2000/svg" width="480" height="270" viewBox="0 0 480 270"><rect width="480" height="270" rx="18" fill="#0c192b"/><circle cx="398" cy="23" r="112" fill="#17353d"/><circle cx="63" cy="240" r="104" fill="#182b45"/>{"".join(art)}<text x="240" y="239" text-anchor="middle" fill="#eaf2f5" font-family="system-ui,sans-serif" font-size="20" font-weight="650">{html.escape(title)}</text><text x="20" y="25" fill="#8be4d2" font-family="system-ui,sans-serif" font-size="10" letter-spacing="2">AUTHORCHE GAMES</text></svg>\n'
 cover_path=ROOT/game['cover'];cover_path.parent.mkdir(parents=True,exist_ok=True);cover_path.write_text(cover)
 (folder/'LICENSE').write_text('MIT License\n\nCopyright (c) 2026 AuthorChe / Vadym Yemelianov\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n')
(ROOT/'catalog.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print('Prepared 10 original games; existing device verification retained.')
