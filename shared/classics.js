(function(){
 'use strict';
 const C=window.AuthorCheClassics;
 const game=document.body.dataset.game;
 const date=new URLSearchParams(location.search).get('daily')||'',daily=/^\d{4}-\d{2}-\d{2}$/.test(date)?date:'';
 const dailyRandom=()=>daily?C.seeded(game+':'+daily):Math.random;
 const title=document.getElementById('title'),intro=document.getElementById('intro'),area=document.getElementById('play-area'),tools=document.getElementById('tools'),status=document.getElementById('status');
 const safe={get(key){try{return JSON.parse(localStorage.getItem(key));}catch(_){return null;}},set(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch(_){}}};
 function say(text){status.textContent=text;}
 function button(text,fn,primary=false){const b=document.createElement('button');b.type='button';b.textContent=text;if(primary)b.className='primary';b.addEventListener('click',fn);return b;}
 function keyboardGrid(board,columns){board.addEventListener('keydown',e=>{const nodes=Array.from(board.querySelectorAll('button'));const index=nodes.indexOf(document.activeElement);if(index<0)return;const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-columns,ArrowDown:columns}[e.key];if(delta===undefined)return;e.preventDefault();const next=nodes[index+delta];if(next)next.focus();});}
 if(game==='connect-four'){
  title.textContent='Чотири в ряд';intro.textContent='Зберіть лінію з чотирьох фішок раніше за суперника. Обирайте стовпець — фішка впаде вниз.';
  let board=Array(42).fill(0),player=1,history=[],busy=false,generation=0,mode='bot';
  const select=document.createElement('select');select.setAttribute('aria-label','Суперник');select.innerHTML='<option value="bot">Проти комп’ютера</option><option value="friend">Удвох на одному екрані</option>';select.addEventListener('change',()=>{mode=select.value;reset();});tools.append(select,button('Нова гра',reset,true),button('Скасувати хід',undo));
  const heads=document.createElement('div');heads.className='connect-head';const grid=document.createElement('div');grid.className='board connect';grid.setAttribute('aria-label','Поле 7 на 6');area.append(heads,grid);
  const cells=[];for(let c=0;c<7;c++){const b=button('↓',()=>move(c));b.setAttribute('aria-label','Стовпець '+(c+1));heads.append(b);}for(let i=0;i<42;i++){const b=button('',()=>move(i%7));b.setAttribute('aria-label','Ряд '+(Math.floor(i/7)+1)+', стовпець '+(i%7+1));grid.append(b);cells.push(b);}keyboardGrid(grid,7);
  function render(){const winner=C.win(board);cells.forEach((b,i)=>{b.dataset.player=board[i];b.classList.toggle('winner',Boolean(winner?.cells.includes(i)));b.setAttribute('aria-label','Ряд '+(Math.floor(i/7)+1)+', стовпець '+(i%7+1)+': '+(board[i]===1?'коралова фішка':board[i]===2?'золота фішка':'порожньо'));});Array.from(heads.children).forEach((b,c)=>b.disabled=Boolean(board[c])||busy||Boolean(winner));if(winner)say(winner.player===1?'Перемога коралових!':mode==='bot'?'Комп’ютер переміг. Спробуйте ще раз.':'Перемога золотих!');else if(board.every(Boolean))say('Нічия. Почнемо нову партію?');else say(busy?'Комп’ютер обирає хід…':player===1?'Хід коралових':'Хід золотих');}
  function apply(col){const result=C.drop(board,col,player);if(!result)return false;history.push({board:board.slice(),player});board=result.board;player=3-player;return true;}
  function move(col){if(busy||C.win(board)||board.every(Boolean)||!apply(col))return;render();if(mode==='bot'&&player===2&&!C.win(board)&&!board.every(Boolean)){busy=true;render();const token=generation;setTimeout(()=>{if(token!==generation)return;const col=C.bestDrop(board,2,4);if(col!==null)apply(col);busy=false;render();},180);}}
  function reset(){generation++;board=Array(42).fill(0);player=1;history=[];busy=false;render();}
  function undo(){generation++;busy=false;let previous=history.pop();if(mode==='bot'&&previous?.player===2)previous=history.pop()||previous;if(previous){board=previous.board;player=previous.player;}render();}
  render();
 }else if(game==='sudoku'){
  title.textContent='Судоку';intro.textContent='Заповніть поле числами 1–9. У кожному рядку, стовпці та квадраті 3×3 кожне число має траплятися один раз.';
  const sudokuKey='ac_sudoku_v1'+(daily?':'+daily:'');
  let state=safe.get(sudokuKey),selected=0,checked=false;
  if(!state||!['grid','puzzle','solution'].every(k=>Array.isArray(state[k])&&state[k].length===81&&state[k].every(n=>Number.isInteger(n)&&n>=0&&n<=9))||state.solution.some(n=>!n))state=C.makeSudoku(false,dailyRandom());
  const level=document.createElement('select');level.setAttribute('aria-label','Складність');level.innerHTML='<option value="normal">Класична</option><option value="easy">Легка</option>';if(daily){level.disabled=true;intro.textContent+=' Завдання дня: '+daily+'.';}
  tools.append(level,button('Нова гра',()=>{state=C.makeSudoku(!daily&&level.value==='easy',dailyRandom());checked=false;selected=0;save();render();},true),button('Підказка',hint),button('Перевірити',()=>{checked=true;render();}));
  const grid=document.createElement('div');grid.className='board sudoku';grid.setAttribute('aria-label','Поле судоку 9 на 9');const pad=document.createElement('div');pad.className='number-pad';area.append(grid,pad);const cells=[];
  for(let i=0;i<81;i++){const b=button('',()=>{selected=i;render();});b.addEventListener('focus',()=>{selected=i;render();});grid.append(b);cells.push(b);}keyboardGrid(grid,9);
  for(let n=1;n<=9;n++)pad.append(button(String(n),()=>input(n)));pad.append(button('Стерти',()=>input(0)));
  grid.addEventListener('keydown',e=>{if(/^[1-9]$/.test(e.key)){e.preventDefault();input(Number(e.key));}else if(['Backspace','Delete','0'].includes(e.key)){e.preventDefault();input(0);}});
  function save(){safe.set(sudokuKey,state);}
  function input(n){if(state.puzzle[selected]){say('Це початкове число. Оберіть порожню клітинку.');return;}state.grid[selected]=n;save();render();}
  function hint(){const i=!state.puzzle[selected]&&state.grid[selected]!==state.solution[selected]?selected:state.grid.findIndex((v,i)=>v!==state.solution[i]);if(i<0)return;state.grid[i]=state.solution[i];state.hints=(state.hints||0)+1;selected=i;save();render();}
  function render(){cells.forEach((b,i)=>{b.textContent=state.grid[i]||'';b.classList.toggle('fixed',Boolean(state.puzzle[i]));b.classList.toggle('selected',i===selected);b.classList.toggle('wrong',checked&&Boolean(state.grid[i])&&state.grid[i]!==state.solution[i]);b.setAttribute('aria-label','Ряд '+(Math.floor(i/9)+1)+', стовпець '+(i%9+1)+': '+(state.grid[i]||'порожньо')+(state.puzzle[i]?', початкове число':''));});const left=state.grid.filter(v=>!v).length;if(state.grid.every((v,i)=>v===state.solution[i]))say('Судоку розв’язано! Підказок: '+(state.hints||0));else say('Порожніх клітинок: '+left+' · Підказок: '+(state.hints||0)+(checked?' · Помилки позначено кораловим':''));}
  render();
 }else if(game==='nonogram'){
  title.textContent='Нонограми';intro.textContent='Відновіть малюнок за числами. Вони показують довжини груп зафарбованих клітинок. Між групами має бути хоча б один пропуск.';
  const patterns=[{name:'Серце',data:['01010','11111','11111','01110','00100']},{name:'Ракета',data:['00100','01110','01110','11111','10101']},{name:'Ялинка',data:['00100','01110','00100','11111','00100']}];
  const nonoKey='ac_nonogram_v1'+(daily?':'+daily:'');
  const stored=safe.get(nonoKey),dailyIndex=daily?Math.floor(dailyRandom()()*patterns.length):0;
  let index=daily?dailyIndex:stored&&Number.isInteger(stored.index)&&stored.index>=0&&stored.index<patterns.length?stored.index:0,grid=stored&&stored.index===index&&Array.isArray(stored.grid)&&stored.grid.length===25&&stored.grid.every(v=>[-1,0,1].includes(v))?stored.grid:Array(25).fill(0),mark=1;const select=document.createElement('select');select.setAttribute('aria-label','Малюнок');patterns.forEach((p,i)=>{const o=document.createElement('option');o.value=i;o.textContent=p.name;select.append(o);});select.value=index;if(daily){select.disabled=true;intro.textContent+=' Завдання дня: '+daily+'.';}select.addEventListener('change',()=>{index=Number(select.value);const saved=safe.get(nonoKey+':'+index);grid=saved&&Array.isArray(saved.grid)&&saved.grid.length===25&&saved.grid.every(v=>[-1,0,1].includes(v))?saved.grid:Array(25).fill(0);saveNono();build();render();});
  const fill=button('Зафарбувати',()=>{mark=1;render();}),cross=button('Позначити ×',()=>{mark=-1;render();});tools.append(select,fill,cross,button('Заново',reset));const board=document.createElement('div');board.className='nonogram';area.append(board);let cells=[];
  function pattern(){return patterns[index].data.join('').split('').map(Number);}
  function saveNono(){safe.set(nonoKey,{index,grid});safe.set(nonoKey+':'+index,{index,grid});}
  function reset(){grid=Array(25).fill(0);saveNono();build();render();}
  function build(){board.replaceChildren();cells=[];board.append(document.createElement('span'));const p=pattern();for(let c=0;c<5;c++){const d=document.createElement('div');d.className='nono-clue column';d.textContent=C.clues([0,1,2,3,4].map(r=>p[r*5+c])).join('\n');board.append(d);}for(let r=0;r<5;r++){const d=document.createElement('div');d.className='nono-clue';d.textContent=C.clues(p.slice(r*5,r*5+5)).join(' ');board.append(d);for(let c=0;c<5;c++){const i=r*5+c,b=button('',()=>paint(i,mark));b.addEventListener('contextmenu',e=>{e.preventDefault();paint(i,-1);});b.setAttribute('aria-label','Ряд '+(r+1)+', стовпець '+(c+1));board.append(b);cells.push(b);}}keyboardGrid(board,5);}
  function paint(i,value){grid[i]=grid[i]===value?0:value;saveNono();render();}
  function render(){cells.forEach((b,i)=>{b.dataset.value=grid[i];b.textContent=grid[i]===-1?'×':'';b.setAttribute('aria-pressed',String(grid[i]===1));});fill.setAttribute('aria-pressed',String(mark===1));cross.setAttribute('aria-pressed',String(mark===-1));say(C.nonogramDone(grid,pattern())?'Малюнок відновлено! Оберіть наступний.':mark===1?'Режим: зафарбовування':'Режим: позначення порожніх клітинок');}
  saveNono();build();render();
 }else if(game==='simon-memory'){
  title.textContent='Світлова пам’ять';intro.textContent='Дивіться на послідовність світлових сигналів і повторюйте її. Кожен раунд додає один новий сигнал.';
  let sequence=[],position=0,accepting=false,token=0,paused=false,sound=true,context=null,best=Number(safe.get('ac_simon_best'))||0,timers=[];
  const start=button('Почати',()=>{if(paused){paused=false;start.textContent='Нова гра';play();}else newGame();},true),mute=button('Звук: увімкнено',()=>{sound=!sound;mute.textContent='Звук: '+(sound?'увімкнено':'вимкнено');});tools.append(start,mute);const board=document.createElement('div');board.className='board simon';area.append(board);const colors=['Зелений','Кораловий','Золотий','Блакитний'],cells=[];
  colors.forEach((name,i)=>{const b=button(String(i+1),()=>press(i));b.setAttribute('aria-label',name+', клавіша '+(i+1));board.append(b);cells.push(b);});
  function later(fn,ms){const id=setTimeout(fn,ms);timers.push(id);return id;}
  function clear(){timers.forEach(clearTimeout);timers=[];cells.forEach(b=>b.classList.remove('lit'));}
  function tone(i){if(!sound)return;try{context=context||new (window.AudioContext||window.webkitAudioContext)();if(context.state==='suspended')context.resume();const o=context.createOscillator(),g=context.createGain();o.frequency.value=[261.63,329.63,392,523.25][i];g.gain.setValueAtTime(.0001,context.currentTime);g.gain.exponentialRampToValueAtTime(.13,context.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,context.currentTime+.25);o.connect(g);g.connect(context.destination);o.start();o.stop(context.currentTime+.27);}catch(_){}}
  function flash(i,duration){cells[i].classList.add('lit');tone(i);later(()=>cells[i].classList.remove('lit'),duration);}
  function update(){cells.forEach(b=>b.disabled=!accepting);}
  function play(){clear();accepting=false;position=0;update();const current=++token,beat=Math.max(340,700-sequence.length*16);say('Запам’ятовуйте · Раунд '+sequence.length+' · Рекорд '+best);sequence.forEach((n,i)=>later(()=>{if(current===token)flash(n,beat*.65);},500+i*beat));later(()=>{if(current!==token)return;accepting=true;update();say('Ваша черга · '+sequence.length+' сигналів');},600+sequence.length*beat);}
  function newGame(){paused=false;token++;clear();sequence=[Math.floor(Math.random()*4)];start.textContent='Нова гра';play();}
  function press(i){if(!accepting)return;flash(i,180);if(i!==sequence[position]){accepting=false;update();const score=sequence.length-1;if(score>best){best=score;safe.set('ac_simon_best',best);}say('Гру завершено. Раундів: '+score+' · Рекорд: '+best);return;}position++;if(position===sequence.length){accepting=false;update();if(sequence.length>best){best=sequence.length;safe.set('ac_simon_best',best);}say('Правильно! Наступний раунд…');later(()=>{sequence.push(Math.floor(Math.random()*4));play();},800);}}
  document.addEventListener('keydown',e=>{if(!e.repeat&&/^[1-4]$/.test(e.key)){e.preventDefault();press(Number(e.key)-1);}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&sequence.length){token++;clear();accepting=false;update();say('Паузу ввімкнено. Натисніть «Повторити раунд».');paused=true;start.textContent='Повторити раунд';}});
  update();say('Натисніть «Почати» · Рекорд: '+best);
 }
})();

