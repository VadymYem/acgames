'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../shared/classics-core.js');
test('Connect Four: gravity, full columns and wins in every direction',()=>{
 let board=Array(42).fill(0);
 for(let r=0;r<6;r++){const m=C.drop(board,0,r%2+1);assert.equal(m.index,(5-r)*7);board=m.board;}
 assert.equal(C.drop(board,0,1),null);
 for(const [dr,dc,r,c] of [[0,1,5,1],[1,0,1,4],[1,1,1,1],[1,-1,1,5]]){
  const b=Array(42).fill(0);for(let k=0;k<4;k++)b[(r+k*dr)*7+c+k*dc]=2;
  assert.equal(C.win(b).player,2);
 }
 assert.equal(C.win(Array(42).fill(0)),null);
});
test('Connect Four opponent takes a win and blocks a forced loss',()=>{
 const a=Array(42).fill(0);a[35]=a[36]=a[37]=2;assert.equal(C.bestDrop(a,2,4),3);
 const b=Array(42).fill(0);b[35]=b[36]=b[37]=1;assert.equal(C.bestDrop(b,2,4),3);
 assert.deepEqual(a.slice(35,38),[2,2,2],'search cannot mutate the board');
});
test('Sudoku transformations preserve a unique solution and given numbers',()=>{
 for(const easy of [false,true])for(let i=0;i<8;i++){
  const game=C.makeSudoku(easy);assert.equal(C.countSudokuSolutions(game.puzzle),1);
  assert(game.puzzle.every((v,i)=>!v||v===game.solution[i]));
  for(let r=0;r<9;r++)assert.equal(new Set(game.solution.slice(r*9,r*9+9)).size,9);
  for(let c=0;c<9;c++)assert.equal(new Set(Array.from({length:9},(_,r)=>game.solution[r*9+c])).size,9);
  assert.equal(game.puzzle.filter(Boolean).length,easy?42:30);
 }
});
test('Nonograms distinguish groups, crosses and completed pictures',()=>{
 assert.deepEqual(C.clues([1,1,0,1,0]),[2,1]);assert.deepEqual(C.clues([0,0,0]),[0]);
 assert(C.nonogramDone([1,-1,1,0],[1,0,1,0]));assert(!C.nonogramDone([1,1,1,0],[1,0,1,0]));
});
