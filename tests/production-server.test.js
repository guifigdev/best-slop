import test from 'node:test';
import assert from 'node:assert/strict';
import {WebSocket} from 'ws';
import {once} from 'node:events';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createGameServer} from '../server/game-server.js';
import {runtimeConfig} from '../server/runtime-config.js';
function message(ws,type){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{ws.off('message',read);reject(Error('No '+type));},5000);function read(data){const m=JSON.parse(data);if(m.type===type){clearTimeout(timer);ws.off('message',read);resolve(m);}}ws.on('message',read);});}
async function connect(app,payload){const ws=new WebSocket('ws://127.0.0.1:'+app.server.address().port+'/ws');await once(ws,'open');const done=message(ws,'joined');ws.send(JSON.stringify(payload));return{ws,data:await done};}
const cfg=extra=>runtimeConfig({HOST:'127.0.0.1',PORT:'0',DRAIN_TIMEOUT_SECONDS:'0',...extra});
test('VPS room host authority, private capability reconnect, checkpoint restart and public config are real',async()=>{
 const directory=mkdtempSync(path.join(tmpdir(),'custom-hero-room-test-')),config=cfg({DATA_DIR:directory});let app=createGameServer({config}),a,b;
 try{await app.listen();a=await connect(app,{type:'join',room:'PERSIST',hero:'fenrir',name:'Ana'});b=await connect(app,{type:'join',room:'PERSIST',hero:'mage',name:'Beto'});assert.equal(a.data.state.onlineRoom.isHost,true);assert.equal(b.data.state.onlineRoom.isHost,false);assert.ok(a.data.resumeToken);assert.ok(!JSON.stringify(b.data.state).includes(a.data.resumeToken));
  const denied=message(b.ws,'error');b.ws.send(JSON.stringify({type:'command',command:{type:'roomStart'}}));assert.match((await denied).message,/host/);
  const room=app.rooms.get('PERSIST'),hero=room.game.player(a.data.id);hero.gold=1777;
  const earlier=Date.now()-300000;room.members.get(b.data.id).disconnectedAt=earlier;app.store.save('PERSIST',room);assert.equal(app.store.load().find(([code])=>code==='PERSIST')[1].members.get(b.data.id).disconnectedAt,earlier);room.members.get(b.data.id).disconnectedAt=null;
  app.store.save('PERSIST',room);const originalId=a.data.id,token=a.data.resumeToken;
  a.ws.terminate();b.ws.terminate();await new Promise(r=>setTimeout(r,30));app.close();await app.closed;
  app=createGameServer({config});await app.listen();a=await connect(app,{type:'resume',room:'PERSIST',id:originalId,token});assert.equal(a.data.id,originalId);assert.equal(a.data.state.units.find(u=>u.owner===originalId).gold,1777);assert.equal(Object.keys(a.data.state.players).length,2);
  const base='http://127.0.0.1:'+app.server.address().port,publicConfig=await(await fetch(base+'/api/config')).json();assert.equal(publicConfig.hosting,'vps');assert.equal(publicConfig.features.online.status,'ready');assert.equal(publicConfig.features.checkpoints.status,'ready');assert.ok(!JSON.stringify(publicConfig).includes(token));assert.equal((await fetch(base+'/healthz')).status,200);
 }finally{a?.ws.terminate();b?.ws.terminate();await new Promise(r=>setTimeout(r,20));app.close();await app.closed;const resolved=path.resolve(directory);assert.ok(resolved.startsWith(path.resolve(tmpdir())+path.sep)&&path.basename(resolved).startsWith('custom-hero-room-test-'));rmSync(resolved,{recursive:true,force:true});}
});
test('Phase HTTP works on the same VPS and configured app origins do not disable foreign-origin rejection',async()=>{
 const app=createGameServer({config:cfg({PUBLIC_ORIGIN:'https://play.gfig.space',ALLOWED_ORIGINS:'capacitor://localhost'})});try{await app.listen();const base='http://127.0.0.1:'+app.server.address().port,post=origin=>fetch(base+'/api/phase/create',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({room:'CORSROOM',name:'Asta'})});const good=await post('capacitor://localhost');assert.equal(good.status,201);assert.equal(good.headers.get('Access-Control-Allow-Origin'),'capacitor://localhost');assert.equal((await post('https://evil.example')).status,403);const result=await good.json();assert.ok(result.token);assert.equal(result.state.options.mode,'phasekiller');}finally{app.close();await app.closed;}
});

test('resuming a live session keeps the replacement peer registered after the old socket closes',async()=>{
 const app=createGameServer({config:cfg({})});let first,replacement;
 try{
  await app.listen();first=await connect(app,{type:'join',room:'TAKEOVER',hero:'fenrir'});
  const closed=once(first.ws,'close');replacement=await connect(app,{type:'resume',room:'TAKEOVER',id:first.data.id,token:first.data.resumeToken});
  const [code]=await closed;assert.equal(code,4001);await new Promise(r=>setTimeout(r,30));
  assert.equal(app.peers.size,1);assert.equal(app.peers.get(first.data.id),app.rooms.get('TAKEOVER').clients.get(first.data.id));
  assert.equal(app.rooms.get('TAKEOVER').clients.size,1);assert.equal(app.rooms.get('TAKEOVER').game.player(first.data.id).bot,false);
  const chat=message(replacement.ws,'roomChat');replacement.ws.send(JSON.stringify({type:'command',command:{type:'roomChat',text:'Ainda conectado'}}));assert.equal((await chat).messages.at(-1).text,'Ainda conectado');
 }finally{first?.ws.terminate();replacement?.ws.terminate();await new Promise(r=>setTimeout(r,20));app.close();await app.closed;}
});

test('the last connected player leaving preserves a disconnected friend who can still resume',async()=>{
 const app=createGameServer({config:cfg({})});let a,b,returned;
 try{
  await app.listen();a=await connect(app,{type:'join',room:'FRIENDS',hero:'fenrir'});b=await connect(app,{type:'join',room:'FRIENDS',hero:'mage'});
  a.ws.terminate();await new Promise(r=>setTimeout(r,25));const closed=once(b.ws,'close');b.ws.send(JSON.stringify({type:'leave'}));await closed;await new Promise(r=>setTimeout(r,25));
  assert.ok(app.rooms.has('FRIENDS'));assert.equal(app.rooms.get('FRIENDS').paused,true);
  returned=await connect(app,{type:'resume',room:'FRIENDS',id:a.data.id,token:a.data.resumeToken});assert.equal(returned.data.id,a.data.id);
 }finally{a?.ws.terminate();b?.ws.terminate();returned?.ws.terminate();await new Promise(r=>setTimeout(r,20));app.close();await app.closed;}
});

test('host start does not lock an incomplete native lobby, and native ready starts its simulation',async()=>{
 for(const [mode,hero,guest,ready] of [['castlefight','knight','mage','ready'],['treetag','ent','blaze','ttReady'],['warlock','warlock','heretic','wlReady']]){
  const app=createGameServer({config:cfg({})});let a,b;
  try{
   await app.listen();a=await connect(app,{type:'join',room:'NATIVE',hero,options:{mode}});
   const denied=message(a.ws,'error');a.ws.send(JSON.stringify({type:'command',command:{type:'roomStart'}}));assert.match((await denied).message,/jogador|Ent|Infernal/);assert.equal(app.rooms.get('NATIVE').started,false);
   b=await connect(app,{type:'join',room:'NATIVE',hero:guest});
   a.ws.send(JSON.stringify({type:'command',command:{type:ready}}));b.ws.send(JSON.stringify({type:'command',command:{type:ready}}));await new Promise(r=>setTimeout(r,130));
   const room=app.rooms.get('NATIVE');assert.equal(room.started,true,mode);assert.equal(room.game.phase,'wave',mode);const previous=room.game.time;await new Promise(r=>setTimeout(r,80));assert.ok(room.game.time>previous,mode);
  }finally{a?.ws.terminate();b?.ws.terminate();await new Promise(r=>setTimeout(r,20));app.close();await app.closed;}
 }
});

test('host can start a solo dungeon through its native ready command',async()=>{
 const app=createGameServer({config:cfg({})});let a;
 try{await app.listen();a=await connect(app,{type:'join',room:'DUNGEON',hero:'fenrir',options:{mode:'dungeon',dungeonPartySize:1}});a.ws.send(JSON.stringify({type:'command',command:{type:'roomStart'}}));await new Promise(r=>setTimeout(r,120));const room=app.rooms.get('DUNGEON');assert.equal(room.started,true);assert.equal(room.game.dungeon.floor,1);assert.equal(room.game.phase,'wave');}finally{a?.ws.terminate();await new Promise(r=>setTimeout(r,20));app.close();await app.closed;}
});
