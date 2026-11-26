import test from 'node:test';import assert from 'node:assert/strict';
import {RO_BIOLAB_FLOORS,tickRoBiolabEnemy} from '../shared/ro-biolab.js';
import {roWorldRegion,roWorldNeighbors,roRouteEncounter} from '../shared/ro-world-route.js';
import {generateBonkLevel,bonkHeightAt} from '../shared/bonk-level.js';
import {roSurvivorEnemyBudget} from '../shared/ro-survivor-balance.js';
import {roMonsterProperties} from '../shared/ro-monster-properties.js';
import {ragnarokMonsterSpec} from '../src/ragnarok-monster-art.js';
test('three connected Somatology floors use native rosters, solid props and flat enclosed rooms',()=>{
 assert.ok(roWorldNeighbors('juno').includes('biolab-1'));
 for(const [i,floor]of RO_BIOLAB_FLOORS.entries()){
  const region=roWorldRegion(floor.key,15),map=generateBonkLevel(15,region.scene,region.habitat,region),encounter=roRouteEncounter(floor.key);
  assert.equal(map.route.biolabFloor,i+1);assert.equal(map.enclosed.style,'biolab');assert.equal(bonkHeightAt(map,44,22),0);assert.ok(map.obstacles.some(o=>o.type==='lab-wall'&&o.h===96));assert.ok(map.decorations.some(o=>o.type==='biolab-prop'));
  assert.ok(!map.objects.some(o=>/Shop|kafra|healer/.test(o.type)));for(const key of encounter.species)assert.ok(ragnarokMonsterSpec(key),key);
  if(i<2)assert.ok(roWorldNeighbors(floor.key).includes(RO_BIOLAB_FLOORS[i+1].key));
 }
 const keys=roRouteEncounter('biolab-3').species;assert.deepEqual(keys,['tower_1634','tower_1635','tower_1636','tower_1637','tower_1638','tower_1639']);
 assert.ok(ragnarokMonsterSpec('bio_eremes').parts.length>30);assert.equal(roMonsterProperties({roSourceId:1647}).element,'poison');
 const early=roSurvivorEnemyBudget({key:'tower_1635',progress:0}),late=roSurvivorEnemyBudget({key:'tower_1635',progress:18});assert.ok(late.damage>early.damage*2);assert.ok(late.hp>early.hp*3);
});
test('laboratory professions have committed attacks, healing support, distance limits and airborne projectile avoidance',()=>{
 const hero={id:1,alive:true,x:0,z:10,bonkJumpHeight:0},archer={id:2,alive:true,bonkEnemy:true,roSourceId:1638,x:0,z:0,damage:100,hp:20,maxHp:100},game={bonk:{elapsed:4,map:{route:{biolabFloor:3}}},units:[archer]},hits=[],effects=[],api={damage:(...a)=>hits.push(a),effect:(...a)=>effects.push(a)};
 tickRoBiolabEnemy(game,archer,[hero],api);assert.ok(archer.roBiolabCast);assert.equal(hits.length,0);game.bonk.elapsed=5;tickRoBiolabEnemy(game,archer,[hero],api);assert.equal(hits.length,1);assert.equal(hits[0][1],160);
 archer.roBiolabReadyAt=0;game.bonk.elapsed=10;tickRoBiolabEnemy(game,archer,[hero],api);game.bonk.elapsed=11;hero.bonkJumpHeight=1.2;tickRoBiolabEnemy(game,archer,[hero],api);assert.equal(hits.length,1);
 const priest={...archer,id:3,roSourceId:1637,roBiolabReadyAt:0,roBiolabCast:null};game.units.push(priest);game.bonk.elapsed=15;tickRoBiolabEnemy(game,priest,[hero],api);game.bonk.elapsed=16;tickRoBiolabEnemy(game,priest,[hero],api);assert.equal(archer.hp,32);assert.ok(effects.some(e=>e[0]==='heal'));
});
