import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {WebSocket} from 'ws';
import {once} from 'node:events';
test('two browser clients share server state and cannot buy without server validation',async()=>{
 const processServer=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:'2568'},stdio:['ignore','pipe','pipe']});
 const clients=[];
 try{
  await Promise.race([once(processServer.stdout,'data'),new Promise((_,reject)=>setTimeout(()=>reject(Error('Server startup timed out')),5000))]);
  async function connect(hero){const ws=new WebSocket('ws://127.0.0.1:2568');clients.push(ws);await once(ws,'open');const joined=new Promise(resolve=>ws.on('message',raw=>{const m=JSON.parse(raw);if(m.type==='joined')resolve(m);}));ws.send(JSON.stringify({type:'join',room:'TEST',hero}));return{ws,joined:await joined};}
  const a=await connect('knight'),b=await connect('mage');
  const snapshot=()=>new Promise(resolve=>b.ws.once('message',raw=>resolve(JSON.parse(raw).state)));
  let s=await snapshot();assert.equal(Object.keys(s.players).length,2);
  a.ws.send(JSON.stringify({type:'command',command:{type:'buy',skill:'heal'}}));
  for(let i=0;i<10;i++){s=await snapshot();if(s.units.find(u=>u.id===s.players[a.joined.id]).skills.includes('heal'))break;}
  const p=s.units.find(u=>u.id===s.players[a.joined.id]);assert.equal(p.gold,500);assert.ok(p.skills.includes('heal'));
  a.ws.send(JSON.stringify({type:'command',command:{type:'buy',skill:'heal'}}));s=await snapshot();assert.equal(s.units.find(u=>u.id===p.id).gold,500);
 }finally{for(const ws of clients)ws.close();processServer.kill();}
});
