import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createFrozenBlockGeometry,frozenBlockSize,frozenTimeRemaining} from '../src/frozen-unit-art.js';
import {createIceElementArt} from '../src/ice-element-art.js';
import {createRoEffectVoxels,RO_EFFECT_VOXEL_BUDGET as B} from '../src/ro-effect-voxels.js';
import {bonkFallingLeaves,bonkLeafTrajectory} from '../src/bonk-tree-art.js';
import {createFoliageWindMaterial,updateFoliageWind} from '../src/foliage-wind.js';

test('freeze encases the entire actor in a closed chamfered block across modes, expires cleanly, and frost slow alone is not freeze',()=>{
 const g=createFrozenBlockGeometry();assert.equal(g.attributes.position.count,192);assert.ok([...g.attributes.normal.array].every(Number.isFinite));assert.equal(g.boundingBox.min.y,0);assert.equal(g.boundingBox.max.y,1);g.dispose();
 const scene=new T.Scene(),a=createIceElementArt({scene}),unit={id:1,hero:'knight',bonkHero:true,alive:true,x:2,z:3,size:1,wlFrozenUntil:5},matrix=new T.Matrix4(),p=new T.Vector3(),q=new T.Quaternion(),scale=new T.Vector3();
 try{for(const mode of ['warlock','bonk','campaign','castlefight']){a.reset();a.update({options:{mode},units:[unit]},1,()=>2);assert.equal(a.stats().frozen,1);a.frozen.getMatrixAt(0,matrix);matrix.decompose(p,q,scale);assert.ok(Math.abs(p.y-2.025)<.0001);assert.ok(scale.y>1.9&&scale.x>1);const size=frozenBlockSize(unit);assert.ok(Math.abs(size.width-scale.x)<1e-6&&Math.abs(size.height-scale.y)<1e-6&&Math.abs(size.depth-scale.z)<1e-6);}a.update({units:[unit]},5);assert.equal(a.stats().frozen,0);assert.equal(frozenTimeRemaining({...unit,alive:false},{},1),0);assert.equal(frozenTimeRemaining({x:0,z:0,wlFrostUntil:5},{},1),0);}finally{a.dispose();}assert.equal(scene.children.length,0);
});

test('native sprite voxels skip transparent texels, retain real box depth, upload each frame, respect budgets and release resources',()=>{
 const root=new T.Group(),a=createRoEffectVoxels(root),quad=[[-1,2,0],[1,2,0],[1,0,0],[-1,0,0]],pixels=new Uint8Array(16*16*4).fill(255),texture={x:0,y:0,w:16,h:16};
 try{a.begin();const empty=new Uint8Array(pixels.length);assert.equal(a.add(quad,texture,empty,16,[255,255,255,255]),0);assert.ok(a.add(quad,texture,pixels,16,[255,255,255,255],{budget:100})>0);a.end();const mesh=root.children[0];assert.equal(mesh.geometry.type,'BoxGeometry');assert.ok(mesh.instanceMatrix.version>0);assert.ok(mesh.instanceColor.version>0);assert.ok(mesh.instanceMatrix.array[10]>.01);assert.ok([...mesh.instanceMatrix.array].every(Number.isFinite));const version=mesh.instanceMatrix.version;a.begin();for(let i=0;i<100;i++)a.add(quad,texture,pixels,16,[255,255,255,255],{budget:500});a.end();assert.ok(mesh.instanceMatrix.version>version);assert.ok(a.stats().instances<=B.instances);assert.ok(a.stats().drawCalls<=B.drawCalls);}finally{a.dispose();}assert.equal(root.children.length,0);
});

test('Amatsu petals drift and tumble from real canopies independently of the observer, with a bounded pink shower and stronger wind without recompiling',()=>{
 const emitters=Array.from({length:8},(_,i)=>({id:'sakura-'+i,x:i*2,z:0,y:7,height:7,radius:2,seed:i+9})),options={sakura:true};let max=0,particle;
 for(let t=0;t<30;t+=.2){const parts=bonkFallingLeaves(emitters,t,{x:0,z:0},options);assert.ok(parts.length<=128);assert.ok(parts.every(p=>[0xf5c4d5,0xe8a0bd,0xffdce6,0xd78eaa].includes(p[6])));max=Math.max(max,parts.length);const p=bonkLeafTrajectory(emitters[0],t,0,options);if(p.alive&&!p.grounded&&p.age<2)particle=p;}
 assert.ok(max>40);assert.ok(particle);const next=bonkLeafTrajectory(emitters[0],particle.emittedAt+particle.age+.2,0,options);assert.ok(next.position.y<particle.position.y);assert.ok(next.position.x>particle.position.x);assert.notEqual(next.rotation.z,particle.rotation.z);assert.deepEqual(bonkFallingLeaves([emitters[0]],10,{x:0,z:0},options),bonkFallingLeaves([emitters[0]],10,{x:3,z:2},options));
 const m=createFoliageWindMaterial({strength:.2,coherent:true}),key=m.customProgramCacheKey();updateFoliageWind(m,2,{strength:.5});assert.equal(m.userData.foliageWind.amplitude.value,.5);assert.equal(m.customProgramCacheKey(),key);updateFoliageWind(m,3);assert.equal(m.userData.foliageWind.amplitude.value,.2);m.dispose();
});
