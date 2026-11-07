'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
test('advertising callbacks finish locally without a network SDK',async()=>{
 const handlers={};
 const document={addEventListener(){},querySelectorAll(){return [];}};
 const window={location:{href:'https://games.example/games/2048/',origin:'https://games.example'},addEventListener(n,f){handlers[n]=f;},dispatchEvent(){}};
 window.parent=window;
 const context={window,document,navigator:{language:'uk-UA'},URL,Promise,Proxy,Event};
 vm.runInNewContext(fs.readFileSync('shared/platform.js','utf8'),context);
 assert.equal(await window.PokiSDK.rewardedBreak(),true);
 assert.equal(typeof window.PokiSDK.gameLoadingFinished,'function');
 let finished=0;await window.CrazyGames.SDK.ad.requestAd('midgame',{adFinished(){finished++;}});
 assert.equal(finished,1);
 const events=[];window.GD_OPTIONS={onEvent(e){events.push(e.name);}};
 handlers.load();await window.gdsdk.showAd();
 assert.deepEqual(events,['SDK_READY','SDK_GAME_START']);
 assert.equal(window.open('https://advertiser.example'),null);
});
test('registry has unique entries, artwork and explicit device support',()=>{
 const catalog=JSON.parse(fs.readFileSync('catalog.json','utf8'));
 assert(catalog.games.length>150);
 assert.equal(new Set(catalog.games.map(g=>g.id)).size,catalog.games.length);
 for(const g of catalog.games){
  assert(fs.existsSync(g.entry),g.id);
  assert(fs.existsSync(g.cover),g.id);
  assert.deepEqual(Object.keys(g.devices).sort(),['android','desktop','ios']);
  if(g.kind==='flash'){assert.equal(g.devices.android,false);assert.equal(g.devices.ios,false);}
 }
 assert(!catalog.games.some(g=>g.id==='avatar'));
});
