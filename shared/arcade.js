(function () {
  'use strict';
  const C = window.AuthorCheArcade, root = document.getElementById('arcade'), id = root.dataset.game;
  const query = new URLSearchParams(location.search), daily = /^\d{4}-\d{2}-\d{2}$/.test(query.get('daily') || '') ? query.get('daily') : '';
  const lowPower = query.get('quality') === 'low' || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const key = 'ac_arcade_v1:' + id + (daily ? ':' + daily : '');
  const status = document.getElementById('status'), tools = document.getElementById('tools'), board = document.getElementById('board');
  const freshSeed = () => daily || Date.now() + ':' + Math.random();
  let state, history = [], generation = 0, storageOK = true;
  function get(k) {try {return JSON.parse(localStorage.getItem(k));} catch (_) {return null;}}
  function put(k,v) {try {localStorage.setItem(k,JSON.stringify(v));} catch (_) {storageOK=false;document.getElementById('storage-note').textContent='Браузер заборонив збереження. Ця партія доступна, доки сторінка відкрита.';}}
  function save() {put(key,{version:1,state,history:history.slice(-50)});root.dataset.moves=String(state.moves ?? state.steps ?? 0);}
  function load(make, valid) {
    const value=get(key);
    if(value?.version===1 && valid(value.state)) {state=value.state;history=Array.isArray(value.history)?value.history.filter(valid).slice(-50):[];say('Партію відновлено на цьому пристрої.');}
    else state=make();
  }
  function say(text) {status.textContent=text;}
  function button(text, action, parent=tools) {const b=document.createElement('button');b.type='button';b.textContent=text;b.addEventListener('click',action);parent.append(b);return b;}
  function select(label, options, action, initial) {
    const l=document.createElement('label'),s=document.createElement('select');s.setAttribute('aria-label',label);l.append(document.createTextNode(label+' '));
    for(const [value,text] of options){const o=document.createElement('option');o.value=value;o.textContent=text;s.append(o);}if(initial!==undefined)s.value=String(initial);
    s.addEventListener('change',()=>action(s.value));l.append(s);tools.append(l);return s;
  }
  function stash() {history.push(C.clone(state));if(history.length>50)history.shift();}
  function score(value, lower=false) {
    const k='ac_arcade_record:'+id, previous=get(k), better=!Number.isFinite(previous)||(lower?value<previous:value>previous);if(better)put(k,value);
    document.getElementById('record').textContent='Особистий рекорд: '+(better?value:previous);
    if(parent!==window)parent.postMessage({source:'authorche-game',type:'ac-game-progress',id,record:better?value:previous,complete:true},'https://authorche.top');
  }
  function reset(make, render) {generation++;history=[];state=make();save();render();}
  function grid(columns, count, handler, className='') {
    board.replaceChildren();const g=document.createElement('div');g.className='square-board '+className;g.style.setProperty('--columns',columns);g.setAttribute('role','group');g.setAttribute('aria-label','Ігрове поле');
    for(let i=0;i<count;i++){const b=button('',()=>handler(i),g);b.className='cell';b.dataset.cell=i;b.tabIndex=i? -1:0;}
    g.addEventListener('keydown',event=>{const active=event.target.closest('[data-cell]');if(!active)return;let i=+active.dataset.cell,n=i;if(event.key==='ArrowLeft')n=Math.max(0,i-1);else if(event.key==='ArrowRight')n=Math.min(count-1,i+1);else if(event.key==='ArrowUp')n=Math.max(0,i-columns);else if(event.key==='ArrowDown')n=Math.min(count-1,i+columns);else if(event.key==='Home')n=0;else if(event.key==='End')n=count-1;else return;event.preventDefault();g.querySelectorAll('[data-cell]').forEach(b=>{b.tabIndex=+b.dataset.cell===n?0:-1;});g.children[n].focus();});
    board.append(g);return Array.from(g.children);
  }
  function restoreFocus(index) {if(index!==null&&index!==undefined){const b=board.querySelector('[data-cell="'+index+'"]');if(b){board.querySelectorAll('[data-cell]').forEach(c=>{c.tabIndex=-1;});b.tabIndex=0;b.focus({preventScroll:true});}}}
  const boardValid = s => s && Array.isArray(s.board) && s.board.length===64 && s.board.every(v=>Number.isInteger(v)&&Math.abs(v)<=2) && [1,-1].includes(s.player) && Number.isFinite(s.moves);
  function discs(draughts=false) {
    const make=()=>({board:draughts?C.draughtsBoard():C.reversiBoard(),player:1,moves:0,local:false,quiet:0,positions:[]});
    load(make,boardValid);let selected=[],busy=false;
    const mode=select('Режим',[['bot','Проти комп’ютера'],['local','Удвох на одному пристрої']],value=>{reset(()=>({...make(),local:value==='local'}),render);selected=[];busy=false;render();},state.local?'local':'bot');
    button('Нова партія',()=>{const local=mode.value==='local';reset(()=>({...make(),local}),render);busy=false;selected=[];render();});
    button('Скасувати хід',()=>{if(!history.length)return;generation++;state=history.pop();if(!state.local&&state.player===-1&&history.length)state=history.pop();selected=[];busy=false;save();render();turn();});
    const moves=()=>draughts?C.draughtsMoves(state.board,state.player):C.reversiMoves(state.board,state.player);
    function finishOrPass() {
      const available=moves();if(available.length)return false;
      if(draughts){state.ended=true;save();say((state.player===1?'Світлі':'Темні')+' не мають ходів. Перемогли '+(state.player===1?'темні.':'світлі.'));score(state.player===-1?1:0);return true;}
      if(C.reversiMoves(state.board,-state.player).length){state.player*=-1;save();render();say('Ходів немає — хід переходить супернику.');return false;}
      state.ended=true;save();const total=state.board.reduce((n,v)=>n+v,0);say(total===0?'Нічия.':(total>0?'Світлі':'Темні')+' перемогли!');score(state.board.filter(v=>v===1).length);return true;
    }
    function commit(move) {
      stash();const before=state.board;
      state.board=draughts?C.draughtsPlay(before,move):C.reversiPlay(before,move,state.player);
      if(draughts)state.quiet=move.taken.length||Math.abs(before[move.path[0]])===1?0:state.quiet+1;
      state.player*=-1;state.moves++;selected=[];save();render();turn();
    }
    function turn() {
      if(state.ended){render(true);return;}
      if(finishOrPass()){busy=false;render(true);return;}
      if(draughts&&state.quiet>=80){state.ended=true;save();say('Нічия: 40 ходів кожного гравця без взяття чи руху простої шашки.');render(true);return;}
      if(!state.local&&state.player===-1){busy=true;const run=generation;say('Комп’ютер обмірковує хід…');setTimeout(()=>{if(run!==generation)return;busy=false;const m=draughts?C.draughtsBest(state.board,-1,3):C.reversiBest(state.board,-1,3);if(m!==null)commit(m);},lowPower?0:230);}
    }
    function choose(index) {
      if(state.ended||busy||!state.local&&state.player===-1)return;
      const possible=moves();if(!possible.length)return;
      if(!draughts){if(possible.includes(index))commit(index);return;}
      if(Math.sign(state.board[index])===state.player){selected=[index];render(false,index);return;}
      if(!selected.length)return;
      const candidates=possible.filter(m=>selected.every((v,i)=>m.path[i]===v)&&m.path[selected.length]===index);
      if(!candidates.length){selected=[];render(false,index);return;}
      selected.push(index);const complete=candidates.find(m=>m.path.length===selected.length);
      if(complete){commit(complete);restoreFocus(index);}else render(false,index);
    }
    function render(done=false,focus=null) {
      const legal=moves(),cells=grid(8,64,choose);cells.forEach((cell,i)=>{
        if(draughts)cell.classList.add((Math.floor(i/8)+i%8)%2?'dark-square':'light-square');
        const v=state.board[i];if(v){const disc=document.createElement('span');disc.className='disc '+(v===1||v===2?'white':'black');disc.textContent=Math.abs(v)===2?'♛':'';disc.setAttribute('aria-hidden','true');cell.append(disc);}
        cell.setAttribute('aria-label',String.fromCharCode(65+i%8)+(8-Math.floor(i/8))+': '+(v?(v>0?'світла':'темна')+(Math.abs(v)===2?' дамка':' фігура'):'порожньо'));
        if(!done&&(!draughts?legal.includes(i):selected.length&&legal.some(m=>selected.every((v,j)=>m.path[j]===v)&&m.path[selected.length]===i)))cell.classList.add('legal');
        if(selected.includes(i))cell.classList.add('marked');
      });
      const a=state.board.filter(v=>v>0).length,b=state.board.filter(v=>v<0).length;
      root.dataset.moves=state.moves;
      if(!done&&!busy)say((state.player===1?'Світлі':'Темні')+' ходять · '+a+' : '+b+(draughts&&legal.some(m=>m.taken.length)?' · Взяття обов’язкове.':''));
      restoreFocus(focus);
    }
    render();turn();
  }
  function sokoban() {
    const customKey='ac_sokoban_custom_v1', custom=get(customKey), extra=Array.isArray(custom)?custom.filter(rows=>Array.isArray(rows)&&rows.length===7&&rows.every(r=>typeof r==='string'&&r.length===7)).slice(0,10):[];
    const levels=()=>C.sokobanLevels.concat(extra),initial=daily?Math.floor(C.random(daily)()*C.sokobanLevels.length):0;
    const make=(level=initial)=>({...C.sokobanParse(levels()[level]),level});
    load(make,s=>s&&Number.isInteger(s.level)&&s.level>=0&&s.level<levels().length&&Array.isArray(s.boxes)&&s.walls&&s.goals&&Number.isInteger(s.player));
    let editing=false,rows=[],brush='#';
    const level=select('Рівень',levels().map((_,i)=>[String(i),i<C.sokobanLevels.length?String(i+1):'Власний '+(i-C.sokobanLevels.length+1)]),value=>{editing=false;reset(()=>make(+value),render);},state.level);
    button('Спочатку',()=>{editing=false;reset(()=>make(+level.value),render);});
    button('Скасувати хід',()=>{if(!history.length||editing)return;state=history.pop();save();render();});
    button('Наступний рівень',()=>{level.value=String((state.level+1)%levels().length);editing=false;reset(()=>make(+level.value),render);});
    button('Редактор рівнів',()=>{editing=!editing;if(editing){rows=Array.from({length:7},(_,y)=>Array.from({length:7},(_,x)=>x===0||x===6||y===0||y===6?'#':' '));rows[5][3]='@';}render();});
    const editor=document.createElement('div');editor.className='editor-tools';board.before(editor);
    for(const [ch,text] of [['#','Стіна'],[' ','Підлога'],['.','Ціль'],['$','Ящик'],['@','Гравець'],['*','Ящик на цілі']])button(text,()=>{brush=ch;Array.from(editor.children).forEach(b=>b.setAttribute('aria-pressed',b.textContent===text));},editor);
    button('Зберегти власний рівень',()=>{
      const parsed=C.sokobanParse(rows.map(r=>r.join(''))),players=rows.flat().filter(ch=>'@+'.includes(ch)).length;
      if(players!==1||!parsed.boxes.length||parsed.boxes.length!==parsed.goals.length||parsed.boxes.length>8){say('Потрібен один гравець та однакова кількість ящиків і цілей — від 1 до 8.');return;}
      if(extra.length>=10){say('Уже збережено 10 власних рівнів.');return;}extra.push(rows.map(r=>r.join('')));put(customKey,extra);const option=document.createElement('option');option.value=levels().length-1;option.textContent='Власний '+extra.length;level.append(option);level.value=option.value;editing=false;reset(()=>make(+option.value),render);say('Рівень збережено. Його розв’язність ще потрібно перевірити грою.');
    },editor);
    const pad=document.createElement('div');pad.className='dpad';board.after(pad);
    for(const [label,dx,dy] of [['↑',0,-1],['←',-1,0],['↓',0,1],['→',1,0]]){const b=button(label,()=>move(dx,dy),pad);b.setAttribute('aria-label','Рух '+label);}
    function move(dx,dy){if(editing||C.sokobanWon(state))return;const next=C.sokobanMove(state,dx,dy);if(!next)return;stash();state=next;save();render();if(C.sokobanWon(state)){say('Рівень пройдено! Кроків: '+state.steps+', штовхань: '+state.pushes+'.');score(state.steps,true);}}
    document.addEventListener('keydown',event=>{if(/INPUT|SELECT|TEXTAREA/.test(event.target.tagName))return;const m={ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1],ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0]}[event.key];if(m){event.preventDefault();move(...m);}});
    function render(){editor.hidden=!editing;pad.hidden=editing;const s=editing?C.sokobanParse(rows.map(r=>r.join(''))):state,cells=grid(s.width,s.width*s.height,i=>{if(!editing)return;const x=i%7,y=Math.floor(i/7);if(!x||!y||x===6||y===6)return;if(brush==='@')rows.forEach(row=>row.forEach((ch,j)=>{if(ch==='@')row[j]=' ';}));rows[y][x]=brush;render();},'sokoban-board');
      board.firstChild.style.aspectRatio=s.width+'/'+s.height;
      cells.forEach((cell,i)=>{cell.classList.add(s.walls.includes(i)?'wall':s.goals.includes(i)?'goal':'floor');const box=s.boxes.includes(i);if(box)cell.classList.add('box');cell.textContent=s.player===i?'●':box?'▣':s.goals.includes(i)?'·':'';cell.setAttribute('aria-label','Клітинка '+(i+1)+': '+(s.walls.includes(i)?'стіна':s.player===i?'гравець':box?'ящик':s.goals.includes(i)?'ціль':'підлога'));});
      if(editing)say('Намалюйте рівень 7 × 7. Зовнішні стіни залишаються замкненими.');else say('Рівень '+(+state.level+1)+' · кроки '+state.steps+' · штовхання '+state.pushes);root.dataset.moves=state.steps;}
    render();
  }
  function wordsearch() {
    const make=(lang='uk')=>({...C.wordSearch(lang,freshSeed()),moves:0});load(make,s=>s&&s.size===10&&Array.isArray(s.board)&&s.board.length===100&&Array.isArray(s.words)&&Array.isArray(s.found));let start=null;
    select('Мова',[['uk','Українська'],['de','Deutsch'],['en','English']],lang=>{start=null;reset(()=>make(lang),render);},state.language);
    button(daily?'Почати завдання знову':'Нове поле',()=>{start=null;reset(()=>make(state.language),render);});
    button('Скасувати вибір',()=>{start=null;render();});
    const list=document.createElement('ul');list.className='word-list';board.after(list);
    function choose(i){if(start===null){start=i;render(i);return;}const match=C.wordMatch(state,start,i);state.moves++;if(match){state.found.push(match.word);say('Знайдено: '+match.word);}else say('Це не одне зі слів у списку. Спробуйте інші початок і кінець.');start=null;save();render(i);if(state.found.length===state.words.length){say('Усі слова знайдено! Спроб: '+state.moves+'.');score(state.moves,true);}}
    function render(focus){const cells=grid(10,100,choose,'word-board'),found=state.words.filter(w=>state.found.includes(w.word)).flatMap(w=>w.cells);cells.forEach((cell,i)=>{cell.textContent=state.board[i];cell.setAttribute('aria-label',state.board[i]+', рядок '+(Math.floor(i/10)+1)+', стовпець '+(i%10+1));if(found.includes(i))cell.classList.add('found');if(start===i)cell.classList.add('marked');});list.replaceChildren();state.words.forEach(w=>{const li=document.createElement('li');li.textContent=w.word;if(state.found.includes(w.word))li.className='done';list.append(li);});restoreFocus(focus);root.dataset.moves=state.moves;if(!status.textContent)say('Оберіть першу, а потім останню літеру слова. Знайдено '+state.found.length+' із '+state.words.length+'.');}
    render();
  }
  function cards(spider=false) {
    const make=()=>spider?C.spider(freshSeed()):C.klondike(freshSeed());
    load(make,s=>s&&Array.isArray(s.piles)&&s.piles.length===(spider?10:7)&&s.piles.every(p=>Array.isArray(p)&&p.every(Number.isInteger))&&Array.isArray(s.hidden)&&Array.isArray(s.stock)&&Number.isFinite(s.moves));let selected=null;
    button('Нова партія',()=>{selected=null;reset(make,render);});button('Скасувати хід',()=>{if(!history.length)return;state=history.pop();selected=null;save();render();});
    button(spider?'Роздати ряд':'Відкрити карту',()=>{const next=spider?C.spiderDeal(state):C.klondikeDraw(state);if(next){stash();state=next;selected=null;save();render();}else say(spider?'Для роздачі кожен стовпець має містити хоча б одну карту.':'Колода порожня.');});
    button('Скасувати вибір',()=>{selected=null;render();});
    function cardText(card){const rank=C.cardRank(card);return (['','A','2','3','4','5','6','7','8','9','10','J','Q','K'][rank])+' '+(spider?'♠':['♠','♥','♦','♣'][C.cardSuit(card)]);}
    function move(target){if(!selected)return false;const next=spider?C.spiderMove(state,selected.pile,selected.index,target.pile):C.klondikeMove(state,selected,target);if(!next)return false;stash();state=next;selected=null;save();render();if(spider?state.completed===8:state.foundations.every(p=>p.length===13)){say('Пасьянс складено! Ходів: '+state.moves+'.');score(state.moves,true);}return true;}
    function render(){board.replaceChildren();const area=document.createElement('div');area.className='card-area';board.append(area);
      const top=document.createElement('div');top.className='card-top';area.append(top);
      button((spider?'Колода: ':'Закриті: ')+state.stock.length,()=>{const next=spider?C.spiderDeal(state):C.klondikeDraw(state);if(next){stash();state=next;save();render();}else say('Роздача зараз недоступна.');},top);
      if(!spider){const last=state.waste[state.waste.length-1],waste=button(last===undefined?'Скидання':cardText(last),()=>{if(last===undefined)return;selected={kind:'waste'};render();},top);waste.className='playing-card '+(last!==undefined&&C.cardRed(last)?'red':'');waste.setAttribute('aria-pressed',selected?.kind==='waste');
        const blank=document.createElement('span');top.append(blank);
        state.foundations.forEach((pile,i)=>{const b=button(pile.length?cardText(pile[pile.length-1]):'A '+['♠','♥','♦','♣'][i],()=>{if(move({kind:'foundation',pile:i}))return;if(pile.length){selected={kind:'foundation',pile:i};render();}else say('Почніть цю основу з туза відповідної масті.');},top);b.className='playing-card '+([1,2].includes(i)?'red':'');b.setAttribute('aria-label','Основа '+['піки','черви','бубни','трефи'][i]+', '+pile.length+' карт');b.setAttribute('aria-pressed',selected?.kind==='foundation'&&selected.pile===i);});
      }else{const p=document.createElement('p');p.textContent='Зібрано послідовностей: '+state.completed+' / 8';top.append(p);}
      const piles=document.createElement('div');piles.className='card-piles'+(spider?' spider':'');area.append(piles);
      state.piles.forEach((pile,p)=>{const col=document.createElement('div');col.className='card-pile';const target=button('Стовпець '+(p+1),()=>{if(!move({kind:'pile',pile:p}))say('Оберіть карту чи послідовність, потім стовпець призначення.');},col);target.className='card-slot';
        pile.forEach((card,i)=>{if(i<state.hidden[p]){const back=document.createElement('span');back.className='card-back';back.setAttribute('aria-hidden','true');col.append(back);return;}const b=button(cardText(card),()=>{if(selected&&selected.pile!==p&&move({kind:'pile',pile:p}))return;selected={kind:'pile',pile:p,index:i};render();},col);b.className='playing-card '+(!spider&&C.cardRed(card)?'red':'');b.setAttribute('aria-label',cardText(card)+', стовпець '+(p+1)+', карта '+(i-state.hidden[p]+1));b.setAttribute('aria-pressed',selected?.kind==='pile'&&selected.pile===p&&selected.index===i);});piles.append(col);});
      root.dataset.moves=state.moves;say('Ходів: '+state.moves+(selected?' · Карту обрано. Натисніть стовпець призначення або основу.':' · Оберіть карту, потім місце для неї.'));}
    render();
  }
  function mahjong() {
    const make=()=>C.mahjong(freshSeed());load(make,s=>s&&Array.isArray(s.tiles)&&s.tiles.length===36&&s.tiles.every(t=>Number.isInteger(t.kind)&&t.kind>=0&&t.kind<18&&Number.isFinite(t.x)&&Number.isFinite(t.y)&&Number.isFinite(t.z)));let selected=null,hints=[];
    button('Нове поле',()=>{selected=null;hints=[];reset(make,render);});button('Скасувати пару',()=>{if(!history.length)return;state=history.pop();selected=null;save();render();});
    button('Підказка',()=>{hints=C.mahjongPairs(state)[0]||[];render();if(!hints.length)say('Доступних пар немає. Скасуйте попередню пару або почніть нове поле.');});
    function choose(i){if(!C.mahjongFree(state.tiles,i))return;hints=[];if(selected!==null&&selected!==i&&state.tiles[selected].kind===state.tiles[i].kind){stash();state.tiles[selected].removed=state.tiles[i].removed=true;state.moves++;selected=null;save();render();if(state.tiles.every(t=>t.removed)){say('Усі пари знайдено!');score(state.moves,true);}return;}selected=i;render();}
    function render(){board.replaceChildren();const wrap=document.createElement('div');wrap.className='board-wrap';const g=document.createElement('div');g.className='mahjong-board';wrap.append(g);board.append(wrap);
      const available=Math.min(480,Math.max(285,board.clientWidth-12)),scale=available/480;g.style.width=available+'px';g.style.height=330*scale+'px';
      state.tiles.forEach((t,i)=>{if(t.removed)return;const free=C.mahjongFree(state.tiles,i),b=button(['●','▰','✦'][Math.floor(t.kind/6)]+' '+(t.kind%6+1),()=>choose(i),g);b.className='mahjong-tile'+(free?' free':'')+(hints.includes(i)?' hint':'');b.dataset.tile=i;b.dataset.suit=Math.floor(t.kind/6);b.style.left=(t.x*74+t.z*7)*scale+'px';b.style.top=(t.y*70-t.z*6+15)*scale+'px';b.style.width=70*scale+'px';b.style.height=64*scale+'px';b.style.fontSize=22*scale+'px';b.style.zIndex=t.z+1;b.disabled=!free;b.setAttribute('aria-label','Плитка '+['кола','смуги','зорі'][Math.floor(t.kind/6)]+' '+(t.kind%6+1)+(free?', вільна':', заблокована'));b.setAttribute('aria-pressed',selected===i);});
      root.dataset.moves=state.moves;if(state.tiles.some(t=>!t.removed))say('Залишилось плиток: '+state.tiles.filter(t=>!t.removed).length+'. Пари: '+C.mahjongPairs(state).length+'.');}
    render();window.addEventListener('resize',render);
  }
  function battleship() {
    const make=()=>({own:C.fleet(freshSeed()),enemy:C.fleet(freshSeed()),shots:[],incoming:[],started:false,moves:0,ended:false});
    load(make,s=>s&&Array.isArray(s.own)&&s.own.length===10&&Array.isArray(s.enemy)&&s.enemy.length===10&&Array.isArray(s.shots)&&Array.isArray(s.incoming)&&Number.isFinite(s.moves));let busy=false;
    button('Нова партія',()=>{busy=false;reset(make,render);});button('Переставити кораблі',()=>{if(state.started){say('Перестановка доступна перед початком партії.');return;}state.own=C.fleet(freshSeed());save();render();});button('Почати бій',()=>{state.started=true;save();render();});
    function choose(i){if(!state.started){say('Перевірте свої кораблі та натисніть «Почати бій».');return;}if(busy||state.ended)return;const hit=C.shipShot(state.enemy,state.shots,i);if(!hit)return;state.shots=hit.shots;state.moves++;if(hit.won){state.ended=true;save();render();say('Перемога! Усі кораблі суперника потоплено за '+state.moves+' пострілів.');score(state.moves,true);return;}save();render();say(hit.hit?(hit.sunk?'Корабель потоплено. Стріляйте ще.':'Влучання! Стріляйте ще.'):'Повз. Хід комп’ютера.');if(!hit.hit){busy=true;const run=generation;setTimeout(()=>computer(run),lowPower?0:350);}}
    function computer(run){if(run!==generation)return;const unhit=Array.from({length:100},(_,i)=>i).filter(i=>!state.incoming.includes(i));const damaged=state.own.filter(ship=>ship.some(i=>state.incoming.includes(i))&&!ship.every(i=>state.incoming.includes(i))).flat().filter(i=>state.incoming.includes(i));const nearby=C.shuffle(damaged.flatMap(i=>[i%10?i-1:-1,i%10<9?i+1:-1,i-10,i+10])).filter(i=>unhit.includes(i));const target=nearby[0]??C.shuffle(unhit.filter(i=>(i%10+Math.floor(i/10))%2===0))[0]??unhit[0];const result=C.shipShot(state.own,state.incoming,target);if(!result){busy=false;return;}state.incoming=result.shots;if(result.won)state.ended=true;save();render();if(result.won){busy=false;say('Комп’ютер переміг. Спробуйте нову партію.');}else if(result.hit){say('Комп’ютер влучив і стріляє ще.');setTimeout(()=>computer(run),lowPower?0:350);}else{busy=false;say('Комп’ютер промахнувся. Ваш хід.');}}
    function render(){board.replaceChildren();const duo=document.createElement('div');duo.className='duo-boards';board.append(duo);
      for(const own of [false,true]){const section=document.createElement('section'),h=document.createElement('h2');h.textContent=own?'Ваш флот':'Поле суперника';section.append(h);const g=document.createElement('div');g.className='square-board';g.style.setProperty('--columns',10);g.setAttribute('role','group');g.setAttribute('aria-label',h.textContent);const ships=own?state.own:state.enemy,shots=own?state.incoming:state.shots;
        for(let i=0;i<100;i++){const ship=ships.some(s=>s.includes(i)),shot=shots.includes(i),b=button(shot?(ship?'×':'·'):own&&ship?'▪':'',()=>{if(!own)choose(i);},g);b.className='cell'+(shot?(ship?' hit':' miss'):own&&ship?' ship':'');b.setAttribute('aria-label',(own?'Ваше поле ':'Постріл ')+String.fromCharCode(65+i%10)+(Math.floor(i/10)+1)+(shot?(ship?', влучання':', повз'):own&&ship?', корабель':''));b.disabled=own||shot||state.ended;b.tabIndex=own?-1:0;}section.append(g);duo.append(section);}
      root.dataset.moves=state.moves;if(!state.started)say('Кораблі вже розставлено за правилами: вони не торкаються навіть кутами. Можна переставити або почати бій.');else if(!state.ended&&!busy)say('Ваш хід. Оберіть клітинку на полі суперника.');}
    render();
  }
  function music() {
    const noteNames=['До','До♯','Ре','Ре♯','Мі','Фа','Фа♯','Соль','Соль♯','Ля','Ля♯','Сі'],intervalNames=['Прима','Мала секунда','Велика секунда','Мала терція','Велика терція','Кварта','Тритон','Квінта','Мала секста','Велика секста','Мала септима','Велика септима','Октава'];
    const make=(mode='notes')=>({mode,round:0,correct:0,moves:0,seed:freshSeed(),answered:false});load(make,s=>s&&['notes','intervals','rhythm'].includes(s.mode)&&Number.isInteger(s.round)&&s.round>=0&&s.round<=10&&Number.isFinite(s.correct));
    let audio,played=false,taps=[],activeQuestion=null;
    select('Вправа',[['notes','Впізнайте ноту'],['intervals','Впізнайте інтервал'],['rhythm','Відчуйте ритм']],mode=>{played=false;taps=[];reset(()=>make(mode),render);},state.mode);
    button('Нова вправа',()=>{played=false;taps=[];reset(()=>make(state.mode),render);});
    function context(){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio){say('У цьому браузері Web Audio недоступне.');return null;}if(!audio)audio=new Audio();audio.resume().catch(()=>{});return audio;}
    function tone(midi,time,duration=.45){const a=context();if(!a)return;const oscillator=a.createOscillator(),gain=a.createGain();oscillator.type='sine';oscillator.frequency.value=440*2**((midi-69)/12);gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(.16,time+.02);gain.gain.exponentialRampToValueAtTime(.001,time+duration);oscillator.connect(gain);gain.connect(a.destination);oscillator.start(time);oscillator.stop(time+duration+.02);}
    function question(){const rng=C.random(state.seed+':'+state.round),answer=state.mode==='notes'?Math.floor(rng()*12):1+Math.floor(rng()*12);const options=C.shuffle(Array.from({length:state.mode==='notes'?12:13},(_,i)=>i).filter(i=>i!==answer),rng).slice(0,3).concat(answer);return {answer,options:C.shuffle(options,rng),tempo:[60,75,90,100,120][Math.floor(rng()*5)]};}
    function play(){if(state.round>=10)return;const a=context();if(!a)return;played=true;const now=a.currentTime+.08,q=activeQuestion;
      if(state.mode==='rhythm'){const step=60/q.tempo;for(let i=0;i<4;i++)tone(84,now+i*step,.1);taps=[];say('Послухайте 4 удари, потім відтворіть той самий темп кнопкою «Торкніться в ритм» чотири рази.');}
      else{tone(60,now);tone(state.mode==='notes'?60+q.answer:60+q.answer,now+.75);say(state.mode==='notes'?'Перша нота — До. Визначте другу ноту.':'Визначте інтервал між двома нотами.');}}
    function answer(value){if(!played){say('Спершу прослухайте завдання.');return;}if(state.answered||state.round>=10)return;const correct=value===activeQuestion.answer;state.correct+=correct?1:0;state.answered=true;state.moves++;save();render();say((correct?'Правильно! ':'Правильна відповідь: '+(state.mode==='notes'?noteNames[activeQuestion.answer]:intervalNames[activeQuestion.answer])+'. ')+'Результат: '+state.correct+' із '+(state.round+1)+'.');}
    function next(){if(!state.answered)return;state.round++;state.answered=false;played=false;taps=[];save();render();if(state.round===10){say('Вправу завершено: '+state.correct+' із 10.');score(state.correct);}}
    function render(){board.replaceChildren();activeQuestion=question();const p=document.createElement('p');p.textContent='Завдання '+Math.min(state.round+1,10)+' / 10 · правильних відповідей '+state.correct;board.append(p);if(state.round>=10){say('Вправу завершено. Почніть нову, коли захочете.');return;}
      const playButton=button('▶ Прослухати',play,board);playButton.className='music-play';playButton.disabled=state.answered;const options=document.createElement('div');options.className='music-options';board.append(options);
      if(state.mode==='rhythm'){button('Торкніться в ритм',()=>{if(!played||state.answered)return;taps.push(performance.now());say('Удар '+taps.length+' / 4');if(taps.length===4){const mean=(taps[3]-taps[0])/3,relative=Math.abs(mean-60000/activeQuestion.tempo)/(60000/activeQuestion.tempo),steady=taps.slice(1).every((v,i)=>Math.abs(v-taps[i]-mean)<mean*.25);state.correct+=relative<.2&&steady?1:0;state.answered=true;state.moves++;save();render();say('Ваш темп: '+Math.round(60000/mean)+' уд/хв. Завдання: '+activeQuestion.tempo+' уд/хв. '+(relative<.2&&steady?'Добре!':'Спробуйте точніше у наступному завданні.'));}},options);}
      else activeQuestion.options.forEach((n,i)=>{const b=button((i+1)+'. '+(state.mode==='notes'?noteNames[n]:intervalNames[n]),()=>answer(n),options);b.disabled=state.answered;});
      const nextButton=button('Далі →',next,board);nextButton.disabled=!state.answered;root.dataset.moves=state.moves;
    }
    document.addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(/^[1-4]$/.test(e.key)&&state.mode!=='rhythm'){e.preventDefault();answer(activeQuestion.options[+e.key-1]);}if(e.key===' '&&e.target===document.body){e.preventDefault();play();}});
    document.addEventListener('visibilitychange',()=>{if(audio){if(document.hidden)audio.suspend().catch(()=>{});else audio.resume().catch(()=>{});}});render();
  }
  function merge() {
    const radii=[13,18,24,31,39,48,58,69,81,94,109],colors=['#e45f87','#eda254','#e8c85b','#9fc95c','#5bb98e','#58aeca','#797ed1','#ac75bd','#d68b8d','#baab62','#72b8a2'];
    const make=()=>({fruits:[],next:0,score:0,moves:0,ended:false});load(make,s=>s&&Array.isArray(s.fruits)&&s.fruits.length<180&&s.fruits.every(f=>Number.isInteger(f.level)&&f.level>=0&&f.level<11&&Number.isFinite(f.x)&&Number.isFinite(f.y))&&Number.isFinite(s.score));
    let paused=false,aim=200,lastDrop=-Infinity,lastTime=0,overflow=0,frame=0,lastPaint=0;state.fruits.forEach(f=>{f.vx=Number(f.vx)||0;f.vy=Number(f.vy)||0;f.born=performance.now()-2000;});
    button('Нова партія',()=>{reset(make,()=>{});overflow=0;paused=false;paint();});button('Пауза',event=>{paused=!paused;event.currentTarget.textContent=paused?'Продовжити':'Пауза';paint();});button('Скасувати скидання',()=>{if(!history.length)return;state=history.pop();overflow=0;save();paint();});
    const canvas=document.createElement('canvas');canvas.width=400;canvas.height=580;canvas.className='merge-canvas';canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Кошик із фруктами. Керування повзунком і кнопкою під ним.');board.append(canvas);const ctx=canvas.getContext('2d');
    const controls=document.createElement('div');controls.className='merge-controls';board.append(controls);const label=document.createElement('label');label.textContent='Позиція наступного фрукта';const range=document.createElement('input');range.type='range';range.min=15;range.max=385;range.value=200;range.setAttribute('aria-label',label.textContent);range.addEventListener('input',()=>{aim=+range.value;paint();});label.append(range);controls.append(label);button('Скинути фрукт',drop,controls);
    function drop(){const now=performance.now();if(paused||state.ended||document.hidden||now-lastDrop<450||state.fruits.length>=160)return;stash();const r=radii[state.next];state.fruits.push({level:state.next,x:Math.min(400-r,Math.max(r,aim)),y:r+8,vx:0,vy:0,born:now});state.next=Math.floor(Math.random()*4);state.moves++;lastDrop=now;save();paint();}
    canvas.addEventListener('pointerdown',event=>{const rect=canvas.getBoundingClientRect();aim=(event.clientX-rect.left)*400/rect.width;range.value=aim;drop();});
    document.addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();aim=Math.max(15,Math.min(385,aim+(e.key==='ArrowRight'?15:-15)));range.value=aim;paint();}else if(e.key===' '&&e.target===document.body){e.preventDefault();drop();}});
    function step(dt,now){
      for(const f of state.fruits){f.vy+=650*dt;f.x+=f.vx*dt;f.y+=f.vy*dt;const r=radii[f.level];if(f.x<r){f.x=r;f.vx=Math.abs(f.vx)*.35;}if(f.x>400-r){f.x=400-r;f.vx=-Math.abs(f.vx)*.35;}if(f.y>580-r){f.y=580-r;f.vy=-Math.abs(f.vy)*.15;f.vx*=.97;}f.vx*=.995;}
      let merged=false;
      for(let pass=0;pass<3;pass++)for(let i=0;i<state.fruits.length;i++)for(let j=i+1;j<state.fruits.length;j++){
        const a=state.fruits[i],b=state.fruits[j],dx=b.x-a.x,dy=b.y-a.y,min=radii[a.level]+radii[b.level],dist=Math.hypot(dx,dy);if(dist>=min)continue;
        if(a.level===b.level&&a.level<10){const level=a.level+1;state.fruits[i]={level,x:(a.x+b.x)/2,y:(a.y+b.y)/2,vx:(a.vx+b.vx)/2,vy:(a.vy+b.vy)/2,born:now-1500};state.fruits.splice(j,1);state.score+=2**level;merged=true;j--;continue;}
        const nx=dist?dx/dist:1,ny=dist?dy/dist:0,overlap=(min-dist)/2;a.x-=nx*overlap;a.y-=ny*overlap;b.x+=nx*overlap;b.y+=ny*overlap;const velocity=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(velocity<0){a.vx+=velocity*nx*.55;a.vy+=velocity*ny*.55;b.vx-=velocity*nx*.55;b.vy-=velocity*ny*.55;}
      }
      if(merged)save();
      const crowded=state.fruits.some(f=>now-f.born>1800&&f.y-radii[f.level]<50&&Math.abs(f.vy)<75);overflow=crowded?overflow+dt:0;
      if(overflow>2){state.ended=true;save();score(state.score);say('Кошик заповнений. Результат: '+state.score+'. Почніть нову партію.');}
    }
    function fruit(x,y,level){const r=radii[level];ctx.fillStyle=colors[level];ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#ecf3e0';ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle='#0c2535';ctx.font=Math.max(11,r*.55)+'px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(level+1),x,y);ctx.fillStyle='#94d389';ctx.beginPath();ctx.ellipse(x+r*.16,y-r*.84,r*.27,r*.1,-.5,0,Math.PI*2);ctx.fill();}
    function paint(){ctx.fillStyle='#102a37';ctx.fillRect(0,0,400,580);ctx.strokeStyle=overflow?'#ff9a91':'#778898';ctx.setLineDash([6,6]);ctx.beginPath();ctx.moveTo(0,50);ctx.lineTo(400,50);ctx.stroke();ctx.setLineDash([]);for(const f of state.fruits)fruit(f.x,f.y,f.level);const r=radii[state.next];ctx.globalAlpha=.6;fruit(Math.max(r,Math.min(400-r,aim)),r+8,state.next);ctx.globalAlpha=1;if(paused||document.hidden){ctx.fillStyle='#0b1422cc';ctx.fillRect(0,0,400,580);ctx.fillStyle='white';ctx.font='24px system-ui';ctx.fillText('Пауза',200,280);}if(!state.ended)say('Рахунок: '+state.score+' · наступний фрукт: '+(state.next+1)+'. Однакові фрукти об’єднуються.');root.dataset.moves=state.moves;}
    function tick(now){frame=0;if(document.hidden)return;const elapsed=lastTime?Math.min(.05,(now-lastTime)/1000):0;lastTime=now;if(!paused&&!state.ended){let remaining=elapsed;while(remaining>0){const dt=Math.min(1/120,remaining);step(dt,now);remaining-=dt;}}if(now-lastPaint>=(lowPower?33:16)){paint();lastPaint=now;}frame=requestAnimationFrame(tick);}
    document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(frame);frame=0;lastTime=0;save();if(!document.hidden)frame=requestAnimationFrame(tick);});window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);save();});paint();frame=requestAnimationFrame(tick);
  }
  try {
    const record=get('ac_arcade_record:'+id);if(Number.isFinite(record))document.getElementById('record').textContent='Особистий рекорд: '+record;
    if(daily)document.getElementById('daily').textContent='Щоденне завдання · '+daily;
    ({reversi:()=>discs(false),draughts:()=>discs(true),sokoban,wordsearch,klondike:()=>cards(false),spider:()=>cards(true),mahjong,battleship,'fruit-merge':merge,'music-lab':music}[id])();
    save();
  } catch (error) {
    console.error('Не вдалося відновити партію:',error);say('Збережена партія пошкоджена. Почніть нову, щоб відновити гру.');
    button('Відновити гру',()=>{try{localStorage.removeItem(key);}catch(_){}location.reload();});
  }
})();
