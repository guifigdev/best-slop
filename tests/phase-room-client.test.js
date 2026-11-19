import test from 'node:test';
import assert from 'node:assert/strict';
import {connectPhaseRoom} from '../src/phase-room-client.js';
const storage=()=>{const values=new Map();return{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};};
const response=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
const joined={room:'ALDEIA',id:'ana',token:'private-capability',revision:1,state:{time:0}};
const until=async check=>{for(let i=0;i<100;i++){if(check())return;await new Promise(r=>setTimeout(r,5));}assert.fail('transport callback did not arrive');};

test('guest transport joins or creates a room and sends tokens only in Authorization',async()=>{
 const calls=[],saved=storage();let client;
 try{client=await connectPhaseRoom({room:'aldeia',name:'Ana',storage:saved,interval:100000,fetcher:async(url,options)=>{calls.push([url,options]);if(url.endsWith('/join'))return response({message:'missing'},404);if(url.endsWith('/create'))return response(joined,201);return response({...joined,revision:2,accepted:true});}});
  assert.equal(client.room,'ALDEIA');client.send({type:'command',command:{type:'pkChat',text:'Olá'}});await until(()=>calls.length===3);
  assert.equal(calls[2][1].headers.Authorization,'Bearer private-capability');assert.ok(!calls[2][0].includes(joined.token));const body=JSON.parse(calls[2][1].body);assert.equal(body.command.text,'Olá');assert.match(body.requestId,/^[a-f0-9-]{36}$/);assert.ok(saved.getItem('phase-room-session:ALDEIA').includes(joined.token));
 }finally{client?.close();}
});

test('late poll never overwrites a newer command and rejected gameplay reaches the UI',async()=>{
 let resolvePoll,polled=false,command=false;const updates=[],errors=[];let client;
 try{client=await connectPhaseRoom({room:'ALDEIA',name:'Ana',storage:storage(),interval:10,onState:s=>updates.push(s.time),onError:e=>errors.push(e),fetcher:async(url,options)=>{
   if(url.endsWith('/join'))return response(joined,201);
   if(url.endsWith('/command')){command=true;return response({...joined,revision:3,state:{time:3},accepted:false,message:'Mana insuficiente.'});}
   polled=true;return new Promise(resolve=>resolvePoll=resolve);
  }});await until(()=>polled);client.send({type:'command',command:{type:'pkCast',skill:'A000'}});await until(()=>command&&updates.length);resolvePoll(response({...joined,revision:2,state:{time:2}}));await new Promise(r=>setTimeout(r,5));assert.deepEqual(updates,[3]);assert.deepEqual(errors,['Mana insuficiente.']);
 }finally{client?.close();}
});

test('saved guest token resumes its own viewer without joining twice',async()=>{
 const saved=storage();saved.setItem('phase-room-session:ALDEIA',JSON.stringify({id:'ana',token:joined.token}));const calls=[];const client=await connectPhaseRoom({room:'ALDEIA',name:'Ana',storage:saved,interval:100000,fetcher:async(url,options)=>{calls.push([url,options]);return response(joined);}});
 try{assert.equal(calls.length,1);assert.equal(calls[0][0],'/api/phase/ALDEIA');assert.equal(calls[0][1].headers.Authorization,'Bearer '+joined.token);assert.equal(client.id,'ana');}finally{client.close();}
});
