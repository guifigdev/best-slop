import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {WebSocket} from 'ws';
import {Game} from '../shared/simulation.js';
import {MODES} from '../shared/modes.js';
import {createRoCheckpoint} from '../shared/ragnarok-save.js';
import {createGameServer} from '../server/game-server.js';
import {runtimeConfig} from '../server/runtime-config.js';

const config=()=>runtimeConfig({HOST:'127.0.0.1',PORT:'0',DRAIN_TIMEOUT_SECONDS:'0'});
function next(ws,type,predicate=()=>true){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{ws.off('message',read);reject(Error('Timeout: '+type));},6000);function read(raw){const m=JSON.parse(raw);if(m.type===type&&predicate(m)){clearTimeout(timer);ws.off('message',read);resolve(m);}}ws.on('message',read);});}
async function request(app,sockets,payload,type='joined'){
 const ws=new WebSocket('ws://127.0.0.1:'+app.server.address().port+'/ws');sockets.push(ws);await once(ws,'open');const result=next(ws,type);ws.send(JSON.stringify(payload));return {ws,data:await result};
}
async function close(app,sockets){for(const ws of sockets)ws.terminate();await new Promise(r=>setTimeout(r,15));app.close();await app.closed;}
const identities={bonk:'knight',phasekiller:'townsperson',kodotag:'runner',treetag:'ent',warlock:'warlock'};

test('every game admits a host and guests through password-protected rooms, never exposing passwords or hashes',async()=>{
 const app=createGameServer({config:config()}),sockets=[];try{
  await app.listen();
  for(const [i,mode]of Object.keys(MODES).entries()){
   const room='MODE'+i,hero=identities[mode]||'knight',options={mode};
   const a=await request(app,sockets,{type:'join',intent:'create',room,hero,options,password:'amigos-123'});
   assert.equal(a.data.state.onlineRoom.isHost,true,mode);assert.equal(a.data.state.onlineRoom.protected,true,mode);
   const lookup=await(await fetch('http://127.0.0.1:'+app.server.address().port+'/api/rooms/'+room)).json();
   assert.equal(lookup.options.mode,mode);assert.equal(lookup.protected,true);assert.doesNotMatch(JSON.stringify(lookup),/passwordLock|tokenHash|amigos-123/);
   const wrong=await request(app,sockets,{type:'join',intent:'join',room,hero,options,password:'wrong'},'error');assert.match(wrong.data.message,/Senha/,mode);
   const b=await request(app,sockets,{type:'join',intent:'join',room,hero,options:{mode:'campaign'},password:'amigos-123'});
   assert.equal(b.data.state.onlineRoom.players.length,2,mode);assert.equal(b.data.state.onlineRoom.isHost,false,mode);
   assert.equal(b.data.state.options.mode,mode,'the host alone selects the game');
   assert.doesNotMatch(JSON.stringify(b.data),/amigos-123|passwordLock|tokenHash/);
   const saved=app.store.load().find(([code])=>code===room)[1];assert.ok(saved.passwordLock?.hash);assert.notEqual(saved.passwordLock.hash,'amigos-123');
  }
 }finally{await close(app,sockets);}
});

test('Ragnarok co-op keeps the lobby paused, classes and offers personal, commands owned, and map delivery compact',async()=>{
 const app=createGameServer({config:config()}),sockets=[];try{
  await app.listen();const a=await request(app,sockets,{type:'join',intent:'create',room:'RAGCOOP',options:{mode:'bonk',bonkWorld:'dominion',bonkDebug:true},ragnarok:{lineage:'dragonknight'},features:['static-world-v1']});
  const b=await request(app,sockets,{type:'join',intent:'join',room:'RAGCOOP',options:{mode:'bonk'},ragnarok:{lineage:'shadowcross'},features:['static-world-v1']});
  const room=app.rooms.get('RAGCOOP'),g=room.game,first=g.player(a.data.id),second=g.player(b.data.id);
  assert.equal(g.options.bonkDebug,undefined);assert.equal(first.roLineage,'dragonknight');assert.equal(second.roLineage,'shadowcross');
  await new Promise(r=>setTimeout(r,110));assert.equal(g.time,0);assert.equal(g.bonk.stage,'preparation');
  const denied=next(b.ws,'error');b.ws.send(JSON.stringify({type:'command',command:{type:'bkReady'}}));assert.match((await denied).message,/host/);
  const started=next(a.ws,'state',m=>m.state.onlineRoom.started);a.ws.send(JSON.stringify({type:'command',command:{type:'roomStart'}}));await started;
  const compact=await next(b.ws,'state',m=>!!m.state.worldStaticKey&&!Object.hasOwn(m.state.bonk,'map'));assert.ok(!Object.hasOwn(compact.state.bonk,'map'));assert.ok(!Object.hasOwn(compact.state,'obstacles'));
  assert.equal(g.phase,'wave');assert.equal(g.bonk.stage,'playing');assert.ok(g.units.some(u=>u.bonkEnemy));
  first.bonkMove={dx:1,dz:0};first.bonkMoveAt=g.bonk.elapsed;second.bonkMove={dx:-1,dz:0};second.bonkMoveAt=g.bonk.elapsed;
  g.bonk.pickups=[{id:g.id(),x:first.x,z:first.z,age:0,type:'xp',value:100}];g.tick(1/30);
  assert.ok(first.bonkOffer);assert.ok(second.bonkOffer);assert.equal(g.bonk.stage,'playing');
  const sa=g.snapshotFor(a.data.id),sb=g.snapshotFor(b.data.id);assert.equal(sa.units[0].owner,a.data.id);assert.equal(sb.units[0].owner,b.data.id);
  assert.equal(sa.bonk.lineage.key,'dragonknight');assert.equal(sb.bonk.lineage.key,'shadowcross');assert.notEqual(sa.bonk.offer.id,sb.bonk.offer.id);
  assert.equal(g.command(b.data.id,{type:'bkChoose',choiceId:first.bonkOffer.choices[0].id}),false);
  const level=second.level;assert.equal(g.command(a.data.id,{type:'bkChoose',choiceId:first.bonkOffer.choices[0].id}),true);assert.equal(second.level,level);assert.ok(second.bonkOffer);
  const time=g.time;g.tick(1/30);assert.ok(g.time>time);
  const rejected=next(b.ws,'error');b.ws.send(JSON.stringify({type:'command',command:{type:'bkRestore',checkpoint:createRoCheckpoint(g)}}));assert.match((await rejected).message,/conta/);
 }finally{await close(app,sockets);}
});

test('Ragnarok loads saved characters and card presets from the authenticated account, and guests cannot replace the host world',async()=>{
 const app=createGameServer({config:config()}),sockets=[];try{
  await app.listen();const base='http://127.0.0.1:'+app.server.address().port;
  const accounts=[];
  for(const [i,lineage]of ['dragonknight','shadowcross'].entries()){
   const result=await(await fetch(base+'/api/ragnarok/account/create',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).json();
   const seed=new Game(100+i,{mode:'bonk',bonkWorld:'dominion',bonkLineage:lineage});seed.addPlayer('p',i?'raccoon':'knight');seed.command('p',{type:'bkReady'});seed.player('p').level=30+i;
   const cp=createRoCheckpoint(seed),checkpoint={version:1,characters:[{id:'saved',name:'Saved',lineage,checkpoint:cp,updatedAt:Date.now()}],selectedCharacter:'saved'};
   const response=await fetch(base+'/api/ragnarok/progress',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+result.token},body:JSON.stringify({checkpoint})});assert.equal(response.status,200);accounts.push(result.token);
  }
  const a=await request(app,sockets,{type:'join',intent:'create',room:'SAVEDRAG',options:{mode:'bonk',bonkWorld:'dominion'},ragnarok:{token:accounts[0],characterId:'saved',activity:'adventure',resume:true}});
  const b=await request(app,sockets,{type:'join',intent:'join',room:'SAVEDRAG',options:{mode:'bonk'},ragnarok:{token:accounts[1],characterId:'saved',activity:'adventure',resume:true}});
  const g=app.rooms.get('SAVEDRAG').game;assert.equal(g.phase,'preparation');assert.equal(g.worldSeed,100);assert.equal(g.player(a.data.id).level,30);assert.equal(g.player(b.data.id).level,31);
  for(const token of accounts)assert.ok(!JSON.stringify(b.data).includes(token));
  assert.equal(g.player(b.data.id).roLineage,'shadowcross');
 }finally{await close(app,sockets);}
});

test('co-op projectiles credit their real owner, rewards reach both accounts, and a guest can lead the group through a cleared MVP gate',()=>{
 const g=new Game(71,{mode:'bonk',bonkWorld:'dominion'});g.bonkOnline=true;
 g.addPlayer('host','knight','Host',false,null,{lineage:'dragonknight'});g.addPlayer('guest','raccoon','Guest',false,null,{lineage:'shadowcross'});g.command('host',{type:'bkReady'});
 const a=g.player('host'),b=g.player('guest');g.units=g.units.filter(u=>u.bonkHero);g.bonk.map.obstacles=[];g.obstacles=[];g.bonk.spawnAt=1e9;
 for(const u of [a,b]){u.x=0;u.z=0;u.bonkSkillAuto=Object.fromEntries(Object.keys(u.bonkBuild.weapons).map(k=>[k,false]));}
 const target={id:g.id(),bonkEnemy:true,bonkBoss:true,ragnarokVisual:'mistress',dungeonSpecies:'poring',alive:true,hp:1,maxHp:1,armor:0,damage:0,speed:0,size:1,collisionRadius:.3,x:2,z:0,bonkNextAttack:1e9,bonkNextSpecial:1e9,bonkBurnUntil:0,bonkPoisonUntil:0};g.units.push(target);
 g.bonk.projectiles.push({id:g.id(),source:b.id,x:2,z:0,dx:0,dz:0,speed:0,remaining:10,travelled:0,damage:1000,element:'fire',hitIds:[],radius:0,pierce:1});
 g.tick(1/30);assert.equal(a.kills,0);assert.equal(b.kills,1);assert.equal(a.bonkRewardKills.length,1);assert.equal(b.bonkRewardKills.length,1);assert.equal(g.bonk.routeBossDefeated,true);assert.equal(g.bonk.stage,'playing');
 assert.equal(g.command('host',{type:'bkAcknowledgeRewards',ids:[String(target.id)]}),true);assert.equal(a.bonkRewardKills.length,0);assert.equal(b.bonkRewardKills.length,1);
 const beforeTravelJob=a.roJobLevel;const gate=g.bonk.exitGates.find(t=>t.open);b.x=gate.x+gate.direction.x*4;b.z=gate.z+gate.direction.z*4;g.tick(1/30);
 assert.equal(g.bonk.route.key,'payon-forest');assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<5);assert.equal(a.roTier,0);assert.equal(b.roTier,0);assert.equal(a.roJobLevel,beforeTravelJob,'region travel does not grant job levels');
});


test('host fills every game with bots alongside a real guest, removes bots, and preserves capacity',async()=>{
 const app=createGameServer({config:config()}),sockets=[];try{
  await app.listen();
  for(const [i,mode]of Object.keys(MODES).entries()){
   const code='BOT'+i,hero=identities[mode]||'knight';
   const a=await request(app,sockets,{type:'join',intent:'create',room:code,hero,options:{mode}});
   const b=await request(app,sockets,{type:'join',intent:'join',room:code,hero});
   const no=next(b.ws,'error');b.ws.send(JSON.stringify({type:'command',command:{type:'roomBots',fill:true}}));assert.match((await no).message,/host/);
   const filled=next(a.ws,'state',m=>m.state.onlineRoom.players.some(p=>p.bot));a.ws.send(JSON.stringify({type:'command',command:{type:'roomBots',fill:true}}));const room=(await filled).state.onlineRoom;
   assert.equal(room.players.length,room.capacity,mode);assert.equal(room.players.filter(p=>!p.bot).length,2);assert.ok(room.players.filter(p=>p.bot).every(p=>p.connected));
   const removed=next(a.ws,'state',m=>m.state.onlineRoom.players.length===room.capacity-1);a.ws.send(JSON.stringify({type:'command',command:{type:'roomKick',playerId:room.players.find(p=>p.bot).id}}));await removed;
   const refill=next(a.ws,'state',m=>m.state.onlineRoom.players.length===room.capacity);a.ws.send(JSON.stringify({type:'command',command:{type:'roomBots',count:1}}));await refill;
   const seats=app.rooms.get(code).game.heroes().map(u=>u.seat);assert.equal(new Set(seats).size,seats.length);
   const stored=app.store.load().find(([c])=>c===code)[1];assert.equal([...stored.members.values()].filter(m=>m.bot).length,room.capacity-2);
  }
 }finally{await close(app,sockets);}
});

test('online players confirm independent characters after entering, and only the host starts the selected Castle Fight',async()=>{
 const app=createGameServer({config:config()}),sockets=[];try{
  await app.listen();const a=await request(app,sockets,{type:'join',intent:'create',room:'CASTLEQA',hero:'knight',chooseHeroInRoom:true,options:{game:'castlefight',mode:'castlefight'}});
  const b=await request(app,sockets,{type:'join',intent:'join',room:'CASTLEQA',hero:'knight',chooseHeroInRoom:true});
  assert.equal(a.data.state.options.mode,'castlefight');
  const waiting=next(a.ws,'error');a.ws.send(JSON.stringify({type:'command',command:{type:'roomStart'}}));assert.match((await waiting).message,/personagem/);
  const changed=next(a.ws,'state',m=>m.state.onlineRoom.players.find(p=>p.id===a.data.id)?.heroChosen);a.ws.send(JSON.stringify({type:'command',command:{type:'roomChooseHero',hero:'mage'}}));await changed;
  const second=next(b.ws,'state',m=>m.state.onlineRoom.players.every(p=>p.heroChosen));b.ws.send(JSON.stringify({type:'command',command:{type:'roomChooseHero',hero:'raccoon'}}));await second;
  const g=app.rooms.get('CASTLEQA').game;assert.equal(g.player(a.data.id).castleBuilderKey,'mage');assert.equal(g.player(b.data.id).castleBuilderKey,'raccoon');assert.equal(g.heroes().length,2);
  const no=next(b.ws,'error');b.ws.send(JSON.stringify({type:'command',command:{type:'ready'}}));assert.match((await no).message,/host/);
  const begun=next(a.ws,'state',m=>m.state.onlineRoom.started);a.ws.send(JSON.stringify({type:'command',command:{type:'roomStart'}}));const state=(await begun).state;assert.equal(state.options.mode,'castlefight');
  const locked=next(a.ws,'error');a.ws.send(JSON.stringify({type:'command',command:{type:'roomChooseHero',hero:'knight'}}));assert.match((await locked).message,/antes/);
 }finally{await close(app,sockets);}
});
