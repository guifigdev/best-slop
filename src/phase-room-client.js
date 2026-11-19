// One authenticated room transport. A private viewer snapshot is applied only
// when its revision is at least the last command/poll already seen.
export async function connectPhaseRoom({room,name,onState,onError,onClose,fetcher=fetch,storage=localStorage,interval=450}){
 const code=String(room||'').trim().toUpperCase(),key='phase-room-session:'+code,abort=new AbortController();let timer=null,closed=false,revision=-1,queue=Promise.resolve(),credential=null;
 const errorFor=async response=>{let data={};try{data=await response.json();}catch{}const e=new Error(data.message||data.error||'NÃ£o foi possÃ­vel falar com a sala.');e.status=response.status;return e;};
 async function request(path,{method='GET',body,token}={}){const response=await fetcher('/api/phase'+path,{method,signal:abort.signal,headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});if(!response.ok)throw await errorFor(response);return response.json();}
 function accept(result){if(closed||!result?.state||result.revision<revision)return;revision=result.revision;onState?.(result.state,{room:result.room,id:result.id,revision});}
 try{credential=JSON.parse(storage.getItem(key)||'null');}catch{}
 let joined;
 if(credential?.token){try{joined=await request('/'+code,{token:credential.token});}catch(e){if(e.status!==401&&e.status!==404&&e.status!==410)throw e;credential=null;storage.removeItem(key);}}
 if(!joined){try{joined=await request('/join',{method:'POST',body:{room:code,name}});}catch(e){if(e.status!==404)throw e;joined=await request('/create',{method:'POST',body:{room:code,name}});}credential={id:joined.id,token:joined.token};storage.setItem(key,JSON.stringify(credential));}
 const transport={room:joined.room,id:joined.id,state:joined.state,readyState:1,onclose:null,
  send(raw){if(closed)return false;const payload=typeof raw==='string'?JSON.parse(raw):raw;if(payload?.type!=='command'||!payload.command)return false;const requestId=crypto.randomUUID();queue=queue.then(async()=>{if(closed)return;try{const next=await request('/'+joined.room+'/command',{method:'POST',token:credential.token,body:{command:payload.command,requestId}});accept(next);if(next.accepted===false)onError?.(next.message||'Ação não concluída.');}catch(e){if(e.name!=='AbortError')onError?.(e.message,e);}});return true;},
  close(){if(closed)return;closed=true;transport.readyState=3;clearTimeout(timer);abort.abort();transport.onclose?.();onClose?.();},
  async leave(){if(closed)return;try{await request('/'+joined.room+'/leave',{method:'POST',token:credential.token,body:{}});}finally{storage.removeItem(key);transport.close();}}
 };
 async function poll(){if(closed)return;try{accept(await request('/'+joined.room,{token:credential.token}));}catch(e){if(e.name!=='AbortError'){onError?.(e.message,e);if([401,404,410].includes(e.status)){storage.removeItem(key);transport.close();return;}}}if(!closed)timer=setTimeout(poll,interval);}
 // Return before starting callbacks so the caller can establish its session.
 revision=joined.revision;timer=setTimeout(poll,interval);return transport;
}
