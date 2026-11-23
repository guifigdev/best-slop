import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {BonkMethods} from '../shared/bonk.js';
import {createRoCheckpoint} from '../shared/ragnarok-save.js';
import {createRagnarokAccountUI,normalizeRoAccount,mergeRoProgress,roAccountSelection,saveRoCharacter,RO_ACCOUNT_STORAGE_KEY} from '../src/ragnarok-account-ui.js';
Object.assign(Game.prototype,BonkMethods);
const token='ro_'+'a'.repeat(64),otherToken='ro_'+'b'.repeat(64);
const empty=()=>({id:'cloud-a',cards:[],presets:[{id:'default',name:'Padrão',cards:{}}],activePreset:'default',progress:{version:1,characters:[],selectedCharacter:null}});
const game=(options={})=>{const g=new Game(123,{mode:'bonk',bonkLineage:'dragonknight',...options});assert.ok(g.addPlayer('p','knight'));return g;};
const storage=initial=>{const map=new Map(initial?[[RO_ACCOUNT_STORAGE_KEY,JSON.stringify(initial)]]:[]);return{getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,value),data:()=>JSON.parse(map.get(RO_ACCOUNT_STORAGE_KEY)||'{}')};};
const settle=()=>new Promise(resolve=>setImmediate(resolve));
function backend(initial=empty()){
 let account=structuredClone(initial);const calls=[];
 const fetchImpl=async(url,options={})=>{const path=url.split('/').pop(),body=options.body?JSON.parse(options.body):{};calls.push({path,options,body});
  if(path==='create')return Response.json({token,account},{status:201});
  if(path==='account')return Response.json({account});
  if(path==='run')return Response.json({runId:'run-a',account});
  if(path==='progress'){account.progress=body.checkpoint;return Response.json({account});}
  if(path==='rewards'){if(!account.cards.includes('poring'))account.cards.push('poring');return Response.json({account,newCards:['poring'],acknowledgedIds:body.kills.slice(0,1).map(k=>k.id)});}
  if(path==='presets'){Object.assign(account,body);return Response.json({account});}
  throw Error('Unexpected endpoint '+path);
 };return{fetchImpl,calls};
}
test('Account normalization accepts only unlocked compatible one-per-slot cards and preserves valid progress',()=>{
 const account=normalizeRoAccount({cards:['poring','poring','constructor','fabre'],presets:[{id:'x',name:'Teste',cards:{armor:'poring',weapon:'poring',head:'fabre',__proto__:'fabre'}}],activePreset:'x'});
 assert.deepEqual(account.cards,['poring','fabre']);assert.deepEqual(account.presets[0].cards,{armor:'poring'});assert.equal(normalizeRoAccount(null).activePreset,'default');
});
test('Character saves merge by timestamp, honor the roster limit and resume only the matching activity',()=>{
 const g=game(),checkpoint=createRoCheckpoint(g);assert.ok(checkpoint);
 const a=saveRoCharacter(null,{id:'hero-a',name:'Rune',lineage:'dragonknight',checkpoint,updatedAt:10});
 const b=saveRoCharacter(a,{id:'hero-a',name:'Rune 2',lineage:'dragonknight',checkpoint,updatedAt:20});assert.equal(mergeRoProgress(a,b).characters[0].name,'Rune 2');
 assert.equal(roAccountSelection({progress:a},{characterId:'hero-a',activity:'adventure',resume:true}).resume,true);
 assert.equal(roAccountSelection({progress:a},{characterId:'hero-a',activity:'tower',resume:true}).resume,false);
 let full=a;for(let i=1;i<12;i++)full=saveRoCharacter(full,{id:'hero-'+i,name:'n',lineage:'dragonknight',checkpoint,updatedAt:i});assert.equal(full.characters.length,12);assert.equal(saveRoCharacter(full,{id:'thirteenth',name:'n',lineage:'dragonknight',checkpoint}),null);
});
test('Cloud creation and save use JSON auth, while a fresh character remains in preparation',async()=>{
 const service=backend(),saved=storage(),ui=createRagnarokAccountUI({fetchImpl:service.fetchImpl,storage:saved});await ui.loadReady();assert.equal(ui.status(),'cloud');assert.equal(saved.data().token,token);
 const g=game();assert.ok(ui.prepareGame(g));assert.equal(g.bonk.stage,'preparation');await settle();await settle();assert.ok(await ui.save(g));assert.equal(ui.account().progress.characters.length,1);
 const request=service.calls.find(c=>c.path==='progress');assert.equal(request.options.headers.Authorization,'Bearer '+token);assert.equal(request.options.headers['Content-Type'],'application/json');assert.ok(request.body.checkpoint.characters[0].checkpoint.hero.roInventory.every(i=>i.cards.length===0));
});
test('Existing developed characters restore into a fresh activity and keep their class development',async()=>{
 const original=game(),hero=original.player('p');hero.level=8;hero.gold=500;const checkpoint=createRoCheckpoint(original),account=empty();account.progress=saveRoCharacter(null,{id:'developed',name:'Veterano',lineage:'dragonknight',checkpoint,updatedAt:1});
 const ui=createRagnarokAccountUI({fetchImpl:backend(account).fetchImpl,storage:storage({token,account})});await ui.loadReady();const next=game();ui.prepareGame(next);assert.equal(next.player('p').level,8);assert.equal(next.player('p').gold,500);assert.equal(ui.selection().characterId,'developed');
});

test('Room rules override cached account preferences and admission never sends a save from another lineage',async()=>{
 const original=game({bonkLineage:'imperialguard'}),account=empty();account.progress=saveRoCharacter(null,{id:'guard',name:'Guarda',lineage:'imperialguard',checkpoint:createRoCheckpoint(original),updatedAt:1});
 let state={options:{mode:'bonk',bonkActivity:'tower',bonkSkillMode:'class'},onlineRoom:{stage:'selecting'}};
 const ui=createRagnarokAccountUI({getState:()=>state,fetchImpl:backend(account).fetchImpl,storage:storage({token,account,activity:'adventure',skillMode:'mixed'})});await ui.loadReady();
 assert.equal(ui.selection().activity,'tower');assert.equal(ui.selection().skillMode,'class');
 assert.equal(ui.onlineSelection('meister').characterId,null,'a merchant card cannot submit the saved guard');
 ui.setLineage('meister');assert.equal(ui.selection().lineage,'meister');assert.equal(ui.selection().character,null);assert.equal(ui.onlineSelection('meister').activity,'tower');
 state=null;assert.equal(ui.selection().skillMode,'mixed','room rules do not overwrite personal solo preferences');
});

test('An explicit card choice survives late cloud selection even when it matches the cached default',async()=>{
 const original=game({bonkLineage:'imperialguard'}),account=empty();account.progress=saveRoCharacter(null,{id:'guard',name:'Guarda',lineage:'imperialguard',checkpoint:createRoCheckpoint(original),updatedAt:1});
 let complete;const ui=createRagnarokAccountUI({storage:storage(),fetchImpl:()=>new Promise(resolve=>complete=()=>resolve(Response.json({token,account})))});
 const loading=ui.loadReady();ui.setLineage('dragonknight');complete();await loading;
 assert.equal(ui.selection().lineage,'dragonknight');assert.equal(ui.onlineSelection('dragonknight').characterId,null);
});
test('Partial reward acknowledgements preserve unprocessed kills and never grant cards locally',async()=>{
 const service=backend(),toasts=[],ui=createRagnarokAccountUI({fetchImpl:service.fetchImpl,storage:storage(),toast:m=>toasts.push(m)});await ui.loadReady();const g=game();ui.prepareGame(g);await settle();await settle();g.bonk.rewardKills=[{id:'one',visual:'poring'},{id:'two',visual:'poring'}];ui.update(g);await settle();await settle();
 assert.deepEqual(g.bonk.rewardKills.map(k=>k.id),['two']);assert.deepEqual(ui.account().cards,['poring']);assert.ok(toasts.some(t=>t.includes('Permanente')));
 const offlineStorage=storage(),offline=createRagnarokAccountUI({storage:offlineStorage,fetchImpl:async()=>Response.json({error:'down'},{status:503})});await offline.loadReady();const local=game();offline.prepareGame(local);local.bonk.rewardKills=[{id:'x',visual:'poring'}];offline.update(local);await offline.save(local);assert.equal(offline.status(),'local');assert.deepEqual(offline.account().cards,[]);assert.equal(local.bonk.rewardKills.length,1);assert.equal(offlineStorage.data().account.progress.characters.length,1);
});
test('Recovery account changes ignore a stale in-flight create response and replace the stored recovery token',async()=>{
 let complete;const old=empty(),replacement={...empty(),id:'other',cards:['elderwillow']};
 const fetchImpl=(url)=>url.endsWith('/create')?new Promise(resolve=>complete=()=>resolve(Response.json({token,account:old},{status:201}))):Promise.resolve(Response.json({account:replacement}));
 const saved=storage(),ui=createRagnarokAccountUI({storage:saved,fetchImpl}),initial=ui.loadReady();assert.ok(await ui.recover(otherToken));complete();await initial;assert.equal(ui.account().id,'other');assert.deepEqual(ui.account().cards,['elderwillow']);assert.equal(saved.data().token,otherToken);
});
test('Tower reward batching requests the canonical activity and drains at 250ms while adventure retains its one-second interval',async()=>{
 const originalNow=Date.now;let stamp=100000;Date.now=()=>stamp;
 try{for(const activity of ['tower','adventure']){const service=backend(),ui=createRagnarokAccountUI({fetchImpl:service.fetchImpl,storage:storage()});await ui.loadReady();const g=game({bonkActivity:activity});ui.prepareGame(g);await settle();await settle();assert.equal(service.calls.find(c=>c.path==='run').body.activity,activity);
   g.bonk.rewardKills=[{id:'one',visual:'poring'},{id:'two',visual:'poring'}];ui.update(g);await settle();await settle();assert.equal(service.calls.filter(c=>c.path==='rewards').length,1);stamp+=249;ui.update(g);await settle();assert.equal(service.calls.filter(c=>c.path==='rewards').length,1);stamp+=1;ui.update(g);await settle();await settle();assert.equal(service.calls.filter(c=>c.path==='rewards').length,activity==='tower'?2:1);
   assert.ok(service.calls.filter(c=>c.path==='rewards').every(c=>c.body.kills.length<=40));stamp+=2000;
  }}finally{Date.now=originalNow;}
});
