import test from 'node:test';
import assert from 'node:assert/strict';
import {BONK_STAGES} from '../shared/bonk-catalog.js';
import {MVP_BY_KEY} from '../shared/ragnarok-expansion.js';
import {monsterHabitats} from '../shared/ragnarok-habitats.js';
import {RO_WORLD_ROUTE,roRouteStage,roRouteNext,roRouteIndex,roRouteEncounter,roRouteGate} from '../shared/ro-world-route.js';

test('the connected pilgrimage has twenty-five distinct regions with true MVP guardians',()=>{
 assert.equal(RO_WORLD_ROUTE.length,25);assert.equal(new Set(RO_WORLD_ROUTE.map(r=>r.key)).size,25);assert.equal(new Set(RO_WORLD_ROUTE.map(r=>r.mvp)).size,20);
 for(const region of RO_WORLD_ROUTE){assert.ok(BONK_STAGES[region.scene]);assert.ok(MVP_BY_KEY[region.mvp]);assert.equal(monsterHabitats(region.mvp).bossKind,'mvp');assert.ok(monsterHabitats(region.mvp).habitats.includes(region.habitat),region.key);assert.ok(Object.isFrozen(region)&&Object.isFrozen(region.entry)&&Object.isFrozen(region.featured));assert.equal(roRouteStage(region.key),region);assert.equal(roRouteIndex(region),region.index);assert.equal(roRouteNext(region),region.index<15?RO_WORLD_ROUTE[region.index+1]:null);}
 assert.equal(roRouteStage('prontera').index,0);assert.ok(roRouteStage('payon-forest').index<roRouteStage('payon-cave').index);assert.ok(roRouteStage('morroc').index<roRouteStage('rachel').index);assert.ok(roRouteStage('rachel').index<roRouteStage('juno').index);
});

test('every route encounter is reproducible, habitat-native and excludes all bosses from ordinary waves',()=>{
 for(const region of RO_WORLD_ROUTE)for(const seed of [1,19,114,501]){
  const encounter=roRouteEncounter(region,seed);assert.deepEqual(encounter,roRouteEncounter(region.key,seed));assert.equal(encounter.boss,region.mvp);assert.equal(encounter.bossKind,'mvp');assert.ok(encounter.species.length>=3&&encounter.species.length<=12);assert.ok(encounter.guardians.length>=1);
  for(const key of encounter.species){const m=monsterHabitats(key);assert.ok(m.habitats.includes(region.habitat),region.key+': '+key);assert.equal(m.bossOnly,false);assert.ok(m.tier<=encounter.tier);}
  for(const key of encounter.guardians){const m=monsterHabitats(key);assert.ok(m.habitats.includes(region.habitat));assert.equal(m.bossOnly,false);}
 }
 const cave=roRouteEncounter('payon-cave');assert.ok(cave.species.includes('poporing')&&cave.species.includes('tarou'));
 const ice=roRouteEncounter('ice-cavern');assert.ok(ice.species.includes('icetitan'));assert.ok(roRouteEncounter('thor-volcano').species.includes('imp'));
});

test('physical gate metadata joins the next region and the final sanctuary never loops to the start',()=>{
 for(const region of RO_WORLD_ROUTE.slice(0,15)){
  const gate=roRouteGate(region),open=roRouteGate(region,true),next=roRouteNext(region);assert.equal(gate.locked,true);assert.equal(gate.open,false);assert.equal(open.locked,false);assert.equal(open.open,true);assert.equal(gate.nextKey,next.key);assert.equal(gate.mvp,region.mvp);assert.deepEqual({x:gate.x,z:gate.z},region.exit);assert.ok(gate.width>=14&&gate.depth>=4);assert.deepEqual(next.entry,region.entry);assert.ok(region.entry.z-region.exit.z>180);
 }
 assert.equal(roRouteGate('thanatos-tower'),null);assert.equal(roRouteNext('thanatos-tower'),null);
 for(const bad of [-1,25,NaN,Infinity,.5,'__proto__','constructor','missing',null]){assert.equal(roRouteIndex(bad),-1);assert.equal(roRouteStage(bad),null);assert.equal(roRouteNext(bad),null);assert.equal(roRouteEncounter(bad),null);assert.equal(roRouteGate(bad),null);}
});
