import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createVoxelFire,VOXEL_FIRE_BUDGET} from '../src/voxel-fire.js';
import {createStatusEffects} from '../src/status-effects.js';
test('volumetric fire is deterministic seeded cube geometry with bounded flames, smoke and embers',()=>{
 const parent=new T.Group(),a=createVoxelFire(parent,{seed:17,scale:.6}),b=createVoxelFire(parent,{seed:17,scale:.6,smoke:false});try{
  a.update(2.5);b.update(2.5);const [flames,smoke,embers]=a.root.children;assert.equal(flames.count,VOXEL_FIRE_BUDGET.flames);assert.equal(smoke.count,4);assert.equal(embers.count,5);assert.equal(b.root.children[1].count,0);assert.deepEqual([...flames.instanceMatrix.array],[...b.root.children[0].instanceMatrix.array]);assert.equal(flames.geometry.type,'BoxGeometry');assert.equal(flames.geometry,b.root.children[0].geometry);assert.equal(flames.material,b.root.children[0].material);
  const matrix=new T.Matrix4(),position=new T.Vector3(),rotation=new T.Quaternion(),scale=new T.Vector3(),depth=[];for(let i=0;i<flames.count;i++){flames.getMatrixAt(i,matrix);matrix.decompose(position,rotation,scale);assert.ok([position.x,position.y,position.z,scale.x,scale.y,scale.z].every(Number.isFinite));assert.ok(scale.z>0);depth.push(position.z);}assert.ok(Math.max(...depth)-Math.min(...depth)>.3,'fire occupies real depth around the actor');
  const before=[...flames.instanceMatrix.array];a.update(3);assert.notDeepEqual([...flames.instanceMatrix.array],before);a.update(3,{enabled:false});assert.equal(a.root.visible,false);a.update(3,{enabled:true,scale:.8});assert.equal(a.root.visible,true);assert.equal(a.root.scale.x,.8);
 }finally{a.dispose();b.dispose();}assert.equal(parent.children.length,0);
});
test('shared fire resources survive one owner disposing and are freed exactly once by the last owner',()=>{
 const parent=new T.Group(),a=createVoxelFire(parent),b=createVoxelFire(parent);let releases=0;const geometry=a.root.children[0].geometry,materials=new Set(a.root.children.map(m=>m.material));geometry.addEventListener('dispose',()=>releases++);for(const m of materials)m.addEventListener('dispose',()=>releases++);
 a.dispose();a.dispose();assert.equal(releases,0);b.update(4);assert.ok(b.root.children[0].instanceMatrix.array.every(Number.isFinite));b.dispose();assert.equal(releases,1+materials.size);assert.equal(parent.children.length,0);
});
test('persistent statuses use volumetric fire while preserving independent frost, poison and expiry without mutating the unit',()=>{
 const a=new T.Group(),b=new T.Group(),fx=createStatusEffects(a),other=createStatusEffects(b),unit={alive:true,dots:{burn:{until:12},poison:{until:14}},frostUntil:16},saved=JSON.stringify(unit);try{
  fx.update(unit,10);other.update(unit,10);const group=a.getObjectByName('persistent-status-effects'),[fire,frost,poison]=group.children;assert.equal(fire.name,'voxel-fire');assert.equal(fire.children[0].geometry.type,'BoxGeometry');assert.ok(fire.visible&&frost.visible&&poison.visible);assert.equal(frost.geometry,b.getObjectByName('persistent-status-effects').children[1].geometry);assert.equal(JSON.stringify(unit),saved);
  fx.update(unit,13);assert.equal(fire.visible,false);assert.ok(frost.visible&&poison.visible);fx.update(unit,15);assert.ok(frost.visible);assert.equal(poison.visible,false);fx.update(unit,17);assert.equal(group.visible,false);fx.update(unit,10,false);assert.equal(group.visible,false);
 }finally{fx.dispose();other.dispose();}assert.equal(a.children.length,0);assert.equal(b.children.length,0);
});
