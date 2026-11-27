import {roAccountSocketReceipt} from './ro-account-sockets.js';
import {RO_PROGRESS_BODY_MAX_BYTES} from '../shared/ro-account-limits.js';
import {roomRoster,waitingRoomProblem,waitingRoomAutoBots,ensureLobbyOpposition,prepareLobbyMarket} from '../shared/lobby-catalog.js';
import {lobbyOptions} from '../shared/room-lobby.js';
import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {WebSocketServer} from 'ws';
import {randomUUID,createHash,timingSafeEqual} from 'node:crypto';
import {Game} from '../shared/simulation.js';
import {capacity,modeOptions} from '../shared/modes.js';
import {RO_LINEAGES} from '../shared/ragnarok-jobs.js';
import {roomCharacterChoices} from '../shared/room-characters.js';
import {addRoomBots,removeRoomBot} from './room-bots.js';
import {lockRoom,canEnterRoom,roomPassword} from './room-access.js';
import {ragnarokRoomProfile} from './ro-room-profile.js';
import {applyRoRoomPolicy} from '../shared/ro-room-policy.js';
import {ARENAS} from '../shared/arenas.js';
import {Matchmaker} from './matchmaking.js';
import {RoomStore} from './room-store.js';
import {createPhaseHandler} from './phase-rooms.js';
import {handlerRagnarokRequest} from './ro-accounts.js';
import {runtimeConfig,originAllowed,publicRuntimeConfig} from './runtime-config.js';
const hash=token=>createHash('sha256').update(String(token)).digest('hex');
const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
const json=(res,status,data,headers={})=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers});res.end(JSON.stringify(data));};
const READY=new Set(['ready','ttReady','ktReady','wlReady','pkReady','dgReady','btReady']);
const MIME={'.wav':'audio/wav','.mp3':'audio/mpeg','.mid':'audio/midi','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon','.json':'application/json','.woff2':'font/woff2','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8'};
export function createGameServer({config=runtimeConfig(),store=new RoomStore(config.dataDir),clock=()=>Date.now()}={}){
 const rooms=new Map(store.load({maxAgeMs:config.idleSeconds*1000,now:clock()})),peers=new Map(),ipBudgets=new Map();
 const phaseHandler=createPhaseHandler({allowedOrigins:[...config.allowedOrigins]});let draining=false,closed=false,frame=0,lastSave=0,drainTimer,tickWorstMs=0;
 function send(peer,data){if(peer?.ws.readyState===1&&peer.ws.bufferedAmount<512000)peer.ws.send(JSON.stringify(data));}
 function roomInfo(room,id){return{code:room.code,lobbyVersion:room.lobbyVersion||1,stage:room.started?'playing':room.stage||'waiting',selectionProblem:room.selectionProblem||null,host:room.host,isHost:id===room.host,started:room.started,paused:room.paused,protected:!!room.passwordLock,options:{...room.game.options},arena:room.game.startingArena||room.game.arena,capacity:capacity(room.game.options),resumeSeconds:config.resumeSeconds,messages:room.messages||[],players:roomRoster(room.game,room.members.values(),room.host,id=>room.clients.has(id))};}
 function resetLobbyReady(room){if(room.lobbyVersion!==2)return;for(const member of room.members.values())if(!member.bot)member.ready=false;}
 function finishRoomSelection(room){
  if(room.lobbyVersion!==2||room.stage!=='selecting'||[...room.members.values()].some(m=>!m.bot&&!m.heroChosen))return;
  ensureLobbyOpposition(room.game);const problem=startProblem(room);room.selectionProblem=problem;if(problem){checkpoint(room);publishRoom(room);return;}
  if(room.game.options.mode==='bloody'){room.stage='recruiting';checkpoint(room);publishRoom(room);return;}
  activateRoom(room);
 }
 function activateRoom(room){
  applyRoRoomPolicy(room.game);
  const initialMarket=room.lobbyVersion===2&&prepareLobbyMarket(room.game);const readyType=room.game.options.mode==='dungeon'?'dgReady':room.game.options.mode==='bonk'?'bkReady':'ready';for(const u of initialMarket?[]:room.game.heroes()){room.game.command(u.owner,{type:readyType});if(room.game.options.mode==='bonk')break;}room.started=true;room.stage='playing';room.selectionProblem=null;if(!initialMarket)room.game.timer=Math.min(3,room.game.timer);checkpoint(room);publishRoom(room);
 }

 function snapshot(room,id){applyRoRoomPolicy(room.game);const state={...room.game.snapshotFor(id),onlineRoom:roomInfo(room,id)},peer=room.clients.get(id);if(peer?.staticWorld&&state.dungeon){const key=room.code+':dg:'+state.dungeon.floor+':'+(state.dungeon.stage==='clash'?'clash':'floor')+':'+room.game.obstacleRevision;state.worldStaticKey=key;if(peer.lastStaticKey===key){state.dungeon={...state.dungeon};delete state.dungeon.map;delete state.obstacles;}else peer.lastStaticKey=key;}if(peer?.staticWorld&&state.bonk){const key=room.code+':ro:'+room.game.worldSeed+':'+state.bonk.floor+':'+room.game.obstacleRevision;state.worldStaticKey=key;if(peer.lastStaticKey===key){state.bonk={...state.bonk};delete state.bonk.map;delete state.obstacles;}else peer.lastStaticKey=key;}if(peer?.skillLibrary&&state.bonk){const u=room.game.player(id),key=JSON.stringify([u?.id,u?.bonkBuild?.weapons,u?.bonkSkillSlots,u?.roLineage,u?.roSkillMode,u?.roTier]);state.bonk={...state.bonk,skillCatalogKey:key};if(peer.lastSkillCatalogKey===key){delete state.bonk.skillCatalog;delete state.bonk.learnedSkills;}else peer.lastSkillCatalogKey=key;}if(peer?.movementReplay)state.network={movementReplay:1,ack:peer.lastCommandSequence||0};return state;}
 function startProblem(room){
  const players=room.game.heroes(),mode=room.game.options.mode;
  if([...room.members.values()].some(m=>!m.bot&&m.heroChosen===false))return 'Cada jogador precisa confirmar seu personagem no lobby.';
  if(['castlefight','treetag','warlock','phasekiller','bloody'].includes(mode)&&players.length<2)return 'Aguarde pelo menos mais um jogador antes de iniciar.';
  if(mode==='treetag'&&(!players.some(u=>u.treeTagRole==='ent')||!players.some(u=>u.treeTagRole==='infernal')))return 'Tree Tag precisa de pelo menos um Ent e um Infernal.';
  if(mode==='bloody'&&new Set(players.map(u=>u.btTeam)).size<2)return 'Aguarde comandantes em duas equipes diferentes.';
  return null;
 }
 function checkpoint(room){try{store.save(room.code,room);}catch{console.error('Room checkpoint failed:',room.code);}}
 function publishRoom(room){for(const peer of room.clients.values())send(peer,{type:'state',state:snapshot(room,peer.id)});}
 function startRoom(peer,room){
  if(peer.id!==room.host)throw Error('Somente o host pode iniciar a sala.');if(room.started)throw Error('A partida já começou.');
  if(room.lobbyVersion===2&&room.stage==='waiting'){const players=roomInfo(room,peer.id).players,problem=waitingRoomProblem(room.game,players);if(problem)throw Error(problem);addRoomBots(room,waitingRoomAutoBots(room.game.options,players));room.stage='selecting';for(const member of room.members.values())if(!member.bot)member.heroChosen=false;checkpoint(room);publishRoom(room);return;}
  if(room.lobbyVersion===2&&room.stage==='selecting')throw Error('Aguarde todos escolherem seus personagens.');
  const problem=startProblem(room);if(problem)throw Error(problem);
  if(room.game.options.mode==='bloody'&&room.game.heroes().some(u=>!u.bot&&!u.btRoster.length))throw Error('Cada comandante precisa recrutar pelo menos um grupo.');
  activateRoom(room);
 }
 function configureRoom(peer,room,settings){
  if(!settings?.options)return configureDungeonRoom(peer,room,settings);
  if(peer.id!==room.host)throw Error('Somente o host pode configurar a sala.');
  if(room.started||room.lobbyVersion===2&&room.stage!=='waiting')throw Error('Configure as regras antes de iniciar.');
  const options=lobbyOptions(settings.options),humans=[...room.members.values()].filter(m=>!m.bot),bots=[...room.members.values()].filter(m=>m.bot);
  if(humans.length>capacity(options))throw Error('Este jogo não comporta todos os jogadores da sala.');
  const game=new Game(room.game.worldSeed||Date.now()>>>0,{...options,bonkDebug:false});if(options.mode==='bonk')game.bonkOnline=true;
  const choices=roomCharacterChoices(options.mode);for(const member of humans){const old=room.game.player(member.id),choice=choices.find(c=>c.hero===old?.hero)||choices[0];if(!game.addPlayer(member.id,choice.hero,member.name))throw Error('Não foi possível preparar o novo jogo.');}
  if(Object.hasOwn(ARENAS,settings.arena)&&!['bonk','dungeon','bloody','castlefight','treetag','kodotag','phasekiller','warlock'].includes(options.mode)){game.startingArena=settings.arena;game.setArena(settings.arena);}
  room.game=game;room.stage='waiting';room.selectionProblem=null;for(const bot of bots)room.members.delete(bot.id);for(const member of humans){member.heroChosen=false;member.ready=false;}
  addRoomBots(room,Math.min(bots.length,capacity(options)-humans.length));for(const client of room.clients.values()){client.lastStaticKey=null;client.lastSkillCatalogKey=null;}
  checkpoint(room);publishRoom(room);
 }
 function configureDungeonRoom(peer,room,settings){
  if(peer.id!==room.host)throw Error('Somente o host pode configurar a sala.');
  const game=room.game;if(room.started||game.phase!=='preparation'||game.dungeon?.floor>0)throw Error('Configure a sala antes de iniciar a expedição.');
  if(game.options.mode!=='dungeon'||game.options.dungeonTeams!==1||game.options.dungeonPvp)throw Error('Este painel configura salas cooperativas de Dungeon.');
  if(!settings||typeof settings!=='object'||Array.isArray(settings)||!Object.keys(settings).length||Object.keys(settings).some(key=>!['capacity','dungeonLimit'].includes(key)))throw Error('Configuração de sala inválida.');
  const size=Object.hasOwn(settings,'capacity')?settings.capacity:game.options.dungeonPartySize,limit=Object.hasOwn(settings,'dungeonLimit')?settings.dungeonLimit:game.options.dungeonLimit;
  if(!Number.isInteger(size)||size<1||size>4||![0,50].includes(limit))throw Error('Escolha de 1 a 4 jogadores e uma meta sem fim ou de 50 andares.');
  if(size<game.heroes().length)throw Error('A capacidade não pode ser menor que o número de jogadores da sala.');
  game.options={...game.options,dungeonPartySize:size,dungeonLimit:limit};if(game.dungeon)game.dungeon.limit=limit;for(const hero of game.heroes())hero.ready=false;checkpoint(room);publishRoom(room);
 }
 for(const [code,room]of rooms)room.code=code;
 function attach(peer,room,{token=null}={}){peer.room=room;room.clients.set(peer.id,peer);room.paused=false;room.lastActivity=clock();const member=room.members.get(peer.id);if(member)member.disconnectedAt=null;const u=room.game.player(peer.id);if(u){u.bonkDisconnected=false;u.bot=false;u.name=member?.name||u.name;}if(!room.clients.has(room.host))room.host=peer.id;send(peer,{type:'joined',id:peer.id,room:room.code,...(token?{resumeToken:token}:{}),state:snapshot(room,peer.id)});checkpoint(room);}
 function addMember(peer,room,input,squad=null){const token=randomUUID();if(!room.game.addPlayer(peer.id,input.roProfile?RO_LINEAGES[input.roProfile.lineage].hero:input.heroChosen===false?roomCharacterChoices(room.game.options.mode)[0].hero:input.hero,input.name,false,squad,input.roProfile))throw Error('Sala em andamento, cheia ou herói inválido.');if(input.roProfile){const u=room.game.player(peer.id),p=input.roProfile;u.roAccountId=p.accountId;if(p.checkpoint)room.game.bonkCommand(u,{type:'bkRestore',checkpoint:p.checkpoint,activity:room.game.bonk.activity,freshActivity:!p.resume||p.checkpoint.activity!==room.game.bonk.activity,restoreWorld:peer.id===room.host});room.game.bonkCommand(u,{type:'bkCards',cards:p.cards});}room.members.set(peer.id,{id:peer.id,roAccountId:input.roProfile?.accountId||null,tokenHash:hash(token),hero:input.hero,name:room.game.player(peer.id).name,heroChosen:input.heroChosen!==false,disconnectedAt:null});attach(peer,room,{token});}
 const matchmaker=new Matchmaker((parties,options)=>{const code='WAR-'+randomUUID().slice(0,8).toUpperCase(),room={code,game:new Game(Date.now()>>>0,options),host:parties[0].host,started:true,paused:false,lastActivity:clock(),clients:new Map(),members:new Map()};rooms.set(code,room);for(const [i,party]of parties.entries())for(const player of party.players){const peer=peers.get(player.id);if(peer)addMember(peer,room,player,i+1);}});
 function parties(){for(const party of matchmaker.parties.values()){const state=matchmaker.state(party);for(const member of party.players)send(peers.get(member.id),{type:'party',party:state,id:member.id});}}
 const server=http.createServer(async(req,res)=>{
  const origin=req.headers.origin,host=req.headers.host||'localhost',cors=origin&&originAllowed(origin,host,config)?{'Access-Control-Allow-Origin':origin,'Vary':'Origin'}:{};
  try{const url=new URL(req.url,'http://'+host);
   if(req.method==='OPTIONS'){if(!originAllowed(origin,host,config))return json(res,403,{message:'Origem não autorizada.'});res.writeHead(204,{...cors,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Authorization, Content-Type'});return res.end();}
   if(url.pathname==='/healthz')return json(res,draining?503:200,{service:'Custom Hero',ready:!draining,rooms:rooms.size,clients:peers.size,version:config.version,persistent:store.persistent,tickWorstMs:Math.round(tickWorstMs)},cors);
   if(url.pathname.startsWith('/api/rooms/')){if(!originAllowed(origin,host,config))return json(res,403,{message:'Origem não autorizada.'},cors);if(req.method!=='GET')return json(res,405,{message:'Método não permitido.'},cors);const code=url.pathname.slice('/api/rooms/'.length).toUpperCase();if(!/^[A-Z0-9]{3,12}$/.test(code))return json(res,400,{message:'Código de sala inválido.'},cors);const room=rooms.get(code);if(!room)return json(res,404,{message:'Sala não encontrada. Confira o código com o host.'},cors);return json(res,200,{code,options:room.game.options,protected:!!room.passwordLock,started:room.started||room.lobbyVersion===2&&room.stage!=='waiting',players:room.members.size,capacity:capacity(room.game.options)},cors);}
   if(url.pathname==='/api/config')return json(res,200,publicRuntimeConfig(config,{persistent:store.persistent,draining}),cors);
   if(url.pathname.startsWith('/api/phase')){if(!originAllowed(origin,host,config))return json(res,403,{message:'Origem não autorizada.'});const chunks=[];let bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>8192)return json(res,413,{message:'Pedido muito grande.'},cors);chunks.push(chunk);}const body=Buffer.concat(chunks),protocol=config.publicOrigin?.startsWith('https:')?'https:':'http:',request=new Request(protocol+'//'+host+req.url,{method:req.method,headers:req.headers,...(body.length?{body}:{})}),response=await phaseHandler(request,{DB:store});if(!response)return json(res,404,{message:'Endpoint não encontrado.'},cors);res.writeHead(response.status,{...Object.fromEntries(response.headers),...cors});return res.end(Buffer.from(await response.arrayBuffer()));}
   if(url.pathname.startsWith('/api/ragnarok/')){
    if(!originAllowed(origin,host,config))return json(res,403,{message:'Origem não autorizada.'});
    const chunks=[];let bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>(url.pathname==='/api/ragnarok/progress'?RO_PROGRESS_BODY_MAX_BYTES:150*1024))return json(res,413,{message:'Pedido muito grande.'},cors);chunks.push(chunk);}
    const body=Buffer.concat(chunks),headers=new Headers(req.headers);
    // A self-hosted Node server has no trusted Sites identity gateway. Visitor
    // supplied identity headers must never select or bind a player's account.
    headers.delete('oai-authenticated-user-id');
    // Origin was checked at this transport boundary against the VPS allowlist.
    // The internal handler can also serve explicitly allowed native app origins.
    headers.delete('origin');
    const protocol=config.publicOrigin?.startsWith('https:')?'https:':'http:',request=new Request(protocol+'//'+host+req.url,{method:req.method,headers,...(body.length&&!['GET','HEAD'].includes(req.method)?{body}:{})}),response=await handlerRagnarokRequest(request,{DB:store});
    if(!response)return json(res,404,{message:'Endpoint não encontrado.'},cors);
    res.writeHead(response.status,{...Object.fromEntries(response.headers),...cors});return res.end(Buffer.from(await response.arrayBuffer()));
   }
   if(!['GET','HEAD'].includes(req.method))return json(res,405,{message:'Método não permitido.'});
   const docs=url.pathname.startsWith('/guides/'),root=path.resolve(docs?path.join(config.clientDir,'guides'):config.clientDir),relative=decodeURIComponent(docs?url.pathname.slice(8):url.pathname==='/'?'index.html':url.pathname.slice(1)),file=path.resolve(root,relative);if(!file.startsWith(root+path.sep)&&file!==root)return json(res,403,{message:'Caminho inválido.'});let resolved=file;try{if(!(await stat(resolved)).isFile())throw Error();}catch{if(docs||path.extname(relative))return json(res,404,{message:'Arquivo não encontrado.'});resolved=path.join(root,'index.html');}const data=await readFile(resolved);res.writeHead(200,{'Content-Type':MIME[path.extname(resolved)]||'application/octet-stream','Cache-Control':url.pathname.startsWith('/assets/')?'public, max-age=31536000, immutable':'no-cache','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);
  }catch{json(res,500,{message:'Não foi possível processar o pedido.'});}
 });
 const wss=new WebSocketServer({noServer:true,maxPayload:65536});
 server.on('upgrade',(req,socket,head)=>{const pathname=new URL(req.url,'http://localhost').pathname;if(draining||peers.size>=config.maxClients||!['/ws','/'].includes(pathname)||!originAllowed(req.headers.origin,req.headers.host,config)){socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');socket.destroy();return;}wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req));});
 wss.on('connection',(ws,req)=>{
  const ip=config.trustProxy?String(req.headers['x-forwarded-for']||req.socket.remoteAddress).split(',')[0].trim():req.socket.remoteAddress;let budget=ipBudgets.get(ip);if(!budget||clock()-budget.at>60000){budget={at:clock(),count:0};ipBudgets.set(ip,budget);}if(++budget.count>60){ws.close(1008,'Muitas conexões');return;}
  const peer={id:randomUUID(),ws,room:null,budget:0,budgetAt:clock(),alive:true};peers.set(peer.id,peer);ws.on('pong',()=>peer.alive=true);
  ws.on('message',async raw=>{if(clock()-peer.budgetAt>=1000){peer.budgetAt=clock();peer.budget=0;}if(++peer.budget>90){if(peer.budget===91)send(peer,{type:'error',message:'Muitas ações. Aguarde um instante.'});return;}
   try{const msg=JSON.parse(raw.toString());if(!msg||typeof msg!=='object'||Array.isArray(msg)||typeof msg.type!=='string')throw Error('Pedido inválido.');
    if(!peer.room&&msg.type==='resume'){peer.movementReplay=Array.isArray(msg.features)&&msg.features.includes('movement-rollback-v1');peer.staticWorld=Array.isArray(msg.features)&&msg.features.includes('static-world-v1');peer.skillLibrary=Array.isArray(msg.features)&&msg.features.includes('ro-skill-library-v1');const code=String(msg.room||'').toUpperCase(),room=rooms.get(code),member=room?.members.get(msg.id);if(!member||typeof msg.token!=='string'||msg.token.length>128||!equal(member.tokenHash,hash(msg.token))||member.disconnectedAt&&clock()-member.disconnectedAt>config.resumeSeconds*1000)throw Error('Sessão expirada. Entre em uma nova sala.');const previous=room.clients.get(member.id);if(previous){previous.room=null;previous.ws.close(4001,'Sessão retomada em outro cliente');peers.delete(previous.id);}peers.delete(peer.id);peer.id=member.id;peers.set(peer.id,peer);if(msg.chooseHeroInRoom===true&&!room.started&&room.lobbyVersion!==2)member.heroChosen=false;attach(peer,room);return;}
    if(!peer.room&&msg.type==='partyCreate'){matchmaker.create(peer.id,msg);parties();return;}
    if(!peer.room&&msg.type==='partyJoin'){matchmaker.join(peer.id,msg.code,msg);parties();return;}
    if(!peer.room&&msg.type==='partyLeave'){matchmaker.leave(peer.id);send(peer,{type:'party',party:null,id:peer.id});parties();return;}
    if(!peer.room&&msg.type==='queue'){if(draining||rooms.size>=config.roomLimit)throw Error('Servidor cheio ou em atualização. Tente novamente em instantes.');matchmaker.queue(peer.id);parties();return;}
    if(!peer.room&&msg.type==='cancelQueue'){matchmaker.cancel(peer.id);parties();return;}
    if(!peer.room&&msg.type==='join'){
     if(peer.joining)throw Error('Sua entrada já está sendo processada.');peer.joining=true;
     try{
      peer.movementReplay=Array.isArray(msg.features)&&msg.features.includes('movement-rollback-v1');peer.staticWorld=Array.isArray(msg.features)&&msg.features.includes('static-world-v1');peer.skillLibrary=Array.isArray(msg.features)&&msg.features.includes('ro-skill-library-v1');
      if(draining)throw Error('Servidor em atualização. Tente novamente em instantes.');
      if(matchmaker.party(peer.id))throw Error('Saia da party antes de entrar em uma sala.');
      const code=String(msg.room||'').trim().toUpperCase();if(!/^[A-Z0-9]{3,12}$/.test(code))throw Error('Use uma sala com 3 a 12 letras ou números.');
      const password=roomPassword(msg.password),requested=modeOptions(msg.options),existing=rooms.get(code);
      if(existing&&!canEnterRoom(existing.passwordLock,password))throw Error('Senha da sala incorreta.');
      if(existing&&msg.intent==='create')throw Error('Esse código já está em uso. Escolha entrar ou use outro código.');
      if(!existing&&msg.intent==='join')throw Error('Sala não encontrada. Confira o código ou crie uma sala.');
      if(existing&&msg.intent!=='join'&&msg.options&&existing.game.options.mode!==requested.mode)throw Error('Essa sala pertence a outro modo de jogo.');
      const roProfile=(existing?.game.options.mode||requested.mode)==='bonk'?await ragnarokRoomProfile(store,msg.ragnarok):null;
      if(ws.readyState!==1||peer.room)return;
      let room=rooms.get(code);
      if(room!==existing)throw Error('A sala mudou enquanto você entrava. Tente novamente.');
      if(!room){
       if(rooms.size>=config.roomLimit)throw Error('Servidor cheio.');
       const game=new Game(Number.parseInt(randomUUID().slice(0,8),16),{...msg.options,bonkDebug:false});
       if(game.options.mode==='bonk')game.bonkOnline=true;
       if(!['treetag','warlock','kodotag','phasekiller','dungeon','bloody','bonk'].includes(game.options.mode)&&Object.hasOwn(ARENAS,msg.arena)){game.startingArena=msg.arena;game.setArena(msg.arena);}
       room={code,game,host:peer.id,passwordLock:lockRoom(password),lobbyVersion:msg.lobbyVersion===2?2:1,stage:'waiting',started:false,paused:false,lastActivity:clock(),clients:new Map(),members:new Map()};rooms.set(code,room);
      }
      if(room.started||room.lobbyVersion===2&&room.stage!=='waiting'||room.game.phase!=='preparation'||room.game.wave!==0)throw Error('Sala em andamento. Use a reconexão ou escolha outra sala.');
      try{if(room.game.heroes().length>=capacity(room.game.options)){const bot=[...room.members.values()].find(m=>m.bot);if(bot)removeRoomBot(room,bot.id);}addMember(peer,room,{...msg,roProfile,name:room.lobbyVersion===2?'Jogador '+(room.members.size+1):msg.name,heroChosen:room.lobbyVersion===2||msg.chooseHeroInRoom?false:true});resetLobbyReady(room);}catch(e){if(!room.members.size){rooms.delete(code);store.delete(code);}throw e;}
      publishRoom(room);return;
     }finally{peer.joining=false;}
    }
    const room=peer.room;if(!room)throw Error('Entre em uma sala primeiro.');room.lastActivity=clock();
    if(msg.type==='leave'){const member=room.members.get(peer.id);if(member)member.disconnectedAt=clock()-config.resumeSeconds*1000-1;peer.explicitLeave=true;ws.close(1000,'Saiu da sala');return;}
    if(msg.type!=='command'||!msg.command||typeof msg.command.type!=='string')throw Error('Comando inválido.');if(peer.movementReplay){if(!Number.isSafeInteger(msg.sequence)||msg.sequence<1)throw Error('Sequência de comando inválida.');if(msg.sequence<=(peer.lastCommandSequence||0))return;peer.lastCommandSequence=msg.sequence;}const c=msg.command;
    if(c.type==='bkDifficulty'&&peer.id!==room.host)throw Error('Somente o host pode alterar a dificuldade.');
    if(room.game.options.mode==='bonk'&&['bkRestore','bkCards','bkAccountSocket'].includes(c.type))throw Error('Personagens e cartas são carregados da sua conta ao entrar.');
    if(c.type==='bkSocketCardReceipt'){if(room.game.options.mode!=='bonk')throw Error('Encaixe disponível apenas no Ragnarok.');const game=room.game,unit=game.player(peer.id),socket=await roAccountSocketReceipt(store,room.members.get(peer.id)?.roAccountId,c.receipt);if(!socket||peer.room!==room||room.game!==game||game.player(peer.id)!==unit||!game.bonkCommand(unit,{type:'bkAccountSocket',socket}))throw Error('Confira a carta e o equipamento na sua conta.');checkpoint(room);publishRoom(room);return;}
    if(room.game.options.mode==='bonk'&&['bkReady','ready','bkNext'].includes(c.type)){if(c.type==='bkNext'){if(peer.id!==room.host)throw Error('Aguarde o host escolher o próximo andar.');}else{startRoom(peer,room);return;}}
    if(c.type==='roomCancelSelection'){if(peer.id!==room.host||room.lobbyVersion!==2||room.stage!=='selecting')throw Error('Somente o host pode voltar à sala durante a seleção.');room.stage='waiting';room.selectionProblem=null;for(const member of room.members.values())if(!member.bot)member.heroChosen=false;resetLobbyReady(room);checkpoint(room);publishRoom(room);return;}
    if(c.type==='roomReady'){if(room.lobbyVersion!==2||room.stage!=='waiting'||typeof c.ready!=='boolean')throw Error('Marque Pronto na sala de espera.');room.members.get(peer.id).ready=c.ready;checkpoint(room);publishRoom(room);return;}
    if(c.type==='roomChooseHero'){
     if(room.lobbyVersion===2&&room.stage!=='selecting')throw Error('A escolha de personagem abre depois que o host inicia a sala.');
     if(room.started||room.game.phase!=='preparation'||room.game.wave!==0)throw Error('Escolha o personagem antes de iniciar a partida.');
     if(peer.selectingHero)throw Error('Aguarde a escolha anterior.');
     const mode=room.game.options.mode,choice=roomCharacterChoices(mode).find(d=>d.key===c.hero);if(!choice)throw Error('Personagem inválido para este jogo.');
     peer.selectingHero=true;const selectedGame=room.game;
     try{const profile=mode==='bonk'?await ragnarokRoomProfile(store,{...c.ragnarok,lineage:c.hero}):null;
      if(peer.room!==room||room.game!==selectedGame||room.started||room.lobbyVersion===2&&room.stage!=='selecting'||ws.readyState!==1)throw Error('A sala mudou durante a escolha.');
      const old=room.game.player(peer.id),oldUnits=room.game.units,oldId=room.game.players[peer.id];
      room.game.units=oldUnits.filter(u=>u.owner!==peer.id);delete room.game.players[peer.id];
      if(!room.game.addPlayer(peer.id,profile?RO_LINEAGES[profile.lineage].hero:choice.hero,choice.name,false,old?.squad,profile)){room.game.units=oldUnits;room.game.players[peer.id]=oldId;throw Error('Não foi possível trocar o personagem.');}
      const u=room.game.player(peer.id);if(profile){u.roAccountId=profile.accountId;if(profile.checkpoint)room.game.bonkCommand(u,{type:'bkRestore',checkpoint:profile.checkpoint,activity:room.game.bonk.activity,freshActivity:!profile.resume||profile.checkpoint.activity!==room.game.bonk.activity,restoreWorld:false});room.game.bonkCommand(u,{type:'bkCards',cards:profile.cards});}
      const member=room.members.get(peer.id);member.roAccountId=profile?.accountId||null;member.hero=choice.hero;member.name=u.name;member.heroChosen=true;checkpoint(room);publishRoom(room);finishRoomSelection(room);
     }finally{peer.selectingHero=false;}return;
    }
    if(c.type==='roomBots'){if(peer.id!==room.host)throw Error('Somente o host pode adicionar bots.');if(room.started||room.lobbyVersion===2&&room.stage!=='waiting')throw Error('Configure os bots antes de iniciar.');const free=capacity(room.game.options)-room.game.heroes().length;const count=c.fill===true?free:c.count;if(!Number.isInteger(count)||count<1||count>free)throw Error('Escolha uma quantidade que caiba na sala.');addRoomBots(room,count);resetLobbyReady(room);checkpoint(room);publishRoom(room);return;}
    if(c.type==='roomStart'){if(c.settings!==undefined)configureRoom(peer,room,c.settings);startRoom(peer,room);return;}
    if(c.type==='roomSettings'){configureRoom(peer,room,c.settings);return;}
    if(room.game.options.mode==='dungeon'&&!room.started&&['dgReady','ready'].includes(c.type)){if(peer.id!==room.host)throw Error('Aguarde o host iniciar a expedição.');startRoom(peer,room);return;}
    if(c.type==='roomKick'){if(peer.id!==room.host||room.started||room.lobbyVersion===2&&room.stage!=='waiting'||c.playerId===peer.id)throw Error('O host só remove convidados antes da partida.');if(removeRoomBot(room,c.playerId)){resetLobbyReady(room);checkpoint(room);publishRoom(room);return;}const target=room.clients.get(c.playerId);if(!target){if(!room.members.has(c.playerId))throw Error('Jogador não encontrado.');room.game.units=room.game.units.filter(u=>u.owner!==c.playerId);delete room.game.players[c.playerId];room.members.delete(c.playerId);resetLobbyReady(room);checkpoint(room);publishRoom(room);return;}target.explicitLeave=true;target.ws.close(4003,'Removido da sala pelo host');return;}
    if(c.type==='roomChat'){const text=String(c.text||'').trim();if(!text||text.length>240||peer.chatAt&&clock()-peer.chatAt<600)throw Error('Mensagem inválida ou enviada muito rápido.');peer.chatAt=clock();room.messages||=[];room.messages.push({id:randomUUID(),name:room.game.player(peer.id)?.name||'Jogador',text});room.messages=room.messages.slice(-40);for(const p of room.clients.values())send(p,{type:'roomChat',messages:room.messages});return;}
    if(room.lobbyVersion===2&&!room.started&&['waiting','selecting'].includes(room.stage))throw Error(room.stage==='waiting'?'Configure a sala e marque Pronto antes de iniciar.':'Escolha seu personagem para continuar.');
    if(!room.started&&READY.has(c.type)){startRoom(peer,room);return;}
    if(!room.game.command(peer.id,c))send(peer,{type:'rejected',message:room.game.commandFailureReason||'Confira recursos, alvo e fase da partida.'});else if(room.game.phase!=='preparation'||room.game.wave>0||READY.has(c.type)&&!startProblem(room)&&room.game.heroes().every(u=>u.ready||u.bot))room.started=true;
   }catch(error){send(peer,{type:'error',message:error.message||'Ação inválida.'});}
  });
  ws.on('close',()=>{if(peers.get(peer.id)!==peer)return;matchmaker.leave(peer.id);parties();peers.delete(peer.id);const room=peer.room;if(room){room.clients.delete(peer.id);const member=room.members.get(peer.id);if(member)member.disconnectedAt=peer.explicitLeave?clock()-config.resumeSeconds*1000-1:clock();if(peer.explicitLeave&&!room.started){room.game.units=room.game.units.filter(u=>u.owner!==peer.id);delete room.game.players[peer.id];room.members.delete(peer.id);resetLobbyReady(room);}else{const u=room.game.player(peer.id);if(u){u.bot=true;if(u.bonkHero){u.bonkDisconnected=true;u.bonkMove={dx:0,dz:0};}}}if(room.host===peer.id&&room.clients.size)room.host=room.clients.keys().next().value;if(!room.clients.size){room.paused=true;if(peer.explicitLeave&&![...room.members.values()].some(m=>!m.bot&&(m.disconnectedAt==null||clock()-m.disconnectedAt<=config.resumeSeconds*1000))){rooms.delete(room.code);store.delete(room.code);}else checkpoint(room);}else checkpoint(room);}if(draining&&!peers.size)finishClose();});ws.on('error',()=>{});
 });
 const interval=setInterval(()=>{const start=performance.now(),now=clock();frame++;for(const[code,room]of rooms){if(!room.clients.size){if(now-room.lastActivity>config.idleSeconds*1000){rooms.delete(code);store.delete(code);}continue;}room.lastActivity=now;try{if(!room.paused&&(room.started||room.lobbyVersion!==2&&!['treetag','kodotag','warlock','phasekiller','bloody','castlefight','dungeon','bonk'].includes(room.game.options.mode)&&[...room.members.values()].every(m=>m.heroChosen!==false))){if(!room.started&&room.game.phase==='preparation')room.game.timer=Math.max(3600,room.game.timer);room.game.tick(1/config.simulationHz);if(room.game.phase!=='preparation'||room.game.wave>0)room.started=true;}if(frame%Math.max(1,Math.round(config.simulationHz/config.snapshotHz))===0)for(const peer of room.clients.values())send(peer,{type:'state',state:snapshot(room,peer.id)});if(now-lastSave>=5000)checkpoint(room);}catch{room.paused=true;for(const peer of room.clients.values())send(peer,{type:'error',message:'A sala foi pausada após um erro. O estado foi preservado para recuperação.'});}}if(now-lastSave>=5000)lastSave=now;tickWorstMs=Math.max(tickWorstMs,performance.now()-start);},1000/config.simulationHz);
 const heartbeat=setInterval(()=>{for(const peer of peers.values()){if(!peer.alive){peer.ws.terminate();continue;}peer.alive=false;if(peer.ws.readyState===1)peer.ws.ping();}for(const[ip,budget]of ipBudgets)if(clock()-budget.at>120000)ipBudgets.delete(ip);},30000);
 let resolveClosed;const done=new Promise(resolve=>resolveClosed=resolve);
 function finishClose(){if(closed)return;closed=true;clearInterval(interval);clearInterval(heartbeat);clearTimeout(drainTimer);for(const room of rooms.values())checkpoint(room);for(const peer of peers.values())peer.ws.terminate();wss.close();server.close(()=>{store.close();resolveClosed();});server.closeIdleConnections?.();}
 function drain(){if(draining)return done;draining=true;for(const peer of peers.values())send(peer,{type:'maintenance',message:'Atualização do servidor: seu progresso será salvo. A conexão será retomada.'});if(!peers.size)finishClose();else drainTimer=setTimeout(finishClose,config.drainSeconds*1000);return done;}
 return{server,wss,rooms,peers,store,config,drain,close:finishClose,closed:done,listen:()=>new Promise(resolve=>server.listen(config.port,config.host,()=>resolve(server.address())))};
}
