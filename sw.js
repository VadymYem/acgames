'use strict';
const BUILD='__AC_BUILD__',SHELL='authorche-games-shell-'+BUILD,META='authorche-games-offline-meta-v1',PREFIX='authorche-game-v1-',BASE=new URL('./',self.location).href;
const shell=['','index.html','app.js','app.css','manifest.webmanifest','catalog.json','offline-manifest.json','shared/library.js','shared/icons/icon-192.png','shared/icons/icon-512.png'];
const absolute=path=>new URL(path,BASE).href;
const metadataURL=absolute('_offline/state');
let busy=false;
async function state(){const cache=await caches.open(META),entry=await cache.match(metadataURL);return entry?entry.json():{};}
async function write(value){const cache=await caches.open(META);await cache.put(metadataURL,new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json'}}));}
self.addEventListener('install',event=>event.waitUntil(caches.open(SHELL).then(cache=>cache.addAll(shell.map(absolute)))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith('authorche-games-shell-')&&name!==SHELL)await caches.delete(name);await self.clients.claim();})()));
function gameId(url){const relative=url.startsWith(BASE)?url.slice(BASE.length):'';return /^games\/([a-z0-9_-]+)\//.exec(relative)?.[1]||null;}
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(BASE))return;
 event.respondWith((async()=>{
  try{const response=await fetch(request);if(response.ok){const relative=url.href.slice(BASE.length).split('?')[0];if(shell.includes(relative)){const cache=await caches.open(SHELL);await cache.put(absolute(relative),response.clone());}}return response;}catch(error){
   let id=gameId(url.href)||/^shared\/covers\/([a-z0-9_-]+)\./.exec(url.href.slice(BASE.length))?.[1];if(!id&&event.clientId){const client=await self.clients.get(event.clientId);id=client&&gameId(client.url);}
   const stored=await state();if(id&&stored[id]){const cache=await caches.open(stored[id].cache),hit=await cache.match(request,{ignoreSearch:true});if(hit)return hit;}
   const cache=await caches.open(SHELL),hit=await cache.match(request,{ignoreSearch:true});if(hit)return hit;
   if(request.mode==='navigate')return Response.redirect(BASE,302);throw error;
  }
 })());
});
self.addEventListener('message',event=>{
 const data=event.data||{},port=event.ports?.[0];
 if(data.type==='ACTIVATE_UPDATE'){self.skipWaiting();return;}
 if(!port||!event.source?.url?.startsWith(BASE))return;
 event.waitUntil((async()=>{
  let acquired=false;
  try{
   if(data.type==='LIST'){port.postMessage({ok:true,games:await state()});return;}
   if(!['SAVE','REMOVE'].includes(data.type)||!/^[-a-z0-9]+$/.test(data.id||''))throw Error('Невідомий запит.');
   if(busy)throw Error('Дочекайтеся завершення попереднього збереження.');busy=true;acquired=true;
   const stored=await state();
   if(data.type==='REMOVE'){if(stored[data.id])await caches.delete(stored[data.id].cache);delete stored[data.id];await write(stored);port.postMessage({ok:true,games:stored});return;}
   const response=await fetch(absolute('offline-manifest.json'),{cache:'reload'});if(!response.ok)throw Error('Не вдалося отримати список файлів.');const manifest=await response.json(),game=manifest.games.find(g=>g.id===data.id);
   if(!game)throw Error('Цю гру зараз не можна зберегти офлайн.');
   if(!stored[data.id]&&Object.keys(stored).length>=5)throw Error('Збережіть до п’яти ігор. Спочатку приберіть одну з офлайн-добірки.');
   if(!Array.isArray(game.files)||game.files.length>80||game.files.some(file=>typeof file!=='string'||file.includes('..')||!file.startsWith('games/'+data.id+'/')&&!file.startsWith('shared/')))throw Error('Некоректний список файлів.');
   const name=PREFIX+data.id+'-'+manifest.buildRevision+'-'+Date.now(),cache=await caches.open(name);let total=0;
   try{
    for(const path of game.files){const r=await fetch(absolute(path),{cache:'reload'});if(!r.ok)throw Error('Не вдалося завантажити всі файли гри.');const blob=await r.blob();total+=blob.size;if(total>5*1024*1024)throw Error('Гра перевищує ліміт офлайн-добірки.');await cache.put(absolute(path),new Response(blob,{status:r.status,headers:r.headers}));}
    const old=stored[data.id]?.cache;stored[data.id]={cache:name,title:game.title,at:Date.now(),bytes:total};await write(stored);if(old&&old!==name)await caches.delete(old);port.postMessage({ok:true,games:stored});
   }catch(error){if(stored[data.id]?.cache!==name)await caches.delete(name);throw error;}
  }catch(error){port.postMessage({ok:false,error:error.message||'Браузер не зміг зберегти файли. Перевірте вільне місце.'});}finally{if(acquired)busy=false;}
 })());
});
