import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {WebSocket} from 'ws';

test('four real room clients share two fields and cannot send troops to a teammate', {timeout:18000},async()=>{
 const server=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:'2583'},stdio:['ignore','pipe','pipe']}),sockets=[];
 const message=(ws,predicate)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>{ws.off('message',on);reject(Error('No authoritative team state'));},9000);function on(data){const m=JSON.parse(data);if(predicate(m)){clearTimeout(timer);ws.off('message',on);resolve(m);}}ws.on('message',on);});
 try{
  await Promise.race([once(server.stdout,'data'),new Promise((_,reject)=>setTimeout(()=>reject(Error('Server startup timeout')),5000))]);
  async function join(hero){const ws=new WebSocket('ws://127.0.0.1:2583');sockets.push(ws);await once(ws,'open');const done=message(ws,m=>m.type==='joined');ws.send(JSON.stringify({type:'join',room:'FJORDTEAMS',hero,name:hero,options:{mode:'linewars',lineTeams:true}}));return{ws,...await done};}
  const a=await join('knight'),b=await join('ranger'),c=await join('mage'),d=await join('owl'),started=message(a.ws,m=>m.type==='state'&&m.state.lineWars);
  for(const p of [a,b,c,d])p.ws.send(JSON.stringify({type:'command',command:{type:'ready'}}));
  const s=(await started).state,hero=id=>s.units.find(u=>u.id===s.players[id]);assert.equal(s.options.lineTeams,true);assert.equal(s.cells.length,2);assert.equal(hero(a.id).cell.x,hero(b.id).cell.x);assert.notEqual(hero(a.id).cell.x,hero(c.id).cell.x);assert.equal(hero(c.id).cell.x,hero(d.id).cell.x);assert.equal(s.lineWars.teams.length,2);assert.equal(s.teamStock[1].mask,1);assert.equal(s.teamStock[2].mask,1);
  const rejected=message(a.ws,m=>m.type==='rejected');a.ws.send(JSON.stringify({type:'command',command:{type:'queueLineUnit',unitKey:'shieldling',target:b.id}}));await rejected;
  const sent=message(a.ws,m=>m.type==='state'&&m.state.lineWars.lanes.find(l=>l.owner===a.id).sent===1);a.ws.send(JSON.stringify({type:'command',command:{type:'queueLineUnit',unitKey:'shieldling',target:c.id}}));const after=(await sent).state,creep=after.units.find(u=>u.lineCreep&&u.lineAttacker===a.id);assert.ok(creep);assert.equal(creep.lineLane,c.id);assert.equal(creep.lineRoute,'west');assert.equal(creep.team,hero(a.id).team);assert.equal(creep.cell.x,hero(c.id).cell.x);assert.equal(after.units.find(u=>u.id===after.players[a.id]).gold,1050);
 }finally{for(const ws of sockets)ws.terminate();server.kill();}
});
