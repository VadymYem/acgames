import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium,webkit} from 'playwright';
const device=process.env.GAME_DEVICE||'desktop',mobile=device!=='desktop',browser=await(device==='ios'?webkit:chromium).launch();
const out='reports/arcade/'+device;fs.mkdirSync(out,{recursive:true});const results=[];
const ids=['klondike','spider','mahjong','sokoban','wordsearch','draughts','reversi','battleship','fruit-merge','music-lab'];
for(const id of ids){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce',userAgent:device==='android'?'Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36':device==='ios'?'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 Version/19.0 Mobile/15E148 Safari/604.1':undefined});
 const page=await context.newPage(),row={id,device,errors:[],missing:[],external:[],checks:[]};
 page.on('pageerror',e=>row.errors.push(e.stack||e.message));page.on('response',r=>{if(r.status()>=400)row.missing.push(r.url());if(!/^http:\/\/(localhost|127\.0\.0\.1):4173\//.test(r.url()))row.external.push(r.url());});
 try{
  const url='http://localhost:4173/tests/arcade-player.html?id='+id;
  await page.goto(url);let frame=page.frames().find(f=>f.url().includes('/games/'+id+'/'));
  if(!frame){await page.locator('iframe').contentFrame().locator('#tools button').first().waitFor();frame=page.frames().find(f=>f.url().includes('/games/'+id+'/'));}
  await frame.locator('#tools button').first().waitFor();
  const read=()=>frame.evaluate(id=>JSON.parse(localStorage.getItem('ac_arcade_v1:'+id)).state,id);
  const check=name=>row.checks.push(name);
  if(id==='reversi'){
   await frame.getByLabel('Режим').selectOption('local');for(let n=0;n<4;n++)await frame.locator('.cell.legal').first().click();assert.equal((await read()).moves,4);await frame.getByRole('button',{name:'Скасувати хід',exact:true}).click();assert.equal((await read()).moves,3);check('legal flips, four local turns and undo');
  }else if(id==='draughts'){
   await frame.getByLabel('Режим').selectOption('local');for(let n=0;n<4;n++){const move=await frame.evaluate(id=>{const s=JSON.parse(localStorage.getItem('ac_arcade_v1:'+id)).state;return AuthorCheArcade.draughtsMoves(s.board,s.player)[0];},id);for(const index of move.path)await frame.locator('[data-cell="'+index+'"]').click();}assert.equal((await read()).moves,4);await frame.getByRole('button',{name:'Скасувати хід',exact:true}).click();assert.equal((await read()).moves,3);check('mandatory legal moves, four local turns and undo');
  }else if(id==='sokoban'){
   await frame.getByRole('button',{name:'Рух →',exact:true}).click();await frame.getByRole('button',{name:'Рух →',exact:true}).click();assert((await frame.locator('#status').innerText()).includes('пройдено'));await frame.getByRole('button',{name:'Скасувати хід',exact:true}).click();assert.equal((await read()).steps,1);await frame.getByRole('button',{name:'Редактор рівнів',exact:true}).click();assert.equal(await frame.locator('.editor-tools').isVisible(),true);await frame.getByRole('button',{name:'Редактор рівнів',exact:true}).click();check('level completion, undo and editor toggle');
  }else if(id==='wordsearch'){
   for(const lang of ['uk','de','en']){await frame.getByLabel('Мова',{exact:true}).selectOption(lang);const s=await read(),w=s.words[0];await frame.locator('[data-cell="'+w.cells[0]+'"]').click();await frame.locator('[data-cell="'+w.cells.at(-1)+'"]').click();assert.equal((await read()).found.length,1);}check('finding complete words in Ukrainian, German and English');
  }else if(id==='klondike'){
   await frame.getByRole('button',{name:'Відкрити карту',exact:true}).click();assert.equal((await read()).waste.length,1);await frame.getByRole('button',{name:'Відкрити карту',exact:true}).click();await frame.getByRole('button',{name:'Скасувати хід',exact:true}).click();assert.equal((await read()).moves,1);check('stock draw and undo');
  }else if(id==='spider'){
   await frame.getByRole('button',{name:'Роздати ряд',exact:true}).click();assert.equal((await read()).stock.length,40);await frame.getByRole('button',{name:'Скасувати хід',exact:true}).click();assert.equal((await read()).stock.length,50);await frame.getByRole('button',{name:'Роздати ряд',exact:true}).click();check('ten-card row deal and undo');
  }else if(id==='mahjong'){
   const pair=await frame.evaluate(id=>AuthorCheArcade.mahjongPairs(JSON.parse(localStorage.getItem('ac_arcade_v1:'+id)).state)[0],id);await frame.getByRole('button',{name:'Підказка',exact:true}).click();assert.equal(await frame.locator('.mahjong-tile.hint').count(),2);for(const index of pair)await frame.locator('[data-tile="'+index+'"]').click();assert.equal((await read()).tiles.filter(t=>t.removed).length,2);await frame.getByRole('button',{name:'Скасувати пару',exact:true}).click();assert.equal((await read()).tiles.filter(t=>t.removed).length,0);await frame.getByRole('button',{name:'Підказка',exact:true}).click();check('free-pair matching, hints and undo');
  }else if(id==='battleship'){
   await frame.getByRole('button',{name:'Переставити кораблі',exact:true}).click();await frame.getByRole('button',{name:'Почати бій',exact:true}).click();const s=await read(),cell=s.enemy[0][0],name='Постріл '+String.fromCharCode(65+cell%10)+(Math.floor(cell/10)+1);await frame.getByRole('button',{name,exact:true}).click();assert((await read()).shots.includes(cell));assert((await frame.locator('#status').innerText()).includes('Влучання'));check('fleet setup, start and successful hit');
  }else if(id==='fruit-merge'){
   await frame.getByRole('button',{name:'Скинути фрукт',exact:true}).click();await frame.locator('canvas').waitFor();assert.equal((await read()).moves,1);await frame.getByRole('button',{name:'Пауза',exact:true}).click();check('fruit drop, physics canvas and pause');
  }else if(id==='music-lab'){
   await frame.getByRole('button',{name:'▶ Прослухати',exact:true}).click();await frame.locator('.music-options button').first().click();assert.equal((await read()).answered,true);await frame.getByRole('button',{name:'Далі →',exact:true}).click();assert.equal((await read()).round,1);await frame.getByLabel('Вправа').selectOption('intervals');await frame.getByRole('button',{name:'▶ Прослухати',exact:true}).click();await frame.locator('.music-options button').first().click();check('user-gesture Web Audio, note answers and interval mode');
  }
  const before=await read();await page.reload();await page.locator('iframe').contentFrame().locator('#tools button').first().waitFor();frame=page.frames().find(f=>f.url().includes('/games/'+id+'/'));const after=await read();
  if(id==='fruit-merge')assert.equal(after.moves,before.moves);else assert.deepEqual(after,before);check('saved game survives reload');
  const overflow=await frame.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);assert.equal(overflow,false,'page must fit its viewport');check('no document overflow');
  await frame.locator('#tools button').first().focus();await page.keyboard.press('Tab');assert(await frame.evaluate(()=>document.activeElement?.tagName!=='BODY'));check('keyboard focus');
  await page.screenshot({path:out+'/'+id+'.jpg',type:'jpeg',quality:75,fullPage:false});
  assert.deepEqual(row.errors,[]);assert.deepEqual(row.missing,[]);assert.deepEqual(row.external,[]);row.passed=true;
 }catch(e){row.passed=false;row.failure=e.stack||e.message;await page.screenshot({path:out+'/'+id+'-failure.jpg',type:'jpeg',quality:75}).catch(()=>{});}
 results.push(row);console.log(JSON.stringify(row));await context.close();
}
await browser.close();fs.writeFileSync(out+'/results.json',JSON.stringify({sourceCommit:process.env.GITHUB_SHA||'local',workflowRun:process.env.GITHUB_RUN_ID||'local',device,results},null,2)+'\n');
if(results.some(row=>!row.passed))process.exitCode=1;
