'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function platform(){
 const handlers={},nodes=new Map(),network=[];
 const document={head:{appendChild(node){nodes.set(node.id,node);}},createElement(){return {};},getElementById(id){return nodes.get(id);},addEventListener(){},querySelectorAll(){return [];}};
 const window={location:{href:'https://example.test/acgames/games/test/',origin:'https://example.test'},addEventListener(n,f){handlers[n]=f;},dispatchEvent(){},fetch:async function(input){network.push(input);return new Response('asset');}};
 window.parent=window;
 const navigator={language:'uk-UA',sendBeacon(url){network.push(url);return true;}};
 vm.runInNewContext(fs.readFileSync('shared/platform.js','utf8'),{window,document,navigator,URL,Promise,Proxy,Event,Response,Uint8Array});
 return {window,document,navigator,handlers,network};
}
test('a game initialized after page load receives SDK_READY exactly once',async()=>{
 const p=platform(),events=[];
 p.handlers.load();
 const options={onEvent(e){events.push(e.name);}};
 p.window.GD_OPTIONS=options;
 await Promise.resolve();
 p.handlers.load();
 p.window.GD_OPTIONS=options;
 await Promise.resolve();
 assert.deepEqual(events,['SDK_READY']);
 assert(p.document.getElementById('gamedistribution-jssdk'));
});
test('embedded legacy telemetry completes locally without network requests',async()=>{
 const p=platform();
 const movie=await p.window.fetch('https://mochibot.com/my/core.swf?mv=7');
 assert.equal(movie.headers.get('content-type'),'application/x-shockwave-flash');
 assert.equal(Buffer.from(await movie.arrayBuffer()).subarray(0,3).toString(),'FWS');
 const news=await p.window.fetch('https://ninjakiwi.com/btd5/scripts/get-challenge.php');
 assert.equal(await news.text(),'{}');
 assert.equal(p.navigator.sendBeacon('https://itch.io/html-callback',new Uint8Array()),true);
 assert.deepEqual(p.network,[]);
 await p.window.fetch('https://example.test/acgames/shared/game.css');
 assert.equal(p.network.length,1);
});
test('Subway mesh cloning honors its explicit texture after asynchronous model loads',()=>{
 const source=fs.readFileSync('dist/games/subway-surfers-ny/js/main.js','utf8');
 const prefix='(Model.getEntityCloneOpaque = ';
 const start=source.indexOf(prefix);
 const end=source.indexOf('\n            }),',start);
 assert(start>=0&&end>start);
 function Material(options){this.map=options.map;}
 const method=vm.runInNewContext('('+source.slice(start+prefix.length,end)+'\n})',{N:Material,C:{a:Material},B:{fog:false},Y:{},v:{a:function(options){Object.assign(this,options);}}});
 const entity={__file:'model_avatar_catch.fbx',view3d:{geometry:{name:'sprayCan'},state:{}}};
 const model={getEntity(name,texture){assert.equal(name,'sprayCan');assert.equal(texture,'props_tex');return entity;},getTexture(name){assert.equal(name,'props_tex');return 'props-bitmap';}};
 const clone=method.call(model,'sprayCan','props_tex',false);
 assert.equal(clone.material.map,'props-bitmap');
 assert.equal(clone.geometry,entity.view3d.geometry);
});
