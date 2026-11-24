import test from 'node:test';
import assert from 'node:assert/strict';
import {WebSocket} from 'ws';
import {once} from 'node:events';
import {createGameServer} from '../server/game-server.js';
import {runtimeConfig} from '../server/runtime-config.js';
const message=(ws,predicate)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>{ws.off('message',read);reject(Error('Network acknowledgement timed out'));},5000);function read(raw){const m=JSON.parse(raw);if(predicate(m)){clearTimeout(timer);ws.off('message',read);resolve(m);}}ws.on('message',read);});
test('negotiated commands are acknowledged once, rejected actions drain prediction, legacy clients remain compatible',async()=>{
 const app=createGameServer({config:runtimeConfig({HOST:'127.0.0.1',PORT:'0',DRAIN_TIMEOUT_SECONDS:'0'})}),clients=[];
 try{await app.listen();async function connect(features){const ws=new WebSocket('ws://127.0.0.1:'+app.server.address().port+'/ws');clients.push(ws);await once(ws,'open');const pending=message(ws,m=>m.type==='joined');ws.send(JSON.stringify({type:'join',room:'REPLAY',hero:'knight',features}));return{ws,data:await pending};}
  const a=await connect(['movement-rollback-v1']),b=await connect([]);assert.equal(a.data.state.network.ack,0);assert.equal(b.data.state.network,undefined);const hero=app.rooms.get('REPLAY').game.player(a.data.id),before=hero.attributes.str;
  const ack=message(a.ws,m=>m.type==='state'&&m.state.network?.ack===1),payload=JSON.stringify({type:'command',sequence:1,command:{type:'attribute',attribute:'str'}});a.ws.send(payload);a.ws.send(payload);await ack;assert.equal(hero.attributes.str,before+1,'duplicate sequence cannot purchase twice');
  const drained=message(a.ws,m=>m.type==='state'&&m.state.network?.ack===2);a.ws.send(JSON.stringify({type:'command',sequence:2,command:{type:'item',item:'invalid'}}));await drained;assert.equal(hero.attributes.str,before+1);
  const oldHero=app.rooms.get('REPLAY').game.player(b.data.id),old=oldHero.attributes.str,updated=message(b.ws,m=>m.type==='state'&&m.state.units.find(u=>u.owner===b.data.id)?.attributes.str===old+1);b.ws.send(JSON.stringify({type:'command',command:{type:'attribute',attribute:'str'}}));await updated;assert.equal(oldHero.attributes.str,old+1);
 }finally{for(const ws of clients)ws.terminate();app.close();await app.closed;}
});
