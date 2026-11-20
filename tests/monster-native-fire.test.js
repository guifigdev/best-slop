import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createMonsterNativeFire,MONSTER_NATIVE_FIRE_BUDGET as B} from '../src/monster-native-fire.js';
const anchors=()=>[{x:0,y:1,z:1,scale:.7},{x:.5,y:1.2,z:-.5,scale:.6},{x:-.5,y:1.2,z:0,scale:.8}];
const snapshot=units=>({options:{mode:'bonk'},units});
const firstPosition=mesh=>{const matrix=new T.Matrix4();mesh.getMatrixAt(0,matrix);return new T.Vector3().setFromMatrixPosition(matrix);};
test('native fire batches stay finite and bounded across hordes, animate at eight hertz and never mutate the units',()=>{
 const scene=new T.Scene(),fx=createMonsterNativeFire({scene}),units=Array.from({length:70},(_,i)=>({id:i+1,x:i,z:i%4,alive:true,size:1,facing:i*.2})),saved=JSON.stringify(units);try{
  fx.update(snapshot(units),3,()=>0,anchors);assert.deepEqual(fx.stats(),{creatures:32,anchors:96,flames:576,embers:192,drawCalls:2});assert.equal(fx.root.children.length,2);assert.ok(fx.root.children.every(m=>m.isInstancedMesh&&m.instanceMatrix.array.every(Number.isFinite)));
  const before=[...fx.root.children[0].instanceMatrix.array];fx.update(snapshot(units),3.05,()=>0,anchors);assert.deepEqual([...fx.root.children[0].instanceMatrix.array],before);fx.update(snapshot(units),3.25,()=>0,anchors);assert.notDeepEqual([...fx.root.children[0].instanceMatrix.array],before);assert.equal(JSON.stringify(units),saved);
  units.forEach(u=>u.alive=false);fx.update(snapshot(units),3.25,()=>0,anchors);assert.equal(fx.root.visible,false);assert.equal(fx.stats().anchors,0);
 }finally{fx.dispose();}assert.equal(scene.children.length,0);assert.equal(B.drawCalls,2);
});
test('local fire anchors rotate with facing, scale with body and follow flight and ground height',()=>{
 const scene=new T.Scene(),a=createMonsterNativeFire({scene}),b=createMonsterNativeFire({scene}),u={id:19,x:4,z:7,alive:true,size:2,facing:0},one=()=>[{x:0,y:1,z:1,scale:.6}];try{
  a.update(snapshot([u]),0,()=>3,one);b.update(snapshot([{...u,facing:Math.PI/2,flying:true,altitude:2.3}]),0,()=>3,one);const pa=firstPosition(a.root.children[0]),pb=firstPosition(b.root.children[0]);assert.ok(Math.abs(pb.x-pa.x-2)<.0001);assert.ok(Math.abs(pb.z-pa.z+2)<.0001);assert.ok(Math.abs(pb.y-pa.y-2.3)<.0001);
 }finally{a.dispose();b.dispose();}
});
test('mode changes, rewinds, absent art and disposal clear stale fire without per-actor resource allocation',()=>{
 const scene=new T.Scene(),fx=createMonsterNativeFire({scene}),u={id:1,x:0,z:0,alive:true},state=snapshot([u]);let disposed=0;const meshes=[...fx.root.children];for(const resource of new Set(meshes.flatMap(m=>[m.geometry,m.material])))resource.addEventListener('dispose',()=>disposed++);
 fx.update(state,20,()=>0,anchors);const buffers=meshes.map(m=>m.instanceMatrix);fx.update({...state,options:{mode:'dungeon'}},1,()=>0,anchors);assert.equal(fx.stats().flames,18);assert.deepEqual(meshes.map(m=>m.instanceMatrix),buffers);fx.update(state,.5,()=>0,()=>[]);assert.equal(fx.stats().drawCalls,0);assert.equal(fx.root.visible,false);fx.update(null,0);assert.equal(fx.stats().flames,0);fx.dispose();fx.dispose();assert.equal(disposed,3);assert.equal(scene.children.length,0);
});
