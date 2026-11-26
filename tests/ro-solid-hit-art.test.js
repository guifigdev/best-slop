import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createRoSolidHitArt,roHitSparkParts,roWeaponStrokeParts,RO_SOLID_HIT_BUDGET as B} from '../src/ro-solid-hit-art.js';
import {createRoAttackArt} from '../src/ro-attack-art.js';

const source={id:1,bonkHero:true,alive:true,x:0,z:0,facing:0,roLineage:'dragonknight'},target={id:2,bonkEnemy:true,alive:true,x:0,z:1.8,size:1.3,collisionRadius:.6},damage={id:7,time:1,type:'damage',target:2,source:1,amount:20},stroke={id:8,time:1,type:'roAttack',bonk:true,source:1,target:2,skillKey:'bash',attackKind:'slash',x:0,z:0,tx:0,tz:1.8,hitX:0,hitZ:1.2,direction:0,range:2.1};
test('hit particles form a small luminous cross on the real body contact, spread and fade without a floor ring or periodic spam',()=>{
 const parts=roHitSparkParts(damage,1.04,target,source,()=>3),late=roHitSparkParts(damage,1.18,target,source,()=>3);assert.equal(parts.length,16);assert.ok(parts.every(p=>p[1]>3.5));assert.ok(parts.every(p=>Math.abs(p[0])<.4));assert.ok(parts.every((p,i)=>p[7]>late[i][7]));for(const patch of [{periodic:true},{amount:0},{miss:true}])assert.deepEqual(roHitSparkParts({...damage,...patch},1.1,target,source),[]);assert.deepEqual(roHitSparkParts(damage,1.3,target,source),[]);assert.deepEqual(roHitSparkParts(damage,1.1,{...target,bonkEnemy:false},source),[]);
});
test('Bash and other weapon strokes become finite 3D trails that follow weapon contact rather than camera-oriented textures',()=>{
 const parts=roWeaponStrokeParts(stroke,1.30,source,()=>3);assert.ok(parts.length>=8);assert.ok(parts.every(p=>p.slice(0,8).every(Number.isFinite)));assert.ok(parts.every(p=>p[1]>3&&Math.hypot(p[0],p[2])<2.2));assert.deepEqual(roWeaponStrokeParts(stroke,2,source),[]);
});
test('the live renderer replaces sword sprite flashes with bounded geometry and spark halos and disposes its batches',()=>{
 const scene=new T.Scene(),art=createRoAttackArt({scene,solidHits:true}),state={options:{mode:'bonk'},bonk:{map:{seed:1}},units:[source,target],effects:[stroke,{...damage,time:1.28}]};try{art.update(state,1.32,()=>0);assert.equal(art.stats().atlasBytes,0);assert.ok(art.stats().solid.particles>20);assert.ok(art.stats().solid.glows>0);assert.equal(art.stats().solid.planes,0);const before=structuredClone(state);art.update({...state,effects:Array.from({length:500},(_,i)=>({...damage,id:i,time:1.28}))},1.32);assert.ok(art.stats().solid.particles<=B.instances);assert.ok(art.stats().solid.drawCalls<=2);for(const m of art.root.children.filter(m=>m.isInstancedMesh)){assert.equal(m.material.map,null);assert.equal(m.geometry.type,'BoxGeometry');}assert.deepEqual(state,before);}finally{art.dispose();}assert.equal(scene.children.length,0);
});
