'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const games=JSON.parse(fs.readFileSync(path.join(root,'catalog.json'),'utf8')).games;
const errors=[];
function parse(file,source,type){
 if(type==='json'){try{JSON.parse(source);}catch(e){errors.push(file+': '+e.message);}return;}
 try{JSON.parse(source.replace(/^\uFEFF/,''));return;}catch(_){}
 try{if(type==='module'||/^\s*(import\s|export\s)/m.test(source))new vm.SourceTextModule(source);else new vm.Script(source,{filename:file});}
 catch(e){errors.push(file+': '+e.message);}
}
function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory())walk(file);else if(file.endsWith('.js'))parse(file,fs.readFileSync(file,'utf8'),'script');else if(file.endsWith('.html')){const html=fs.readFileSync(file,'utf8');let m;const re=/<script\b([^>]*)>([\s\S]*?)<\/script>/gi;while((m=re.exec(html))){if(/\bsrc\s*=/i.test(m[1]))continue;const type=(m[1].match(/\btype=["']([^"']+)/i)||[])[1]||'text/javascript';if(/application\/(?:json|ld\+json)/i.test(type))parse(file,m[2],'json');else if(['text/javascript','application/javascript','module'].includes(type))parse(file,m[2],type);}}}}
for(const game of games)walk(path.join(root,'games',game.id));
walk(path.join(root,'shared'));
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log('PASS: JavaScript, modules, inline scripts and JSON in every registered runtime');
