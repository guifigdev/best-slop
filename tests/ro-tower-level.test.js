import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {generateRoTowerLevel,roTowerSpawnPoint,roTowerHeightAt,roTowerSpawnBatch} from '../shared/ro-tower-level.js';
import {bonkBlocked,bonkHeightAt,generateBonkLevel} from '../shared/bonk-level.js';
import {planRoTowerFloor} from '../shared/ragnarok-tower.js';
import {RO_ENDLESS_SOURCE_IDS} from '../shared/ragnarok-endless-tower.js';
import {roTowerArchitectureParts} from '../src/ro-tower-art.js';
import {createBonkWorld,bonkPaletteForMap} from '../src/bonk-world.js';
import {Game} from '../shared/simulation.js';
import {createRoCheckpoint,validateRoCheckpoint} from '../shared/ragnarok-save.js';
import {RO_TOWER_FLOORS,roFloorInfo} from '../shared/ragnarok-tower.js';
import {ragnarokMonsterSpec} from '../src/ragnarok-monster-art.js';
import {RO_TOWER_DROP_MAP} from '../shared/ragnarok-tower-drops.js';
test('the tower has a bounded navigable stone nave, entry hall and far-end staircase on every floor',()=>{
 for(const floor of [1,5,25,26,50,75,99,100,101]){const map=generateRoTowerLevel(100+floor,floor);assert.equal(map.tower.floor,floor);assert.equal(map.stageKey,'crypt');assert.equal(map.width,62);assert.ok(!map.decorations.some(d=>['tree','palm','cactus'].includes(d.type)));assert.equal(map.landmarks.length,0);assert.ok(!bonkBlocked(map,map.spawn,1));assert.ok(bonkBlocked(map,{x:35,z:0}));assert.ok(bonkBlocked(map,{x:0,z:45}));
  for(let z=31;z>=-35;z-=.25)assert.equal(bonkBlocked(map,{x:0,z},1),false,'center aisle '+floor+' '+z);
  const reached=new Set(),queue=[{x:0,z:31}];for(let i=0;i<queue.length;i++){const p=queue[i],key=p.x+','+p.z;if(reached.has(key)||bonkBlocked(map,p,.8))continue;reached.add(key);for(const [x,z]of [[1,0],[-1,0],[0,1],[0,-1]]){const n={x:p.x+x,z:p.z+z};if(!reached.has(n.x+','+n.z)&&!bonkBlocked(map,n,.8))queue.push(n);}}
  for(const p of [...map.objects,...map.tower.spawnPoints,map.tower.exit])assert.ok(reached.has(Math.round(p.x)+','+Math.round(p.z)),'reachable target '+JSON.stringify(p));
  assert.equal(bonkHeightAt(map,0,20),0);assert.equal(bonkHeightAt(map,0,-35),roTowerHeightAt(map,0,-35));assert.ok(bonkHeightAt(map,0,-35)>=1);
 }
});
test('finite tower rosters preserve all source IDs and are spawned safely inside the nave away from the group',()=>{
 for(let floor=1;floor<=101;floor++){const map=generateRoTowerLevel(3,floor),roster=planRoTowerFloor(floor,()=>.4),heroes=[{...map.spawn,alive:true},{x:10,z:10,alive:true}];assert.ok(roster.every(m=>RO_ENDLESS_SOURCE_IDS.includes(m.sourceId)));let serial=0;for(const entry of roster)for(let n=0;n<entry.count;n++){const p=roTowerSpawnPoint(map,serial++,()=>.4,heroes,entry.boss?1.8:.8);assert.equal(bonkBlocked(map,p,entry.boss?1.8:.8),false);assert.ok(p.z>=-24&&p.z<=22);assert.ok(Math.min(...heroes.map(h=>Math.hypot(h.x-p.x,h.z-p.z)))>=13);}}
});
test('tower geometry keeps its original architectural identity and cannot leak outdoor props when switching activities',()=>{
 const map=generateRoTowerLevel(18,1),art=roTowerArchitectureParts(map);assert.ok(art.stone.length<1400&&art.stone.length>700);assert.equal(art.flames.length,4);for(const p of [...art.stone,...art.lights]){assert.ok(p.every(Number.isFinite));assert.ok(p.slice(3,6).every(n=>n>0));}const world=createBonkWorld({scene:new T.Scene()}),state=m=>({options:{mode:'bonk'},units:[{bonkHero:true,alive:true,...m.spawn}],bonk:{map:m,objects:m.objects,objectives:[],pickups:[],projectiles:[],warnings:[]}});
 try{world.update(state(generateBonkLevel(1)),0);assert.ok(world.root.getObjectByName('bonk-foliage').count>0);world.update(state(map),1);assert.ok(world.root.getObjectByName('bonk-endless-tower-flagstones'));assert.equal(world.root.getObjectByName('bonk-foliage').count,0);assert.equal(world.root.getObjectByName('bonk-landscape').count,0);assert.equal(world.root.getObjectByName('bonk-weather').count,0);assert.equal(world.root.getObjectByName('bonk-tower-masonry').count,art.stone.length);assert.equal(world.stats().physicalHalfExtent,40);assert.equal(bonkPaletteForMap(map).sky,0x080e0e);world.update(state(generateBonkLevel(3)),2);assert.equal(world.root.getObjectByName('bonk-tower-masonry').count,0);assert.ok(!world.root.getObjectByName('bonk-endless-tower-flagstones'));}finally{world.dispose();}
});
test('the 101st throne preserves its five source waves and its own armoured Naght Sieger sculpture and source loot',()=>{
 assert.equal(RO_TOWER_FLOORS,101);assert.equal(roFloorInfo(100).final,false);assert.equal(roFloorInfo(101).final,true);const plan=planRoTowerFloor(101);assert.deepEqual(plan.map(m=>[m.sourceId,m.count,m.phase]),[[1627,10,0],[1152,100,1],[1263,60,2],[1132,40,3],[1956,1,4]]);
 const queue=plan.flatMap(m=>Array.from({length:m.count},()=>({...m})));let phase=0;while(queue.length){const phaseEntries=queue.filter(m=>m.phase===phase),count=phaseEntries.length;assert.ok(count>0);const live=[];let emitted=0;while(queue[0]?.phase===phase){const n=roTowerSpawnBatch(queue,live,280-live.length);assert.ok(n>0&&n<=8);for(let i=0;i<n;i++)live.push({alive:true,roTowerPhase:queue.shift().phase});emitted+=n;}assert.equal(emitted,count);assert.equal(roTowerSpawnBatch(queue,live,280-live.length),0);phase++;}assert.equal(phase,5);
 const spec=ragnarokMonsterSpec('tower_1956');assert.ok(spec.parts.length>200&&spec.parts.length<450);assert.equal(spec.legs.length,2);assert.equal(spec.wings.length,0);assert.ok(spec.features.includes('paired-elemental-blades'));for(const p of spec.parts){assert.ok(p.every(Number.isFinite));assert.ok(p.slice(3,6).every(n=>n>0));}assert.ok(Object.isFrozen(spec));assert.equal(RO_TOWER_DROP_MAP.tower_1956.cardKey,null);assert.equal(RO_TOWER_DROP_MAP.tower_1956.equipmentKeys.length,5);
});
test('the expedition continues after Entweihen at 100, saves the 101st entrance, then finishes only after Naght and every final wave',()=>{
 const g=new Game(81,{mode:'bonk',bonkActivity:'tower',bonkLineage:'archmage'});g.addPlayer('p','mage');const u=g.player('p'),checkpoint=createRoCheckpoint(g);checkpoint.floor=100;checkpoint.clearedStages=Array(99).fill('crypt');assert.ok(validateRoCheckpoint(checkpoint));assert.ok(g.command('p',{type:'bkRestore',checkpoint,activity:'tower'}));assert.equal(g.bonk.stage,'playing');assert.equal(g.bonk.floor,100);g.bonk.towerQueue=[];g.units=[u];g.tick(.05);assert.equal(g.bonk.stage,'cleared');assert.equal(g.bonk.won,false);assert.equal(g.phase,'wave');assert.ok(g.command('p',{type:'bkNext'}));assert.equal(g.bonk.floor,101);assert.equal(g.bonk.map.tower.floor,101);assert.equal(g.bonk.floorTotal,211);const cp=createRoCheckpoint(g);assert.equal(cp.floor,101);assert.ok(validateRoCheckpoint(cp));
 g.options.bonkDebug=true;let count=0,lastPhase=-1;
 for(let i=0;i<180&&g.bonk.stage==='playing';i++){g.bonk.towerSpawnAt=g.bonk.elapsed;g.tick(.05);const live=g.units.filter(e=>e.bonkEnemy&&e.alive);if(!live.length)continue;const phases=new Set(live.map(e=>e.roTowerPhase));assert.equal(phases.size,1);const phase=live[0].roTowerPhase;assert.ok(phase>=lastPhase);lastPhase=phase;count+=live.length;for(const e of live)e.alive=false;}
 assert.equal(count,211);assert.equal(lastPhase,4);assert.equal(g.bonk.stage,'finished');assert.equal(g.bonk.won,true);assert.equal(g.phase,'victory');
});
