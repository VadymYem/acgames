'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../shared/arcade-core.js');
test('Reversi flips, legal play, forced passes and complete deterministic games',()=>{
 const b=C.reversiBoard();assert.equal(C.reversiMoves(b,1).length,4);const i=C.reversiMoves(b,1)[0],next=C.reversiPlay(b,i,1);assert.equal(next.filter(v=>v===1).length,4);assert.equal(b.filter(Boolean).length,4);assert.equal(C.reversiPlay(b,27,1),null);
 for(let seed=0;seed<10;seed++){let board=C.reversiBoard(),player=1,passed=false;const rng=C.random(seed);for(let turn=0;turn<125;turn++){const moves=C.reversiMoves(board,player);if(!moves.length){if(passed)break;passed=true;player*=-1;continue;}passed=false;const after=C.reversiPlay(board,moves[Math.floor(rng()*moves.length)],player);assert.equal(after.filter(Boolean).length,board.filter(Boolean).length+1);board=after;player*=-1;}assert(!C.reversiMoves(board,1).length&&!C.reversiMoves(board,-1).length);}
 assert(C.reversiMoves(b,1).includes(C.reversiBest(b,1)));
});
test('English draughts requires captures, follows multiple jumps and ends crowning turns',()=>{
 const start=C.draughtsBoard();assert.equal(start.filter(v=>v===1).length,12);assert.equal(C.draughtsMoves(start,1).length,7);
 const b=Array(64).fill(0);b[42]=1;b[35]=-1;b[21]=-1;const moves=C.draughtsMoves(b,1);assert.equal(moves.length,1);assert.deepEqual(moves[0].path,[42,28,14]);assert.deepEqual(moves[0].taken,[35,21]);const next=C.draughtsPlay(b,moves[0]);assert.equal(next.filter(v=>v===-1).length,0);assert.equal(b[42],1);
 const crown=Array(64).fill(0);crown[17]=1;crown[10]=-1;crown[12]=-1;const m=C.draughtsMoves(crown,1)[0];assert.deepEqual(m.path,[17,3]);assert.equal(C.draughtsPlay(crown,m)[3],2);
 const king=Array(64).fill(0);king[28]=2;assert.equal(C.draughtsMoves(king,1).length,4);
});
test('Every original Sokoban level is solvable; walls, undo snapshots and goals remain consistent',()=>{
 for(const [i,rows] of C.sokobanLevels.entries()){let s=C.sokobanParse(rows);assert.equal(s.boxes.length,s.goals.length);const path=C.sokobanSolve(s,150000);assert.notEqual(path,null,'Unsolvable level '+(i+1));const original=C.clone(s);for(const key of path){const [dx,dy]={U:[0,-1],D:[0,1],L:[-1,0],R:[1,0]}[key];const next=C.sokobanMove(s,dx,dy);assert(next);s=next;}assert(C.sokobanWon(s));assert.equal(original.steps,0);}
 const s=C.sokobanParse(['#####','#@$.#','#####']);assert.equal(C.sokobanMove(s,0,-1),null);assert(C.sokobanWon(C.sokobanMove(s,1,0)));
});
test('Word search generates reproducible complete puzzles in all three languages',()=>{
 for(const language of ['uk','de','en'])for(let seed=0;seed<30;seed++){const state=C.wordSearch(language,String(seed));assert.equal(state.words.length,8);assert.deepEqual(state,C.wordSearch(language,String(seed)));for(const w of state.words){assert.equal(w.cells.map(i=>state.board[i]).join(''),w.word);assert.equal(C.wordMatch(state,w.cells[0],w.cells.at(-1)).word,w.word);assert.equal(C.wordMatch(state,w.cells.at(-1),w.cells[0]).word,w.word);state.found.push(w.word);assert.equal(C.wordMatch(state,w.cells[0],w.cells.at(-1)),null);}}
});
test('Klondike deals exactly 52 distinct cards; draws recycle in order and legal moves reveal cards',()=>{
 let s=C.klondike('cards');assert.equal(new Set(s.stock.concat(...s.piles)).size,52);assert.deepEqual(s.hidden,[0,1,2,3,4,5,6]);const stock=s.stock.slice();for(let i=0;i<24;i++)s=C.klondikeDraw(s);assert.equal(s.stock.length,0);s=C.klondikeDraw(s);assert.deepEqual(s.stock,stock);
 const blank={stock:[],waste:[0],piles:[[25],[],[],[],[],[],[]],hidden:[0,0,0,0,0,0,0],foundations:[[],[],[],[]],moves:0};
 assert(C.klondikeMove(blank,{kind:'waste'},{kind:'foundation',pile:0}));assert.equal(C.klondikeMove(blank,{kind:'waste'},{kind:'foundation',pile:1}),null);assert(C.klondikeMove(blank,{kind:'pile',pile:0,index:0},{kind:'pile',pile:1}));assert.equal(C.klondikeMove(blank,{kind:'waste'},{kind:'pile',pile:1}),null);
 const reveal={...blank,waste:[],piles:[[6,14],[2],[],[],[],[],[]],hidden:[1,0,0,0,0,0,0]};const moved=C.klondikeMove(reveal,{kind:'pile',pile:0,index:1},{kind:'pile',pile:1});assert(moved);assert.equal(moved.hidden[0],0);
});
test('Spider deals 104 unique cards, restricts dealing and removes complete runs',()=>{
 let s=C.spider('spider');assert.equal(new Set(s.stock.concat(...s.piles)).size,104);assert.equal(s.stock.length,50);const next=C.spiderDeal(s);assert.equal(next.stock.length,40);assert.equal(next.piles[0].length,7);const empty=C.clone(s);empty.piles[0]=[];assert.equal(C.spiderDeal(empty),null);
 const ready={stock:[],piles:[Array.from({length:12},(_,i)=>12-i),[0],...Array.from({length:8},()=>[])],hidden:Array(10).fill(0),completed:0,moves:0};const win=C.spiderMove(ready,1,0,0);assert(win);assert.equal(win.completed,1);assert.equal(win.piles[0].length,0);assert.equal(C.spiderMove(s,0,0,1),null);
});
test('Mahjong starts with a guaranteed removal sequence and enforces blocked sides/overlap',()=>{
 for(let seed=0;seed<100;seed++){const s=C.mahjong(seed);assert.equal(s.tiles.length,36);const counts=new Map();for(const t of s.tiles)counts.set(t.kind,(counts.get(t.kind)||0)+1);assert([...counts.values()].every(n=>n%2===0));assert(C.mahjongPairs(s).length);}
 const tiles=[{x:0,y:0,z:0},{x:1,y:0,z:0},{x:2,y:0,z:0},{x:0,y:0,z:1}];assert(!C.mahjongFree(tiles,0));assert(!C.mahjongFree(tiles,1));assert(C.mahjongFree(tiles,2));assert(C.mahjongFree(tiles,3));
});
test('Battleship fleets contain 20 cells, never overlap or touch and finish only after every ship',()=>{
 for(let seed=0;seed<150;seed++){const ships=C.fleet(seed),all=ships.flat();assert.equal(new Set(all).size,20);assert.deepEqual(ships.map(s=>s.length),[4,3,3,2,2,2,1,1,1,1]);ships.forEach((ship,i)=>{for(const at of ship){assert(at>=0&&at<100);for(const other of ships.slice(i+1).flat())assert(Math.abs(at%10-other%10)>1||Math.abs(Math.floor(at/10)-Math.floor(other/10))>1);}});let shots=[],result;for(const at of all){result=C.shipShot(ships,shots,at);assert(result.hit);shots=result.shots;}assert(result.won);assert.equal(C.shipShot(ships,shots,all[0]),null);}
});
