'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
test('Doge 2048 can award more than four points without an advertising slot',()=>{
  const nodes=[];
  const document={createElement(){return {classList:{add(){}},setAttribute(){}};}};
  const context={document,Math};
  vm.runInNewContext(fs.readFileSync('games/doge2048/play/js/html_actuator.js','utf8'),context);
  const ui={score:0,clearContainer(){},scoreContainer:{appendChild(node){nodes.push(node);}},dogeSays:{appendChild(){}}};
  context.HTMLActuator.prototype.updateScore.call(ui,8);
  assert.equal(ui.score,8);
  assert.equal(ui.scoreContainer.textContent,8);
  assert.equal(nodes[0].textContent,'+8');
});
test('Bounceback accepts mouse movement before the game script initializes',()=>{
  const source=fs.readFileSync('games/bounceback/gameEngine.js','utf8');
  const start=source.indexOf('onmousemove   =');
  const context={document:{getElementById(){return {getBoundingClientRect(){return {left:0,top:0,width:100,height:100};}};}},mousePos:{Set(){return this;},Multiply(){return this;}},mainCanvasSize:{x:100,y:100}};
  const handler=source.slice(start,source.indexOf('\n}',start)+2);
  vm.runInNewContext(handler,context);
  assert.doesNotThrow(()=>context.onmousemove({x:20,y:30,clientX:20,clientY:30}));
});