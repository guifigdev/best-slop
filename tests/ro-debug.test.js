import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {modeOptions} from '../shared/modes.js';
import {RO_LINEAGES} from '../shared/ragnarok-jobs.js';
import {RO_WORLD_ROUTE} from '../shared/ro-world-route.js';
import {BONK_TOMES,BONK_RELICS} from '../shared/bonk-catalog.js';
import {initializeRoDebugHero,createRoDebugSave,validateRoDebugSave,RO_DEBUG_MAX_LEVEL,RO_DEBUG_SAVE_KEY} from '../shared/ro-debug.js';
import {createRoCheckpoint,validateRoCheckpoint} from '../shared/ragnarok-save.js';
import {createRagnarokAccountUI} from '../src/ragnarok-account-ui.js';

test('only a literal debug flag inside the Ragnarok mode enables GM',()=>{
 assert.equal(modeOptions({mode:'bonk',bonkDebug:true}).bonkDebug,true);assert.equal(modeOptions({game:'bonk',bonkDebug:true}).bonkDebug,true);
 for(const mode of ['campaign','tower','dungeon','bloody','phasekiller','kodotag','castlefight','linewars'])assert.equal(modeOptions({mode,bonkDebug:true}).bonkDebug,undefined);
 for(const value of ['true',1,{},false,undefined])assert.equal(modeOptions({mode:'bonk',bonkDebug:value}).bonkDebug,undefined);
 const game=new Game(10,{mode:'bonk'});game.addPlayer('p','knight');const u=game.player('p'),before=JSON.stringify(u);assert.equal(initializeRoDebugHero(game,u),false);assert.equal(JSON.stringify(u),before);assert.equal(createRoDebugSave(game),null);
});

test('all twelve GM lineages have finite maximum attributes, fourth class and exactly four native maxed weapons',()=>{
 for(const p of Object.values(RO_LINEAGES)){const g=new Game(15,{mode:'bonk',bonkDebug:true,bonkLineage:p.key});g.addPlayer('p',p.hero);const u=g.player('p');assert.equal(initializeRoDebugHero(g,u),true);assert.equal(u.level,RO_DEBUG_MAX_LEVEL);assert.equal(u.level,150);assert.equal(u.roTier,3);assert.equal(u.bonkJob,p.jobs[3]);assert.equal(u.name,p.names[3]);assert.equal(u.attributePoints,0);assert.equal(u.bonkPendingLevels,0);assert.ok(Object.values(u.attributes).every(v=>v===99));assert.deepEqual(Object.keys(u.bonkBuild.weapons),['basic',...p.skills.slice(-3)]);assert.ok(Object.values(u.bonkBuild.weapons).every(v=>v===8));assert.equal(Object.keys(u.bonkBuild.tomes).length,4);assert.ok(Object.entries(u.bonkBuild.tomes).every(([key,v])=>Object.hasOwn(BONK_TOMES,key)&&v===8));assert.ok(Object.keys(u.bonkBuild.relics).every(key=>Object.hasOwn(BONK_RELICS,key)&&key!=='glassrune'));assert.ok([u.maxHp,u.hp,u.maxMana,u.mana,u.gold].every(Number.isFinite));assert.ok(u.hp>0&&u.mana>0);}
});

test('GM saves contain only a whitelisted map/class/clock recipe and never account data or inventory',()=>{
 const g=new Game(7,{mode:'bonk',bonkDebug:true,bonkLineage:'shadowcross'});g.addPlayer('p','raccoon');initializeRoDebugHero(g,g.player('p'));g.bonk.routeIndex=6;g.bonk.totalElapsed=482.4;g.accountId='private-account';g.player('p').roCardLoadout={weapon:'rare-card'};const save=createRoDebugSave(g);assert.deepEqual(save,{version:1,debug:true,lineage:'shadowcross',regionKey:RO_WORLD_ROUTE[6].key,clock:482.4});assert.deepEqual(validateRoDebugSave({...save,hero:g.player('p'),accountId:'leak',cards:['rare-card']}),save);assert.equal(validateRoCheckpoint(save),null,'a GM recipe cannot be mistaken for an account checkpoint');assert.match(RO_DEBUG_SAVE_KEY,/debug/);assert.deepEqual(validateRoDebugSave({version:1,debug:true,lineage:'dragonknight',routeIndex:0}),{version:1,debug:true,lineage:'dragonknight',regionKey:RO_WORLD_ROUTE[0].key,clock:0});
});

test('GM recipes reject invalid or ambiguous modes, maps, classes and clocks',()=>{
 const good={version:1,debug:true,lineage:'dragonknight',regionKey:RO_WORLD_ROUTE[0].key,clock:122.4};for(const mutate of [s=>s.version=2,s=>s.debug=false,s=>s.debug='true',s=>s.lineage='unknown',s=>s.regionKey='unknown',s=>s.routeIndex=1,s=>s.routeIndex='0',s=>s.clock=Infinity,s=>s.clock=-1,s=>s.clock=NaN,s=>s.clock='122.4',s=>delete s.regionKey]){const s=structuredClone(good);mutate(s);assert.equal(validateRoDebugSave(s),null,mutate.toString());}
});

test('GM games cannot create normal account checkpoints or start any account synchronization',async()=>{
 const g=new Game(11,{mode:'bonk',bonkDebug:true});g.addPlayer('p','knight');initializeRoDebugHero(g,g.player('p'));g.bonk.rewardKills=[{id:'gm-kill',visual:'poring',boss:true}];assert.equal(createRoCheckpoint(g),null);let requests=0,writes=0,commands=0;const ui=createRagnarokAccountUI({getGame:()=>g,fetchImpl:async()=>{requests++;throw Error('GM must not access accounts');},storage:{getItem:()=>null,setItem:()=>writes++},send:()=>commands++});const before=ui.account();assert.equal(ui.prepareGame(g),false);assert.equal(await ui.save(g),false);for(let i=0;i<20;i++)ui.update(g);await new Promise(resolve=>setImmediate(resolve));assert.equal(requests,0);assert.equal(writes,0);assert.equal(commands,0);assert.deepEqual(ui.account(),before);assert.equal(g.bonk.rewardKills.length,1);
});

test('GM guards remain effective with an existing cloud run and cannot post rewards or replace a saved character',async()=>{
 const account={id:'real-account',cards:[],presets:[{id:'default',name:'Default',cards:{}}],activePreset:'default',progress:{version:1,characters:[],selectedCharacter:null}},calls=[],values=new Map(),ui=createRagnarokAccountUI({storage:{getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)},fetchImpl:async(url,options={})=>{const path=url.split('/').pop();calls.push(path);if(path==='create')return Response.json({token:'ro_'+'a'.repeat(64),account},{status:201});if(path==='run')return Response.json({runId:'real-run',account});throw Error('Unexpected account write '+path);}});await ui.loadReady();const game=new Game(21,{mode:'bonk'});game.addPlayer('p','knight');assert.equal(ui.prepareGame(game),true);await new Promise(resolve=>setImmediate(resolve));await new Promise(resolve=>setImmediate(resolve));assert.ok(calls.includes('run'));const count=calls.length,before=ui.account(),saved=[...values.entries()];game.options.bonkDebug=true;initializeRoDebugHero(game,game.player('p'));game.bonk.rewardKills=[{id:'test-only-mvp',visual:'ifrit',boss:true}];assert.equal(await ui.save(game),false);for(let i=0;i<20;i++)ui.update(game);assert.equal(ui.prepareGame(game),false);await new Promise(resolve=>setImmediate(resolve));assert.equal(calls.length,count);assert.deepEqual(ui.account(),before);assert.deepEqual([...values.entries()],saved);assert.equal(game.bonk.rewardKills.length,1);
});
