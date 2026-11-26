import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Game} from '../shared/simulation.js';
import {advanceRoJob,RO_SKILLS} from '../shared/ragnarok-jobs.js';
import {roRollingCutterRadius,roRollingCutterPose,RO_ROLLING_CUTTER_DURATION as D} from '../shared/ro-rolling-cutter.js';
import {roSkillTargetRange} from '../shared/ro-skill-range.js';
import {roSkillStatus} from '../shared/ro-skill-controls.js';
import {bonkStats} from '../shared/bonk.js';
import {createRoRollingCutterArt,RO_ROLLING_CUTTER_BUDGET as B} from '../src/ro-rolling-cutter-art.js';
import {updateRoWeaponRig} from '../src/ro-weapon-rig.js';
import {roGroundAreas} from '../src/ro-ground-area-art.js';

const cast=(extra={})=>({id:1,type:'roAttack',bonk:true,source:7,skillKey:'rollingcutter',attackKind:'pulse',time:1,spinStart:1,x:0,z:0,radius:2,range:2,...extra});
const hero={id:7,bonkHero:true,alive:true,x:0,z:0,facing:0,size:1};
test('Rolling Cutter turns the hero and both attached blade arms, chaining spins without resetting the phase',()=>{
 const e=cast(),a=roRollingCutterPose(hero,[e],1.1),b=roRollingCutterPose(hero,[e],1.2);assert.ok(b.turn>a.turn);
 const next=cast({id:2,time:1.2}),continued=roRollingCutterPose(hero,[e,next],1.201);assert.ok(Math.abs(continued.turn-b.turn)<.03);assert.equal(continued.alpha,1);
 const arms=['right','left'].map(key=>({key,group:new T.Group(),pivot:[key==='right'?.4:-.4,1,0]})),rig={arms};
 const pose=updateRoWeaponRig(rig,hero,[e],1.1);assert.equal(pose.turn,a.turn);assert.ok(arms.every(arm=>Math.abs(arm.group.rotation.y)>1));assert.ok(arms[0].group.rotation.z*arms[1].group.rotation.z<0);for(const arm of arms){arm.group.updateMatrixWorld(true);const tip=new T.Vector3(0,-.3,.67).applyMatrix4(arm.group.matrixWorld);assert.ok(arm.key==='right'?tip.x>.8:tip.x<-.8,'the actual blade extends outward from the torso');}
 assert.equal(roRollingCutterPose(hero,[e],1+D),null);assert.equal(roRollingCutterPose({...hero,alive:false},[e],1.1),null);
 const end=roRollingCutterPose(hero,[e],1+D-.00001);assert.ok(Math.abs(end.turn-Math.PI*2)<.001,'single spins settle back to the original facing');
});
test('the rank-dependent melee radius is shared by readiness, authoritative hits, cast geometry and hover range',()=>{
 assert.deepEqual([1,2,3,4,5].map(roRollingCutterRadius),[1,1,2,2,3]);
 const g=new Game(617,{mode:'bonk',bonkLineage:'shadowcross'});g.addPlayer('p','raccoon');g.command('p',{type:'bkReady'});const u=g.player('p');advanceRoJob(u,2);u.bonkBuild.weapons={basic:1,rollingcutter:3};u.bonkSkillSlots=['basic','rollingcutter'];u.bonkSkillAuto={basic:false,rollingcutter:false};u.mana=500;
 const enemy=(id,d)=>({id,bonkEnemy:true,alive:true,team:100,x:u.x,z:u.z+d,hp:10000,maxHp:10000,collisionRadius:.2,damage:0,speed:0}),near=enemy(9001,1.5),far=enemy(9002,4);g.units=[u,near,far];g.bonk.map.obstacles=[];g.effects=[];g.random=()=>.1;
 assert.ok(roSkillStatus(g,u,'rollingcutter',bonkStats(u)).ready);assert.ok(g.command('p',{type:'bkCast',key:'rollingcutter'}));assert.ok(near.hp<10000);assert.equal(far.hp,10000);assert.equal(near.z,u.z+1.5,'the spin does not shove victims out of melee');
 const event=g.effects.find(e=>e.type==='roAttack');assert.equal(event.radius,roSkillTargetRange(RO_SKILLS.rollingcutter,bonkStats(u),3));assert.ok(event.radius<3);assert.equal(event.spinStart,event.time);assert.ok(!g.effects.some(e=>e.type==='abilityPulse'));
});
test('Rolling Cutter uses opposite steel trails above the ground, follows the caster and clears on expiry',()=>{
 const scene=new T.Scene(),art=createRoRollingCutterArt({scene}),state={options:{mode:'bonk'},units:[hero],effects:[cast()]},matrix=new T.Matrix4();
 try{art.update(state,1.1,()=>3);assert.equal(art.stats().casters,1);assert.ok(art.stats().instances>0&&art.stats().instances<=B.instances);assert.equal(art.stats().planes,0);assert.equal(art.stats().drawCalls,1);
  const mesh=scene.getObjectByName('ro-rolling-cutter-blade-trails');mesh.getMatrixAt(0,matrix);assert.ok(matrix.elements[13]>3.9);const x=matrix.elements[12];art.update({...state,units:[{...hero,x:5}]},1.1,()=>3);mesh.getMatrixAt(0,matrix);assert.ok(Math.abs(matrix.elements[12]-x-5)<1e-5);
  art.update(state,2,()=>3);assert.equal(art.stats().instances,0);
  const pulse={...cast(),type:'abilityPulse'};assert.deepEqual(roGroundAreas({options:{mode:'bonk'},time:1.1,bonk:{elapsed:1.1},effects:[pulse]},1.1),[],'old snapshots cannot resurrect the flashing floor disc');
 }finally{art.dispose();}assert.equal(scene.children.length,0);
});
