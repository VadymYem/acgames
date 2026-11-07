'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
test('Tiny Fishing loader runs without publisher DOM and clamps its progress',()=>{
  const context={window:{}};
  vm.runInNewContext(fs.readFileSync('games/tinyfishing/html5game/zph_djl.js','utf8'),context);
  const labels=[],rects=[];
  const canvas={fillRect(...args){rects.push(args);},fillText(text){labels.push(text);}};
  context.dj_loading(canvas,320,640,100,150);
  assert.equal(context.dj_loading_get_current(),100);
  assert.equal(context.dj_loading_get_width(),320);
  assert.equal(labels[0],'AUTHORCHE GAMES');
  assert.equal(rects[1][2],rects[2][2]);
  context.dj_loading(canvas,320,640,0,0);
  assert.equal(rects.at(-1)[2],0);
  context.dg_hide_loading();
});
