import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {BonkMethods} from '../shared/bonk.js';
import {roLoseBagOnDeath} from '../shared/ro-death-inventory.js';
import {createRoEquipment} from '../shared/ragnarok-equipment.js';
import {createRoCheckpoint} from '../shared/ragnarok-save.js';
import {createRagnarokAccountUI,normalizeRoAccount,mergeRoProgress,roAccountSelection,saveRoCharacter,deleteRoCharacter,roCharacterGallery,RO_ACCOUNT_STORAGE_KEY} from '../src/ragnarok-account-ui.js';
Object.assign(Game.prototype,BonkMethods);
const token='ro_'+'a'.repeat(64),otherToken='ro_'+'b'.repeat(64);
const empty=()=>({id:'cloud-a',cards:[],presets:[{id:'default',name:'Padrão',cards:{}}],activePreset:'default',progress:{version:1,characters:[],selectedCharacter:null}});
const game=(options={})=>{const g=new Game(123,{mode:'bonk',bonkLineage:'dragonknight',...options});assert.ok(g.addPlayer('p','knight'));return g;};
const storage=initial=>{const map=new Map(initial?[[RO_ACCOUNT_STORAGE_KEY,JSON.stringify(initial)]]:[]);return{getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,value),data:()=>JSON.parse(map.get(RO_ACCOUNT_STORAGE_KEY)||'{}')};};
const settle=()=>new Promise(resolve=>setImmediate(resolve));

test('new card drops appear on the ground first and only an explicit nearby claim unlocks the collection',async()=>{
 const g=game(),drops=[],claimed=[],calls=[];let account=empty();
 const fetchImpl=async(url,options={})=>{const path=url.split('/').pop(),body=options.body?JSON.parse(options.body):{};calls.push({path,body});
  if(path==='create')return Response.json({token,account});if(path==='run')return Response.json({runId:'ground-run',account});if(path==='progress'){account.progress=body.checkpoint;return Response.json({account});}
  if(path==='rewards')return Response.json({account,newCards:[],acknowledgedIds:['ground'],cardDrops:[{key:'poring',receipt:'ground',pending:true,x:10,z:10,mapSeed:g.bonk.map.seed,expiresAt:Date.now()+180000}]});
  if(path==='claim'){account.cards=['poring'];return Response.json({account,collectedCard:{key:'poring',receipt:'ground',duplicate:false}});}throw Error(path);
 };
 const ui=createRagnarokAccountUI({fetchImpl,storage:storage(),getGame:()=>g,onCardDrop:d=>drops.push(d),onCardClaimed:d=>claimed.push(d)});await ui.loadReady();ui.prepareGame(g);await settle();await settle();assert.equal(calls.find(c=>c.path==='run').body.pickupMode,'ground');
 g.bonk.rewardKills=[{id:'ground',visual:'poring',x:10,z:10}];ui.update(g);await settle();await settle();assert.equal(drops.length,1);assert.equal(drops[0].pending,true);assert.deepEqual(ui.account().cards,[]);assert.equal(claimed.length,0);
 const u=g.player('p');u.x=50;u.z=50;assert.equal(await ui.claimCard('ground'),false);assert.equal(calls.filter(c=>c.path==='claim').length,0);u.x=u.z=10;assert.equal(await ui.claimCard('ground'),true);assert.deepEqual(ui.account().cards,['poring']);assert.equal(claimed.length,1);assert.equal(await ui.claimCard('ground'),false);
});

test('death saves the emptied bag immediately, without waiting for the periodic autosave',async()=>{
 const service=backend(),saved=storage(),messages=[],ui=createRagnarokAccountUI({fetchImpl:service.fetchImpl,storage:saved,toast:t=>messages.push(t)});await ui.loadReady();const g=game();ui.prepareGame(g);await settle();await settle();const u=g.player('p');u.roInventory.push(createRoEquipment('knife','do-not-restore'));await ui.save(g);const before=service.calls.filter(c=>c.path==='progress').length;roLoseBagOnDeath(u);u.alive=false;u.hp=0;ui.update(g);await settle();await settle();assert.equal(service.calls.filter(c=>c.path==='progress').length,before+1);assert.ok(messages.some(t=>t.includes('itens da mochila foram perdidos')));const hero=saved.data().account.progress.characters[0].checkpoint.hero;assert.ok(!hero.roInventory.some(i=>i.id==='do-not-restore'));ui.update(g);await settle();assert.equal(service.calls.filter(c=>c.path==='progress').length,before+1);
});
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
 let full=a;for(let i=1;i<30;i++)full=saveRoCharacter(full,{id:'hero-'+i,name:'n',lineage:'dragonknight',checkpoint,updatedAt:i});assert.equal(full.characters.length,30);assert.equal(saveRoCharacter(full,{id:'thirty-first',name:'n',lineage:'dragonknight',checkpoint}),null);
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


test('Deleting a character frees a slot, preserves shared possessions and cannot be resurrected by a stale device',()=>{
 const checkpoint=createRoCheckpoint(game());let full=null;for(let i=0;i<12;i++)full=saveRoCharacter(full,{id:'char-'+i,name:i===0?'Rune <b>':'Rune '+i,lineage:'dragonknight',checkpoint,updatedAt:i});
 full.warehouse={version:1,revision:3,items:[]};const removed=deleteRoCharacter(full,'char-0');assert.equal(removed.characters.length,11);assert.deepEqual(removed.warehouse,full.warehouse);assert.equal(deleteRoCharacter(removed,'missing'),null);
 for(const merged of [mergeRoProgress(full,removed),mergeRoProgress(removed,full)]){assert.equal(merged.characters.length,11);assert.ok(!merged.characters.some(c=>c.id==='char-0'));assert.deepEqual(merged.deletedCharacters,['char-0']);}
 const newer=structuredClone(full);newer.characters[0].updatedAt=Date.now();assert.ok(!mergeRoProgress(removed,newer).characters.some(c=>c.id==='char-0'),'deletion also overrides a newer stale autosave');
 assert.equal(saveRoCharacter(removed,{id:'char-0',lineage:'dragonknight',checkpoint}),null);const replacement=saveRoCharacter(removed,{id:'replacement',lineage:'dragonknight',checkpoint});assert.equal(replacement.characters.length,12);assert.deepEqual(replacement.deletedCharacters,['char-0']);
 const account=normalizeRoAccount({cards:['poring'],progress:removed});assert.deepEqual(account.cards,['poring']);assert.deepEqual(account.progress.warehouse,full.warehouse);
 const markup=roCharacterGallery(full,'char-0');assert.ok(markup.includes('Rune &lt;b&gt;'));assert.ok(markup.includes('data-ro-delete="char-0"'));assert.ok(markup.includes('Cavaleiro'));assert.ok(!markup.includes('<select'));assert.equal((markup.match(/data-ro-choose=/g)||[]).length,12);
});


test('A character deleted on another device is deselected and a new run receives a fresh savable ID',async()=>{
 const g=game(),checkpoint=createRoCheckpoint(g),cached=empty();cached.progress=saveRoCharacter(null,{id:'deleted-elsewhere',lineage:'dragonknight',checkpoint});const cloud=structuredClone(cached);cloud.progress=deleteRoCharacter(cloud.progress,'deleted-elsewhere');
 const ui=createRagnarokAccountUI({storage:storage({token,account:cached}),fetchImpl:backend(cloud).fetchImpl});await ui.loadReady();assert.equal(ui.selection().character,null);assert.notEqual(ui.selection().characterId,'deleted-elsewhere');const next=game();ui.prepareGame(next);assert.ok(await ui.save(next));assert.equal(ui.account().progress.characters.length,1);assert.ok(!ui.account().progress.characters.some(c=>c.id==='deleted-elsewhere'));
});


test('a new merchant after twelve saved characters gets a unique ID and stays new through a delayed cloud load',async()=>{
 const original=game({bonkLineage:'meister'}),checkpoint=createRoCheckpoint(original),account=empty();for(let i=0;i<12;i++)account.progress=saveRoCharacter(account.progress,{id:'merchant-'+i,lineage:'meister',checkpoint});let complete;
 const service=backend(account),ui=createRagnarokAccountUI({storage:storage({token,account}),fetchImpl:(url,options)=>url.endsWith('/account')?new Promise(resolve=>complete=()=>resolve(Response.json({account}))):service.fetchImpl(url,options)});
 const loading=ui.loadReady();assert.ok(ui.newCharacter());ui.setLineage('meister');const id=ui.selection().characterId;assert.equal(ui.selection().character,null);complete();await loading;ui.setLineage('meister');assert.equal(ui.selection().characterId,id);assert.equal(ui.onlineSelection('meister').characterId,null);
 const next=game({bonkLineage:'meister'});assert.ok(ui.prepareGame(next));assert.equal(next.player('p').level,1);assert.ok(await ui.save(next));assert.equal(ui.account().progress.characters.length,13);assert.ok(ui.account().progress.characters.some(c=>c.id===id));assert.ok(roCharacterGallery(ui.account().progress,id).includes('13 / 30'));
});


test('a selected saved character can be confirmed directly without choosing its class again',async()=>{
 const original=game({bonkLineage:'meister'}),checkpoint=createRoCheckpoint(original),account=empty();account.progress=saveRoCharacter(null,{id:'saved-merchant',name:'Ferreiro salvo',lineage:'meister',checkpoint});const choices=[],state={options:{mode:'bonk',bonkActivity:'adventure'},onlineRoom:{stage:'selecting'}};
 const ui=createRagnarokAccountUI({getState:()=>state,storage:storage({token,account}),fetchImpl:backend(account).fetchImpl,onConfirmCharacter:choice=>{choices.push(choice);return true;}});await ui.loadReady();assert.ok(await ui.confirmCharacter());assert.equal(choices[0].characterId,'saved-merchant');assert.equal(choices[0].lineage,'meister');assert.equal(choices[0].character.name,'Ferreiro salvo');state.onlineRoom.stage='playing';assert.equal(await ui.confirmCharacter(),false);assert.equal(choices.length,1);
});
