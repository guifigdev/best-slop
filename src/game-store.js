// One client session store. Rules remain authoritative in shared/Game (server online).
// UI reads only snapshot; input emits commands and never edits snapshot fields.
export function createGameStore(){
 const listeners=new Set();let revision=0;
 const target={snapshot:null,game:null,playerId:'local',socket:null,selected:'knight',paused:false,mode:null,castSlot:null,dialog:[],dialogIndex:0};
 const state=new Proxy(target,{set(object,key,value){if(!Object.hasOwn(object,key))throw Error('Unknown store key: '+String(key));object[key]=value;revision++;for(const fn of listeners)fn(state,revision);return true;}});
 return{state,getState:()=>state,getRevision:()=>revision,subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},reset(){Object.assign(state,{snapshot:null,game:null,playerId:'local',paused:false,mode:null,castSlot:null,dialog:[],dialogIndex:0});}};
}
