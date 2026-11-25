import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {generateBonkLevel,bonkHeightAt} from '../shared/bonk-level.js';
import {roWorldRegion} from '../shared/ro-world-route.js';
import {RO_TRADE_HUBS} from '../shared/ro-region-services.js';
import {roTownServices} from '../shared/ro-town-services.js';
import {roTownVillageParts} from '../src/ro-town-village-art.js';
import {createBonkWorld} from '../src/bonk-world.js';

const level=(key,seed)=>{const route=roWorldRegion(key,seed);return generateBonkLevel(seed,route.scene,route.habitat,route);};
test('each trade hub grades a continuous foundation under the plaza, houses and all five NPCs',()=>{
 for(const seed of [1,52,617])for(const key of Object.keys(RO_TRADE_HUBS)){
  const map=level(key,seed),outside=bonkHeightAt(map,100,100);
  // The server can query the map before attaching its services.
  bonkHeightAt(map,map.spawn.x-18,map.spawn.z-14);
  const services=roTownServices(map),town=map.town,h=bonkHeightAt(map,town.x,town.z);
  for(const o of services)assert.ok(Math.abs(bonkHeightAt(map,o.x,o.z)-h)<1e-8,`${key} ${o.type}`);
  for(const [x,,z,w,,d]of roTownVillageParts(map,{stone:0x888888,wood:0x665544,dark:0x333333})){
   for(const [dx,dz]of [[-w/2,-d/2],[w/2,d/2]])assert.ok(Math.abs(bonkHeightAt(map,town.x+x+dx,town.z+z+dz)-h)<1e-8,`${key} asset footprint`);
  }
  assert.equal(bonkHeightAt(map,100,100),outside,'remote terrain is untouched');
  const clone=structuredClone(map);
  for(let x=-32;x<=32;x+=2)for(let z=-30;z<=30;z+=2){const wx=town.x+x,wz=town.z+z,a=bonkHeightAt(map,wx,wz);assert.equal(bonkHeightAt(clone,wx,wz),a);assert.ok(Math.abs(bonkHeightAt(map,wx+.01,wz)-a)<.025,'smooth shoulder');}
 }
});

test('adding the village after the first render rebuilds the floor to the same authoritative plane',()=>{
 const map=level('prontera',617),world=createBonkWorld({scene:new T.Scene()}),state={options:{mode:'bonk'},units:[],bonk:{map,objects:map.objects,objectives:[],pickups:[],projectiles:[]}};
 try{
  world.update(state,0);const original=world.root.getObjectByName('bonk-organic-ground').geometry;
  const services=roTownServices(map);map.objects.push(...services);world.update(state,1);
  const floor=world.root.getObjectByName('bonk-organic-ground');assert.notEqual(floor.geometry,original);floor.updateMatrixWorld(true);
  const h=bonkHeightAt(map,map.town.x,map.town.z);
  for(const o of [...services,map.town]){const ray=new T.Raycaster(new T.Vector3(o.x,100,o.z),new T.Vector3(0,-1,0)),hit=ray.intersectObject(floor)[0];assert.ok(hit);assert.ok(Math.abs(hit.point.y-h)<.0001);}
  const stable=floor.geometry;world.update(structuredClone(state),2);assert.equal(floor.geometry,stable,'snapshots do not rebuild unchanged terrain');
 }finally{world.dispose();}
});
