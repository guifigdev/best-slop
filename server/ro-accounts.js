import {RO_CARDS,RO_EQUIPMENT_SLOTS,roCardFitsSlot,rollRoLoot} from '../shared/ragnarok-equipment.js';
import {RAGNAROK_VOXEL_REFERENCES} from '../shared/monster-visual-references.js';
import {mvpDefinition} from '../shared/ragnarok-expansion.js';
import {RO_TOWER_DROP_MAP} from '../shared/ragnarok-tower-drops.js';
import {validateRoProgress} from '../shared/ragnarok-save.js';

const PREFIX='/api/ragnarok/',MAX_BODY=150*1024,RUN_TTL=6*60*60*1000,MAX_RECEIPTS=40000;
const own=(object,key)=>typeof key==='string'&&Object.hasOwn(object,key);
const response=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const error=(status,message)=>response({error:message},status);
const publicAccount=(state,siteLinked=false)=>({id:state.id,siteLinked,cards:state.cards,presets:state.presets,activePreset:state.activePreset,...(state.progress?{progress:state.progress}:{})});
async function digest(value){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(n=>n.toString(16).padStart(2,'0')).join('');}
async function body(request){
 if(Number(request.headers.get('Content-Length')||0)>MAX_BODY)throw new RangeError('Body too large');
 if(!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json'))throw new TypeError('JSON required');
 const reader=request.body?.getReader();if(!reader)return{};const chunks=[];let length=0;
 try{while(true){const result=await reader.read();if(result.done)break;length+=result.value.byteLength;if(length>MAX_BODY){await reader.cancel();throw new RangeError('Body too large');}chunks.push(result.value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 const value=JSON.parse(new TextDecoder().decode(bytes));if(!value||Array.isArray(value)||typeof value!=='object')throw new TypeError('Object required');return value;
}
function presets(input,cards){
 if(!Array.isArray(input)||input.length<1||input.length>6)return null;
 const ids=new Set(),unlocked=new Set(cards),result=[];
 for(const preset of input){if(!preset||typeof preset.id!=='string'||!/^[a-zA-Z0-9_-]{1,36}$/.test(preset.id)||ids.has(preset.id)||typeof preset.name!=='string'||preset.name.length<1||preset.name.length>40||!preset.cards||Array.isArray(preset.cards)||typeof preset.cards!=='object')return null;
  ids.add(preset.id);const active={};for(const [slot,key]of Object.entries(preset.cards)){if(!RO_EQUIPMENT_SLOTS.includes(slot)||!own(RO_CARDS,key)||!unlocked.has(key)||!roCardFitsSlot(RO_CARDS[key],slot))return null;active[slot]=key;}
  result.push({id:preset.id,name:preset.name,cards:active});
 }return result;
}
// Canonical game validator strips transient state, item sockets and unlocks.
export function validateRoAccountProgress(value){
 const normalized=validateRoProgress(value);if(!normalized)return null;
 return new TextEncoder().encode(JSON.stringify(normalized)).length<=128*1024?normalized:null;
}
function validKill(kill){return kill&&((typeof kill.id==='number'&&Number.isSafeInteger(kill.id)&&kill.id>=0)||(typeof kill.id==='string'&&/^[a-zA-Z0-9:._-]{1,48}$/.test(kill.id)))&&(own(RAGNAROK_VOXEL_REFERENCES,kill.visual)||own(RO_TOWER_DROP_MAP,kill.visual));}
async function accountRow(db,tokenHash){return db.prepare('SELECT id,site_user_id,payload,revision FROM ro_accounts WHERE token_hash=?').bind(tokenHash).first();}
async function siteAccountRow(db,siteUserId){return db.prepare('SELECT id,site_user_id,payload,revision FROM ro_accounts WHERE site_user_id=?').bind(siteUserId).first();}
// Sites dispatch supplies this server-side identity. Direct/self-hosted origins
// must preserve a trusted identity boundary rather than forwarding spoofable
// visitor-provided OAI identity headers.
function siteIdentity(request){const id=request.headers.get('oai-authenticated-user-id')?.trim();return id&&id.length<=256&&!/[\u0000-\u001f\u007f]/.test(id)?id:null;}
async function bindLegacyAccount(db,row,siteUserId){
 if(!siteUserId||row.site_user_id)return !!row.site_user_id;
 // The unique index and conditional single-statement update make two devices
 // racing to adopt a legacy account safe. Existing identities are never moved.
 const result=await db.prepare('UPDATE ro_accounts SET site_user_id=? WHERE id=? AND site_user_id IS NULL AND NOT EXISTS (SELECT 1 FROM ro_accounts WHERE site_user_id=?)').bind(siteUserId,row.id,siteUserId).run();
 return result.meta?.changes===1||((await siteAccountRow(db,siteUserId))?.id===row.id);
}

export async function handlerRagnarokRequest(request,env,{now=Date.now,random=Math.random}={}){
 const url=new URL(request.url);if(!url.pathname.startsWith(PREFIX))return null;
 const origin=request.headers.get('Origin');if(origin&&origin!==url.origin)return error(403,'Origin not allowed');
 const route=url.pathname.slice(PREFIX.length),method=request.method;
 const methods={account:'GET','account/create':'POST',presets:'POST',run:'POST',rewards:'POST',progress:'POST','characters/delete':'POST'};
 if(!own(methods,route))return error(404,'Unknown account route');if(method!==methods[route])return response({error:'Method not allowed'},405);
 if(!env?.DB?.prepare)return error(503,'Cloud account storage unavailable');const db=env.DB;
 try{
  const input=method==='POST'?await body(request):{},siteUserId=siteIdentity(request),authorization=request.headers.get('Authorization'),token=authorization?.match(/^Bearer (ro_[a-f0-9]{64})$/)?.[1];
  if(authorization&&!token)return error(401,'Invalid recovery key');const tokenHash=token?await digest(token):null;
  if(route==='account/create'){
   if(tokenHash){const existing=await accountRow(db,tokenHash);if(!existing)return error(401,'Invalid recovery key');const linked=await bindLegacyAccount(db,existing,siteUserId);return response({account:publicAccount(JSON.parse(existing.payload),linked)});}
   if(siteUserId){const existing=await siteAccountRow(db,siteUserId);if(existing)return response({account:publicAccount(JSON.parse(existing.payload),true)});}
   const id=crypto.randomUUID(),token=`ro_${crypto.randomUUID().replaceAll('-','')}${crypto.randomUUID().replaceAll('-','')}`,state={id,cards:[],presets:[{id:'default',name:'Padrão',cards:{}}],activePreset:'default'};
   try{await db.prepare('INSERT INTO ro_accounts(id,token_hash,site_user_id,payload,revision) VALUES(?,?,?,?,0)').bind(id,await digest(token),siteUserId,JSON.stringify(state)).run();}catch(reason){if(siteUserId){const winner=await siteAccountRow(db,siteUserId);if(winner)return response({account:publicAccount(JSON.parse(winner.payload),true)});}throw reason;}return response({token,account:publicAccount(state,!!siteUserId)},201);
  }
  if(!tokenHash&&!siteUserId)return error(401,'Sign in or provide a recovery key');
  for(let attempt=0;attempt<6;attempt++){
   // An explicit recovery key intentionally selects that account. Otherwise
   // Sites identity gives the same user-owned row across devices and sessions.
   const row=tokenHash?await accountRow(db,tokenHash):await siteAccountRow(db,siteUserId);if(!row)return error(401,tokenHash?'Invalid recovery key':'Create your game account first');const linked=tokenHash?await bindLegacyAccount(db,row,siteUserId):!!row.site_user_id;const state=JSON.parse(row.payload),stamp=now();
   if(route==='account')return response({account:publicAccount(state,linked)});
   let extra={};
   if(route==='presets'){const next=presets(input.presets,state.cards);if(!next||!next.some(p=>p.id===input.activePreset))return error(400,'Invalid or locked card preset');state.presets=next;state.activePreset=input.activePreset;}
   if(route==='characters/delete'){
    if(typeof input.id!=='string'||!/^[a-zA-Z0-9_-]{1,64}$/.test(input.id))return error(400,'Invalid character');
    const progress=validateRoAccountProgress(state.progress||{version:1,characters:[]}),deleted=new Set(progress?.deletedCharacters||[]);if(!progress)return error(400,'Invalid account progress');deleted.add(input.id);
    const next=validateRoAccountProgress({...progress,characters:progress.characters.filter(c=>c.id!==input.id),deletedCharacters:[...deleted]});if(!next)return error(400,'Character deletion history exceeds account limit');state.progress=next;
   }
   if(route==='progress'){const progress=validateRoAccountProgress(input.checkpoint);if(!progress)return error(400,'Invalid checkpoint');const prior=state.progress?.warehouse;if(prior&&(progress.warehouse.revision<prior.revision||progress.warehouse.revision===prior.revision&&JSON.stringify(progress.warehouse.items)!==JSON.stringify(prior.items)))return error(409,'Warehouse changed in another session; reload your account before saving.');state.progress=validateRoAccountProgress({...progress,deletedCharacters:[...new Set([...(state.progress?.deletedCharacters||[]),...(progress.deletedCharacters||[])])]});if(!state.progress)return error(400,'Character deletion history exceeds account limit');}
   if(route==='run'){if(input.activity!==undefined&&!['adventure','tower'].includes(input.activity))return error(400,'Invalid activity');state.run={id:crypto.randomUUID(),activity:input.activity==='tower'?'tower':'adventure',started:stamp,processed:[],count:0};extra.runId=state.run.id;}
   if(route==='rewards'){
    if(!Array.isArray(input.kills)||input.kills.length>40||input.kills.some(k=>!validKill(k)))return error(400,'Invalid monster reports');
    const run=state.run;if(!run||input.runId!==run.id||stamp<run.started||stamp-run.started>RUN_TTL)return error(409,'Run expired or replaced');
    const tower=run.activity==='tower',processed=new Set(run.processed),credits=Math.min(MAX_RECEIPTS,(tower?280:6)+Math.floor((stamp-run.started)/1000*(tower?64:3))),newCards=[],cardDrops=[],acknowledgedIds=[];
    for(const kill of input.kills){const receipt=String(kill.id);if(processed.has(receipt)){acknowledgedIds.push(receipt);continue;}if(run.count>=credits)break;processed.add(receipt);acknowledgedIds.push(receipt);run.count++;
     // Boss odds derive from the server catalog, never the reported flag.
     const drop=rollRoLoot(random,kill.visual,{boss:!!mvpDefinition(kill.visual)||!!RO_TOWER_DROP_MAP[kill.visual]?.boss});if(drop?.kind==='card'&&!state.cards.includes(drop.key)){state.cards.push(drop.key);newCards.push(drop.key);cardDrops.push({key:drop.key,receipt});}
    }
    run.processed=[...processed];extra.newCards=newCards;extra.cardDrops=cardDrops;extra.acknowledgedIds=acknowledgedIds;
   }
   const payload=JSON.stringify(state);if(payload.length>1900000)return error(413,'Account run receipt limit reached');
   const result=await db.prepare('UPDATE ro_accounts SET payload=?,revision=revision+1 WHERE id=? AND revision=?').bind(payload,row.id,row.revision).run();
   if(result.meta?.changes===1)return response({account:publicAccount(state,linked),...extra});
  }
  return error(409,'Account changed; retry the request');
 }catch(reason){if(reason instanceof RangeError)return error(413,'Request too large');if(reason instanceof TypeError||reason instanceof SyntaxError)return error(400,'Invalid JSON request');return error(503,'Cloud account storage unavailable');}
}
