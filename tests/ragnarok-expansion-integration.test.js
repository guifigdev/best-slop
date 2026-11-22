import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Game} from '../shared/simulation.js';
import {SKILLS} from '../shared/catalog.js';
import {MONSTERS,monsterKind,monsterLoadout} from '../shared/monsters.js';
import {RAGNAROK_EXPANSION,RAGNAROK_COMMON_EXPANSION,MVP_BY_KEY,mvpForBiome,mvpWarning} from '../shared/ragnarok-expansion.js';
import {RAGNAROK_VOXEL_REFERENCES} from '../shared/monster-visual-references.js';
import {DUNGEON_BIOMES,DUNGEON_SPECIES} from '../shared/dungeon-catalog.js';
import {spawnDungeonSpecies,tickDungeonEncounters} from '../shared/dungeon-encounters.js';
import {insideBossPattern} from '../shared/boss-patterns.js';
import {createMonsterAbilityArt,MONSTER_ABILITY_ART_BUDGET as B} from '../src/monster-ability-art.js';

test('expanded species have real local profiles and biome pools; MVPs never leak into ordinary waves',()=>{
 assert.equal(RAGNAROK_EXPANSION.length,366);assert.equal(RAGNAROK_COMMON_EXPANSION.length,336);assert.equal(Object.keys(MVP_BY_KEY).length,30);assert.equal(Object.keys(RAGNAROK_VOXEL_REFERENCES).length,387);
 assert.equal(new Set(RAGNAROK_EXPANSION.map(m=>m.key)).size,366);
 for(const m of RAGNAROK_EXPANSION){const profile=MONSTERS['ro_'+m.key];assert.ok(profile&&DUNGEON_SPECIES[m.key]);assert.ok(SKILLS[m.skill],m.key+': '+m.skill);assert.equal(profile.name,RAGNAROK_VOXEL_REFERENCES[m.key].name);assert.ok(profile.hpMultiplier<=1.45&&profile.damageMultiplier<=1);assert.equal(monsterLoadout('ro_'+m.key,40,'boss',()=>.5).skills[0],m.skill);}
 const normal=new Set(),boss=new Set();for(let i=0;i<2000;i++){normal.add(monsterKind('frog',50,i/2000));boss.add(monsterKind('champion',50,i/2000,true));}
 for(const m of RAGNAROK_COMMON_EXPANSION)assert.ok(normal.has('ro_'+m.key),m.key);
 for(const key of Object.keys(MVP_BY_KEY)){assert.ok(!normal.has('ro_'+key));assert.ok(boss.has('ro_'+key));}
 for(const [biome,s]of Object.entries(DUNGEON_BIOMES)){assert.ok(s.expandedEnemies.some(key=>RAGNAROK_COMMON_EXPANSION.some(m=>m.key===key)));assert.ok(s.expandedEnemies.every(key=>DUNGEON_SPECIES[key]&&!DUNGEON_SPECIES[key].bossOnly));assert.ok(mvpForBiome(biome,0).biomes.includes(biome));}
});

test('MVP circles, rings, cones and lines use a single fair, finite, thematic warning footprint',()=>{
 const shapes=new Set();for(const m of Object.values(MVP_BY_KEY))for(let index=0;index<m.patterns.length;index++){
  const u={x:0,z:0,ragnarokMvp:m.key},p={x:8,z:0},w=mvpWarning(u,p,index,20,100);shapes.add(w.shape);
  assert.equal(w.mvp,m.key);assert.ok(w.fireAt>=21.8);assert.ok(w.radius<=7&&w.width<=4);assert.equal(w.damage,100);assert.ok([w.x,w.z,w.dx,w.dz,w.radius,w.inner,w.angle,w.length,w.fireAt].every(Number.isFinite));
  assert.ok(!insideBossPattern({x:100,z:100},w));if(w.shape==='ring'){assert.ok(!insideBossPattern(u,w),'the center of a ring is a safe zone');assert.ok(insideBossPattern({x:w.x+w.radius-.1,z:w.z},w));}
  if(w.shape==='cone'){assert.ok(!insideBossPattern({x:-2,z:0},w));assert.ok(insideBossPattern({x:2,z:0},w));}
 }
 assert.deepEqual(shapes,new Set(['circle','ring','cone','line']));assert.equal(mvpWarning({x:0,z:0}, {x:1,z:0},0,0,50),null);
 for(let i=0;i<4;i++)assert.equal(mvpWarning({x:0,z:0,ragnarokMvp:'ifrit'},{x:5,z:0},i,0,10).element,'fire');
});

test('a real dungeon MVP announces its own pattern, can be dodged and cancels on death',()=>{
 for(const dodge of [false,true]){
  const g=new Game(51,{mode:'dungeon'});g.addPlayer('p','knight');g.command('p',{type:'dgReady'});const p=g.player('p'),room=g.dungeon.map.rooms[1];Object.assign(p,{x:room.x,z:room.z});g.units=[p];g.obstacles=[];g.dungeon.map.hazards=[];g.dungeon.objects=[];g.dungeon.rooms[1].pending=0;g.dungeon.rooms[1].status='combat';
  const boss=spawnDungeonSpecies(g,room,'ifrit',{x:p.x-6,z:p.z},{boss:true});assert.equal(boss.ragnarokMvp,'ifrit');assert.equal(boss.ragnarokVisual,'ifrit');assert.ok(boss.dungeonBoss);boss.dungeonAbilityAt=0;
  const hooks={roomAt:()=>1,free:p=>p,extra:()=>null};g.time=.1;const hp=p.hp;tickDungeonEncounters(g,.1,hooks);const w=g.dungeon.telegraphs[0];assert.equal(w.mvp,'ifrit');assert.equal(w.element,'fire');assert.equal(p.hp,hp);assert.ok(w.fireAt-g.time>=1.8);
  // Use the footprint's actual impact location, retaining the ring safe zone.
  const hitPoint=w.shape==='ring'?{x:w.x+w.radius-.1,z:w.z}:w.shape==='cone'?{x:boss.x+w.dx*2,z:boss.z+w.dz*2}:{x:w.x,z:w.z};Object.assign(p,dodge?{x:room.x+100,z:room.z+100}:hitPoint);g.time=w.fireAt+.01;tickDungeonEncounters(g,.1,hooks);assert.equal(g.dungeon.telegraphs.length,0);if(dodge)assert.equal(p.hp,hp);else{assert.ok(p.hp<hp);assert.ok(p.hp>hp*.55,'one announced ability is not a fresh-hero two-shot');}
  boss.dungeonAbilityAt=0;g.dungeon.nextTellAt=0;Object.assign(p,{x:room.x,z:room.z});g.time+=10;tickDungeonEncounters(g,.1,hooks);assert.ok(g.dungeon.telegraphs.length);boss.alive=false;const before=p.hp;g.time+=5;tickDungeonEncounters(g,.1,hooks);assert.equal(g.dungeon.telegraphs.length,0);assert.equal(p.hp,before);
 }
});

test('MVP elemental art respects authoritative pattern cancellation and fixed rendering budgets',()=>{
 const scene=new T.Scene(),art=createMonsterAbilityArt({scene});try{
 const warnings=Object.values(MVP_BY_KEY).map((m,i)=>({...mvpWarning({x:i*10,z:0,ragnarokMvp:m.key},{x:i*10+4,z:0},i%4,0,100),id:i+100,source:i+1}));
 const effects=warnings.map(w=>({...w,id:w.id+1000,warningId:w.id,type:'bossDanger',duration:w.fireAt,time:0}));const state={options:{mode:'campaign'},bossWarnings:warnings,effects,units:[]};art.update(state,.4);assert.ok(art.stats().events>0);assert.ok(art.stats().threads<=B.threads&&art.stats().solids<=B.solids&&art.stats().glow<=B.glow);assert.equal(art.stats().drawCalls,3);
 art.update({...state,bossWarnings:[]},.6);assert.equal(art.stats().events,0);art.update({...state,effects:effects.map(e=>({...e,type:'bossImpact',duration:.8,time:1}))},1.3);assert.ok(art.stats().glow>0);assert.ok(art.stats().solids<=B.solids&&art.stats().glow<=B.glow);
 }finally{art.dispose();}
});


test('Custom Hero and Frenesi spawn actual named MVP actors and expose their own warnings and boss status',()=>{
 const g=new Game(17,{mode:'tower'});g.addPlayer('p','knight');g.wave=50;g.phase='wave';g.units=g.heroes();const p=g.player('p');Object.assign(p,{x:0,z:0});g.obstacles=[];
 const boss=g.spawnEnemy('champion',-6,0,{hp:2000,damage:40,boss:'boss',skills:[],variantRoll:.01,team:100});assert.ok(MVP_BY_KEY[boss.ragnarokMvp]);assert.equal(boss.ragnarokVisual,boss.ragnarokMvp);assert.equal(boss.name,MVP_BY_KEY[boss.ragnarokMvp].name);boss.nextPattern=0;g.tickBossPatterns();assert.equal(g.bossWarnings[0].mvp,boss.ragnarokMvp);assert.ok(g.bossWarnings[0].fireAt-g.time>=1.8);
 const b=new Game(19,{mode:'bonk'});b.addPlayer('p','knight');b.command('p',{type:'bkReady'});b.bonk.stage='cleared';b.bonk.clearedStages=['grove'];assert.ok(b.command('p',{type:'bkNext',stageKey:'forge'}));const hero=b.player('p');Object.assign(hero,{x:3,z:0});b.bonk.bossUnlocked=true;b.tick(.05);const mvp=b.units.find(u=>u.bonkBoss);assert.ok(mvp&&MVP_BY_KEY[mvp.ragnarokMvp]);assert.equal(mvp.name,MVP_BY_KEY[mvp.ragnarokMvp].name);const info=b.snapshotBonk().bossInfo;assert.deepEqual(info,{name:mvp.name,hp:mvp.hp,maxHp:mvp.maxHp,enraged:false,key:mvp.ragnarokMvp});mvp.bonkNextSpecial=0;hero.bonkMove={dx:0,dz:0};b.tick(.05);assert.ok(b.bonk.warnings.some(w=>w.mvp===mvp.ragnarokMvp));assert.ok(b.bonk.warnings.every(w=>!w.mvp||w.fireAt-b.bonk.elapsed>=1.75));
});


test('MVP impact particles stay inside the actual cone, line and ring rather than drawing a misleading full circle',()=>{
 const scene=new T.Scene(),art=createMonsterAbilityArt({scene}),matrix=new T.Matrix4();try{for(const [i,shape]of ['cone','line','ring'].entries()){
 const e={...mvpWarning({x:0,z:0,ragnarokMvp:'ifrit'},{x:6,z:0},i,0,100),shape,element:'physical',id:i+1,type:'bossImpact',time:0,duration:.8};const state={options:{mode:'campaign'},dungeon:{map:{seed:i}},bossWarnings:[],effects:[e],units:[]};art.update(state,.2);const solids=art.root.children[1];assert.ok(solids.count>0);for(let n=0;n<solids.count;n++){solids.getMatrixAt(n,matrix);const v=new T.Vector3().setFromMatrixPosition(matrix);assert.ok(insideBossPattern({x:v.x,z:v.z},{...e,radius:e.radius+.001,width:e.width+.001,length:e.length+.001,inner:e.inner-.001}),shape);}
 }}finally{art.dispose();}
});
