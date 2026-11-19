import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoomSocket} from '../src/room-socket.js';
class FakeSocket{static instances=[];constructor(url){this.url=url;this.readyState=0;this.sent=[];FakeSocket.instances.push(this);}send(value){this.sent.push(JSON.parse(value));}open(){this.readyState=1;this.onopen?.();}message(value){this.onmessage?.({data:JSON.stringify(value)});}close(code=1000){this.readyState=3;this.onclose?.({code});}}
const storage=()=>{const values=new Map();return{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};};
test('room client negotiates static worlds, restores omitted maps and reconnects after a long active run',async()=>{
 FakeSocket.instances=[];let now=0;const states=[],joined=[];const client=createRoomSocket({url:'ws://localhost/ws',payload:{type:'join',room:'TEST'},storage:storage(),WebSocketClass:FakeSocket,now:()=>now,onState:s=>states.push(s),onJoined:m=>joined.push(m)});
 try{const first=FakeSocket.instances[0];first.open();assert.ok(first.sent[0].features.includes('static-world-v1'));const map={tiles:[1,2]},obstacles=[{x:1}];first.message({type:'joined',id:'p',room:'TEST',resumeToken:'guest-capability',state:{worldStaticKey:'floor1',dungeon:{map},obstacles}});first.message({type:'state',state:{worldStaticKey:'floor1',dungeon:{floor:1}}});assert.deepEqual(states[0].dungeon.map,map);assert.deepEqual(states[0].obstacles,obstacles);
  now=3600000;first.close(1006);await new Promise(r=>setTimeout(r,550));assert.equal(FakeSocket.instances.length,2);const second=FakeSocket.instances[1];second.open();assert.equal(second.sent[0].type,'resume');assert.equal(second.sent[0].id,'p');assert.equal(second.sent[0].token,'guest-capability');second.message({type:'joined',id:'p',room:'TEST',state:{worldStaticKey:'floor2',dungeon:{map:{tiles:[3]}},obstacles:[]}});assert.equal(joined.length,2);assert.equal(client.readyState,1);
 }finally{client.close();}
});
test('a kicked or replaced session is not silently reconnected',async()=>{FakeSocket.instances=[];let closed=0;const client=createRoomSocket({url:'ws://localhost/ws',payload:{type:'join',room:'T'},storage:storage(),WebSocketClass:FakeSocket,onClose:()=>closed++});try{const s=FakeSocket.instances[0];s.open();s.message({type:'joined',id:'p',room:'T',resumeToken:'cap',state:{}});s.close(4003);await new Promise(r=>setTimeout(r,550));assert.equal(FakeSocket.instances.length,1);assert.equal(closed,1);}finally{client.close();}});

test('an expired resume after an active run closes the connection and clears the old capability',async()=>{
 FakeSocket.instances=[];let closed=0;const saved=storage(),errors=[],client=createRoomSocket({url:'ws://localhost/ws',payload:{type:'join',room:'TEST'},storage:saved,WebSocketClass:FakeSocket,onClose:()=>closed++,onError:e=>errors.push(e)});
 try{
  const first=FakeSocket.instances[0];first.open();first.message({type:'joined',id:'p',room:'TEST',resumeToken:'cap',state:{}});first.close(1006);
  await new Promise(r=>setTimeout(r,550));const second=FakeSocket.instances[1];second.open();assert.equal(second.sent[0].type,'resume');
  second.message({type:'error',message:'Sessão expirada. Entre em uma nova sala.'});
  assert.equal(client.readyState,3);assert.equal(closed,1);assert.equal(errors.length,1);assert.equal(saved.getItem('custom-hero-room:ws://localhost/ws:TEST'),undefined);
 }finally{client.close();}
});
