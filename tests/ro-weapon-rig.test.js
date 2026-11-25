import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {ragnarokJobSpec,buildRagnarokJobModel} from '../src/ragnarok-job-art.js';
import {createRoWeaponRig,updateRoWeaponRig,roSwordPose} from '../src/ro-weapon-rig.js';

test('sword shoulder rig separates the actual arm and weapon without changing the authored sculpture',()=>{
 for(const job of ['swordsman','knight','runeknight','dragonknight']){const spec=ragnarokJobSpec(job),emitted=[],rig=spec.weaponRig;assert.ok(rig&&rig.indices.length>10);assert.ok(Object.isFrozen(rig)&&rig.parts.every(Object.isFrozen));buildRagnarokJobModel({bonkHero:true,bonkJob:job},{},(_,...p)=>emitted.push(p),{rigged:true});assert.equal(emitted.length+rig.parts.length,spec.parts.length);assert.ok(rig.parts.some(p=>p[1]+rig.pivot[1]>1.8),'weapon blade belongs to the shoulder rig');assert.ok(rig.parts.some(p=>p[1]+rig.pivot[1]<.8),'right arm follows the weapon');for(let i=0;i<rig.parts.length;i++){const original=spec.parts[rig.indices[i]],part=rig.parts[i];for(let axis=0;axis<3;axis++)assert.ok(Math.abs(part[axis]+rig.pivot[axis]-original[axis])<1e-12);assert.deepEqual(part.slice(3),original.slice(3));}}
 for(const job of ['crusader','imperialguard'])assert.equal(ragnarokJobSpec(job).weaponRig.kind,'thrust');
 for(const job of ['archmage','windhawk'])assert.equal(ragnarokJobSpec(job).weaponRig,null);
});

test('overhead sword pose raises and pulls down on the vertical axis without any horizontal spin',()=>{
 const before=roSwordPose(.12,.6),impact=roSwordPose(.40,.6);assert.ok(before.x<-.6);assert.ok(impact.x>1.1);for(let i=0;i<=60;i++){const p=roSwordPose(i/100,.6);assert.ok([p.x,p.y,p.z].every(Number.isFinite));assert.equal(p.y,0);assert.ok(Math.abs(p.z)<=.06);}assert.deepEqual(roSwordPose(-1),{x:0,y:0,z:0,active:false});assert.deepEqual(roSwordPose(.7),{x:0,y:0,z:0,active:false});
});

test('repeated strikes animate one cached shoulder group and never move the whole body',()=>{
 const unit={id:7,bonkHero:true,bonkJob:'knight',roLineage:'dragonknight'},spec=ragnarokJobSpec('knight'),body=new T.Group();let voxels=0,bakes=0;body.position.set(2,3,4);const rig=createRoWeaponRig({unit,spec,body,voxel:()=>voxels++,bake:(_group,key)=>{bakes++;assert.equal(key,'ro-shoulder-sword-knight');}}),count=voxels,pivot=rig.group.position.toArray();assert.equal(body.children.length,1);for(let i=0;i<100;i++){const age=(i%50)/100;updateRoWeaponRig(rig,unit,[{id:i,type:'roAttack',source:7,time:0,skillKey:'bash',range:6}],age);}assert.equal(voxels,count);assert.equal(bakes,1);assert.deepEqual(body.position.toArray(),[2,3,4]);assert.deepEqual(rig.group.position.toArray(),pivot);assert.equal(rig.group.rotation.y,0);updateRoWeaponRig(rig,unit,[],1);assert.deepEqual(rig.group.rotation.toArray(),[0,0,0,'XYZ']);assert.equal(createRoWeaponRig({unit:{hero:'knight'},spec,body,voxel:()=>assert.fail(),bake:()=>assert.fail()}),null);
});
