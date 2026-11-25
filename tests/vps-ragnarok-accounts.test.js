import {saveRoCharacter} from '../src/ragnarok-account-ui.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createGameServer} from '../server/game-server.js';
import {runtimeConfig} from '../server/runtime-config.js';
import {Game} from '../shared/simulation.js';
import {createRoCheckpoint} from '../shared/ragnarok-save.js';

const configFor=extra=>runtimeConfig({HOST:'127.0.0.1',PORT:'0',DRAIN_TIMEOUT_SECONDS:'0',...extra});
const baseFor=app=>'http://127.0.0.1:'+app.server.address().port;
async function request(app,route,{method='GET',token,origin,identity,body,raw}={}){
 return fetch(baseFor(app)+'/api/ragnarok/'+route,{method,headers:{...(body!==undefined||raw!==undefined?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{}),...(origin?{Origin:origin}:{}),...(identity?{'oai-authenticated-user-id':identity}:{})},...(raw!==undefined?{body:raw}:body!==undefined?{body:JSON.stringify(body)}:{})});
}
function progress(){const g=new Game(917,{mode:'bonk',bonkLineage:'archmage'});g.addPlayer('save','mage');g.command('save',{type:'bkReady'});const checkpoint=createRoCheckpoint(g);return{version:1,characters:[{id:'mage-test',name:'Brasa',lineage:'archmage',checkpoint,updatedAt:1}],selectedCharacter:'mage-test'};}
function removeFixture(directory){const resolved=path.resolve(directory);assert.ok(resolved.startsWith(path.resolve(tmpdir())+path.sep)&&path.basename(resolved).startsWith('custom-hero-vps-ro-'));rmSync(resolved,{recursive:true,force:true});}

test('VPS HTTP accounts save character progress in SQLite and recovery bearer survives a real server restart',async()=>{
 const directory=mkdtempSync(path.join(tmpdir(),'custom-hero-vps-ro-')),config=configFor({DATA_DIR:directory});let app=createGameServer({config});
 try{
  await app.listen();const createdResponse=await request(app,'account/create',{method:'POST',body:{}});assert.equal(createdResponse.status,201);assert.match(createdResponse.headers.get('content-type'),/application\/json/);assert.equal(createdResponse.headers.get('cache-control'),'no-store');assert.equal(createdResponse.headers.get('x-content-type-options'),'nosniff');const created=await createdResponse.json();assert.match(created.token,/^ro_[a-f0-9]{64}$/);assert.equal(created.account.siteLinked,false);
  assert.equal((await request(app,'account')).status,401);const first=await(await request(app,'account',{token:created.token})).json();assert.equal(first.account.id,created.account.id);
  const saved=await request(app,'progress',{method:'POST',token:created.token,body:{checkpoint:progress()}});assert.equal(saved.status,200);assert.equal((await saved.json()).account.progress.characters[0].name,'Brasa');
  const stored=app.store.db.prepare('SELECT token_hash,site_user_id,payload FROM ro_accounts WHERE id=?').get(created.account.id);assert.equal(stored.site_user_id,null);assert.match(stored.token_hash,/^[a-f0-9]{64}$/);assert.ok(!JSON.stringify(stored).includes(created.token));
  app.close();await app.closed;app=createGameServer({config});await app.listen();const recovered=await request(app,'account',{token:created.token});assert.equal(recovered.status,200);const account=(await recovered.json()).account;assert.equal(account.id,created.account.id);assert.equal(account.progress.selectedCharacter,'mage-test');assert.equal(account.progress.characters[0].checkpoint.hero.bonkBuild.weapons.fireball,1);assert.equal(app.store.db.prepare('SELECT COUNT(*) AS n FROM ro_accounts').get().n,1);
 }finally{app.close();await app.closed;removeFixture(directory);}
});

test('VPS never trusts a visitor-supplied Sites identity and only a valid recovery bearer selects an account',async()=>{
 const app=createGameServer({config:configFor({})});
 try{
  await app.listen();const a=await(await request(app,'account/create',{method:'POST',identity:'pretend-site-owner',body:{}})).json();assert.equal(a.account.siteLinked,false);
  assert.equal((await request(app,'account',{identity:'pretend-site-owner'})).status,401);
  const b=await(await request(app,'account/create',{method:'POST',identity:'pretend-site-owner',body:{}})).json();assert.notEqual(a.account.id,b.account.id,'spoofed identity cannot auto-reopen an account');
  const explicit=await request(app,'account',{token:a.token,identity:'another-spoofed-user'});assert.equal(explicit.status,200);assert.equal((await explicit.json()).account.id,a.account.id);
  assert.equal(app.store.db.prepare('SELECT COUNT(*) AS n FROM ro_accounts WHERE site_user_id IS NOT NULL').get().n,0,'bearer recovery cannot bind an untrusted external identity');
  assert.equal((await request(app,'account',{token:'ro_'+'0'.repeat(64)})).status,401);
 }finally{app.close();await app.closed;}
});

test('VPS account transport enforces configured origins and independent 150KiB account / 8KiB Phase body limits',async()=>{
 const app=createGameServer({config:configFor({PUBLIC_ORIGIN:'https://play.example',ALLOWED_ORIGINS:'capacitor://localhost'})});
 try{
  await app.listen();const permitted=await request(app,'account/create',{method:'POST',origin:'capacitor://localhost',body:{}});assert.equal(permitted.status,201);assert.equal(permitted.headers.get('access-control-allow-origin'),'capacitor://localhost');assert.equal(permitted.headers.get('vary'),'Origin');const {token}=await permitted.json();
  assert.equal((await request(app,'account',{token,origin:'https://play.example'})).status,200);
  assert.equal((await request(app,'account',{token,origin:'https://evil.example'})).status,403);
  assert.equal((await request(app,'account/create',{method:'POST',origin:'https://evil.example',body:{}})).status,403);
  const before=app.store.db.prepare('SELECT COUNT(*) AS n FROM ro_accounts').get().n;
  const modest=await request(app,'account/create',{method:'POST',origin:'https://play.example',raw:JSON.stringify({padding:'x'.repeat(10000)})});assert.equal(modest.status,201,'accounts are not subject to the Phase 8KiB limit');
  const large=await request(app,'account/create',{method:'POST',origin:'https://play.example',raw:JSON.stringify({padding:'x'.repeat(150*1024)})});assert.equal(large.status,413);assert.equal(app.store.db.prepare('SELECT COUNT(*) AS n FROM ro_accounts').get().n,before+1);
  const phase=await fetch(baseFor(app)+'/api/phase/create',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://play.example'},body:JSON.stringify({room:'LARGEROOM',padding:'x'.repeat(8192)})});assert.equal(phase.status,413);
  assert.equal((await request(app,'unknown',{token})).status,404);assert.equal((await request(app,'account',{method:'POST',token,body:{}})).status,405);assert.equal((await request(app,'account/create',{method:'POST',raw:'{' })).status,400);
 }finally{app.close();await app.closed;}
});


test('the VPS stores thirty developed characters above the old 150KiB transport limit and rejects a thirty-first',async()=>{
 const g=new Game(17,{mode:'bonk'});g.addPlayer('p','knight');const checkpoint=createRoCheckpoint(g);checkpoint.hero.roEquipment={};checkpoint.hero.roInventory=Array.from({length:30},(_,i)=>({...checkpoint.hero.roInventory[0],id:'full-bag-'+String(i).padStart(2,'0')+'x'.repeat(48)}));
 let progress=null;for(let i=0;i<30;i++){progress=saveRoCharacter(progress,{id:'hero-'+i,lineage:checkpoint.lineage,checkpoint});assert.ok(progress);}assert.ok(JSON.stringify(progress).length>150*1024);assert.equal(saveRoCharacter(progress,{id:'overflow',lineage:checkpoint.lineage,checkpoint}),null);
 const app=createGameServer({config:configFor({})});try{await app.listen();const {token}=await(await request(app,'account/create',{method:'POST',body:{}})).json();const saved=await request(app,'progress',{method:'POST',token,body:{checkpoint:progress}});assert.equal(saved.status,200);const restored=(await saved.json()).account;assert.equal(restored.progress.characters.length,30);assert.equal(restored.progress.characters[29].checkpoint.hero.roInventory.length,30);}finally{app.close();await app.closed;}
});
