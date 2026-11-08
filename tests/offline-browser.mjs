import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium,webkit} from 'playwright';
const device=process.env.GAME_DEVICE||'desktop',mobile=device!=='desktop',browser=await(device==='ios'?webkit:chromium).launch();
const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900},isMobile:mobile,hasTouch:mobile});
const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
fs.mkdirSync('reports/offline/'+device,{recursive:true});
try{
 await page.goto('http://127.0.0.1:4173/');await page.getByText('Оберіть гру або збережіть легкі ігри для офлайну.',{exact:true}).waitFor();
 await page.getByRole('combobox').selectOption('eligible');const game=page.locator('[data-game="sudoku"]');assert(await game.isVisible());await game.getByRole('button',{name:'Зберегти офлайн',exact:true}).click();
 await page.getByText('Гру збережено. Тепер її можна запускати без інтернету.',{exact:true}).waitFor();
 await page.locator('#collection').selectOption('offline');assert.equal(await page.locator('.game').count(),1);
 await context.setOffline(true);await page.reload();await page.getByText('Ви офлайн. Запускайте заздалегідь збережені ігри.',{exact:true}).waitFor();assert.equal(await page.locator('.game').count(),1);
 await page.locator('[data-game="sudoku"] .play').click();await page.locator('.sudoku button').first().waitFor();assert.equal(await page.locator('.sudoku button').count(),81);await page.getByRole('button',{name:'Підказка',exact:true}).click();assert((await page.locator('#status').innerText()).includes('Підказок: 1'));await page.reload();await page.locator('.sudoku button').first().waitFor();assert((await page.locator('#status').innerText()).includes('Підказок: 1'));
 await page.screenshot({path:'reports/offline/'+device+'/sudoku-without-network.jpg',type:'jpeg',quality:75});
 await page.goto('http://127.0.0.1:4173/');await page.getByText('Ви офлайн. Запускайте заздалегідь збережені ігри.',{exact:true}).waitFor();await page.getByRole('button',{name:'Прибрати офлайн',exact:true}).click();await page.getByText('Файли прибрано. Збережена партія залишилася.',{exact:true}).waitFor();assert.equal(await page.locator('.game').count(),0);
 const progress=await page.evaluate(()=>JSON.parse(localStorage.getItem('ac_sudoku_v1')));assert.equal(progress.hints,1);assert.deepEqual(errors,[]);
 fs.writeFileSync('reports/offline/'+device+'/results.json',JSON.stringify({device,passed:true,checks:['save complete local game','offline app reload','offline Sudoku gameplay','offline progress persistence','remove cached files without removing progress'],sourceCommit:process.env.GITHUB_SHA,workflowRun:process.env.GITHUB_RUN_ID},null,2));console.log('PASS:',device,'offline install, launch, gameplay, persistence and removal');
}finally{await context.close();await browser.close();}
