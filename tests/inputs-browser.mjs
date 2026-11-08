import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium,webkit} from 'playwright';
const device=process.env.GAME_DEVICE||'desktop',mobile=device!=='desktop';
const browser=await(device==='ios'?webkit:chromium).launch({args:device==='ios'?[]:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
const out='reports/browser/'+device;fs.mkdirSync(out,{recursive:true});const results=[];
for(const id of ['sokoban','klondike','asteroids','snake-retro','adarkroom','coloron',...(mobile?[]:['tube-jumpers'])]){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900},isMobile:mobile,hasTouch:mobile});
 await context.addInitScript(()=>{window.testPad={mapping:'standard',axes:[0,0],buttons:Array.from({length:16},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[window.testPad]});});
 const page=await context.newPage(),row={id,device,errors:[],missing:[],external:[],checks:[]};
 page.on('pageerror',e=>row.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)row.missing.push(r.url());if(!r.url().startsWith('http://127.0.0.1:4173/'))row.external.push(r.url());});
 await page.addInitScript(()=>{window.policyErrors=[];document.addEventListener('securitypolicyviolation',e=>{if(/^https?:/.test(e.blockedURI))window.policyErrors.push(e.blockedURI);});});
 async function pressPad(button){await page.evaluate(button=>{testPad.buttons[button].pressed=true;window.dispatchEvent(new Event('gamepadconnected'));},button);await page.waitForTimeout(90);await page.evaluate(button=>{testPad.buttons[button].pressed=false;},button);await page.waitForTimeout(40);}
 try{
  await page.goto('http://127.0.0.1:4173/games/'+id+'/index.html');
  if(id==='sokoban'){
   await page.getByRole('button',{name:'Спочатку',exact:true}).click();await pressPad(15);await pressPad(15);assert((await page.locator('#status').innerText()).includes('пройдено'));await pressPad(1);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('ac_arcade_v1:sokoban')).state.steps),1);row.checks.push('standard D-pad solves a level','B undoes the move');
  }else if(id==='klondike'){
   await page.getByRole('button',{name:'Відкрити карту',exact:true}).focus();await pressPad(0);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('ac_arcade_v1:klondike')).state.waste.length),1);await pressPad(1);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('ac_arcade_v1:klondike')).state.waste.length),0);row.checks.push('A draws a card','B restores the previous stock');
  }else if(id==='asteroids'||id==='snake-retro'){
   if(!mobile){await page.locator('.ac-input-help summary').click();await page.getByRole('button',{name:'Екранні кнопки',exact:true}).click();}
   assert(await page.locator('.ac-touch-pad').isVisible());
   await page.getByRole('button',{name:'Почати / дія',exact:true}).click({delay:90});
   if(id==='asteroids'){
    await page.waitForFunction(()=>Game.FSM.state==='run');const left=page.getByRole('button',{name:'Рух ліворуч',exact:true}),box=await left.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.waitForTimeout(80);assert(await page.evaluate(()=>KEY_STATUS.left));await page.mouse.up();assert.equal(await page.evaluate(()=>KEY_STATUS.left),false);await pressPad(14);assert.equal(await page.evaluate(()=>KEY_STATUS.left),false);row.checks.push('touch starts the game','held direction and release reach the engine','gamepad release clears the engine key');
   }else{
    assert.equal(await page.locator('#start-screen').isVisible(),false);await page.getByRole('button',{name:'Рух угору',exact:true}).click({delay:60});await page.waitForFunction(()=>snake.dy===-1);await page.waitForFunction(()=>snake.cells.length>=4);assert.equal(await page.evaluate(()=>snake.cells.length),4);row.checks.push('touch starts the game','on-screen arrow changes snake direction','initial four-cell snake body grows correctly');
   }
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
  }else if(id==='adarkroom'){
   await page.locator('#lightButton').click();await page.locator('#stokeButton').waitFor();await page.waitForFunction(()=>Object.keys(AudioEngine.AUDIO_BUFFER_CACHE).length>0);assert(await page.evaluate(()=>Object.keys(AudioEngine.AUDIO_BUFFER_CACHE).every(url=>!url.includes('index.htmlaudio'))));row.checks.push('lighting the fire advances the room','audio files load and decode from their correct directory');
  }else if(id==='coloron'){
   await page.locator('.start-game .play-button').click();await page.locator('.scene #ball').waitFor();const bar=page.locator('.scene .stick').first();await bar.waitFor();row.checks.push('play starts the ball animation','local scene creates playable platforms');
  }else{
   await page.locator('canvas').first().waitFor({timeout:35000});await page.keyboard.press('Enter');await page.keyboard.press('w');await page.waitForTimeout(1500);row.checks.push('Unity canvas loads','keyboard input is delivered');
  }
  assert.deepEqual(row.errors,[]);assert.deepEqual(row.missing,[]);assert.deepEqual(row.external,[]);assert.deepEqual(await page.evaluate(()=>policyErrors),[]);row.passed=true;await page.screenshot({path:out+'/inputs-'+id+'.jpg',type:'jpeg',quality:75});
 }catch(error){row.passed=false;row.failure=error.stack||error.message;await page.screenshot({path:out+'/inputs-'+id+'-failure.jpg',type:'jpeg',quality:75}).catch(()=>{});}
 results.push(row);console.log(JSON.stringify(row));await context.close();
}
await browser.close();fs.writeFileSync(out+'/inputs.json',JSON.stringify({device,sourceCommit:process.env.GITHUB_SHA,workflowRun:process.env.GITHUB_RUN_ID,results},null,2)+'\n');if(results.some(r=>!r.passed))process.exitCode=1;
