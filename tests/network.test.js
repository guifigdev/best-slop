import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {WebSocket} from 'ws';
import {once} from 'node:events';
test('two online clients compete for the last item using the authoritative stock',async()=>{
 const server=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:'2568'},stdio:['ignore','pipe','pipe']}),clients=[];let timeout;
 try{
  await Promise.race([once(server.stdout,'data'),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('Server timeout')),5000);})]);clearTimeout(timeout);
  async function connect(hero){const ws=new WebSocket('ws://127.0.0.1:2568');clients.push(ws);await once(ws,'open');const joined=new Promise(resolve=>ws.on('message',raw=>{const m=JSON.parse(raw);if(m.type==='joined')resolve(m);}));ws.send(JSON.stringify({type:'join',room:'TEST',hero,arena:'glacier'}));return{ws,joined:await joined};}
  const a=await connect('knight'),b=await connect('mage');
  const snapshot=()=>new Promise(resolve=>{const read=raw=>{const m=JSON.parse(raw);if(m.type==='state'){b.ws.off('message',read);resolve(m.state);}};b.ws.on('message',read);});
  a.ws.send(JSON.stringify({type:'command',command:{type:'item',item:'mask'}}));b.ws.send(JSON.stringify({type:'command',command:{type:'item',item:'mask'}}));
  let s;for(let i=0;i<10;i++){s=await snapshot();if(s.stock.mask===0)break;}
  assert.equal(s.arena,'glacier');assert.equal(s.stock.mask,0);const players=s.units.filter(u=>u.hero);assert.equal(players.length,2);assert.equal(players.flatMap(p=>p.inventory).filter(i=>i?.key==='mask').length,1);assert.equal(players.reduce((n,p)=>n+p.gold,0),1550);
 }finally{clearTimeout(timeout);for(const c of clients)c.close();server.kill();}
});
