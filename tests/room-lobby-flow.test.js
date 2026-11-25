import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {WebSocket} from 'ws';
import {createLocalLobby} from '../shared/room-lobby.js';
import {LOBBY_GAMES,lobbyGameKey,waitingRoomProblem,waitingRoomAutoBots} from '../shared/lobby-catalog.js';
import {roomSettingsMarkup} from '../src/room-settings-ui.js';
import {roomCharacterPickerMarkup} from '../src/room-character-picker.js';
import {createGameServer} from '../server/game-server.js';
import {runtimeConfig} from '../server/runtime-config.js';
import {createRoCheckpoint} from '../shared/ragnarok-save.js';
import {saveRoCharacter} from '../src/ragnarok-account-ui.js';
import {roSkillOfferPool} from '../shared/ro-skill-offers.js';
import {Game} from '../shared/simulation.js';
import {wlSkillPrice} from '../shared/warlock-catalog.js';

const config=()=>runtimeConfig({HOST:'127.0.0.1',PORT:'0',DRAIN_TIMEOUT_SECONDS:'0'});
function next(ws,type,predicate=()=>true){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{ws.off('message',read);reject(Error('Timeout: '+type));},6000);function read(raw){const m=JSON.parse(raw);if(m.type===type&&predicate(m)){clearTimeout(timer);ws.off('message',read);resolve(m);}}ws.on('message',read);});}
async function join(app,sockets,payload){const ws=new WebSocket('ws://127.0.0.1:'+app.server.address().port+'/ws');sockets.push(ws);await once(ws,'open');const result=next(ws,'joined');ws.send(JSON.stringify({lobbyVersion:2,chooseHeroInRoom:true,hero:'knight',...payload}));return{ws,data:await result};}
async function command(client,c,predicate=()=>true,type='state'){const result=next(client.ws,type,predicate);client.ws.send(JSON.stringify({type:'command',command:c}));return result;}
async function close(app,sockets){for(const ws of sockets)ws.terminate();await new Promise(r=>setTimeout(r,10));app.close();await app.closed;}

test('local room has ready before start and character choice only inside the started selection phase',()=>{
 const room=createLocalLobby({seed:12});assert.equal(room.stage,'waiting');assert.equal(room.started,false);
 assert.throws(()=>room.command({type:'roomChooseHero',hero:'fenrir'}),/depois/);assert.throws(()=>room.command({type:'roomStart'}),/Pronto/);
 room.command({type:'roomReady',ready:true});room.command({type:'roomStart'});assert.equal(room.stage,'selecting');assert.equal(room.game.time,0);assert.equal(room.started,false);
 room.command({type:'roomChooseHero',hero:'fenrir'});assert.equal(room.game.player('local').hero,'fenrir');assert.equal(room.started,false);room.command({type:'roomSelectionComplete'});assert.equal(room.stage,'playing');assert.equal(room.started,true);assert.equal(room.game.phase,'preparation');assert.equal(room.game.timer,60);for(let i=0;i<5;i++)room.game.tick(1);assert.equal(room.game.phase,'preparation');assert.ok(room.game.timer>50,'the first market remains available after choosing a character');
});

test('local RPG selection leaves a restore window and preserves bots, while changing settings resets ready',()=>{
 const room=createLocalLobby({seed:13});room.command({type:'roomSettings',settings:{options:{mode:'bonk',bonkActivity:'tower'}}});room.command({type:'roomBots',count:2});assert.equal(room.game.heroes().length,3);
 room.command({type:'roomReady',ready:true});room.command({type:'roomSettings',settings:{options:{mode:'bonk',bonkActivity:'tower',bonkSkillMode:'class'}}});assert.equal(room.snapshot().onlineRoom.players[0].ready,false);assert.equal(room.game.heroes().filter(u=>u.bot).length,2);
 room.command({type:'roomReady',ready:true});room.command({type:'roomStart'});room.command({type:'roomChooseHero',hero:'archmage'});
 assert.equal(room.game.bonk.stage,'preparation');const cp=createRoCheckpoint(room.game);assert.ok(cp);assert.equal(room.game.command('local',{type:'bkRestore',checkpoint:cp}),true);room.command({type:'roomSelectionComplete'});assert.equal(room.game.bonk.activity,'tower');assert.equal(room.game.bonk.stage,'playing');
});

test('game cards keep Custom Hero modes inside Custom Hero and the two Ragnarok activities inside Ragnarok',()=>{
 assert.equal(LOBBY_GAMES.filter(g=>g.key==='survival').length,1);assert.ok(!LOBBY_GAMES.some(g=>['tower','best','war'].includes(g.key)));assert.equal(lobbyGameKey({mode:'tower'}),'survival');assert.equal(lobbyGameKey({mode:'bonk'}),'bonk');
 const classic=roomSettingsMarkup({isHost:true,stage:'waiting',options:{mode:'campaign'}});assert.doesNotMatch(classic,/<select|Cenário/);assert.match(classic,/data-room-game="survival"/);assert.match(classic,/data-lobby-option="mode" data-lobby-value="best"/);assert.match(classic,/cenários mudam/i);
 const rag=roomSettingsMarkup({isHost:true,stage:'waiting',options:{mode:'bonk',bonkActivity:'tower'}});assert.match(rag,/Torre sem Fim · Ragnarok/);assert.match(rag,/data-lobby-option="bonkActivity"/);assert.doesNotMatch(rag,/<select/);assert.match(roomCharacterPickerMarkup('campaign'),/PARTIDA INICIADA/);
 assert.match(classic,/Custom Hero · Line Wars/);
});

test('local Tower class-only merchant keeps the clicked lineage and excludes swordsman offers after restore',()=>{
 for(const lineage of ['meister','biolo']){
  const room=createLocalLobby({seed:14,options:{mode:'bonk',bonkActivity:'tower',bonkSkillMode:'class'}});room.command({type:'roomReady',ready:true});room.command({type:'roomStart'});room.command({type:'roomChooseHero',hero:lineage});
  const u=room.game.player('local'),cp=createRoCheckpoint(room.game);assert.equal(u.roLineage,lineage);assert.ok(room.game.command('local',{type:'bkRestore',checkpoint:cp,activity:'tower'}));
  u.roSkillMode='mixed';room.command({type:'roomSelectionComplete'});assert.equal(u.roSkillMode,'class');assert.equal(u.roLineage,lineage);assert.equal(u.bonkJob,'merchant');
  assert.ok(!roSkillOfferPool(u).some(c=>['sm_endure','sm_movingrecovery'].includes(c.key)));
 }
});

test('Tree Tag computers fill the opposite role after the human chooses an Infernal',()=>{
 const room=createLocalLobby({seed:18,options:{mode:'treetag'}});room.command({type:'roomBots',count:1});room.command({type:'roomReady',ready:true});room.command({type:'roomStart'});room.command({type:'roomChooseHero',hero:'blaze'});room.command({type:'roomSelectionComplete'});
 assert.equal(room.game.player('local').treeTagRole,'infernal');assert.ok(room.game.heroes().some(u=>u.bot&&u.treeTagRole==='ent'));assert.equal(room.started,true);
});

test('a ready solo Warlock host starts with exactly one computer opponent and keeps it through character selection',()=>{
 for(const manual of [false,true]){
  const room=createLocalLobby({seed:21,options:{mode:'warlock'}});if(manual)room.command({type:'roomBots',count:1});
  assert.throws(()=>room.command({type:'roomStart'}),/Pronto/);assert.equal(room.game.heroes().length,manual?2:1,'a rejected start cannot add a bot');
  room.command({type:'roomReady',ready:true});const players=room.snapshot().onlineRoom.players;
  assert.equal(waitingRoomProblem(room.game,players),null);assert.equal(waitingRoomAutoBots(room.game.options,players),manual?0:1);
  room.command({type:'roomStart'});assert.equal(room.stage,'selecting');assert.equal(room.game.heroes().filter(u=>u.bot).length,1);
  room.command({type:'roomChooseHero',hero:'heretic'});room.command({type:'roomSelectionComplete'});
  const u=room.game.player('local');assert.equal(room.started,true);assert.equal(u.warlockCharacter,'heretic');assert.equal(room.game.heroes().filter(u=>u.bot).length,1);assert.equal(room.game.phase,'preparation');assert.equal(room.game.warlock.phase,'shop');assert.equal(room.game.warlock.remaining,30);assert.equal(u.ready,false);
  for(const level of [1,2]){const price=wlSkillPrice(u,'S011'),gold=u.gold;assert.equal(room.command({type:'wlBuy',skill:'S011'}),true);assert.equal(u.skillLevels.S011,level);assert.equal(u.gold,gold-price);}
  assert.equal(room.command({type:'wlReady'}),true);assert.equal(room.game.phase,'wave');assert.ok(room.game.heroes().find(v=>v.bot).skills.length>2,'the computer buys spells even if the human immediately starts');
  for(let i=0;i<30;i++)room.game.tick(1/30);assert.equal(room.game.heroes().filter(u=>u.alive).length,2,'solo does not instantly win from having no opponent');
 }
 assert.match(waitingRoomProblem({options:{mode:'warlock'}},[{ready:true,connected:false,bot:false}]),/reconectarem/);
 assert.match(waitingRoomProblem({options:{mode:'castlefight'}},[{ready:true,connected:true,bot:false}]),/outro jogador/);
});

test('a network Warlock room can start with one ready human and registers one real bot in the authoritative roster',async()=>{
 const app=createGameServer({config:config()}),sockets=[];try{
  await app.listen();const a=await join(app,sockets,{type:'join',intent:'create',room:'WLSOLO',options:{mode:'warlock'}});
  assert.match((await command(a,{type:'roomStart'},()=>true,'error')).message,/Pronto/);assert.equal(app.rooms.get('WLSOLO').members.size,1);
  await command(a,{type:'roomReady',ready:true},m=>m.state.onlineRoom.players.every(p=>p.ready));
  const selected=await command(a,{type:'roomStart'},m=>m.state.onlineRoom.stage==='selecting');assert.equal(selected.state.onlineRoom.players.length,2);assert.equal(selected.state.onlineRoom.players.filter(p=>p.bot&&p.ready&&p.heroChosen).length,1);
  const started=await command(a,{type:'roomChooseHero',hero:'heretic'},m=>m.state.onlineRoom.started);assert.equal(started.state.options.mode,'warlock');assert.equal(started.state.onlineRoom.players.length,2);
  const room=app.rooms.get('WLSOLO'),u=room.game.player(a.data.id);assert.equal(room.game.heroes().filter(u=>u.bot).length,1);assert.equal(u.warlockCharacter,'heretic');assert.equal(room.game.phase,'preparation');assert.equal(room.game.warlock.phase,'shop');assert.ok(room.game.warlock.remaining>29);assert.equal(u.ready,false);
  for(const level of [1,2]){const gold=u.gold,price=wlSkillPrice(u,'S011');await command(a,{type:'wlBuy',skill:'S011'},m=>m.state.units.find(v=>v.owner===a.data.id)?.skillLevels.S011===level);assert.equal(u.gold,gold-price);assert.equal(u.skillLevels.S011,level);}
  await command(a,{type:'wlReady'},m=>m.state.warlock.phase==='battle');assert.equal(room.game.phase,'wave');assert.equal(room.game.warlock.round,1);
 }finally{await close(app,sockets);}
});

test('two real clients confirm ready, select independent characters only after start, and launch the selected game',async()=>{
 const app=createGameServer({config:config()}),sockets=[];try{
  await app.listen();const a=await join(app,sockets,{type:'join',intent:'create',room:'READYV2',options:{mode:'campaign'}}),b=await join(app,sockets,{type:'join',intent:'join',room:'READYV2'});
  assert.equal(a.data.state.onlineRoom.stage,'waiting');assert.equal(a.data.state.onlineRoom.players[0].heroChosen,false);
  assert.match((await command(a,{type:'roomChooseHero',hero:'fenrir'},()=>true,'error')).message,/depois/);
  assert.match((await command(a,{type:'roomStart'},()=>true,'error')).message,/Pronto/);
  await command(a,{type:'roomSettings',settings:{options:{mode:'castlefight',laneCount:2}}},m=>m.state.options.mode==='castlefight');
  await command(a,{type:'roomBots',count:1},m=>m.state.onlineRoom.players.length===3);
  const ra=await command(a,{type:'roomReady',ready:true},m=>m.state.onlineRoom.players.find(p=>p.id===a.data.id)?.ready);assert.notEqual(ra.state.onlineRoom.players[0].color,ra.state.onlineRoom.players[1].color);
  await command(b,{type:'roomReady',ready:true},m=>m.state.onlineRoom.players.every(p=>p.ready));
  assert.match((await command(b,{type:'roomStart'},()=>true,'error')).message,/host/);
  const selecting=await command(a,{type:'roomStart'},m=>m.state.onlineRoom.stage==='selecting');assert.equal(selecting.state.onlineRoom.started,false);const game=app.rooms.get('READYV2').game;
  await new Promise(r=>setTimeout(r,80));assert.equal(game.time,0);assert.equal(game.phase,'preparation');
  await command(a,{type:'roomChooseHero',hero:'orc'},m=>m.state.onlineRoom.players.find(p=>p.id===a.data.id)?.heroChosen);assert.equal(app.rooms.get('READYV2').started,false);
  const begun=next(a.ws,'state',m=>m.state.onlineRoom.started);await command(b,{type:'roomChooseHero',hero:'mage'},m=>m.state.onlineRoom.started);await begun;
  assert.equal(game.player(a.data.id).castleBuilderKey,'orc');assert.equal(game.player(b.data.id).castleBuilderKey,'mage');assert.equal(app.rooms.get('READYV2').stage,'playing');assert.equal(game.heroes().filter(u=>u.bot).length,1);
 }finally{await close(app,sockets);}
});

test('selection may be cancelled safely and readiness is invalidated by changed rules or membership',async()=>{
 const app=createGameServer({config:config()}),sockets=[];try{
  await app.listen();const a=await join(app,sockets,{type:'join',intent:'create',room:'BACKV2',options:{mode:'campaign'}});
  await command(a,{type:'roomReady',ready:true},m=>m.state.onlineRoom.players[0].ready);await command(a,{type:'roomStart'},m=>m.state.onlineRoom.stage==='selecting');
  const reset=await command(a,{type:'roomCancelSelection'},m=>m.state.onlineRoom.stage==='waiting');assert.equal(reset.state.onlineRoom.players[0].ready,false);
  await command(a,{type:'roomReady',ready:true},m=>m.state.onlineRoom.players[0].ready);await join(app,sockets,{type:'join',intent:'join',room:'BACKV2'});assert.equal(app.rooms.get('BACKV2').members.get(a.data.id).ready,false);
  await command(a,{type:'roomReady',ready:true},m=>m.state.onlineRoom.players.find(p=>p.id===a.data.id)?.ready);const changed=await command(a,{type:'roomSettings',settings:{options:{mode:'bonk'}}},m=>m.state.options.mode==='bonk');assert.ok(changed.state.onlineRoom.players.every(p=>!p.ready));assert.equal(app.rooms.get('BACKV2').game.time,0);
 }finally{await close(app,sockets);}
});

test('a selected character and readiness survive verified reconnect and room checkpoint serialization',async()=>{
 const app=createGameServer({config:config()}),sockets=[];try{
  await app.listen();const a=await join(app,sockets,{type:'join',intent:'create',room:'RESUMEV2',options:{mode:'campaign'}}),b=await join(app,sockets,{type:'join',intent:'join',room:'RESUMEV2'});
  await command(a,{type:'roomReady',ready:true},m=>m.state.onlineRoom.players.find(p=>p.id===a.data.id)?.ready);await command(b,{type:'roomReady',ready:true},m=>m.state.onlineRoom.players.every(p=>p.ready));
  await command(a,{type:'roomStart'},m=>m.state.onlineRoom.stage==='selecting');await command(a,{type:'roomChooseHero',hero:'fenrir'},m=>m.state.onlineRoom.players.find(p=>p.id===a.data.id)?.heroChosen);
  const saved=app.store.load().find(([code])=>code==='RESUMEV2')[1];assert.equal(saved.stage,'selecting');assert.equal(saved.lobbyVersion,2);assert.equal(saved.members.get(a.data.id).ready,true);assert.equal(saved.members.get(a.data.id).heroChosen,true);
  const resumed=await join(app,sockets,{type:'resume',room:'RESUMEV2',id:a.data.id,token:a.data.resumeToken});assert.equal(resumed.data.state.onlineRoom.stage,'selecting');assert.equal(resumed.data.state.onlineRoom.players.find(p=>p.id===a.data.id).heroChosen,true);assert.equal(app.rooms.get('RESUMEV2').game.player(a.data.id).hero,'fenrir');
  await command(b,{type:'roomChooseHero',hero:'mage'},m=>m.state.onlineRoom.started);assert.equal(app.rooms.get('RESUMEV2').stage,'playing');
 }finally{await close(app,sockets);}
});

test('two Tower clients preserve class-only merchant identities through account restore and reconnect',async()=>{
 const app=createGameServer({config:config()}),sockets=[];try{
  await app.listen();const base='http://127.0.0.1:'+app.server.address().port+'/api/ragnarok/';
  const created=await(await fetch(base+'account/create',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).json();
  let progress=null;for(const lineage of ['imperialguard','meister']){const g=new Game(16,{mode:'bonk',bonkLineage:lineage});g.addPlayer('save','knight');g.player('save').level=8;progress=saveRoCharacter(progress,{id:lineage,name:lineage,lineage,checkpoint:createRoCheckpoint(g),updatedAt:1});}
  const saved=await fetch(base+'progress',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+created.token},body:JSON.stringify({checkpoint:progress})});assert.equal(saved.status,200);
  const a=await join(app,sockets,{type:'join',intent:'create',room:'ROCLASS',options:{mode:'bonk',bonkActivity:'tower',bonkSkillMode:'class'},features:['ro-skill-library-v1']}),b=await join(app,sockets,{type:'join',intent:'join',room:'ROCLASS'});
  await command(a,{type:'roomReady',ready:true},m=>m.state.onlineRoom.players.find(p=>p.id===a.data.id)?.ready);await command(b,{type:'roomReady',ready:true},m=>m.state.onlineRoom.players.every(p=>p.ready));await command(a,{type:'roomStart'},m=>m.state.onlineRoom.stage==='selecting');
  const denied=await command(a,{type:'roomChooseHero',hero:'meister',ragnarok:{token:created.token,characterId:'imperialguard',activity:'tower'}},()=>true,'error');assert.match(denied.message,/classe escolhida/);assert.equal(app.rooms.get('ROCLASS').members.get(a.data.id).heroChosen,false);
  await command(a,{type:'roomChooseHero',hero:'meister',ragnarok:{token:created.token,characterId:'meister',activity:'tower'}},m=>m.state.onlineRoom.players.find(p=>p.id===a.data.id)?.heroChosen);
  await command(b,{type:'roomChooseHero',hero:'biolo'},m=>m.state.onlineRoom.started);
  const room=app.rooms.get('ROCLASS'),u=room.game.player(a.data.id),v=room.game.player(b.data.id);assert.equal(u.roLineage,'meister');assert.equal(v.roLineage,'biolo');assert.equal(u.level,8,'a matching character retains progression');assert.equal(room.game.bonk.activity,'tower');
  for(const player of [u,v]){assert.equal(player.roSkillMode,'class');assert.ok(!roSkillOfferPool(player).some(c=>['sm_endure','sm_movingrecovery'].includes(c.key)));}
  u.roSkillMode='mixed';app.store.save(room.code,room);const restored=app.store.load().find(([code])=>code===room.code)[1];assert.equal(restored.game.player(a.data.id).roSkillMode,'class','persisted room rules repair an old unit policy');
  const resumed=await join(app,sockets,{type:'resume',room:room.code,id:a.data.id,token:a.data.resumeToken,features:['ro-skill-library-v1']});const mine=resumed.data.state.units.find(unit=>unit.owner===a.data.id);assert.equal(mine.roLineage,'meister');assert.equal(mine.roSkillMode,'class');assert.match(resumed.data.state.bonk.skillCatalogKey,/meister/);assert.ok(!roSkillOfferPool(room.game.player(a.data.id)).some(c=>c.key==='sm_movingrecovery'));
 }finally{await close(app,sockets);}
});
