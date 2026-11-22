import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {stoneRockParts,stoneColumnParts,stoneRuneParts,STONE_ROCK_PART_BUDGET} from '../src/stone-landmark-art.js';
import {createScenery,sceneryRenderParts} from '../src/scenery.js';
import {SCENERY_ASSETS,sceneryObstacles} from '../shared/scenery.js';

test('fractured stone masses vary by seed while every voxel remains grounded and within the original footprint',()=>{
 const shapes=new Set();for(let seed=0;seed<64;seed++){const parts=stoneRockParts({id:'stone-'+seed,w:3.6,d:2.8,h:4.1,biome:'crypt'});assert.ok(parts.length>60&&parts.length<=STONE_ROCK_PART_BUDGET);for(const [x,y,z,w,h,d,c]of parts){assert.ok([x,y,z,w,h,d,c].every(Number.isFinite));assert.ok(w>0&&h>0&&d>0);assert.ok(Math.abs(x)+w/2<=1.8+1e-6);assert.ok(Math.abs(z)+d/2<=1.4+1e-6);assert.ok(y-h/2>=0);assert.ok(y+h/2<=4.1+1e-6);}shapes.add(JSON.stringify(parts));assert.deepEqual(parts,stoneRockParts({id:'stone-'+seed,w:3.6,d:2.8,h:4.1,biome:'crypt'}));}assert.ok(shapes.size>16&&shapes.size<=32,'bounded shape variants instead of one unique geometry per object');
});

test('ice caps, moss and basalt strata retain biome identity without affecting rock topology',()=>{
 const forest=stoneRockParts({id:'same',biome:'forest'}),ice=stoneRockParts({id:'same',biome:'frost'}),forge=stoneRockParts({id:'same',biome:'forge'});assert.deepEqual(forest.map(p=>p.slice(0,6)),ice.map(p=>p.slice(0,6)));assert.notDeepEqual(forest,ice);assert.notDeepEqual(ice,forge);assert.ok(new Set(forest.map(p=>p[6])).size>=4);
});

test('carved columns have fluted shafts and distinct broken capitals, and rune monuments fit their collider',()=>{
 const a=stoneColumnParts({id:'pillar'}),b=stoneColumnParts({id:'pillar',broken:true});assert.ok(a.length>=30&&a.length<50);assert.notDeepEqual(a,b);assert.ok(new Set(a.map(p=>p[1])).size>9);for(const make of[stoneColumnParts,stoneRuneParts]){const parts=make({w:1.2,d:.9,h:2.3});for(const [x,y,z,w,h,d]of parts){assert.ok(Math.abs(x)+w/2<=.6+1e-6);assert.ok(Math.abs(z)+d/2<=.45+1e-6);assert.ok(y-h/2>=0&&y+h/2<=2.3+1e-6);}}
});

test('all shared arena landmarks use one stable instanced batch while authoritative obstacles retain old dimensions',()=>{
 const scene=new T.Scene(),view=createScenery({scene}),descriptors=[{id:'stone',kind:'boulder',x:0,z:0},{id:'rune',kind:'runestone',x:3,z:0}];try{const before=sceneryObstacles(descriptors);view.update(descriptors);const mesh=scene.children[0].children[0];assert.equal(scene.children[0].children.length,1);assert.equal(mesh.count,descriptors.reduce((n,p)=>n+sceneryRenderParts(p).length,0));assert.ok(mesh.count>SCENERY_ASSETS.boulder.parts.length+SCENERY_ASSETS.runestone.parts.length);view.update(descriptors);assert.equal(scene.children[0].children[0],mesh);assert.deepEqual(sceneryObstacles(descriptors),before);}finally{view.dispose();}assert.equal(scene.children.length,0);
});
