import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {WebSocket} from 'ws';

test('two real WebSocket defenders enter Line Wars and only their own buildings can spend gold and send troops', {timeout:15000},async()=>{
 const server=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:'2570'},stdio:['ignore','pipe','pipe']}),sockets=[];
 const message=(ws,predicate,timeout=7000)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>{ws.off('message',on);reject(new Error('Timed out waiting for authoritative Line Wars state'));},timeout);function on(data){const value=JSON.parse(data);if(predicate(value)){clearTimeout(timer);ws.off('message',on);resolve(value);}}ws.on('message',on);});
 try{
  await Promise.race([once(server.stdout,'data'),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Server did not start')),5000))]);
  async function join(hero){const ws=new WebSocket('ws://127.0.0.1:2570');sockets.push(ws);await once(ws,'open');const joined=message(ws,m=>m.type==='joined');ws.send(JSON.stringify({type:'join',room:'NORDICLINE',hero,name:hero,options:{mode:'linewars'}}));return{ws,...await joined};}
  const a=await join('knight'),b=await join('mage');const started=message(a.ws,m=>m.type==='state'&&m.state.lineWars);
  for(const client of [a,b])client.ws.send(JSON.stringify({type:'command',command:{type:'ready'}}));
  const state=(await started).state,heroA=state.units.find(u=>u.owner===a.id),heroB=state.units.find(u=>u.owner===b.id);assert.equal(state.options.game,'linewars');assert.ok(Math.abs(heroA.x-heroB.x)>40);assert.equal(state.lineWars.lanes.length,2);
  const foreign=state.lineWars.buildings.find(building=>building.owner===b.id),rejected=message(a.ws,m=>m.type==='rejected');a.ws.send(JSON.stringify({type:'command',command:{type:'sendLineUnit',building:foreign.id}}));await rejected;
  const own=state.lineWars.buildings.find(building=>building.owner===a.id),sent=message(a.ws,m=>m.type==='state'&&m.state.lineWars?.lanes.find(l=>l.owner===a.id).sent===1);a.ws.send(JSON.stringify({type:'command',command:{type:'sendLineUnit',building:own.id}}));const after=(await sent).state;
  assert.equal(after.units.find(u=>u.owner===a.id).gold,1050);assert.equal(after.lineWars.lanes.find(l=>l.owner===a.id).income,23);assert.ok(after.units.some(u=>u.lineCreep&&u.lineAttacker===a.id&&u.lineLane===b.id));
 }finally{for(const ws of sockets)ws.terminate();server.kill();}
});
