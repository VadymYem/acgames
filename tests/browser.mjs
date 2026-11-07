import fs from 'node:fs';
import path from 'node:path';
import {chromium,webkit} from 'playwright';
const registry=JSON.parse(fs.readFileSync('catalog.json','utf8'));
const device=process.env.GAME_DEVICE||'desktop';
const isMobile=device!=='desktop';
const engine=device==='ios'?webkit:chromium;
const browser=await engine.launch({headless:true,args:device==='ios'?[]:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
const out=path.join('reports','browser',device);fs.mkdirSync(out,{recursive:true});
const results=[];
const requested=(process.env.GAME_IDS||'').split(',').filter(Boolean);
const queue=registry.games.filter(g=>(process.env.GAME_PUBLISHED_ONLY==='true'?g.devices:(g.candidateDevices||g.devices))[device]&&(!requested.length||requested.includes(g.id)));
const published=new Set(registry.games.filter(g=>g.devices[device]).map(g=>g.id));
async function worker(){
 for(;;){
  const game=queue.shift();if(!game)return;
  const context=await browser.newContext({viewport:isMobile?{width:390,height:844}:{width:1280,height:800},hasTouch:isMobile,isMobile,userAgent:device==='android'?'Mozilla/5.0 (Linux; Android 16; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36':device==='ios'?'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Mobile/15E148 Safari/604.1':undefined});
  await context.addInitScript(()=>{
   window.__acPolicyViolations=[];
   document.addEventListener('securitypolicyviolation',event=>{
    if(/^https?:/i.test(event.blockedURI))window.__acPolicyViolations.push(event.blockedURI);
   });
  });
  const page=await context.newPage();const errors=[],missing=[],external=[],blocked=[],rowStacks=[];
  page.on('pageerror',e=>{errors.push(e.message);rowStacks.push(e.stack);});
  page.on('response',r=>{if(r.status()>=400)missing.push({status:r.status(),url:r.url().replace('http://127.0.0.1:4173/','')});});
  page.on('response',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith('http://127.0.0.1:4173/'))external.push(r.url());});
  page.on('requestfailed',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith('http://127.0.0.1:4173/')){blocked.push(r.url());if(!/fonts\.google|unity3d|analytics|googletagmanager|sockjs-node/.test(r.url()))missing.push({status:'blocked-external',url:r.url()});}});
  const row={id:game.id,device,entry:game.entry,errors,missing,external,blocked,stacks:rowStacks};
  try{
   await page.goto('http://127.0.0.1:4173/'+game.entry,{waitUntil:'domcontentloaded',timeout:30000});
   await page.mouse.click(12,12).catch(()=>{});
   await page.waitForTimeout(game.kind==='flash'?10000:5500);
   for(const name of [/^play(?: now)?$/i,/^start(?: game)?$/i,/^new game$/i,/^continue$/i,/^Почати$/i]){
    const btn=page.getByRole('button',{name}).first();if(await btn.isVisible().catch(()=>false)){await btn.click({timeout:1500}).catch(()=>{});break;}
   }
   const domControl=page.locator('.play-button,.start-button,.option_image,.card,.js-pacman-start').first();
   if(await domControl.isVisible().catch(()=>false))await domControl.click({timeout:1500}).catch(()=>{});
   const canvas=page.locator('canvas').first();
   if(await canvas.isVisible().catch(()=>false)){
    const box=await canvas.boundingBox();if(box){const x=Math.min(box.x+box.width/2,1280-8),y=Math.min(box.y+box.height/2,(isMobile?844:800)-8);if(isMobile)await page.touchscreen.tap(Math.min(x,382),y);else await page.mouse.click(x,y);}
   }
   if(isMobile){await page.touchscreen.tap(195,380).catch(()=>{});}
   else{for(const key of ['Enter','ArrowRight','ArrowUp','ArrowLeft','ArrowDown','Space'])await page.keyboard.press(key).catch(()=>{});}
   await page.waitForTimeout(1200);
   row.surface=await page.evaluate(()=>({canvas:[...document.querySelectorAll('canvas')].filter(c=>c.width>1&&c.height>1).length,buttons:document.querySelectorAll('button,input,[role="button"],.tile,.square,.cell,.card,.option_image,.play-button,.js-pacman-playground>*').length,text:document.body?.innerText.trim().length||0,flash:document.querySelectorAll('ruffle-player').length,overflow:document.documentElement.scrollWidth>innerWidth+2}));
   const policy=await page.evaluate(()=>window.__acPolicyViolations||[]);
   for(const url of new Set(policy)){
    if(/fonts\.google|unity3d|analytics|googletagmanager|sockjs-node/.test(url))continue;
    if(!missing.some(item=>item.url===url))missing.push({status:'csp-blocked',url});
   }
   row.started=Boolean(row.surface.canvas||row.surface.buttons||row.surface.flash);
   row.passed=row.started&&errors.length===0&&missing.length===0&&external.length===0;
   await page.screenshot({path:path.join(out,game.id+'.jpg'),type:'jpeg',quality:60,timeout:5000}).catch(()=>{});
  }catch(e){row.failure=e.message;row.passed=false;}
  results.push(row);console.log(device,game.id,row.passed?'PASS':'REVIEW',JSON.stringify({errors:errors.slice(0,2),missing:missing.slice(0,2),failure:row.failure}));
  await context.close();
 }
}
await Promise.all(Array.from({length:3},()=>worker()));
await browser.close();
fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({device,tested:results.length,passed:results.filter(r=>r.passed).length,results},null,2));
console.log('Completed',device,results.length,'games;',results.filter(r=>r.passed).length,'passed load and input smoke');

const regressions=results.filter(row=>(published.has(row.id)||process.env.GAME_REQUIRE_ALL==='true')&&!row.passed);
console.log('Published game regressions:',regressions.length);
if(regressions.length)process.exitCode=1;
