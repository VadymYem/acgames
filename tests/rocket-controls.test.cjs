'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
test('Rocket League keyboard ignores input until both cars exist',()=>{
  const source=fs.readFileSync('games/2drocketleague/js/main.js','utf8');
  const start=source.indexOf('function KeyboardController(');
  const end=source.indexOf('KeyboardController({',start);
  const context={players:[],document:{},window:{},setInterval(){return 1;},clearInterval(){}};
  vm.runInNewContext(source.slice(start,end),context);
  let moves=0;
  context.KeyboardController({37(){moves++;}},50);
  assert.equal(context.document.onkeydown({keyCode:37}),true);
  assert.equal(moves,0);
  context.players.push({},{});
  context.document.onkeydown({keyCode:37});
  assert.equal(moves,1);
  context.document.onkeyup({keyCode:37});
});
