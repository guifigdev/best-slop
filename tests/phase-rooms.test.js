import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {createPhaseHandler,PHASE_ROOM_LIMITS} from '../server/phase-rooms.js';

// Executes the actual schema and handler SQL. The asynchronous adapter mimics
// D1 and can return stale reads deliberately to exercise optimistic retries.
class D1Sqlite{
 constructor(){this.db=new DatabaseSync(':memory:');this.db.exec(readFileSync(new URL('../drizzle/0000_phase_rooms.sql',import.meta.url),'utf8').replaceAll('--> statement-breakpoint',''));this.delayReads=false;this.conflicts=0;}
 prepare(sql){const self=this;return{bind(...args){return{async first(){const row=self.db.prepare(sql).get(...args);if(self.delayReads)await new Promise(resolve=>setTimeout(resolve,2));return row||null;},async run(){const result=self.db.prepare(sql).run(...args);if(sql.startsWith('UPDATE')&&!result.changes)self.conflicts++;return{meta:{changes:Number(result.changes)}};}};}};}
 room(code='ALDEIA'){const row=this.db.prepare('SELECT * FROM phase_rooms WHERE room_id = ?').get(code);return row?{...row,data:JSON.parse(row.data)}:null;}
 mutate(mutator,code='ALDEIA'){const row=this.room(code);mutator(row.data);this.db.prepare('UPDATE phase_rooms SET data = ? WHERE room_id = ?').run(JSON.stringify(row.data),code);}
 close(){this.db.close();}
}
function setup(t){const DB=new D1Sqlite();t.after(()=>DB.close());let now=100000;const handler=createPhaseHandler({clock:()=>now,cryptoProvider:webcrypto});
 const request=async(path,body,token,headers={})=>{const response=await handler(new Request('https://game.example'+path,{method:body===undefined?'GET':'POST',headers:{...(body!==undefined?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{}),...headers},...(body!==undefined?{body:JSON.stringify(body)}:{})}),{DB});return{status:response.status,headers:response.headers,body:await response.json()};};
 return{DB,handler,request,advance:ms=>now+=ms};}
async function pair(ctx){const a=await ctx.request('/api/phase/create',{room:'ALDEIA',name:'Ana'}),b=await ctx.request('/api/phase/join',{room:'aldeia',name:'Beto'});assert.equal(a.status,201);assert.equal(b.status,201);return{a:a.body,b:b.body};}
async function start(ctx,a,b){assert.equal((await ctx.request('/api/phase/ALDEIA/command',{command:{type:'pkReady'}},a.token)).body.accepted,true);assert.equal((await ctx.request('/api/phase/ALDEIA/command',{command:{type:'pkReady'}},b.token)).body.accepted,true);ctx.advance(750);ctx.DB.mutate(data=>{data.game.phaseKiller.assignAt=data.game.time+.1;});await ctx.request('/api/phase/ALDEIA',undefined,a.token);}

test('D1 migration, two-player HTTP lobby and capability authentication keep tokens out of shared state',async t=>{
 const ctx=setup(t),{a,b}=await pair(ctx);assert.notEqual(a.token,b.token);assert.notEqual(a.id,b.id);assert.equal(a.state.options.mode,'phasekiller');assert.equal(a.state.options.phaseTraining,false);assert.equal(a.state.phase,'preparation');
 const poll=await ctx.request('/api/phase/ALDEIA',undefined,a.token);assert.equal(poll.status,200);assert.equal(poll.body.id,a.id);assert.equal(poll.body.token,undefined);assert.equal(poll.body.state.units.length,2);assert.equal(poll.headers.get('Cache-Control'),'no-store, private');
 const serialized=JSON.stringify(poll.body),stored=JSON.stringify(ctx.DB.room().data);for(const token of [a.token,b.token]){assert.ok(!serialized.includes(token));assert.ok(!stored.includes(token));}assert.equal(ctx.DB.room().data.members[0].tokenHash.length,64);
 assert.equal((await ctx.request('/api/phase/ALDEIA')).status,401);assert.equal((await ctx.request('/api/phase/ALDEIA',undefined,webcrypto.randomUUID())).status,401);assert.equal((await ctx.request('/api/phase/ALDEIA/command',{command:{type:'pkMove',x:1,z:1},owner:b.id},a.token)).body.accepted,false);
});

test('lobby waits for friends, then role assignment is hidden in each authenticated viewer snapshot',async t=>{
 const ctx=setup(t),created=await ctx.request('/api/phase/create',{room:'ALDEIA',name:'Ana'}),a=created.body;ctx.advance(60000);
 const alone=await ctx.request('/api/phase/ALDEIA/command',{command:{type:'pkReady'}},a.token);assert.equal(alone.body.accepted,false);assert.match(alone.body.message,/dois jogadores/);assert.equal(alone.body.state.time,0);assert.equal(alone.body.state.phase,'preparation');
 const b=(await ctx.request('/api/phase/join',{room:'ALDEIA',name:'Beto'})).body;await start(ctx,a,b);
 const data=ctx.DB.room().data;assert.equal(data.game.phaseKiller.stage,'hunt');assert.equal(data.game.units.filter(u=>u.pkRole==='killer').length,1);
 for(const viewer of [a,b]){ctx.advance(1000);const poll=await ctx.request('/api/phase/ALDEIA',undefined,viewer.token),mine=poll.body.state.units.find(u=>u.owner===viewer.id);assert.ok(['killer','phaser','townsfolk'].includes(mine.pkRole));assert.equal(poll.body.state.phaseKiller.yourRole,mine.pkRole);for(const other of poll.body.state.units.filter(u=>u.owner!==viewer.id)){assert.equal(other.pkRole,undefined);assert.deepEqual(other.inventory,[]);assert.equal(other.pkPower,undefined);}assert.ok(poll.body.state.phaseKiller.roster.every(u=>u.role===undefined));}
 assert.equal((await ctx.request('/api/phase/join',{room:'ALDEIA',name:'Late'})).status,409);
});

test('concurrent chat survives CAS conflicts, binds authors to tokens and retries idempotently',async t=>{
 const ctx=setup(t),{a,b}=await pair(ctx);await start(ctx,a,b);ctx.advance(1000);ctx.DB.delayReads=true;
 const results=await Promise.all([ctx.request('/api/phase/ALDEIA/command',{command:{type:'pkChat',text:'Eu vi um vulto.',owner:b.id,name:'Beto'},requestId:'chat_ana_01'},a.token),ctx.request('/api/phase/ALDEIA/command',{command:{type:'pkChat',text:'Estou na praça.'},requestId:'chat_beto_01'},b.token)]);
 assert.ok(results.every(r=>r.status===200&&r.body.accepted));assert.ok(ctx.DB.conflicts>0);const messages=ctx.DB.room().data.game.phaseKiller.messages;assert.ok(messages.some(m=>m.text==='Eu vi um vulto.'&&m.name==='Ana'));assert.ok(messages.some(m=>m.text==='Estou na praça.'&&m.name==='Beto'));
 ctx.advance(1000);const before=messages.length,retry=await ctx.request('/api/phase/ALDEIA/command',{command:{type:'pkChat',text:'Eu vi um vulto.'},requestId:'chat_ana_01'},a.token);assert.equal(retry.body.accepted,true);assert.equal(retry.body.duplicate,true);assert.equal(ctx.DB.room().data.game.phaseKiller.messages.length,before);
});

test('simulation advances in bounded real elapsed steps and canonical hydration preserves the match',async t=>{
 const ctx=setup(t),{a,b}=await pair(ctx);await start(ctx,a,b);const before=ctx.DB.room().data.game.time;ctx.advance(60000);const poll=await ctx.request('/api/phase/ALDEIA',undefined,a.token);assert.equal(poll.status,200);assert.ok(Math.abs(poll.body.state.time-before-PHASE_ROOM_LIMITS.maxCatchup)<1e-8);assert.equal(poll.body.state.options.mode,'phasekiller');assert.equal(poll.body.state.units.find(u=>u.owner===a.id).pkRole,ctx.DB.room().data.game.units.find(u=>u.owner===a.id).pkRole);
});

test('leave frees a lobby slot, substitutes a bot during play and removes an empty room',async t=>{
 const ctx=setup(t),{a,b}=await pair(ctx);assert.equal((await ctx.request('/api/phase/ALDEIA/leave',{},b.token)).body.left,true);assert.equal(ctx.DB.room().data.game.units.length,1);assert.equal((await ctx.request('/api/phase/ALDEIA',undefined,b.token)).status,401);
 const c=(await ctx.request('/api/phase/join',{room:'ALDEIA',name:'Caio'})).body;await start(ctx,a,c);assert.equal((await ctx.request('/api/phase/ALDEIA/leave',{},c.token)).body.left,true);assert.equal(ctx.DB.room().data.game.units.find(u=>u.owner===c.id).bot,true);assert.equal((await ctx.request('/api/phase/ALDEIA/leave',{},a.token)).body.left,true);assert.equal(ctx.DB.room(),null);
});

test('HTTP transport rejects foreign origins, malformed commands, oversize chat, overpolling and expired rooms',async t=>{
 const ctx=setup(t),{a}=await pair(ctx);assert.equal((await ctx.request('/api/phase/ALDEIA',undefined,a.token,{Origin:'https://attacker.example'})).status,403);assert.equal((await ctx.request('/api/phase/ALDEIA/command',{command:{type:'attribute',attribute:'str'}},a.token)).status,400);assert.equal((await ctx.request('/api/phase/ALDEIA/command',{command:{type:'pkChat',text:'a'.repeat(241)}},a.token)).status,400);
 for(let i=0;i<PHASE_ROOM_LIMITS.pollsPerSecond;i++)assert.equal((await ctx.request('/api/phase/ALDEIA',undefined,a.token)).status,200);assert.equal((await ctx.request('/api/phase/ALDEIA',undefined,a.token)).status,429);ctx.advance(PHASE_ROOM_LIMITS.ttlMs+1);assert.equal((await ctx.request('/api/phase/ALDEIA',undefined,a.token)).status,404);
 const missing=await ctx.handler(new Request('https://game.example/api/phase/create',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"name":"Ana"}'}),{});assert.equal(missing.status,503);assert.equal(await ctx.handler(new Request('https://game.example/asset.js'),{}),null);
});

test('concurrent joins retain every new player and the hard twelve-player cap is enforced',async t=>{
 const ctx=setup(t);await ctx.request('/api/phase/create',{room:'ALDEIA',name:'Host'});ctx.DB.delayReads=true;
 const joined=await Promise.all(Array.from({length:5},(_,i)=>ctx.request('/api/phase/join',{room:'ALDEIA',name:'Player '+i})));assert.ok(joined.every(r=>r.status===201));assert.equal(ctx.DB.room().data.members.length,6);assert.equal(ctx.DB.room().data.game.units.length,6);assert.ok(ctx.DB.conflicts>0);
 ctx.DB.delayReads=false;for(let i=6;i<12;i++)assert.equal((await ctx.request('/api/phase/join',{room:'ALDEIA',name:'Player '+i})).status,201);assert.equal((await ctx.request('/api/phase/join',{room:'ALDEIA',name:'Extra'})).status,409);assert.equal(ctx.DB.room().data.members.length,12);
});
