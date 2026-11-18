import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {WebSocket} from 'ws';
import {once} from 'node:events';
import {ITEMS,itemUpgradePrice} from '../shared/catalog.js';
import {SHOPS} from '../shared/shops.js';
import {merchantPosition} from '../shared/instances.js';
test('two online clients compete for the last item using the authoritative stock',async()=>{
 const server=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:'2568'},stdio:['ignore','pipe','pipe']}),clients=[];let timeout;
 try{
  await Promise.race([once(server.stdout,'data'),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('Server timeout')),5000);})]);clearTimeout(timeout);
  async function connect(hero){const ws=new WebSocket('ws://127.0.0.1:2568');clients.push(ws);await once(ws,'open');const joined=new Promise(resolve=>ws.on('message',raw=>{const m=JSON.parse(raw);if(m.type==='joined')resolve(m);}));ws.send(JSON.stringify({type:'join',room:'TEST',hero,arena:'glacier'}));return{ws,joined:await joined};}
  const a=await connect('knight'),b=await connect('mage');
  const snapshot=()=>new Promise(resolve=>{const read=raw=>{const m=JSON.parse(raw);if(m.type==='state'){b.ws.off('message',read);resolve(m.state);}};b.ws.on('message',read);});
  const talk=async(client,npc)=>{client.ws.send(JSON.stringify({type:'command',command:{type:'interact',npc}}));let state;for(let i=0;i<80;i++){state=await snapshot();const hero=state.units.find(u=>u.owner===client.joined.id);if(hero?.shopInteraction===npc){const point=merchantPosition(hero,SHOPS[npc]);assert.ok(Math.hypot(hero.x-point.x,hero.z-point.z)<=point.range+.35,'online transactions must use the NPC in the hero own arena');return state;}}throw Error('Hero did not reach '+npc);};
  a.ws.send(JSON.stringify({type:'command',command:{type:'item',item:'mask',cost:0,npc:'equipment'}}));const remote=await snapshot();assert.equal(remote.stock.mask,1);assert.equal(remote.units.filter(u=>u.hero).reduce((n,p)=>n+p.gold,0),2200);
  await talk(a,'equipment');await talk(b,'equipment');
  a.ws.send(JSON.stringify({type:'command',command:{type:'item',item:'mask'}}));b.ws.send(JSON.stringify({type:'command',command:{type:'item',item:'mask'}}));
  let s;for(let i=0;i<10;i++){s=await snapshot();if(s.stock.mask===0)break;}
  assert.equal(s.arena,'glacier');assert.equal(s.stock.mask,0);const players=s.units.filter(u=>u.hero);assert.equal(players.length,2);assert.equal(Math.abs(players[1].cell.x-players[0].cell.x),56);assert.equal(players.flatMap(p=>p.inventory).filter(i=>i?.key==='mask').length,1);assert.equal(players.reduce((n,p)=>n+p.gold,0),2200-ITEMS.mask.cost);
  const owner=players.find(p=>p.inventory.some(i=>i?.key==='mask')),client=owner.owner===a.joined.id?a:b,slot=owner.inventory.findIndex(i=>i?.key==='mask');await talk(client,'smith');client.ws.send(JSON.stringify({type:'command',command:{type:'upgradeItem',slot,level:5,cost:0}}));for(let i=0;i<10;i++){s=await snapshot();if(s.units.find(p=>p.owner===owner.owner)?.inventory[slot]?.level===2)break;}const upgraded=s.units.find(p=>p.owner===owner.owner);assert.equal(upgraded.inventory[slot].level,2);assert.equal(upgraded.gold,1100-ITEMS.mask.cost-itemUpgradePrice('mask',1));assert.equal(s.stock.mask,0);
  const other=client===a?b:a;await talk(other,'equipment');other.ws.send(JSON.stringify({type:'command',command:{type:'item',item:'blade'}}));await talk(other,'enchanter');other.ws.send(JSON.stringify({type:'command',command:{type:'enchantItem',slot:0,enchantment:'fire',cost:0}}));for(let i=0;i<10;i++){s=await snapshot();if(s.units.find(p=>p.owner===other.joined.id)?.inventory[0]?.enchantment==='fire')break;}const enchanted=s.units.find(p=>p.owner===other.joined.id);assert.equal(enchanted.inventory[0].enchantment,'fire');assert.equal(enchanted.gold,1100-ITEMS.blade.cost-300);assert.equal(enchanted.enchantments.fire,1);
 }finally{clearTimeout(timeout);for(const c of clients)c.close();server.kill();}
});
test('four real clients form two complete parties and enter one authoritative war match',async()=>{
 const server=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:'2569'},stdio:['ignore','pipe','pipe']}),clients=[];let startup;
 const message=(ws,type)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>{ws.off('message',read);reject(Error('Timed out waiting for '+type));},5000);const read=raw=>{const m=JSON.parse(raw);if(m.type==='error'){clearTimeout(timer);ws.off('message',read);reject(Error(m.message));}else if(m.type===type){clearTimeout(timer);ws.off('message',read);resolve(m);}};ws.on('message',read);});
 try{await Promise.race([once(server.stdout,'data'),new Promise((_,reject)=>{startup=setTimeout(()=>reject(Error('Server timeout')),5000);})]);clearTimeout(startup);
  for(let i=0;i<4;i++){const ws=new WebSocket('ws://127.0.0.1:2569');clients.push(ws);await once(ws,'open');}
  const request=async(i,payload,type='party')=>{const pending=message(clients[i],type);clients[i].send(JSON.stringify(payload));return pending;};
  const a=await request(0,{type:'partyCreate',hero:'knight',teamSize:2,teamCount:2});await request(1,{type:'partyJoin',code:a.party.code,hero:'mage'});
  const b=await request(2,{type:'partyCreate',hero:'ranger',teamSize:2,teamCount:2});await request(3,{type:'partyJoin',code:b.party.code,hero:'owl'});
  const queued=await request(0,{type:'queue'});assert.equal(queued.party.queued,true);assert.equal(queued.party.waitingParties,1);
  const joined=clients.map(ws=>message(ws,'joined'));clients[2].send(JSON.stringify({type:'queue'}));const rooms=await Promise.all(joined);assert.equal(new Set(rooms.map(r=>r.room)).size,1);
  const snapshot=await message(clients[0],'state'),s=snapshot.state;assert.equal(s.options.mode,'war');assert.equal(s.units.filter(u=>u.hero).length,4);const hero=id=>s.units.find(u=>u.id===s.players[id]);assert.equal(hero(rooms[0].id).squad,hero(rooms[1].id).squad);assert.notEqual(hero(rooms[0].id).squad,hero(rooms[2].id).squad);
 }finally{clearTimeout(startup);for(const ws of clients)ws.close();server.kill();}
});
