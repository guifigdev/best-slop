import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Game} from '../shared/simulation.js';
import {BONK_STAGES} from '../shared/bonk-catalog.js';
import {MONSTER_HABITATS,monsterHabitats} from '../shared/ragnarok-habitats.js';
import {buildRoEncounter,dominantRoHabitat,habitatScene,roStageSpecies} from '../shared/ro-encounters.js';
import {planRoTowerFloor,roFloorRegion} from '../shared/ragnarok-tower.js';
import {generateBonkLevel,bonkBlocked} from '../shared/bonk-level.js';
import {createBonkWorld} from '../src/bonk-world.js';

test('every encounter uses only its habitat, keeps bosses out of ordinary waves and has deterministic varied rosters',()=>{
 for(const key of Object.keys(BONK_STAGES))for(let tier=1;tier<=3;tier++)for(let seed=1;seed<=12;seed++){
  const e=buildRoEncounter(key,seed,tier);assert.deepEqual(e,buildRoEncounter(key,seed,tier));assert.ok(e.species.length>=2&&e.species.length<=12);
  for(const k of e.species){const m=MONSTER_HABITATS[k];assert.ok(m,m?.sourceName||k);assert.ok(m.habitats.includes(e.habitat),k);assert.ok(!m.bossOnly,k);assert.ok(m.tier<=tier,k);}
  for(const k of [...e.guardians,e.boss])assert.ok(MONSTER_HABITATS[k].habitats.includes(e.habitat),k);
  assert.ok(MONSTER_HABITATS[e.boss].bossOnly);
 }
 const a=buildRoEncounter('payon',1,1),b=buildRoEncounter('payon',2,3);assert.notDeepEqual(a.species,b.species);assert.ok(a.species.includes('poporing')&&a.species.includes('tarou'));
 const rosters=new Set(Array.from({length:12},(_,seed)=>JSON.stringify(buildRoEncounter('payon',seed+1,3).species)));assert.ok(rosters.size>6);
 for(const key of Object.keys(BONK_STAGES))assert.deepEqual(BONK_STAGES[key].enemySpecies,roStageSpecies(key));
});

test('real adventure spawning, guardians and final bosses use the selected ecology, not generic biome aliases',()=>{
 for(const key of Object.keys(BONK_STAGES)){
  const g=new Game(114,{mode:'bonk'});g.addPlayer('p','knight');const u=g.player('p');g.command('p',{type:'bkReady'});
  if(key!=='grove'){g.bonk.stage='cleared';g.bonk.clearedStages=['grove'];assert.ok(g.command('p',{type:'bkNext',stageKey:key}));}
  const ecology=g.bonk.encounter;assert.equal(g.bonk.map.biome,BONK_STAGES[key].biome);assert.equal(g.bonk.map.habitat,ecology.habitat);
  for(const enemy of g.units.filter(v=>v.bonkEnemy))assert.ok(ecology.species.includes(enemy.ragnarokVisual));
  u.bonkBuild.weapons={};const o=g.bonk.objectives[0];Object.assign(u,{x:o.x,z:o.z});g.tick(.05);const guardian=g.units.find(v=>v.id===o.guardianId);assert.ok(guardian);assert.ok(ecology.guardians.includes(guardian.ragnarokVisual));
  g.bonk.bossUnlocked=true;Object.assign(u,{x:0,z:0});g.tick(.05);assert.equal(g.units.find(v=>v.bonkBoss).ragnarokVisual,ecology.boss);
 }
});

test('classic tower roster ecology remains correct independently of the dedicated stone-room renderer',()=>{
 const seen=new Set();for(let floor=1;floor<=100;floor++){
  const roster=planRoTowerFloor(floor,()=>.5),before=structuredClone(roster),habitat=dominantRoHabitat(roster),scene=roFloorRegion(floor,roster);assert.equal(scene,habitatScene(habitat));assert.ok(BONK_STAGES[scene]);assert.deepEqual(roster,before);seen.add(scene);
 }
 assert.ok(seen.has('glacier')&&seen.has('forge')&&seen.has('sands')&&seen.has('coast'));
 assert.equal(habitatScene(monsterHabitats('icetitan').primary),'glacier');assert.equal(habitatScene(monsterHabitats('imp').primary),'forge');
});

test('sand and coastal habitats render native scenery with matching terrain, usable paths and bounded instance counts',()=>{
 for(const key of ['sands','coast'])for(const seed of [1,13,99]){
  const map=generateBonkLevel(seed,key),scene=new T.Scene(),world=createBonkWorld({scene});assert.ok(map.decorations.some(o=>o.type===(key==='sands'?'cactus':'coral')));assert.ok(map.decorations.some(o=>o.type==='scenery'&&o.model===(key==='sands'?'sand-pyramid':'coastal-wreck')));
  for(const l of map.landmarks)for(let t=0;t<=1;t+=.05)assert.equal(bonkBlocked(map,{x:l.x*t,z:l.z*t},.6),false);
  world.update({options:{mode:'bonk'},bonk:{map,objects:map.objects,pickups:[],projectiles:[],objectives:[]}},1);for(const child of world.root.children)if(child.isInstancedMesh)assert.ok(child.count<=child.instanceMatrix.count,key+': '+child.name);world.dispose();assert.equal(scene.children.length,0);
 }
});

test('Bash emits a frontal timed attack event and projectiles preserve their real damage trajectory',()=>{
 const g=new Game(4,{mode:'bonk',bonkLineage:'dragonknight'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p');g.units=[u,{id:g.id(),alive:true,team:100,bonkEnemy:true,x:u.x,z:u.z+3,hp:1000,maxHp:1000,speed:0,bonkNextAttack:99,bonkNextSpecial:99,collisionRadius:.3}];g.bonk.spawnAt=99;u.bonkBuild.weapons={bash:1};g.random=()=>.5;g.tick(.05);const fx=g.effects.find(e=>e.type==='roAttack');assert.ok(fx);assert.equal(fx.skillKey,'bash');assert.equal(fx.source,u.id);assert.equal(fx.attackKind,'slash');assert.equal(fx.direction,0);assert.equal(fx.range,6);assert.ok(g.units[1].hp<1000);assert.ok(!g.effects.some(e=>e.type==='slash'),'the old golden ring is replaced rather than stacked');
});
