(function(root){
  'use strict';
  const KEY='ac_games_library_v1';
  function create(storage){
    let value,volatile=false,allowed=null;
    const fresh=()=>({version:1,favorites:[],recent:[],records:{},preferences:{lowPower:false,touchControls:false}});
    const valid=id=>typeof id==='string'&&/^[a-z0-9][a-z0-9_-]{0,80}$/.test(id)&&(!allowed||allowed.has(id));
    function read(){let parsed;try{parsed=JSON.parse(storage?.getItem(KEY));}catch(_){}value=fresh();if(!parsed||parsed.version!==1)return;
      if(Array.isArray(parsed.favorites))value.favorites=[...new Set(parsed.favorites.filter(valid))].slice(0,300);
      if(Array.isArray(parsed.recent)){const seen=new Set();value.recent=parsed.recent.filter(item=>item&&valid(item.id)&&Number.isFinite(item.at)&&!seen.has(item.id)&&seen.add(item.id)).slice(0,30).map(item=>({id:item.id,at:item.at}));}
      if(parsed.records&&typeof parsed.records==='object')for(const [id,record]of Object.entries(parsed.records))if(valid(id)&&Number.isFinite(record)&&record>=0)value.records[id]=record;
      if(parsed.preferences&&typeof parsed.preferences==='object')for(const k of Object.keys(value.preferences))value.preferences[k]=parsed.preferences[k]===true;
    }
    function save(){try{if(!storage)throw Error('storage');storage.setItem(KEY,JSON.stringify(value));}catch(_){volatile=true;}}
    read();
    return {
      configure(ids){allowed=new Set(ids);value.favorites=value.favorites.filter(valid);value.recent=value.recent.filter(item=>valid(item.id));},
      reload:read,
      snapshot(){return JSON.parse(JSON.stringify(value));},
      favorite(id){return valid(id)&&value.favorites.includes(id);},
      toggle(id){if(!valid(id))return false;value.favorites=value.favorites.includes(id)?value.favorites.filter(item=>item!==id):value.favorites.concat(id);save();return value.favorites.includes(id);},
      visit(id){if(!valid(id))return;value.recent=[{id,at:Date.now()},...value.recent.filter(item=>item.id!==id)].slice(0,30);save();},
      record(id,record){if(!valid(id)||!Number.isFinite(record)||record<0)return;value.records[id]=record;save();},
      preference(name,next){if(!Object.hasOwn(value.preferences,name))return false;if(typeof next==='boolean'){value.preferences[name]=next;save();}return value.preferences[name];},
      temporary(){return volatile;},
      clearRecent(){value.recent=[];save();}
    };
  }
  if(typeof module==='object'&&module.exports)module.exports={create};
  if(!root.document)return;
  let storage;try{storage=root.localStorage;}catch(_){}
  root.AuthorCheLibrary=create(storage);
})(typeof window!=='undefined'?window:globalThis);
