import {RO_PROGRESS_BODY_MAX_BYTES} from '../shared/ro-account-limits.js';
import {Game} from '../shared/simulation.js';
import {createRoCheckpoint} from '../shared/ragnarok-save.js';
import {saveRoCharacter,deleteRoCharacter} from '../src/ragnarok-account-ui.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {handlerRagnarokRequest,validateRoAccountProgress} from '../server/ro-accounts.js';
import {migrateLocalPhaseDatabase} from '../server/local-phase-api.js';

function fixture({migrate=true}={}){const sqlite=new DatabaseSync(':memory:');if(migrate)sqlite.exec(readFileSync(new URL('../drizzle/0001_ro_accounts.sql',import.meta.url),'utf8').replaceAll('--> statement-breakpoint',''));let conflicts=0;
 const DB={prepare(sql){return{bind(...args){return{async first(){return sqlite.prepare(sql).get(...args)||null;},async run(){if(sql.startsWith('UPDATE ro_accounts')&&conflicts-->0)return{meta:{changes:0}};return{meta:{changes:Number(sqlite.prepare(sql).run(...args).changes)}};}};}};}};
 let stamp=100000,randomCalls=0;const settings={now:()=>stamp,random:()=>{randomCalls++;return 0;}};
 const request=(route,{method='POST',token,uid,body={},origin='https://game.example'}={})=>handlerRagnarokRequest(new Request('https://game.example/api/ragnarok/'+route,{method,headers:{'Content-Type':'application/json',Origin:origin,...(token?{Authorization:'Bearer '+token}:{}),...(uid?{'oai-authenticated-user-id':uid}:{})},...(method==='GET'?{}:{body:JSON.stringify(body)})}),{DB},settings);
 return{sqlite,DB,request,settings,advance:ms=>stamp+=ms,conflict:n=>conflicts=n,randomCalls:()=>randomCalls};
}
async function account(f){const result=await f.request('account/create');assert.equal(result.status,201);return result.json();}
test('Cloud RO account recovery stores a token hash, has no CORS bypass, validates authentication and fails closed without D1',async()=>{
 const f=fixture();try{const created=await account(f),row=f.sqlite.prepare('SELECT * FROM ro_accounts').get();assert.ok(created.token.startsWith('ro_'));assert.equal(row.token_hash.length,64);assert.ok(!JSON.stringify(row).includes(created.token));
  assert.deepEqual(created.account.cards,[]);assert.equal((await f.request('account',{method:'GET'})).status,401);assert.equal((await f.request('account',{method:'GET',token:created.token})).status,200);
  assert.equal((await f.request('account',{method:'GET',token:created.token,origin:'https://evil.example'})).status,403);
  assert.equal((await handlerRagnarokRequest(new Request('https://game.example/api/ragnarok/account'),{})).status,503);
  assert.equal(await handlerRagnarokRequest(new Request('https://game.example/'),{}),null);
 }finally{f.sqlite.close();}
});
test('Sites identity opens the same game account on another device without token rotation and isolates different users',async()=>{
 const f=fixture();try{
  const first=await f.request('account/create',{uid:'site-user-a'});assert.equal(first.status,201);const created=await first.json();assert.ok(created.token);assert.equal(created.account.siteLinked,true);const originalHash=f.sqlite.prepare('SELECT token_hash FROM ro_accounts WHERE id=?').get(created.account.id).token_hash;
  const otherDevice=await f.request('account/create',{uid:'site-user-a'});assert.equal(otherDevice.status,200);const recovered=await otherDevice.json();assert.equal(recovered.account.id,created.account.id);assert.equal(recovered.token,undefined);assert.equal(f.sqlite.prepare('SELECT token_hash FROM ro_accounts WHERE id=?').get(created.account.id).token_hash,originalHash);
  const current=await(await f.request('account',{method:'GET',uid:'site-user-a'})).json();assert.equal(current.account.id,created.account.id);
  const other=await(await f.request('account/create',{uid:'site-user-b'})).json();assert.notEqual(other.account.id,created.account.id);
  const run=await(await f.request('run',{uid:'site-user-a'})).json();await f.request('rewards',{uid:'site-user-a',body:{runId:run.runId,kills:[{id:1,visual:'poring'}]}});
  assert.deepEqual((await(await f.request('account',{method:'GET',uid:'site-user-a'})).json()).account.cards,['poring']);assert.deepEqual((await(await f.request('account',{method:'GET',uid:'site-user-b'})).json()).account.cards,[]);
 }finally{f.sqlite.close();}
});
test('A valid legacy recovery key binds an unclaimed Sites identity without losing cards and cannot move an existing identity',async()=>{
 const f=fixture();try{const legacy=await account(f),run=await(await f.request('run',{token:legacy.token})).json();await f.request('rewards',{token:legacy.token,body:{runId:run.runId,kills:[{id:1,visual:'poring'}]}});
  const adopted=await(await f.request('account',{method:'GET',token:legacy.token,uid:'site-user-legacy'})).json();assert.equal(adopted.account.siteLinked,true);assert.equal(adopted.account.id,legacy.account.id);assert.deepEqual(adopted.account.cards,['poring']);
  const phone=await(await f.request('account',{method:'GET',uid:'site-user-legacy'})).json();assert.equal(phone.account.id,legacy.account.id);assert.deepEqual(phone.account.cards,['poring']);
  const separate=await(await f.request('account/create',{uid:'site-user-other'})).json();const explicit=await(await f.request('account',{method:'GET',token:legacy.token,uid:'site-user-other'})).json();assert.equal(explicit.account.id,legacy.account.id,'Explicit recovery intentionally selects its account');
  assert.equal((await(await f.request('account',{method:'GET',uid:'site-user-other'})).json()).account.id,separate.account.id,'A recovery key cannot silently rebind the logged-in Sites user');
  assert.equal((await f.request('account',{method:'GET',token:legacy.token})).status,200,'Direct/self-hosted recovery fallback remains usable');
 }finally{f.sqlite.close();}
});
test('Concurrent first visits share one Sites identity row and return only the original recovery key',async()=>{
 const f=fixture();try{const replies=await Promise.all(Array.from({length:5},()=>f.request('account/create',{uid:'same-user'})));assert.equal(replies.filter(r=>r.status===201).length,1);assert.equal(replies.filter(r=>r.status===200).length,4);const records=await Promise.all(replies.map(r=>r.json()));assert.equal(new Set(records.map(r=>r.account.id)).size,1);assert.equal(records.filter(r=>r.token).length,1);assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM ro_accounts').get().n,1);
 }finally{f.sqlite.close();}
});
test('Requests never create migration-owned tables; a missing migration fails with 503',async()=>{
 const f=fixture({migrate:false});try{assert.equal((await f.request('account/create',{uid:'missing-schema'})).status,503);assert.equal(f.sqlite.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name='ro_accounts'").get().n,0);
 }finally{f.sqlite.close();}
});
test('Local preview applies tracked migrations before requests and preserves legacy preview accounts',()=>{
 const db=new DatabaseSync(':memory:');try{db.exec('CREATE TABLE ro_accounts(id TEXT PRIMARY KEY,token_hash TEXT UNIQUE NOT NULL,payload TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 0)');db.prepare('INSERT INTO ro_accounts(id,token_hash,payload) VALUES(?,?,?)').run('legacy','existing-hash',JSON.stringify({cards:['poring']}));migrateLocalPhaseDatabase(db);migrateLocalPhaseDatabase(db);
  assert.ok(db.prepare('PRAGMA table_info(ro_accounts)').all().some(c=>c.name==='site_user_id'));assert.equal(db.prepare('SELECT token_hash FROM ro_accounts WHERE id=?').get('legacy').token_hash,'existing-hash');assert.deepEqual(JSON.parse(db.prepare('SELECT payload FROM ro_accounts WHERE id=?').get('legacy').payload).cards,['poring']);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM local_preview_migrations').get().n,2);
  db.prepare('UPDATE ro_accounts SET site_user_id=? WHERE id=?').run('stable-user','legacy');assert.throws(()=>db.prepare('INSERT INTO ro_accounts(id,token_hash,site_user_id,payload) VALUES(?,?,?,?)').run('second','other-hash','stable-user','{}'),/UNIQUE/);
 }finally{db.close();}
});
test('Rewards are server-rolled, catalog-only, replay-safe and bounded by elapsed spawn credits',async()=>{
 const f=fixture();try{const {token}=await account(f),run=await(await f.request('run',{token})).json();
  let result=await f.request('rewards',{token,body:{runId:run.runId,kills:[{id:1,visual:'poring',boss:true}]}});assert.equal(result.status,200);assert.deepEqual((await result.json()).newCards,['poring']);assert.equal(f.randomCalls(),1);
  await f.request('rewards',{token,body:{runId:run.runId,kills:[{id:1,visual:'elderwillow'}]}});assert.equal(f.randomCalls(),1);
  const kills=Array.from({length:40},(_,i)=>({id:i+2,visual:'poring'}));await f.request('rewards',{token,body:{runId:run.runId,kills}});assert.equal(f.randomCalls(),6);
  f.advance(1000);await f.request('rewards',{token,body:{runId:run.runId,kills}});assert.equal(f.randomCalls(),9);
  result=await f.request('rewards',{token,body:{runId:run.runId,kills:[{id:200,visual:'__proto__'}]}});assert.equal(result.status,400);
  assert.equal((await f.request('rewards',{token,body:{runId:run.runId,kills:Array.from({length:41},(_,id)=>({id,visual:'poring'}))}})).status,400);
  f.advance(6*60*60*1000);assert.equal((await f.request('rewards',{token,body:{runId:run.runId,kills:[]}})).status,409);
 }finally{f.sqlite.close();}
});
test('Presets preserve unlocks, require compatible unlocked cards, reject forged unlocks and use D1 CAS retries',async()=>{
 const f=fixture();try{const {token}=await account(f),run=await(await f.request('run',{token})).json();await f.request('rewards',{token,body:{runId:run.runId,kills:[{id:1,visual:'poring'}]}});
  const valid={presets:[{id:'default',name:'Sorte',cards:{armor:'poring'}}],activePreset:'default',cards:['fabre']};f.conflict(2);
  const result=await f.request('presets',{token,body:valid});assert.equal(result.status,200);assert.deepEqual((await result.json()).account.cards,['poring']);
  assert.equal((await f.request('presets',{token,body:{...valid,presets:[{id:'default',name:'bad',cards:{weapon:'poring'}}]}})).status,400);
  assert.equal((await f.request('presets',{token,body:{...valid,presets:[{id:'default',name:'bad',cards:{weapon:'fabre'}}]}})).status,400);
  assert.equal((await f.request('presets',{token,body:{...valid,presets:Array.from({length:7},(_,id)=>({id:String(id),name:'n',cards:{}}))}})).status,400);
  f.conflict(8);assert.equal((await f.request('presets',{token,body:valid})).status,409);
 }finally{f.sqlite.close();}
});
test('Concurrent reward requests cannot double roll an enemy or lose distinct card unlocks',async()=>{
 const f=fixture();try{const {token}=await account(f),run=await(await f.request('run',{token})).json();
  const result=await Promise.all([f.request('rewards',{token,body:{runId:run.runId,kills:[{id:1,visual:'poring'}]}}),f.request('rewards',{token,body:{runId:run.runId,kills:[{id:2,visual:'elderwillow'}]}})]);assert.ok(result.every(r=>r.status===200));
  const current=await(await f.request('account',{method:'GET',token})).json();assert.deepEqual(current.account.cards.toSorted(),['elderwillow','poring']);
  await f.request('rewards',{token,body:{runId:run.runId,kills:[{id:1,visual:'poring'},{id:2,visual:'elderwillow'}]}});assert.equal((await(await f.request('account',{method:'GET',token})).json()).account.cards.length,2);
 }finally{f.sqlite.close();}
});
test('A reported boss flag cannot increase normal creature odds; true MVPs use their catalog card',async()=>{
 const f=fixture();try{const {token}=await account(f),run=await(await f.request('run',{token})).json();f.settings.random=()=>.0005;
  const result=await(await f.request('rewards',{token,body:{runId:run.runId,kills:[{id:1,visual:'poring',boss:true},{id:2,visual:'ifrit',boss:false},{id:3,visual:'tower_1957',boss:false}]}})).json();
  assert.deepEqual(result.newCards,['poring','ifrit','towercard_4451']);assert.deepEqual(result.account.cards,['poring','ifrit','towercard_4451']);
 }finally{f.sqlite.close();}
});
test('Tower reward credits cover a full 280-creature burst and its canonical spawn throughput without losing MVP receipts',async()=>{
 const f=fixture();try{const {token}=await account(f);assert.equal((await f.request('run',{token,body:{activity:'constructor'}})).status,400);const run=await(await f.request('run',{token,body:{activity:'tower'}})).json();let id=0,acknowledged=0;
  async function report(kills){for(let offset=0;offset<kills.length;offset+=40){const batch=kills.slice(offset,offset+40),reply=await f.request('rewards',{token,body:{runId:run.runId,kills:batch}});assert.equal(reply.status,200);const result=await reply.json();assert.deepEqual(result.acknowledgedIds,batch.map(k=>String(k.id)));acknowledged+=result.acknowledgedIds.length;}}
  await report(Array.from({length:280},()=>({id:++id,visual:'poring'})));
  const throttled=await(await f.request('rewards',{token,body:{runId:run.runId,kills:[{id:++id,visual:'poring'}]}})).json();assert.deepEqual(throttled.acknowledgedIds,[],'Credits remain bounded even for the Tower');
  for(let second=0;second<60;second++){f.advance(1000);await report(Array.from({length:53},(_,i)=>({id:++id,visual:i===52?'ifrit':'poring'})));}
  assert.equal(acknowledged,280+60*53);const current=await(await f.request('account',{method:'GET',token})).json();assert.ok(current.account.cards.includes('ifrit'));assert.ok(current.account.cards.includes('poring'));
 }finally{f.sqlite.close();}
});
test('Canonical progress rejects malformed data, strips client unlocks and obeys the body limit',async()=>{
 const progress={version:1,characters:[],selectedCharacter:null,cards:['poring'],presets:[{cards:{armor:'poring'}}]};
 const clean=validateRoAccountProgress(progress);assert.deepEqual(clean,{version:1,warehouse:{version:1,revision:0,items:[]},characters:[],selectedCharacter:null});
 assert.equal(validateRoAccountProgress({...progress,version:2}),null);
 assert.equal(validateRoAccountProgress({...progress,characters:[{id:'bad',lineage:'dragonknight',checkpoint:{hero:{value:Infinity}}}]}),null);
 const f=fixture();try{const {token}=await account(f);assert.equal((await f.request('progress',{token,body:{checkpoint:progress}})).status,200);const current=await(await f.request('account',{method:'GET',token})).json();assert.deepEqual(current.account.progress,clean);assert.deepEqual(current.account.cards,[]);
  assert.equal((await f.request('progress',{token,body:{checkpoint:{version:1}}})).status,400);
  assert.equal((await f.request('progress',{token,body:{checkpoint:{value:'x'.repeat(RO_PROGRESS_BODY_MAX_BYTES)}}})).status,413);
 }finally{f.sqlite.close();}
});

test('shared Kafra revisions reject stale or conflicting saves without overwriting the stored warehouse',async()=>{
 const f=fixture();try{const {token}=await account(f),progress={version:1,characters:[],selectedCharacter:null,warehouse:{version:1,revision:1,items:[{id:'kafra:gift',key:'knife',cards:[],refine:3,enchants:{damage:2}}]}};
  assert.equal((await f.request('progress',{token,body:{checkpoint:progress}})).status,200);
  for(const warehouse of [{version:1,revision:0,items:[]},{version:1,revision:1,items:[]}])assert.equal((await f.request('progress',{token,body:{checkpoint:{...progress,warehouse}}})).status,409);
  const current=await(await f.request('account',{method:'GET',token})).json();assert.equal(current.account.progress.warehouse.items[0].refine,3);assert.equal(current.account.progress.warehouse.items.length,1);
  assert.equal((await f.request('progress',{token,body:{checkpoint:{...progress,warehouse:{version:1,revision:2,items:[]}}}})).status,200);
 }finally{f.sqlite.close();}
});


test('character deletion survives stale and concurrent saves while retaining the shared warehouse and account cards',async()=>{
 const g=new Game(17,{mode:'bonk'});g.addPlayer('p','knight');const checkpoint=createRoCheckpoint(g),lineage=checkpoint.lineage;
 const original=saveRoCharacter(null,{id:'departed',name:'Old',lineage,checkpoint});original.warehouse={version:1,revision:1,items:[{id:'kafra:gift',key:'knife',cards:[],refine:3,enchants:{damage:2}}]};const removed=deleteRoCharacter(original,'departed');
 const f=fixture();try{const {token}=await account(f);assert.equal((await f.request('progress',{token,body:{checkpoint:original}})).status,200);f.conflict(1);assert.equal((await f.request('progress',{token,body:{checkpoint:removed}})).status,200);
  const stale=await f.request('progress',{token,body:{checkpoint:original}});assert.equal(stale.status,200);const current=(await stale.json()).account;assert.deepEqual(current.progress.characters,[]);assert.deepEqual(current.progress.deletedCharacters,['departed']);assert.deepEqual(current.progress.warehouse,original.warehouse);assert.deepEqual(current.cards,[]);
  assert.equal((await f.request('progress',{token,body:{checkpoint:{...removed,deletedCharacters:['../bad']}}})).status,400);
 }finally{f.sqlite.close();}
});


test('explicit character deletion is idempotent and retains a cloud character missing from an older device',async()=>{
 const g=new Game(17,{mode:'bonk'});g.addPlayer('p','knight');const checkpoint=createRoCheckpoint(g),lineage=checkpoint.lineage;let progress=saveRoCharacter(null,{id:'old',lineage,checkpoint});progress=saveRoCharacter(progress,{id:'new-cloud-character',lineage,checkpoint});
 const f=fixture();try{const {token}=await account(f);assert.equal((await f.request('progress',{token,body:{checkpoint:progress}})).status,200);for(let i=0;i<2;i++){const result=await f.request('characters/delete',{token,body:{id:'old'}});assert.equal(result.status,200);const state=(await result.json()).account;assert.deepEqual(state.progress.characters.map(c=>c.id),['new-cloud-character']);assert.deepEqual(state.progress.deletedCharacters,['old']);}assert.equal((await f.request('characters/delete',{token,body:{id:'../invalid'}})).status,400);
 }finally{f.sqlite.close();}
});
