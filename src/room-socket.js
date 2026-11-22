// Capability-based reconnect. The host can administer the room, but every
// combat command is still applied by the authoritative server to its sender.
export function createRoomSocket({url,payload,onJoined,onState,onParty,onError,onStatus,onClose,onChat,WebSocketClass=WebSocket,storage=localStorage,now=()=>Date.now(),retryLimitMs=120000}){
 let socket=null,closed=false,joined=false,awaitingJoin=false,retrying=false,timer=null,timeout=null,started=now(),attempt=0,disconnectedAt=null;
 const code=String(payload.room||'').toUpperCase(),key='custom-hero-room:'+url+':'+code;let saved=null;try{saved=JSON.parse(storage.getItem(key)||'null');}catch{}if(['create','join'].includes(payload.intent))saved=null;
 let catalogKey=null,catalog=null,learned=null;let staticKey=null,staticMap=null,staticObstacles=null;function hydrate(state){if(state?.bonk?.skillCatalogKey){if(catalogKey!==state.bonk.skillCatalogKey){catalogKey=state.bonk.skillCatalogKey;catalog=state.bonk.skillCatalog;learned=state.bonk.learnedSkills;}else state.bonk={...state.bonk,skillCatalog:state.bonk.skillCatalog||catalog,learnedSkills:state.bonk.learnedSkills||learned};}if(!state?.worldStaticKey)return state;if(state.worldStaticKey!==staticKey){staticKey=state.worldStaticKey;staticMap=state.dungeon?.map||state.bonk?.map;staticObstacles=state.obstacles;}else{if(state.bonk&&!Object.hasOwn(state.bonk,'map'))state.bonk={...state.bonk,map:staticMap};if(state.dungeon&&!Object.hasOwn(state.dungeon,'map'))state.dungeon={...state.dungeon,map:staticMap};if(!Object.hasOwn(state,'obstacles'))state.obstacles=staticObstacles;}return state;}
 const facade={room:code,id:null,readyState:0,onclose:null,send(raw){if(socket?.readyState!==1)return false;socket.send(typeof raw==='string'?raw:JSON.stringify(raw));return true;},close(){if(closed)return;closed=true;clearTimeout(timer);clearTimeout(timeout);facade.readyState=3;socket?.close();},leave(){storage.removeItem(key);if(socket?.readyState===1)socket.send(JSON.stringify({type:'leave'}));facade.close();return Promise.resolve();}};
 function connect(){if(closed)return;awaitingJoin=true;facade.readyState=0;onStatus?.(retrying?'Reconectando à sala…':'Conectando…');socket=new WebSocketClass(url);const current=socket;
  timeout=setTimeout(()=>{if(current.readyState!==1)current.close();},7000);
  current.onopen=()=>{clearTimeout(timeout);facade.readyState=1;current.send(JSON.stringify(saved&&code?{type:'resume',room:code,id:saved.id,token:saved.token,...(payload.lobbyVersion===2?{lobbyVersion:2}:{}),...(payload.chooseHeroInRoom&&!joined?{chooseHeroInRoom:true}:{}),features:['static-world-v1','ro-skill-library-v1']}:{...payload,features:['static-world-v1','ro-skill-library-v1']}));};
  current.onmessage=event=>{let m;try{m=JSON.parse(event.data);}catch{return;}
   if(m.type==='joined'){awaitingJoin=false;const resumed=joined||!!saved;joined=true;retrying=false;attempt=0;disconnectedAt=null;started=now();m.state=hydrate(m.state);facade.id=m.id;facade.room=m.room;if(m.resumeToken){saved={id:m.id,token:m.resumeToken};storage.setItem(key,JSON.stringify(saved));}onJoined?.(m,{resumed});}
   else if(m.type==='state')onState?.(hydrate(m.state));
   else if(m.type==='party')onParty?.(m.party,m.id);
   else if(m.type==='roomChat')onChat?.(m.messages);
   else if(m.type==='maintenance')onStatus?.(m.message);
   else if(m.type==='error'||m.type==='rejected'){onError?.(m.message);if(saved&&awaitingJoin&&m.type==='error'){storage.removeItem(key);saved=null;facade.close();onClose?.();}else if(awaitingJoin&&m.type==='error')facade.close();}
  };
  current.onerror=()=>onStatus?.('Conexão indisponível. Tentando retomar a sala…');
  current.onclose=event=>{if(current!==socket||closed)return;clearTimeout(timeout);facade.readyState=0;if(!retrying)disconnectedAt=now();if(saved&&![4001,4003,1008].includes(event.code)&&now()-disconnectedAt<retryLimitMs){retrying=true;timer=setTimeout(connect,Math.min(5000,500*2**Math.min(attempt++,4)));return;}facade.readyState=3;facade.onclose?.();onClose?.();};
 }
 connect();return facade;
}
