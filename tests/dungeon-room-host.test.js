import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {WebSocket} from 'ws';
import {createGameServer} from '../server/game-server.js';
import {runtimeConfig} from '../server/runtime-config.js';
function message(ws,type,predicate=()=>true){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{ws.off('message',read);reject(Error('No '+type));},3000);function read(raw){const m=JSON.parse(raw);if(m.type===type&&predicate(m)){clearTimeout(timer);ws.off('message',read);resolve(m);}}ws.on('message',read);});}
async function join(app,room,options,hero='knight'){const ws=new WebSocket('ws://127.0.0.1:'+app.server.address().port+'/ws');await once(ws,'open');const waiting=message(ws,'joined');ws.send(JSON.stringify({type:'join',room,hero,options}));return{ws,data:await waiting};}
const send=(peer,command)=>peer.ws.send(JSON.stringify({type:'command',command}));
async function error(peer,command,pattern){const pending=message(peer.ws,'error');send(peer,command);assert.match((await pending).message,pattern);}
const cfg=()=>runtimeConfig({HOST:'127.0.0.1',PORT:'0',DRAIN_TIMEOUT_SECONDS:'0'});
async function cleanup(app,peers){for(const p of peers)p?.ws.terminate();await new Promise(r=>setTimeout(r,20));app.close();await app.closed;}

test('Dungeon configuration and first floor remain under host authority and lobby time stays paused',async()=>{
 const app=createGameServer({config:cfg()}),peers=[];try{
  await app.listen();const host=await join(app,'COOPHOST',{mode:'dungeon',dungeonPartySize:4,dungeonTeams:1,dungeonPvp:false});peers.push(host);const guest=await join(app,'COOPHOST',undefined,'mage');peers.push(guest);const room=app.rooms.get('COOPHOST'),time=room.game.time,timer=room.game.timer;
  await new Promise(r=>setTimeout(r,140));assert.equal(room.game.time,time);assert.equal(room.game.timer,timer);assert.equal(room.game.dungeon.floor,0);
  await error(guest,{type:'dgReady'},/host/);await error(guest,{type:'ready'},/host/);await error(guest,{type:'roomSettings',settings:{capacity:2,dungeonLimit:50}},/host/);assert.equal(room.started,false);assert.equal(room.game.dungeon.floor,0);
  await error(host,{type:'roomSettings',settings:{capacity:1,dungeonLimit:50}},/menor/);assert.equal(room.game.options.dungeonPartySize,4);assert.equal(room.game.dungeon.limit,0);
  for(const settings of [{capacity:5},{capacity:2.5},{capacity:'2'},{dungeonLimit:100},{capacity:2,mode:'war'},{capacity:null}])await error(host,{type:'roomSettings',settings},/Escolha|inválida/);
  const updated=message(guest.ws,'state',m=>m.state.onlineRoom.capacity===2&&m.state.onlineRoom.options.dungeonLimit===50);send(host,{type:'roomSettings',settings:{capacity:2,dungeonLimit:50}});const state=(await updated).state;
  assert.equal(state.onlineRoom.isHost,false);assert.equal(state.options.dungeonPartySize,2);assert.equal(room.game.dungeon.limit,50);assert.equal(room.started,false);
  const stranger=new WebSocket('ws://127.0.0.1:'+app.server.address().port+'/ws');await once(stranger,'open');peers.push({ws:stranger});const denied=message(stranger,'error');stranger.send(JSON.stringify({type:'join',room:'COOPHOST',hero:'ranger'}));assert.match((await denied).message,/cheia/);
  const started=message(guest.ws,'state',m=>m.state.onlineRoom.started&&m.state.dungeon.floor===1);send(host,{type:'roomStart'});assert.equal((await started).state.dungeon.limit,50);assert.equal(room.game.phase,'wave');
  const previous=room.game.time;await new Promise(r=>setTimeout(r,90));assert.ok(room.game.time>previous);await error(host,{type:'roomSettings',settings:{capacity:4}},/antes/);
 }finally{await cleanup(app,peers);}
});

test('host starts with pending compact settings atomically while legacy Dungeon formats remain available through the API',async()=>{
 const app=createGameServer({config:cfg()}),peers=[];try{
  await app.listen();const host=await join(app,'SOLOHOST',{mode:'dungeon',dungeonPartySize:1,dungeonTeams:1});peers.push(host);
  await error(host,{type:'roomStart',settings:{capacity:0,dungeonLimit:50}},/Escolha/);assert.equal(app.rooms.get('SOLOHOST').started,false);
  const pending=message(host.ws,'state',m=>m.state.onlineRoom.started);send(host,{type:'roomStart',settings:{capacity:3,dungeonLimit:50}});const state=(await pending).state;assert.equal(state.onlineRoom.capacity,3);assert.equal(state.onlineRoom.options.dungeonLimit,50);assert.equal(state.dungeon.floor,1);
  const legacy=await join(app,'LEGACYDG',{mode:'dungeon',dungeonPartySize:2,dungeonTeams:4,dungeonPvp:true});peers.push(legacy);assert.equal(legacy.data.state.onlineRoom.capacity,8);assert.equal(legacy.data.state.options.dungeonPvp,true);assert.equal(legacy.data.state.options.dungeonTeams,4);
 }finally{await cleanup(app,peers);}
});
