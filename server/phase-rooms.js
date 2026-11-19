import {Game} from '../shared/simulation.js';

// D1 is authoritative. A room is one versioned document so a command, chat
// message, player join and elapsed simulation time commit atomically together.
export const PHASE_ROOM_LIMITS=Object.freeze({players:12,rooms:128,ttlMs:2*60*60*1000,maxCatchup:.75,step:.05,retries:8,bodyBytes:8192,pollsPerSecond:8,commandsPerSecond:30,documentBytes:1500000});
const ROOM=/^[A-Z0-9]{4,10}$/,TOKEN=/^[a-f0-9-]{36}$/i,REQUEST_ID=/^[A-Za-z0-9_-]{8,64}$/;
const TYPES=new Set(['pkReady','ready','pkChat','pkName','pkDisguise','pkForm','pkStop','pkMove','pkAttack','pkCast','pkPickup','pkDrop','pkCombine','pkGateway']);
const KEYS=['worldSeed','seed','time','units','effects','players','phase','wave','timer','serial','message','phaseKiller','winningOwners','options'];
class PhaseError extends Error{constructor(status,code,message){super(message);this.status=status;this.code=code;}}
const fail=(status,code,message)=>{throw new PhaseError(status,code,message);};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
const changes=result=>Number(result?.meta?.changes??result?.changes??0);
const normalizeName=value=>typeof value==='string'?Array.from(value.replace(/[\u0000-\u001f\u007f]/g,' ').trim()).slice(0,20).join(''):'';
const roomCode=value=>{const code=typeof value==='string'?value.trim().toUpperCase():'';if(!ROOM.test(code))fail(400,'invalid_room','Use um código de sala com 4 a 10 letras ou números.');return code;};
const canonicalGame=game=>Object.fromEntries(KEYS.filter(k=>game[k]!==undefined).map(k=>[k,game[k]]));
async function readBody(request){
 if(!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json'))fail(415,'json_required','Envie dados JSON.');
 if(Number(request.headers.get('Content-Length')||0)>PHASE_ROOM_LIMITS.bodyBytes)fail(413,'body_too_large','Pedido muito grande.');
 const reader=request.body?.getReader();if(!reader)return{};const chunks=[];let size=0;
 while(true){const{done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>PHASE_ROOM_LIMITS.bodyBytes){await reader.cancel();fail(413,'body_too_large','Pedido muito grande.');}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.byteLength;}
 try{const result=JSON.parse(new TextDecoder().decode(bytes)||'{}');if(!result||Array.isArray(result)||typeof result!=='object')throw Error();return result;}catch{fail(400,'invalid_json','JSON inválido.');}
}
function rate(member,kind,now){const key=kind==='poll'?'pollRate':'commandRate',limit=kind==='poll'?PHASE_ROOM_LIMITS.pollsPerSecond:PHASE_ROOM_LIMITS.commandsPerSecond;let budget=member[key];if(!budget||now-budget.at>=1000)budget=member[key]={at:now,count:0};if(++budget.count>limit)fail(429,'rate_limit','Aguarde um instante antes de enviar outra ação.');}
function tick(game,data,now){
 const elapsed=Math.max(0,Math.min(PHASE_ROOM_LIMITS.maxCatchup,(now-data.lastTickMs)/1000));data.lastTickMs=now;
 // Lobby time is deliberately paused. Only all-player ready starts the game;
 // an empty browser tab cannot assign the killer before its friends join.
 if(game.phase==='preparation'||!data.members.length)return;
 let remaining=elapsed;while(remaining>.000001){const dt=Math.min(PHASE_ROOM_LIMITS.step,remaining);game.tick(dt);remaining-=dt;}
}
function hydrate(data,createGame){const saved=data.game;if(!saved||saved.options?.mode!=='phasekiller')fail(503,'invalid_state','A sala precisa ser recriada.');const game=createGame(saved.worldSeed||1);for(const key of KEYS)if(Object.hasOwn(saved,key))game[key]=saved[key];return game;}
function validateCommand(command){if(!command||Array.isArray(command)||typeof command!=='object'||!TYPES.has(command.type))fail(400,'invalid_command','Comando desconhecido.');if(command.type==='pkChat'&&(typeof command.text!=='string'||command.text.trim().length<1||command.text.length>240))fail(400,'invalid_chat','Escreva uma mensagem de até 240 caracteres.');return command;}

export function createPhaseHandler({createGame=seed=>new Game(seed,{mode:'phasekiller',phaseTraining:false}),clock=()=>Date.now(),cryptoProvider=globalThis.crypto}={}){
 const digest=async token=>{const bytes=await cryptoProvider.subtle.digest('SHA-256',new TextEncoder().encode(token));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');};
 const newIdentity=async()=>{const id=cryptoProvider.randomUUID(),token=cryptoProvider.randomUUID();return{id,token,tokenHash:await digest(token)};};
 const select=(db,code)=>db.prepare('SELECT room_id, revision, data, expires_at FROM phase_rooms WHERE room_id = ?').bind(code).first();
 const save=async(db,code,revision,data,now)=>{
  const document=JSON.stringify(data);if(new TextEncoder().encode(document).length>PHASE_ROOM_LIMITS.documentBytes)fail(503,'room_capacity','A sala atingiu sua capacidade de dados.');
  return changes(await db.prepare('UPDATE phase_rooms SET revision = revision + 1, data = ?, updated_at = ?, expires_at = ? WHERE room_id = ? AND revision = ?').bind(document,now,now+PHASE_ROOM_LIMITS.ttlMs,code,revision).run())===1;
 };
 const view=(game,member,code,revision,extra={})=>({room:code,id:member.id,revision,state:game.snapshotPhaseKiller(member.id),...extra});
 async function create(db,body,now){
  const name=normalizeName(body.name);if(!name)fail(400,'invalid_name','Informe seu nome.');const identity=await newIdentity(),member={id:identity.id,tokenHash:identity.tokenHash,joinedAt:now,lastSeenAt:now,receipts:[]};
  await db.prepare('DELETE FROM phase_rooms WHERE expires_at <= ?').bind(now).run();
  const explicit=body.room!=null,code=explicit?roomCode(body.room):cryptoProvider.randomUUID().replaceAll('-','').slice(0,8).toUpperCase();
  if(await select(db,code))fail(409,'room_exists','Essa sala já existe. Escolha entrar nela.');
  const game=createGame(Number.parseInt(cryptoProvider.randomUUID().slice(0,8),16));if(game.options?.mode!=='phasekiller'||typeof game.snapshotPhaseKiller!=='function'||!game.addPlayer(identity.id,'townsperson',name))fail(503,'mode_unavailable','O modo online está sendo atualizado.');
  const data={schema:1,lastTickMs:now,members:[member],game:canonicalGame(game)},document=JSON.stringify(data);
  let inserted=false;try{inserted=changes(await db.prepare('INSERT INTO phase_rooms (room_id, revision, data, updated_at, expires_at) SELECT ?, 0, ?, ?, ? WHERE (SELECT COUNT(*) FROM phase_rooms) < ?').bind(code,document,now,now+PHASE_ROOM_LIMITS.ttlMs,PHASE_ROOM_LIMITS.rooms).run())===1;}catch{fail(409,'room_exists','Essa sala acabou de ser criada. Tente outro código.');}
  if(!inserted)fail(503,'server_full','O servidor está cheio. Tente novamente mais tarde.');return json(view(game,member,code,0,{token:identity.token}),201);
 }
 async function join(db,body,now){
  const code=roomCode(body.room),name=normalizeName(body.name);if(!name)fail(400,'invalid_name','Informe seu nome.');const identity=await newIdentity();
  for(let attempt=0;attempt<PHASE_ROOM_LIMITS.retries;attempt++){
   const row=await select(db,code);if(!row||row.expires_at<=now)fail(404,'room_missing','Sala não encontrada ou expirada.');const data=JSON.parse(row.data),game=hydrate(data,createGame);
   if(data.members.length>=PHASE_ROOM_LIMITS.players)fail(409,'room_full','A sala está cheia.');if(game.phase!=='preparation'||game.phaseKiller)fail(409,'game_started','A partida já começou.');
   const member={id:identity.id,tokenHash:identity.tokenHash,joinedAt:now,lastSeenAt:now,receipts:[]};if(!game.addPlayer(identity.id,'townsperson',name))fail(409,'join_rejected','Não foi possível entrar nesta sala.');data.members.push(member);data.lastTickMs=now;data.game=canonicalGame(game);
   if(await save(db,code,row.revision,data,now))return json(view(game,member,code,row.revision+1,{token:identity.token}),201);
  }fail(409,'busy','A sala recebeu ações simultâneas. Tente novamente.');
 }
 async function authenticated(db,request,code,action,body,now){
  const raw=request.headers.get('Authorization')||'',match=raw.match(/^Bearer ([a-f0-9-]{36})$/i);if(!match||!TOKEN.test(match[1]))fail(401,'unauthorized','Entre na sala para continuar.');const hash=await digest(match[1]);
  if(action==='command')validateCommand(body.command);if(body.requestId!=null&&!REQUEST_ID.test(body.requestId))fail(400,'invalid_request_id','Identificador de ação inválido.');
  for(let attempt=0;attempt<PHASE_ROOM_LIMITS.retries;attempt++){
   const row=await select(db,code);if(!row||row.expires_at<=now)fail(404,'room_missing','Sala não encontrada ou expirada.');const data=JSON.parse(row.data),member=data.members.find(m=>m.tokenHash===hash);if(!member)fail(401,'unauthorized','Sua entrada nesta sala não é válida.');
   rate(member,action,now);member.lastSeenAt=now;const game=hydrate(data,createGame);tick(game,data,now);
   let result={};
   if(action==='command'){
    const receipt=body.requestId&&member.receipts?.find(r=>r.requestId===body.requestId);
    if(receipt)result={accepted:receipt.accepted,message:receipt.message,duplicate:true};
    else{
     if(['pkReady','ready'].includes(body.command.type)&&game.phase==='preparation'&&data.members.length<2)result={accepted:false,message:'Aguarde pelo menos dois jogadores para começar.'};
     else{const accepted=game.command(member.id,body.command);result={accepted:!!accepted,message:accepted?null:game.commandFailureReason||'Ação indisponível.'};}
     if(body.requestId){member.receipts||=[];member.receipts.push({requestId:body.requestId,...result});member.receipts=member.receipts.slice(-32);}
    }
   }else if(action==='leave'){
    data.members=data.members.filter(m=>m.id!==member.id);
    if(!data.members.length){if(changes(await db.prepare('DELETE FROM phase_rooms WHERE room_id = ? AND revision = ?').bind(code,row.revision).run())===1)return json({room:code,left:true});continue;}
    const unit=game.player(member.id);if(unit){if(game.phase==='preparation'){game.units=game.units.filter(u=>u.id!==unit.id);delete game.players[member.id];}else unit.bot=true;}
   }
   data.game=canonicalGame(game);if(await save(db,code,row.revision,data,now))return action==='leave'?json({room:code,left:true}):json(view(game,member,code,row.revision+1,result));
  }fail(409,'busy','A sala recebeu ações simultâneas. Tente novamente.');
 }
 return async function handlerPhaseRequest(request,env){
  const url=new URL(request.url);if(!url.pathname.startsWith('/api/phase'))return null;
  try{
   const origin=request.headers.get('Origin');if(origin&&origin!==url.origin)fail(403,'origin_mismatch','Origem não autorizada.');
   const route=url.pathname.match(/^\/api\/phase\/(create|join|[A-Za-z0-9]{4,10})(?:\/(command|leave))?\/?$/);if(!route)fail(404,'not_found','Rota não encontrada.');
   const special=['create','join'].includes(route[1]);if(special&&route[2])fail(404,'not_found','Rota não encontrada.');const action=special?route[1]:route[2]||'poll',method=action==='poll'?'GET':'POST';if(request.method!==method)fail(405,'method_not_allowed','Método não permitido.');
   if(!env?.DB?.prepare)fail(503,'storage_unavailable','O serviço online está indisponível no momento.');const now=clock(),body=method==='POST'?await readBody(request):{};
   if(action==='create')return await create(env.DB,body,now);if(action==='join')return await join(env.DB,body,now);return await authenticated(env.DB,request,roomCode(route[1]),action,body,now);
  }catch(error){return error instanceof PhaseError?json({error:error.code,message:error.message},error.status):json({error:'service_unavailable',message:'O serviço online está indisponível. Tente novamente em instantes.'},503);}
 };
}
export const handlerPhaseRequest=createPhaseHandler();
