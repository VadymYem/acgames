(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AuthorCheArcade = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  function random(seed) {
    let n = 2166136261;
    for (const ch of String(seed)) n = Math.imul(n ^ ch.charCodeAt(0), 16777619);
    return () => {n += 0x6D2B79F5; let t = Math.imul(n ^ n >>> 15, n | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296;};
  }
  function shuffle(values, rng = Math.random) {
    const out = values.slice();
    for (let i = out.length - 1; i > 0; i--) {const j = Math.floor(rng() * (i + 1)); [out[i], out[j]] = [out[j], out[i]];}
    return out;
  }
  const inside = (x, y, n = 8) => x >= 0 && y >= 0 && x < n && y < n;
  const directions = [-1, 0, 1].flatMap(x => [-1, 0, 1].filter(y => x || y).map(y => [x, y]));
  function reversiBoard() {const b = Array(64).fill(0); b[27] = b[36] = -1; b[28] = b[35] = 1; return b;}
  function reversiFlips(board, index, player) {
    if (index < 0 || index >= 64 || board[index]) return [];
    const result = [], x = index % 8, y = Math.floor(index / 8);
    for (const [dx, dy] of directions) {
      let nx = x + dx, ny = y + dy; const line = [];
      while (inside(nx, ny) && board[ny * 8 + nx] === -player) {line.push(ny * 8 + nx); nx += dx; ny += dy;}
      if (inside(nx, ny) && board[ny * 8 + nx] === player) result.push(...line);
    }
    return result;
  }
  const reversiMoves = (board, player) => board.flatMap((v, i) => !v && reversiFlips(board, i, player).length ? [i] : []);
  function reversiPlay(board, index, player) {
    const flips = reversiFlips(board, index, player);
    if (!flips.length) return null;
    const next = board.slice(); next[index] = player; flips.forEach(i => {next[i] = player;}); return next;
  }
  function reversiBest(board, player, depth = 3) {
    const weights = [100,-25,12,6,6,12,-25,100,-25,-45,-2,-2,-2,-2,-45,-25,12,-2,4,2,2,4,-2,12,6,-2,2,1,1,2,-2,6,6,-2,2,1,1,2,-2,6,12,-2,4,2,2,4,-2,12,-25,-45,-2,-2,-2,-2,-45,-25,100,-25,12,6,6,12,-25,100];
    function score(b, p, d, alpha, beta, passed = false) {
      const moves = reversiMoves(b, p);
      if (!moves.length) return passed ? b.reduce((n, v) => n + v * p, 0) * 1000 : -score(b, -p, d, -beta, -alpha, true);
      if (!d) return b.reduce((n, v, i) => n + v * p * weights[i], 0) + (moves.length - reversiMoves(b, -p).length) * 4;
      let best = -Infinity;
      for (const i of moves) {best = Math.max(best, -score(reversiPlay(b, i, p), -p, d - 1, -beta, -alpha)); alpha = Math.max(alpha, best); if (alpha >= beta) break;}
      return best;
    }
    return reversiMoves(board, player).map(i => ({i, score: -score(reversiPlay(board, i, player), -player, depth - 1, -Infinity, Infinity)})).sort((a,b) => b.score - a.score)[0]?.i ?? null;
  }
  function draughtsBoard() {return Array.from({length:64}, (_, i) => (Math.floor(i / 8) + i % 8) % 2 ? (i < 24 ? -1 : i >= 40 ? 1 : 0) : 0);}
  function draughtsMoves(board, player) {
    const captures = [], simple = [];
    function jumps(b, at, piece, path, taken) {
      const x = at % 8, y = Math.floor(at / 8), dirs = Math.abs(piece) === 2 ? [-1, 1] : [-Math.sign(piece)];
      let continued = false;
      for (const dy of dirs) for (const dx of [-1, 1]) {
        const nx = x + 2 * dx, ny = y + 2 * dy, mid = (y + dy) * 8 + x + dx;
        if (!inside(nx, ny) || Math.sign(b[mid]) !== -player || b[ny * 8 + nx]) continue;
        const to = ny * 8 + nx, next = b.slice(); next[at] = next[mid] = 0; next[to] = piece;
        const route = path.concat(to), removed = taken.concat(mid);
        continued = true;
        // English draughts: crowning ends the turn, including a capturing turn.
        if (Math.abs(piece) === 1 && (ny === 0 || ny === 7)) captures.push({path:route, taken:removed});
        else jumps(next, to, piece, route, removed);
      }
      if (!continued && taken.length) captures.push({path, taken});
    }
    board.forEach((piece, from) => {
      if (Math.sign(piece) !== player) return;
      jumps(board, from, piece, [from], []);
      const x = from % 8, y = Math.floor(from / 8);
      for (const dy of Math.abs(piece) === 2 ? [-1,1] : [-player]) for (const dx of [-1,1]) {
        if (inside(x + dx, y + dy) && !board[(y + dy) * 8 + x + dx]) simple.push({path:[from,(y + dy) * 8 + x + dx], taken:[]});
      }
    });
    return captures.length ? captures : simple;
  }
  function draughtsPlay(board, move) {
    const b = board.slice(), from = move.path[0], to = move.path[move.path.length - 1], piece = b[from];
    b[from] = 0; move.taken.forEach(i => {b[i] = 0;}); b[to] = Math.abs(piece) === 1 && (to < 8 || to >= 56) ? 2 * Math.sign(piece) : piece; return b;
  }
  function draughtsBest(board, player, depth = 4) {
    function value(b, p, d) {
      const moves = draughtsMoves(b, p); if (!moves.length) return -10000 - d;
      if (!d) return b.reduce((n,v,i) => n + (Math.sign(v) === p ? 1 : -1) * (Math.abs(v) === 2 ? 175 : v ? 100 + (Math.sign(v) === 1 ? 7 - Math.floor(i / 8) : Math.floor(i / 8)) * 3 : 0), 0);
      return Math.max(...moves.map(m => -value(draughtsPlay(b,m), -p, d - 1)));
    }
    return draughtsMoves(board, player).map(m => ({m, score:-value(draughtsPlay(board,m), -player, depth - 1)})).sort((a,b) => b.score-a.score)[0]?.m || null;
  }
  function sokobanParse(rows) {
    const width = Math.max(...rows.map(row => row.length)), walls = [], goals = [], boxes = []; let player = -1;
    rows.forEach((row,y) => Array.from({length:width},(_,x) => row[x] || '#').forEach((ch,x) => {
      const i = y * width + x;
      if (ch === '#') walls.push(i); if ('.+*'.includes(ch)) goals.push(i); if ('$*'.includes(ch)) boxes.push(i); if ('@+'.includes(ch)) player = i;
    }));
    return {width, height:rows.length, walls, goals, boxes, player, steps:0, pushes:0};
  }
  function sokobanMove(state, dx, dy) {
    if (Math.abs(dx) + Math.abs(dy) !== 1) return null;
    const x = state.player % state.width, y = Math.floor(state.player / state.width), nx = x + dx, ny = y + dy;
    if (!inside(nx, ny, Math.max(state.width,state.height)) || nx >= state.width || ny >= state.height) return null;
    const at = ny * state.width + nx;
    if (state.walls.includes(at)) return null;
    const b = state.boxes.indexOf(at), next = clone(state);
    if (b >= 0) {
      const bx = nx + dx, by = ny + dy, to = by * state.width + bx;
      if (bx < 0 || by < 0 || bx >= state.width || by >= state.height || state.walls.includes(to) || state.boxes.includes(to)) return null;
      next.boxes[b] = to; next.pushes++;
    }
    next.player = at; next.steps++; return next;
  }
  const sokobanWon = s => s.boxes.length > 0 && s.boxes.every(i => s.goals.includes(i));
  function sokobanSolve(start, limit = 60000) {
    const queue = [{s:start, path:''}], seen = new Set(); let cursor = 0;
    while (cursor < queue.length && cursor < limit) {
      const {s,path} = queue[cursor++]; if (sokobanWon(s)) return path;
      for (const [dx,dy,k] of [[0,-1,'U'],[0,1,'D'],[-1,0,'L'],[1,0,'R']]) {
        const next = sokobanMove(s,dx,dy); if (!next) continue;
        const key = next.player + ':' + next.boxes.slice().sort((a,b) => a-b).join(',');
        if (seen.has(key)) continue; seen.add(key); queue.push({s:next,path:path+k});
      }
    }
    return null;
  }
  const sokobanLevels = [
    ['#######','#     #','# @$ .#','#     #','#######'],
    ['#######','#  .  #','#  $  #','#  @  #','#     #','#######'],
    ['#######','# . . #','# $ $ #','#  @  #','#     #','#######'],
    ['########','#      #','# @$   #','#   # .#','#      #','########'],
    ['########','# .    #','# $ ## #','# @ $ .#','#      #','########'],
    ['########','#  . . #','#  $ $ #','# ##   #','#   @  #','########'],
    ['########','#      #','# .$$. #','#  @   #','#      #','########'],
    ['########','# . . .#','# $ $ $#','#   @  #','#      #','########'],
    ['########','# .    #','# $ #  #','# @ # .#','#   $  #','#      #','########'],
    ['########','# . .  #','# $ $  #','#  #   #','# $ @ .#','#      #','########']
  ];
  const words = {
    uk:['МУЗИКА','ПОЕЗІЯ','КНИГА','СОНЦЕ','ХВИЛЯ','МРІЯ','ПІСНЯ','ЗІРКА','ОКЕАН','КВІТКА','НЕБО','МІСТО'],
    de:['MUSIK','GEDICHT','BUCH','SONNE','WELLE','TRAUM','LIED','STERN','MEER','BLUME','HIMMEL','STADT'],
    en:['MUSIC','POETRY','BOOK','SUN','WAVE','DREAM','SONG','STAR','OCEAN','FLOWER','SKY','CITY']
  };
  function wordSearch(language, seed, size = 10) {
    const rng = random(seed + ':' + language), selected = shuffle(words[language] || words.uk, rng).slice(0, 8).sort((a,b)=>b.length-a.length);
    const board = Array(size * size).fill(''), placed = [];
    for (const word of selected) {
      const candidates = shuffle(Array.from({length:size*size},(_,i)=>i), rng); let found = false;
      for (const at of candidates) {
        for (const [dx,dy] of shuffle(directions,rng)) {
          const cells = Array.from(word,(_,i) => {const x=at%size+dx*i,y=Math.floor(at/size)+dy*i;return inside(x,y,size)?y*size+x:-1;});
          if (cells.some((cell,i)=>cell<0 || board[cell] && board[cell]!==word[i])) continue;
          cells.forEach((cell,i)=>{board[cell]=word[i];}); placed.push({word,cells}); found=true; break;
        }
        if (found) break;
      }
    }
    const alphabet = language==='uk'?'АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ':'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return {size,language,board:board.map(ch=>ch||alphabet[Math.floor(rng()*alphabet.length)]),words:placed,found:[]};
  }
  function wordMatch(state, from, to) {return state.words.find(w => !state.found.includes(w.word) && (w.cells[0]===from && w.cells[w.cells.length-1]===to || w.cells[0]===to && w.cells[w.cells.length-1]===from)) || null;}
  const cardRank = card => card % 13 + 1, cardSuit = card => Math.floor(card / 13), cardRed = card => [1,2].includes(cardSuit(card));
  function klondike(seed) {
    const deck=shuffle(Array.from({length:52},(_,i)=>i),random(seed)), piles=[],hidden=[];
    for(let i=0;i<7;i++){piles.push(deck.splice(0,i+1));hidden.push(i);}
    return {stock:deck,waste:[],piles,hidden,foundations:[[],[],[],[]],moves:0};
  }
  function klondikeDraw(state) {const s=clone(state);if(s.stock.length)s.waste.push(s.stock.pop());else if(s.waste.length)s.stock=s.waste.splice(0).reverse();else return null;s.moves++;return s;}
  function klondikeMove(state, source, target) {
    const s=clone(state), from=source.kind==='waste'?s.waste:source.kind==='pile'?s.piles[source.pile]:source.kind==='foundation'?s.foundations[source.pile]:null;
    if(!from || !from.length)return null;
    const start=source.kind==='pile'?source.index:from.length-1;
    if(!Number.isInteger(start)||start<0||start>=from.length||source.kind==='pile'&&start<s.hidden[source.pile])return null;
    const moving=from.slice(start), first=moving[0];
    for(let i=1;i<moving.length;i++)if(cardRank(moving[i-1])!==cardRank(moving[i])+1||cardRed(moving[i-1])===cardRed(moving[i]))return null;
    if(source.kind===target.kind&&source.pile===target.pile)return null;
    let to;
    if(target.kind==='foundation'){
      to=s.foundations[target.pile]; if(!to||moving.length!==1||cardSuit(first)!==target.pile||cardRank(first)!==to.length+1)return null;
    }else if(target.kind==='pile'){
      to=s.piles[target.pile]; if(!to)return null;
      if(to.length ? cardRank(to[to.length-1])!==cardRank(first)+1||cardRed(to[to.length-1])===cardRed(first) : cardRank(first)!==13)return null;
    }else return null;
    from.splice(start);to.push(...moving);
    if(source.kind==='pile')s.hidden[source.pile]=Math.min(s.hidden[source.pile],Math.max(0,from.length-1));s.moves++;return s;
  }
  function spider(seed) {
    const deck=shuffle(Array.from({length:104},(_,i)=>i),random(seed)),piles=[],hidden=[];
    for(let i=0;i<10;i++){const count=i<4?6:5;piles.push(deck.splice(0,count));hidden.push(count-1);}
    return {stock:deck,piles,hidden,completed:0,moves:0};
  }
  function spiderFinish(s) {
    for(let i=0;i<10;i++){
      const p=s.piles[i], tail=p.slice(-13);
      if(p.length-s.hidden[i]>=13&&tail.every((card,j)=>cardRank(card)===13-j)){
        p.splice(-13);s.completed++;s.hidden[i]=Math.min(s.hidden[i],Math.max(0,p.length-1));
      }
    }
    return s;
  }
  function spiderDeal(state) {if(state.stock.length<10||state.piles.some(p=>!p.length))return null;const s=clone(state);for(let i=0;i<10;i++)s.piles[i].push(s.stock.pop());s.moves++;return spiderFinish(s);}
  function spiderMove(state, from, start, to) {
    if(from===to||from<0||to<0||from>=10||to>=10)return null;
    const p=state.piles[from],dest=state.piles[to];
    if(!Number.isInteger(start)||start<state.hidden[from]||start>=p.length)return null;
    const tail=p.slice(start);
    if(tail.some((card,j)=>j&&cardRank(tail[j-1])!==cardRank(card)+1)||dest.length&&cardRank(dest[dest.length-1])!==cardRank(tail[0])+1)return null;
    const s=clone(state);s.piles[to].push(...s.piles[from].splice(start));s.hidden[from]=Math.min(s.hidden[from],Math.max(0,s.piles[from].length-1));s.moves++;return spiderFinish(s);
  }
  function mahjongFree(tiles,index) {
    const tile=tiles[index];if(!tile||tile.removed)return false;
    const others=tiles.filter((t,i)=>i!==index&&!t.removed);
    if(others.some(t=>t.z>tile.z&&Math.abs(t.x-tile.x)<1&&Math.abs(t.y-tile.y)<1))return false;
    return !others.some(t=>t.z===tile.z&&t.x===tile.x-1&&Math.abs(t.y-tile.y)<1)||!others.some(t=>t.z===tile.z&&t.x===tile.x+1&&Math.abs(t.y-tile.y)<1);
  }
  function mahjong(seed, large=false) {
    const tiles=[],rng=random(seed);
    const layers=large?[[12,8],[10,4],[4,2]]:[[6,4],[4,3]];
    layers.forEach(([cols,rows],z)=>{for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)tiles.push({x:x+(layers[0][0]-cols)/2,y:y+(layers[0][1]-rows)/2,z,kind:0,removed:false});});
    // Assign pairs in a valid removal order, so every fresh board has a solution.
    const work=clone(tiles);let pair=0;
    while(work.some(t=>!t.removed)){
      const free=shuffle(work.flatMap((_,i)=>mahjongFree(work,i)?[i]:[]),rng);if(free.length<2)throw Error('Invalid tile layout');
      const a=free[0],b=free[1],kind=pair++%18;tiles[a].kind=tiles[b].kind=kind;work[a].removed=work[b].removed=true;
    }
    return {tiles,moves:0};
  }
  function mahjongPairs(state) {const free=state.tiles.flatMap((_,i)=>mahjongFree(state.tiles,i)?[i]:[]),pairs=[];for(let a=0;a<free.length;a++)for(let b=a+1;b<free.length;b++)if(state.tiles[free[a]].kind===state.tiles[free[b]].kind)pairs.push([free[a],free[b]]);return pairs;}
  function fleet(seed) {
    const rng=random(seed),ships=[];
    for(const length of [4,3,3,2,2,2,1,1,1,1]){
      const candidates=shuffle(Array.from({length:200},(_,i)=>i),rng);let placed=false;
      for(const candidate of candidates){
        const start=candidate%100,vertical=candidate>=100,x=start%10,y=Math.floor(start/10),cells=Array.from({length},(_,i)=>start+i*(vertical?10:1));
        if((vertical?y:x)+length>10)continue;
        if(ships.flat().some(at=>cells.some(c=>Math.abs(at%10-c%10)<=1&&Math.abs(Math.floor(at/10)-Math.floor(c/10))<=1)))continue;
        ships.push(cells);placed=true;break;
      }
      if(!placed)return fleet(seed+'!');
    }
    return ships;
  }
  function shipShot(ships, shots, cell) {if(cell<0||cell>=100||shots.includes(cell))return null;const next=shots.concat(cell),ship=ships.find(s=>s.includes(cell));return {shots:next,hit:!!ship,sunk:ship&&ship.every(i=>next.includes(i)),won:ships.every(s=>s.every(i=>next.includes(i)))};}
  return {clone,random,shuffle,reversiBoard,reversiFlips,reversiMoves,reversiPlay,reversiBest,draughtsBoard,draughtsMoves,draughtsPlay,draughtsBest,sokobanParse,sokobanMove,sokobanWon,sokobanSolve,sokobanLevels,wordSearch,wordMatch,cardRank,cardSuit,cardRed,klondike,klondikeDraw,klondikeMove,spider,spiderDeal,spiderMove,mahjong,mahjongFree,mahjongPairs,fleet,shipShot};
});
