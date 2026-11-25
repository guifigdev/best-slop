import * as T from 'three';
import {roAttackProfile} from '../shared/ro-attack-catalog.js';
import {roThiefCombatPose,roKatarCombatPose} from './ro-thief-combat.js';

const clamp=n=>Math.max(0,Math.min(1,n)),smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
// Shoulder-space X rotation: raise behind the shoulder, pull down in front,
// then recover. Y stays zero, so this can never become a horizontal spin.
export function roSwordPose(age,duration=.6){
 if(!Number.isFinite(age)||age<0||age>=duration)return{x:0,y:0,z:0,active:false};const p=age/duration;
 const strike=smooth((p-.28)/.25),recovery=1-smooth((p-.67)/.33);
 const x=p<.28?-.95*smooth(p/.28):p<.53?-.95+2.55*strike:1.6*recovery;
 return{x,y:0,z:-.06*Math.sin(p*Math.PI),active:true,body:{x:(-.07*(1-strike)+.20*strike)*recovery,y:-.055*Math.sin(p*Math.PI),z:.19*strike*recovery}};
}
export function roThrustPose(age,duration=.48){if(!Number.isFinite(age)||age<0||age>=duration)return{x:0,y:0,z:0,active:false};const p=age/duration,drive=Math.sin(Math.PI*Math.min(1,p/.6))*(1-smooth((p-.6)/.4));return{x:-.8*drive,y:0,z:0,active:true,body:{x:.08*drive,y:-.025*drive,z:.08*drive}};}
export function roAxePose(age,duration=.65){
 if(!Number.isFinite(age)||age<0||age>=duration)return{x:0,y:0,z:0,active:false};const strike=smooth((age-.055)/.245),recover=1-smooth((age-.38)/Math.max(.1,duration-.38));return{x:(-.38+2.48*strike)*recover,y:0,z:-.075*Math.sin(age/duration*Math.PI),active:true,body:{x:(-.10+.30*strike)*recover,y:-.10*strike*recover,z:.13*strike*recover}};
}

export function createRoWeaponRig({unit,spec,body,voxel,bake}){
 if(!unit?.bonkHero||!spec?.weaponRig||!body)return null;const descriptor=spec.weaponRig,group=new T.Group();group.name=(descriptor.arms?'ro-native-arms-':'ro-shoulder-sword-')+spec.key;
 if(descriptor.arms){const arms=descriptor.arms.map(arm=>{const child=new T.Group();child.name='ro-native-arm-'+spec.key+'-'+arm.key;for(const p of arm.parts)voxel(child,...p);bake(child,child.name);child.position.set(...arm.pivot);group.add(child);return{group:child,key:arm.key,pivot:arm.pivot};});body.add(group);return{group,kind:descriptor.kind,job:descriptor.job,offhand:descriptor.offhand,arms};}
 for(const p of descriptor.parts)voxel(group,...p);bake(group,'ro-shoulder-sword-'+spec.key);group.position.set(...descriptor.pivot);body.add(group);return{group,kind:descriptor.kind};
}

export function updateRoWeaponRig(rig,unit,effects,time){
 if(!rig)return;let latest=null,profile=null;for(const event of effects||[]){if(event.type!=='roAttack'||event.source!==unit?.id||!Number.isFinite(event.time)||event.time>time||latest&&event.time<latest.time)continue;const p=roAttackProfile(event,unit);if((rig.arms?(p.family==='dagger'||['overhead','axeSlam'].includes(p.motion)):['overhead','axeSlam','thrust','daggerStreaks'].includes(p.motion))&&time-event.time<p.duration){latest=event;profile=p;}}
 if(rig.arms){const pose=latest?(profile.motion==='katarCross'||(!profile.weaponType&&rig.kind==='dual-katar')?roKatarCombatPose(time-latest.time,profile.duration):profile.weaponType==='sword'?{...roThiefCombatPose(time-latest.time,profile.duration),arms:{right:roSwordPose(time-latest.time,profile.duration),left:roSwordPose(time-latest.time,profile.duration)}}:profile.weaponType==='axe'?{...roThiefCombatPose(time-latest.time,profile.duration),arms:{right:roAxePose(time-latest.time,profile.duration),left:roAxePose(time-latest.time,profile.duration)}}:roThiefCombatPose(time-latest.time,profile.duration,rig.offhand&&rig.offhand!=='shield'?'assassin':'thief')):roThiefCombatPose(-1);for(const arm of rig.arms){const p=pose.arms[arm.key];arm.group.rotation.set(p.x,p.y,p.z);arm.group.position.set(arm.pivot[0],arm.pivot[1],arm.pivot[2]+(p.push||0));}return pose;}
 const pose=latest?(rig.kind==='thrust'?roThrustPose:rig.kind==='overhead-axe'?roAxePose:roSwordPose)(time-latest.time,profile.duration):roSwordPose(-1);rig.group.rotation.set(pose.x,pose.y,pose.z);return pose;
}
