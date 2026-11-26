import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {generateBonkLevel,bonkHeightAt,bonkBlocked} from '../shared/bonk-level.js';
import {RO_WORLD_ROUTE,roWorldRegion} from '../shared/ro-world-route.js';
import {roTerrainSlope,roTerrainReviewPoints,RO_TERRAIN_VERSION} from '../shared/ro-terrain-relief.js';
import {RO_REGION_PROP_POOLS,RO_REGION_PROP_BUDGET} from '../shared/ro-regional-props.js';
import {roRegionalPropParts} from '../src/ro-regional-prop-art.js';
import {createBonkWorld} from '../src/bonk-world.js';
const palette={stone:0xa5a58b,dark:0x3c5242,wood:0x735438,grass:0x8eac66,glow:0xf3d89d};
const range=points=>Math.max(...points)-Math.min(...points);

test('all twelve connected regions have pronounced deterministic hills and valleys instead of a flat playable plane',()=>{
 for(const seed of [1,52,880])for(const r of RO_WORLD_ROUTE.filter(r=>!r.biolabFloor)){
  const map=generateBonkLevel(seed,r.scene,r.habitat,roWorldRegion(r)),heights=[];
  assert.equal(map.terrainVersion,RO_TERRAIN_VERSION);assert.deepEqual(map,generateBonkLevel(seed,r.scene,r.habitat,roWorldRegion(r)));
  for(let x=-100;x<=100;x+=10)for(let z=-100;z<=100;z+=10)heights.push(bonkHeightAt(map,x,z));
  assert.ok(heights.every(Number.isFinite));assert.ok(range(heights)>10,`${r.key} range ${range(heights)}`);assert.ok(range(heights)<32,`${r.key} remains a traversable landscape`);
  const review=roTerrainReviewPoints(map);assert.ok(review.ridge.height-review.valley.height>9);assert.ok(bonkHeightAt(map,review.ridge.x,review.ridge.z)===review.ridge.height);
 }
});

test('graded roads join spawn, boss plaza and every gate without terrain jumps or new decorative blockages',()=>{
 for(const r of RO_WORLD_ROUTE.filter(r=>!r.biolabFloor)){
  const map=generateBonkLevel(52,r.scene,r.habitat,roWorldRegion(r));assert.ok(map.paths.some(p=>p.from.x===map.spawn.x&&p.from.z===map.spawn.z));
  for(const path of map.paths)for(let t=0;t<=.90;t+=.02){const x=path.from.x+(path.to.x-path.from.x)*t,z=path.from.z+(path.to.z-path.from.z)*t;assert.ok(roTerrainSlope(map,x,z)<.65,`${r.key} at ${x},${z}`);assert.equal(bonkBlocked(map,{x,z},.5),false,`${r.key} clear avenue`);const next=bonkHeightAt(map,x+.1,z);assert.ok(Math.abs(next-bonkHeightAt(map,x,z))<.1,'no discontinuous terrace walls');}
  const arena=r.graph?r.bossArena:roWorldRegion(r).bossArena,h=bonkHeightAt(map,arena.x,arena.z);for(const [dx,dz]of [[5,0],[-5,0],[0,5],[0,-5]])assert.ok(Math.abs(bonkHeightAt(map,arena.x+dx,arena.z+dz)-h)<.05,'readable local boss floor');
 }
});

test('the same relief continues into the visual surroundings without an edge clamp or distant empty flat plane',()=>{
 for(const r of RO_WORLD_ROUTE.filter(r=>!r.biolabFloor)){const map=generateBonkLevel(52,r.scene,r.habitat,roWorldRegion(r));for(const sign of [-1,1]){const h=[];for(let d=125;d<=500;d+=12){h.push(bonkHeightAt(map,sign*d,35));h.push(bonkHeightAt(map,35,sign*d));}assert.ok(range(h)>6,`${r.key} outer relief`);assert.ok(Math.abs(bonkHeightAt(map,sign*115.19,20)-bonkHeightAt(map,sign*115.21,20))<.05,'physical limit does not cut visual height');}}
});

test('twenty seeded regional scenes per map provide recognizable biome-appropriate props with bounded cached voxel parts',()=>{
 const signatures=new Set();for(const [style,pool]of Object.entries(RO_REGION_PROP_POOLS))for(const model of pool.models){const parts=roRegionalPropParts(model,palette,0);assert.ok(parts&&parts.length>=14,model);assert.ok(parts.length<=RO_REGION_PROP_BUDGET.partsPerProp,model);assert.equal(roRegionalPropParts(model,palette,0),parts,'cached authored geometry');assert.ok(Object.isFrozen(parts)&&parts.every(Object.isFrozen));for(const part of parts){assert.ok(part.slice(0,8).every(Number.isFinite));assert.ok(part.slice(3,6).every(v=>v>0));assert.ok(part[1]-part[4]*.5>=-.35,`${model} grounded miniature`);}signatures.add(JSON.stringify(parts));}
 assert.ok(signatures.size>=22,'different silhouettes, not one square recolored');
 for(const r of RO_WORLD_ROUTE.filter(r=>!r.biolabFloor)){const map=generateBonkLevel(52,r.scene,r.habitat,roWorldRegion(r)),props=map.decorations.filter(o=>o.type==='regional-prop');assert.equal(props.length,20);assert.deepEqual(props,generateBonkLevel(52,r.scene,r.habitat,roWorldRegion(r)).decorations.filter(o=>o.type==='regional-prop'));assert.ok(new Set(props.map(o=>o.model)).size>=4);assert.ok(props.every(o=>map.obstacles.some(s=>s.id.startsWith(o.id+'-'))));}
});

test('rendered fine terrain intersects at the exact authoritative height and new scenery reuses existing instance budgets',()=>{
 const region=roWorldRegion('prontera'),map=generateBonkLevel(52,region.scene,region.habitat,region),world=createBonkWorld({scene:new T.Scene()}),state={options:{mode:'bonk'},units:[],bonk:{map,objects:map.objects,objectives:[],pickups:[],projectiles:[]}};
 try{world.update(state,1);const floor=world.root.getObjectByName('bonk-organic-ground');floor.updateMatrixWorld(true);for(const [x,z]of [[-68.3,-31.8],[25.7,75.2],[67.4,37.9],[-17.2,63.3],[1.7,93.9]]){const ray=new T.Raycaster(new T.Vector3(x,100,z),new T.Vector3(0,-1,0)),hit=ray.intersectObject(floor)[0];assert.ok(hit);assert.ok(Math.abs(hit.point.y-bonkHeightAt(map,x,z))<.0001,`${x},${z} rendered=${hit.point.y} physical=${bonkHeightAt(map,x,z)}`);}for(const name of ['bonk-landscape','bonk-ground-details','bonk-landmarks']){const mesh=world.root.getObjectByName(name);assert.ok(mesh.count<=mesh.instanceMatrix.count,name);}assert.ok(!world.root.children.some(o=>o.name.startsWith('regional-prop-')),'no per-object draw calls');const before=floor.geometry;world.update(state,2);assert.equal(floor.geometry,before);}finally{world.dispose();}
});
