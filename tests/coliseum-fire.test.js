import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {ARENAS} from '../shared/arenas.js';
import {arenaBoundaryRadius} from '../src/coliseum-architecture.js';
import {createColiseumFire,coliseumFireAnchors,COLISEUM_FIRE_BUDGET} from '../src/coliseum-fire.js';
test('Muspelheim fire stays in the lava channel and existing vents, preserving bridges and safe combat space',()=>{
 const zones=ARENAS.volcano.zones,anchors=coliseumFireAnchors(zones);assert.ok(anchors.length>12&&anchors.length<=COLISEUM_FIRE_BUDGET.sources);
 for(const p of anchors)assert.ok(Math.hypot(p.x,p.z)>arenaBoundaryRadius(p.x,p.z)&&Math.min(Math.abs(p.x),Math.abs(p.z))>3.8||zones.some(z=>Math.hypot(z.x-p.x,z.z-p.z)<z.r));
});
test('many campfires share three bounded batches, pause with time and dispose without releasing another campfire',()=>{
 const fire=createColiseumFire(),options={enabled:true,zones:ARENAS.volcano.zones};fire.update(1,options);assert.equal(fire.root.children.length,3);assert.equal(fire.stats().drawCalls,3);assert.equal(fire.stats().lights,0);
 const mesh=fire.root.children[0],before=Array.from(mesh.instanceMatrix.array);fire.update(1.01,options);assert.deepEqual(Array.from(mesh.instanceMatrix.array),before);fire.update(1.2,options);assert.notDeepEqual(Array.from(mesh.instanceMatrix.array),before);
 for(const mesh of fire.root.children){assert.ok(mesh.count<=mesh.instanceMatrix.count);assert.ok(Array.from(mesh.instanceMatrix.array).every(Number.isFinite));assert.equal(mesh.castShadow,false);}
 fire.update(2,{enabled:false});assert.equal(fire.root.visible,false);assert.equal(fire.stats().drawCalls,0);const scene=new T.Scene();scene.add(fire.root);fire.dispose();fire.dispose();assert.equal(scene.children.length,0);
});
