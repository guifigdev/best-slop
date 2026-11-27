import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createRoSolidHitArt,roHitSparkParts,roWeaponStrokeParts,RO_SOLID_HIT_BUDGET as B} from '../src/ro-solid-hit-art.js';
import {createRoAttackArt} from '../src/ro-attack-art.js';
import {createRoEquipment} from '../shared/ragnarok-equipment.js';
import {roAttackProfile} from '../shared/ro-attack-catalog.js';

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

test('an equipped sword leaves a connected curved ribbon with a blue body and white edge, including at maximum ASPD',()=>{
 const gear=createRoEquipment('sword','s'),u={...source,roInventory:[gear],roEquipment:{weapon:'s'},roAttackMotion:.07},e={...stroke,skillKey:'basic'},profile=roAttackProfile(e,u);assert.equal(profile.duration,.07,'combat timing remains unchanged');const parts=roWeaponStrokeParts(e,1.09,u);assert.equal(parts.length,36);assert.equal(new Set(parts.map(p=>p[6])).size,2);assert.ok(Math.max(...parts.map(p=>p[1]))-Math.min(...parts.map(p=>p[1]))>.8,'a full overhead arc is visible');assert.ok(parts.some(p=>p[5]>.2),'the ribbon has visible width');
 for(let i=2;i<parts.length;i+=2){const a=parts[i-2],b=parts[i],gap=Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);assert.ok(gap<=(a[4]+b[4])*.5,'neighboring volumes overlap instead of leaving detached arrows');}const late=roWeaponStrokeParts(e,1.23,u);assert.ok(late.length>0&&late[0][7]<parts[0][7],'the trail persists and fades after the fast attack');assert.deepEqual(roWeaponStrokeParts(e,1.30,u),[]);
});

test('the ribbon stays at the original swing position, rotates with its target and keeps a finite orthogonal 3D basis',()=>{
 for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2]){const e={...stroke,skillKey:'bash',direction:yaw},parts=roWeaponStrokeParts(e,1.30,{...source,x:20,z:30},()=>4);assert.ok(parts.length>0);for(const p of parts){assert.ok(p.slice(0,8).every(Number.isFinite));assert.ok(Math.hypot(p[0],p[2])<2.2);assert.ok(p[1]>4);const tangent=new T.Vector3().fromArray(p[8]).normalize(),normal=new T.Vector3().fromArray(p[9]);assert.ok(Math.abs(tangent.dot(normal))<1e-6);}}
});

test('sixteen complete sword ribbons plus twenty-four hits fit the existing shared GPU budgets',()=>{
 const scene=new T.Scene(),art=createRoSolidHitArt({scene}),gear=createRoEquipment('sword','s'),u={...source,roInventory:[gear],roEquipment:{weapon:'s'},roAttackMotion:.07},effects=[...Array.from({length:B.strokes},(_,i)=>({...stroke,id:100+i,skillKey:'basic'})),...Array.from({length:B.hits},(_,i)=>({...damage,id:200+i,time:1.04}))];try{art.update({options:{mode:'bonk'},units:[u,target],effects},1.09);assert.equal(art.stats().particles,B.strokes*36+B.hits*16);assert.ok(art.stats().particles<=B.instances);assert.equal(art.stats().drawCalls,2);assert.equal(art.stats().planes,0);for(const mesh of scene.children){assert.equal(mesh.material.map,null);assert.equal(mesh.material.depthTest,true);}}finally{art.dispose();}
});
