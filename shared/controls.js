(function () {
  'use strict';
  const id = location.pathname.split('/games/')[1]?.split('/')[0];
  const legacy = ['asteroids', 'snake-retro'].includes(id);
  const arcade = !!document.getElementById('arcade');
  if (!legacy && !arcade) return;
  const root = document.createElement('details');
  root.className = 'ac-input-help';
  const summary = document.createElement('summary');
  summary.textContent = legacy ? 'Екранні кнопки та геймпад' : 'Керування геймпадом';
  const note = document.createElement('p');
  note.textContent = legacy ? 'Стрілки — рух. A — пробіл / початок гри. Натискайте кілька екранних кнопок одночасно.' : 'D-pad або лівий стік — вибір клітинки. A — натиснути. B — скасувати хід. L/R — попередня чи наступна кнопка. У Сокобані D-pad пересуває гравця.';
  const gamepadNote = document.createElement('p');
  gamepadNote.setAttribute('role', 'status');
  gamepadNote.textContent = 'Під’єднайте стандартний геймпад і натисніть його кнопку. Підтримка залежить від браузера.';
  root.append(summary, note, gamepadNote);
  (document.getElementById('arcade') || document.body).append(root);
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = new URL('controls.css' + (document.currentScript?.src.includes('?') ? new URL(document.currentScript.src).search : ''), document.currentScript.src).href;
  document.head.append(style);

  const codes = {ArrowUp:38, ArrowDown:40, ArrowLeft:37, ArrowRight:39, ' ':32};
  const pressed = new Set(), sources = new Map();
  function send(key, down, source='gamepad') {
    if(!sources.has(source))sources.set(source,new Set());
    if(down)sources.get(source).add(key);else sources.get(source).delete(key);
    down=Array.from(sources.values()).some(keys=>keys.has(key));
    if (down === pressed.has(key)) return;
    if (down) pressed.add(key); else pressed.delete(key);
    if(down&&key===' '&&id==='snake-retro')Array.from(document.querySelectorAll('#start-screen button,#game-over button')).find(b=>b.getClientRects().length)?.click();
    const target = legacy ? document.body : document.activeElement || document.body;
    target.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', {key,code:key === ' ' ? 'Space' : key,keyCode:codes[key],which:codes[key],bubbles:true,cancelable:true}));
  }
  function release() {sources.clear();Array.from(pressed).forEach(key => send(key,false));}
  if (legacy) {
    const pad = document.createElement('div');
    pad.className = 'ac-touch-pad';pad.setAttribute('role','group');pad.setAttribute('aria-label','Екранне керування');
    const pointers = new Map();
    for (const [key,text] of [['ArrowLeft','←'],['ArrowUp','↑'],['ArrowDown','↓'],['ArrowRight','→'],[' ','A']]) {
      const b=document.createElement('button');b.type='button';b.textContent=text;b.setAttribute('aria-label',key===' '?'Почати / дія':{'ArrowLeft':'Рух ліворуч','ArrowRight':'Рух праворуч','ArrowUp':'Рух угору','ArrowDown':'Рух униз'}[key]);
      b.addEventListener('pointerdown',event=>{event.preventDefault();pointers.set(event.pointerId,key);b.setPointerCapture(event.pointerId);send(key,true,'touch');});
      function up(event){const held=pointers.get(event.pointerId);pointers.delete(event.pointerId);if(held&&!Array.from(pointers.values()).includes(held))send(held,false,'touch');}
      b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',up);
      b.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();send(key,true,'touch');}});
      b.addEventListener('keyup',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();send(key,false,'touch');}});
      pad.append(b);
    }
    const toggle=document.createElement('button');toggle.type='button';toggle.textContent='Екранні кнопки';toggle.setAttribute('aria-controls','ac-touch-pad');pad.id='ac-touch-pad';
    function show(value){pad.hidden=!value;toggle.setAttribute('aria-pressed',String(value));document.body.classList.toggle('ac-has-touch-pad',value);if(!value)release();}
    toggle.addEventListener('click',()=>show(pad.hidden));root.append(toggle);document.body.append(pad);
    show(new URLSearchParams(location.search).get('touch')==='1'||(navigator.maxTouchPoints>0&&new URLSearchParams(location.search).get('touch')!=='0'));
  }
  function available() {return Array.from(document.querySelectorAll('#arcade button,#arcade select,#arcade input')).filter(b=>!b.disabled&&!b.closest('[hidden]')&&b.getClientRects().length);}
  function focusButton(delta) {
    const all=available();if(!all.length)return;const index=all.indexOf(document.activeElement);all[(Math.max(-1,index)+delta+all.length)%all.length].focus();
  }
  function action(key) {
    if(legacy)return;
    if(key==='A'){
      let target=document.activeElement;
      if(!target?.matches('#arcade button'))target=available().find(b=>b.matches('#board button'))||available()[0];
      if(target?.tagName==='BUTTON'){const all=available(),index=all.indexOf(target);target.click();if(!target.isConnected){const next=available();next[Math.min(index,next.length-1)]?.focus({preventScroll:true});}}
    }else if(key==='B'){
      available().find(b=>/^Скасувати (хід|пару)$/.test(b.textContent))?.click();
    }else if(key==='L'||key==='R')focusButton(key==='L'?-1:1);
    else {
      let target=document.activeElement;
      if(!target?.closest('#board')&&!['sokoban','fruit-merge'].includes(id)){
        target=available().find(b=>b.matches('#board button'));target?.focus({preventScroll:true});
      }
      const before=document.activeElement;send(key,true);send(key,false);
      if(document.activeElement===before&&!['sokoban','fruit-merge'].includes(id)&&!target?.matches('[data-cell]'))focusButton(key==='ArrowLeft'||key==='ArrowUp'?-1:1);
    }
  }
  let frame=0,last=new Map(),nextRepeat=new Map(),connected=false;
  function poll(time) {
    frame=0;if(document.hidden){release();return;}
    let pad;try{pad=Array.from(navigator.getGamepads?.()||[]).find(p=>p&&p.mapping==='standard');}catch(_){release();return;}
    if(!pad){release();last.clear();connected=false;gamepadNote.textContent='Геймпад від’єднано. Клавіатура й дотики залишаються доступними.';return;}
    if(!connected){gamepadNote.textContent='Стандартний геймпад під’єднано.';connected=true;}
    const button=n=>!!pad.buttons[n]?.pressed,keys={ArrowUp:button(12)||pad.axes[1]<-.55,ArrowDown:button(13)||pad.axes[1]>.55,ArrowLeft:button(14)||pad.axes[0]<-.55,ArrowRight:button(15)||pad.axes[0]>.55,A:button(0),B:button(1),L:button(4),R:button(5)};
    for(const [key,down] of Object.entries(keys)) {
      if(legacy){if(codes[key]||key==='A')send(key==='A'?' ':key,down);}
      else if(down&&(!last.get(key)||key.startsWith('Arrow')&&time>nextRepeat.get(key))){action(key);nextRepeat.set(key,time+(last.get(key)?140:350));}
      last.set(key,down);
    }
    frame=requestAnimationFrame(poll);
  }
  function start(){if(!frame&&!document.hidden)frame=requestAnimationFrame(poll);}
  window.addEventListener('gamepadconnected',start);
  window.addEventListener('gamepaddisconnected',()=>{release();start();});
  window.addEventListener('blur',()=>{cancelAnimationFrame(frame);frame=0;release();last.clear();});
  window.addEventListener('focus',start);
  document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(frame);frame=0;release();if(!document.hidden)start();});
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;release();});
  start();
})();
