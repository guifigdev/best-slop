import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createRoEquipment,roEquip,roEquipmentBonuses} from '../shared/ragnarok-equipment.js';
import {roEquipmentBagMarkup} from '../src/ro-equipment-bag-ui.js';
import {ragnarokJobSpec,buildRagnarokJobModel} from '../src/ragnarok-job-art.js';
import {createRoWeaponRig,updateRoWeaponRig} from '../src/ro-weapon-rig.js';
import {roAttackProfile} from '../shared/ro-attack-catalog.js';
import {createRoAttackArt} from '../src/ro-attack-art.js';
import {roKatarCombatPose} from '../src/ro-thief-combat.js';

const unit=(job='assassin')=>({id:1,name:'Mercenário',bonkHero:true,bonkJob:job,roLineage:'shadowcross',roTier:1,x:0,z:0,roAttackMotion:.8,roInventory:[createRoEquipment('build_1287','durga'),createRoEquipment('build_13027','scalpel'),createRoEquipment('knife','knife')],roEquipment:{weapon:'durga',offhand:null}});
const attack={id:1,type:'roAttack',source:1,time:0,skillKey:'basic',x:0,z:0,tx:0,tz:3,direction:0,range:3};

test('Katar mirrors its two-hand occupancy in the paperdoll without duplicating the physical item or bonuses',()=>{
 const u=unit(),before=structuredClone(u),bonuses=roEquipmentBonuses(u),html=roEquipmentBagMarkup(u,{selectedId:'scalpel'});
 assert.match(html,/Arma direita: Durga \[1\]/);assert.match(html,/Arma esquerda: Ocupada por Durga \[1\] · duas mãos/);assert.equal((html.match(/class="ro-hand-state">2 MÃOS/g)||[]).length,2);assert.match(html,/ro-equip-block-reason">Bloqueada por Durga \[1\] · duas mãos/);assert.equal(roEquip(u,'scalpel','offhand'),false);assert.deepEqual(u,before);assert.deepEqual(roEquipmentBonuses(u),bonuses);
 assert.ok(roEquip(u,'scalpel','weapon'));assert.ok(roEquip(u,'knife','offhand'));const dual=roEquipmentBagMarkup(u,{selectedId:'knife'});assert.match(dual,/Arma direita: Scalpel \[3\]/);assert.match(dual,/Arma esquerda: Knife \[3\]/);assert.ok(!dual.includes('shared-hand selected'));assert.equal(u.roEquipment.weapon,'scalpel');assert.equal(u.roEquipment.offhand,'knife');
});

test('equipped Katars keep two frozen shoulder rigs across Mercenary evolutions and actual item switches',()=>{
 for(const job of ['assassin','guillotinecross','shadowcross']){const u=unit(job),spec=ragnarokJobSpec(u),rig=spec.weaponRig,body=[],emitted=[];assert.equal(rig.kind,'dual-katar');assert.equal(rig.arms.length,2);assert.equal(ragnarokJobSpec(u),spec);assert.ok(Object.isFrozen(rig.arms));assert.equal(new Set(rig.indices).size,rig.indices.length);
  buildRagnarokJobModel(u,{},(_,...p)=>body.push(p),{rigged:true});for(const arm of rig.arms){assert.ok(Object.isFrozen(arm));for(const [n,p]of arm.parts.entries()){emitted.push(p);const original=spec.parts[arm.indices[n]];for(let axis=0;axis<3;axis++)assert.ok(Math.abs(p[axis]+arm.pivot[axis]-original[axis])<1e-12);}}assert.equal(body.length+emitted.length,spec.parts.length);
  assert.ok(roEquip(u,'scalpel','weapon'));assert.ok(roEquip(u,'knife','offhand'));const dual=ragnarokJobSpec(u),left=dual.weaponRig.arms.find(a=>a.key==='left');assert.notEqual(dual,spec);assert.ok(left.indices.some(i=>i>=ragnarokJobSpec({...u,roEquipment:{weapon:'scalpel'}}).parts.length),'offhand weapon is inside the moving left arm');
 }
});

test('Katar uses its own two-cut pose while a dagger keeps the short single thrust and ASPD controls duration',()=>{
 const u=unit(),body=new T.Group(),rig=createRoWeaponRig({unit:u,spec:ragnarokJobSpec(u),body,voxel:()=>{},bake:()=>{}}),profile=roAttackProfile(attack,u);assert.equal(profile.motion,'katarCross');assert.equal(profile.duration,.8);
 const right=updateRoWeaponRig(rig,u,[attack],.28),left=updateRoWeaponRig(rig,u,[attack],.44);assert.ok(right.arms.right.x<right.arms.left.x);assert.ok(left.arms.left.x<left.arms.right.x);assert.notDeepEqual(right,roKatarCombatPose(.44,.8));
 assert.ok(roEquip(u,'scalpel','weapon'));assert.equal(roAttackProfile(attack,u).motion,'daggerStreaks');const pose=updateRoWeaponRig(rig,u,[attack],.44);assert.notDeepEqual(pose,left);updateRoWeaponRig(rig,u,[],1);for(const arm of rig.arms){assert.deepEqual(arm.group.rotation.toArray(),[0,0,0,'XYZ']);assert.deepEqual(arm.group.position.toArray(),arm.pivot);}
});

test('Katar trails are bounded volumetric meshes, never the dagger billboard, and rewind and expiry clear them',()=>{
 const scene=new T.Scene(),art=createRoAttackArt({scene}),u=unit(),state={options:{mode:'bonk'},bonk:{map:{seed:1}},units:[u],effects:[attack]};art.update(state,.28,()=>2);const stats=art.stats();assert.equal(stats.instances,0,'no dagger atlas instances');assert.ok(stats.katar.instances>0);assert.equal(stats.katar.planes,0);const root=art.root.getObjectByName('ro-katar-cross-cuts');assert.equal(root.geometry.type,'BoxGeometry');assert.equal(root.material.depthWrite,false);const matrix=new T.Matrix4();for(let i=0;i<root.count;i++){root.getMatrixAt(i,matrix);assert.ok(matrix.elements.every(Number.isFinite));assert.ok(matrix.elements[13]>2.5&&matrix.elements[13]<3.4);}
 const count=root.count;root.getMatrixAt(0,matrix);const first=matrix.toArray();art.update(state,.28,()=>2);assert.equal(root.count,count);root.getMatrixAt(0,matrix);assert.deepEqual(matrix.toArray(),first);art.update(state,1);assert.equal(art.stats().katar.instances,0);art.update(state,.28,()=>2);assert.equal(art.stats().katar.instances,count);art.update(null);assert.equal(root.count,0);art.dispose();assert.equal(scene.children.length,0);
});
