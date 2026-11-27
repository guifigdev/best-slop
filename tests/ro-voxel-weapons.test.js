import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {RO_EQUIPMENT,createRoEquipment} from '../shared/ragnarok-equipment.js';
import {roVoxelWeapon,RO_VOXEL_WEAPON_BUDGET} from '../src/ro-voxel-weapons.js';
import {actorModelKey} from '../src/actor-identity.js';
import {ragnarokJobSpec} from '../src/ragnarok-job-art.js';
import {createRoWeaponRig,updateRoWeaponRig} from '../src/ro-weapon-rig.js';
import {roMeleeTip,roMeleeTipPoint} from '../src/ro-melee-motion.js';
import {roAttackProfile} from '../shared/ro-attack-catalog.js';
import {createRoCartRevolutionArt,roCartRevolutionParts,RO_CART_ART_BUDGET} from '../src/ro-cart-revolution-art.js';
test('all 138 equipped weapons have cached finite solid sculptures, with metal and wood relief instead of billboard planes',()=>{
 const weapons=Object.values(RO_EQUIPMENT).filter(d=>d.slot==='weapon');assert.equal(weapons.length,138);
 for(const d of weapons){const model=roVoxelWeapon(d.key);assert.equal(model,roVoxelWeapon(d.key));assert.equal(model.key,d.key);assert.equal(model.planes,0);assert.ok(model.parts.length>15&&model.parts.length<=RO_VOXEL_WEAPON_BUDGET.parts,d.key);assert.ok(Object.isFrozen(model)&&Object.isFrozen(model.parts));assert.ok(new Set(model.parts.map(p=>p[6])).size>=3);for(const p of model.parts){assert.ok(p.every(Number.isFinite),d.key);assert.ok(p.slice(3,6).every(v=>v>0));}}
 const u={bonkHero:true,bonkJob:'knight',roInventory:[createRoEquipment('sword','a'),createRoEquipment('katana','b')],roEquipment:{weapon:'a'}};const a=actorModelKey(u),spec=ragnarokJobSpec(u);u.roEquipment.weapon='b';assert.notEqual(actorModelKey(u),a);assert.notEqual(ragnarokJobSpec(u),spec);
});
test('the drawn sword tip and its afterimage use the same articulated shoulder and wrist throughout the swing',()=>{
 const item=createRoEquipment('sword','s'),u={id:1,bonkHero:true,roLineage:'dragonknight',bonkJob:'knight',roInventory:[item],roEquipment:{weapon:item.id},roAttackMotion:.49},spec=ragnarokJobSpec(u),body=new T.Group(),rig=createRoWeaponRig({unit:u,spec,body,voxel:()=>{},bake:()=>{}}),e={type:'roAttack',time:0,source:1,skillKey:'basic',attackKind:'slash'};
 assert.ok(rig.wrist);const duration=roAttackProfile(e,u).duration;
 for(const p of [.22,.35,.5,.67]){const t=p*duration;updateRoWeaponRig(rig,u,[e],t);body.updateMatrixWorld(true);const actual=new T.Vector3(...roMeleeTip(u)).applyMatrix4(rig.wrist.matrixWorld),expected=new T.Vector3(...roMeleeTipPoint(u,t,duration));assert.ok(actual.distanceTo(expected)<1e-9);}
 assert.ok(Math.abs(rig.wrist.rotation.x)>3);updateRoWeaponRig(rig,{...u,roMining:{started:0}},[e],.3);assert.equal(rig.group.visible,false);
});
test('Cart Revolution is a moving physical cart with wheels, an axle and planks, and removes the old ground flash',()=>{
 const e={id:1,type:'roAttack',skillKey:'cartrevolution',time:0,x:0,z:0,direction:0},a=roCartRevolutionParts(e,.15),b=roCartRevolutionParts(e,.4);assert.ok(a.length>45&&a.length<96);assert.notDeepEqual(a,b);for(const p of a){assert.ok(p.every(Number.isFinite));assert.ok(p.slice(3,6).every(v=>v>0));assert.ok(Math.hypot(p[0],p[2])<2.1);}assert.deepEqual(roCartRevolutionParts(e,.8),[]);
 const scene=new T.Scene(),art=createRoCartRevolutionArt({scene}),state={options:{mode:'bonk'},effects:[e,{...e,type:'abilityPulse',id:2},{id:3,type:'damage',skillKey:'cartrevolution',amount:12}]};try{art.update(state,.3,()=>0);assert.ok(art.stats().instances>0&&art.stats().instances<=RO_CART_ART_BUDGET.instances);assert.equal(art.stats().drawCalls,1);assert.equal(art.stats().planes,0);assert.deepEqual(art.legacyState(state).effects,[state.effects[2]]);assert.equal(state.effects.length,3);}finally{art.dispose();}assert.equal(scene.children.length,0);
});
