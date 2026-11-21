import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {modeOptions} from '../shared/modes.js';
import {RO_WORLD_ROUTE} from '../shared/ro-world-route.js';
import {createRoCheckpoint,validateRoCheckpoint,validateRoProgress} from '../shared/ragnarok-save.js';
import {validateRoAccountProgress} from '../server/ro-accounts.js';
import {createRagnarokAccountUI,roAccountSelection,saveRoCharacter,RO_ACCOUNT_STORAGE_KEY} from '../src/ragnarok-account-ui.js';

function fixture(index=0,defeated=false){
 const g=new Game(114,{mode:'bonk'});g.addPlayer('p','knight');const region=RO_WORLD_ROUTE[index];
 Object.assign(g.bonk,{activity:'adventure',routeVersion:1,routeIndex:index,routeBossDefeated:defeated,clearedStages:RO_WORLD_ROUTE.slice(0,index+Number(defeated)).map(r=>r.key),floor:index+1,totalElapsed:125.75});g.bonk.map={...g.bonk.map,stageKey:region.scene};return g;
}
const checkpoint=(index=0,defeated=false)=>createRoCheckpoint(fixture(index,defeated));

test('route checkpoints preserve the current region, defeated MVP, exact prefix and elapsed daylight time',()=>{
 for(let index=0;index<12;index++)for(const defeated of [false,true]){
  const cp=checkpoint(index,defeated);assert.ok(cp);assert.equal(cp.routeVersion,1);assert.equal(cp.routeIndex,index);assert.equal(cp.routeBossDefeated,defeated);assert.equal(cp.floor,index+1);assert.equal(cp.totalElapsed,125.75);assert.equal(cp.stageKey,RO_WORLD_ROUTE[index].scene);assert.deepEqual(cp.clearedStages,RO_WORLD_ROUTE.slice(0,index+Number(defeated)).map(r=>r.key));assert.deepEqual(validateRoCheckpoint(cp),cp);
 }
 const final=checkpoint(11,true);assert.equal(final.floor,12);assert.equal(final.clearedStages.length,12);assert.equal(final.routeBossDefeated,true);
});

test('route validation rejects forged prefixes, mismatched scenes, invalid versions and tower route leakage',()=>{
 const cp=checkpoint(5,true),mutations=[
  c=>c.clearedStages.reverse(),c=>c.clearedStages.pop(),c=>c.clearedStages.push('juno'),c=>c.clearedStages[0]='grove',
  c=>c.routeIndex=6,c=>c.routeIndex=-1,c=>c.routeIndex=12,c=>c.routeIndex=1.5,c=>delete c.routeIndex,
  c=>c.routeBossDefeated=false,c=>c.routeBossDefeated=1,c=>delete c.routeBossDefeated,
  c=>c.stageKey='grove',c=>c.floor=7,c=>c.totalElapsed=Infinity,c=>c.totalElapsed=-1,c=>delete c.totalElapsed,
  c=>c.routeVersion=2,c=>c.routeVersion='1',c=>c.routeVersion=0,c=>c.activity='tower'
 ];
 for(const change of mutations){const bad=structuredClone(cp);change(bad);assert.equal(validateRoCheckpoint(bad),null);}
});

test('legacy adventures and tower checkpoints retain their original format and explicit route version zero normalizes away',()=>{
 const legacy=new Game(19,{mode:'bonk'});legacy.addPlayer('p','knight');const cp=createRoCheckpoint(legacy);assert.ok(cp);assert.equal(cp.routeVersion,undefined);assert.deepEqual(validateRoCheckpoint({...cp,routeVersion:0}),cp);assert.equal(validateRoCheckpoint({...cp,routeIndex:0}),null);assert.equal(validateRoCheckpoint({...cp,floor:12}),null);
 const tower=new Game(20,{mode:'bonk',bonkActivity:'tower',bonkWorld:'midgard'});tower.addPlayer('p','knight');const t=createRoCheckpoint(tower);assert.ok(t);assert.equal(t.activity,'tower');assert.equal(t.routeVersion,undefined);
 assert.equal(modeOptions({mode:'bonk',bonkWorld:'midgard'}).bonkWorld,'midgard');assert.equal(modeOptions({mode:'bonk'}).bonkWorld,undefined);assert.equal(modeOptions({mode:'bonk',bonkWorld:'other'}).bonkWorld,undefined);assert.equal(modeOptions({mode:'dungeon',bonkWorld:'midgard'}).bonkWorld,undefined);
});

test('persistent characters keep a gate-open adventure alongside a separate tower save and share latest development',()=>{
 const cp=checkpoint(7,true);cp.hero.level=17;let progress=saveRoCharacter(null,{id:'route-hero',name:'Peregrino',lineage:cp.lineage,checkpoint:cp,updatedAt:1});
 const g=new Game(15,{mode:'bonk',bonkActivity:'tower'});g.addPlayer('p','knight');const t=createRoCheckpoint(g);t.hero.level=23;t.hero.attributes.vit=32;progress=saveRoCharacter(progress,{id:'route-hero',name:'Peregrino',lineage:cp.lineage,checkpoint:t,updatedAt:2});assert.ok(validateRoProgress(progress));assert.ok(validateRoAccountProgress(progress));
 const adventure=roAccountSelection({progress},{activity:'adventure',characterId:'route-hero',resume:true});assert.equal(adventure.checkpoint.routeIndex,7);assert.equal(adventure.checkpoint.routeBossDefeated,true);assert.equal(adventure.checkpoint.hero.level,23);assert.equal(adventure.checkpoint.hero.attributes.vit,32);assert.equal(adventure.resume,true);
 const tower=roAccountSelection({progress},{activity:'tower',characterId:'route-hero',resume:true});assert.equal(tower.checkpoint.routeVersion,undefined);assert.equal(tower.checkpoint.floor,1);assert.equal(tower.resume,true);
});

test('account autosave commits each gate opening and physical crossing immediately without a per-frame request loop',async()=>{
 const token='ro_'+'a'.repeat(64),calls=[],values=new Map(),storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};let account={id:'route-account',cards:[],presets:[{id:'default',name:'Default',cards:{}}],activePreset:'default',progress:{version:1,characters:[],selectedCharacter:null}};
 const fetchImpl=async(url,options={})=>{const path=url.split('/').pop(),body=options.body?JSON.parse(options.body):{};calls.push({path,body});if(path==='create')return Response.json({token,account},{status:201});if(path==='run')return Response.json({runId:'route-run',account});if(path==='account')return Response.json({account});if(path==='progress'){account={...account,progress:body.checkpoint};return Response.json({account});}throw Error('Unexpected endpoint '+path);};
 const ui=createRagnarokAccountUI({storage,fetchImpl}),g=fixture();await ui.loadReady();ui.prepareGame(g);await new Promise(resolve=>setImmediate(resolve));await new Promise(resolve=>setImmediate(resolve));ui.update(g);await new Promise(resolve=>setImmediate(resolve));const count=()=>calls.filter(c=>c.path==='progress').length,initial=count();assert.ok(initial>=1);
 for(let i=0;i<30;i++)ui.update(g);await new Promise(resolve=>setImmediate(resolve));assert.equal(count(),initial);
 g.bonk.routeBossDefeated=true;g.bonk.clearedStages=['prontera'];ui.update(g);await new Promise(resolve=>setImmediate(resolve));assert.equal(count(),initial+1);assert.equal(JSON.parse(values.get(RO_ACCOUNT_STORAGE_KEY)).account.progress.characters[0].checkpoint.routeBossDefeated,true);
 Object.assign(g.bonk,{routeIndex:1,routeBossDefeated:false,floor:2});g.bonk.map={...g.bonk.map,stageKey:RO_WORLD_ROUTE[1].scene};ui.update(g);await new Promise(resolve=>setImmediate(resolve));assert.equal(count(),initial+2);assert.equal(calls.filter(c=>c.path==='progress').at(-1).body.checkpoint.characters[0].checkpoint.routeIndex,1);
 for(let i=0;i<30;i++)ui.update(g);await new Promise(resolve=>setImmediate(resolve));assert.equal(count(),initial+2);
});
