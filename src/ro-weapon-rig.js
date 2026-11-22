import * as T from 'three';
import {roAttackProfile} from '../shared/ro-attack-catalog.js';
import {roThiefCombatPose} from './ro-thief-combat.js';

const clamp=n=>Math.max(0,Math.min(1,n)),smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
// Shoulder-space X rotation: raise behind the shoulder, pull down in front,
// then recover. Y stays zero, so this can never become a horizontal spin.
export function roSwordPose(age,duration=.6){
 if(!Number.isFinite(age)||age<0||age>=duration)return{x:0,y:0,z:0,active:false};const p=age/duration;
 const strike=smooth((p-.28)/.25),recovery=1-smooth((p-.67)/.33);
 const x=p<.28?-.95*smooth(p/.28):p<.53?-.95+2.55*strike:1.6*recovery;
 return{x,y:0,z:-.06*Math.sin(p*Math.PI),active:true,body:{x:(-.07*(1-strike)+.20*strike)*recovery,y:-.055*Math.sin(p*Math.PI),z:.19*strike*recovery}};
}

export function createRoWeaponRig({unit,spec,body,voxel,bake}){
 if(!unit?.bonkHero||!spec?.weaponRig||!body)return null;const descriptor=spec.weaponRig,group=new T.Group();group.name=(descriptor.arms?'ro-native-arms-':'ro-shoulder-sword-')+spec.key;
 if(descriptor.arms){const arms=descriptor.arms.map(arm=>{const child=new T.Group();child.name='ro-native-arm-'+spec.key+'-'+arm.key;for(const p of arm.parts)voxel(child,...p);bake(child,child.name);child.position.set(...arm.pivot);group.add(child);return{group:child,key:arm.key,pivot:arm.pivot};});body.add(group);return{group,kind:descriptor.kind,job:descriptor.job,arms};}
 for(const p of descriptor.parts)voxel(group,...p);bake(group,'ro-shoulder-sword-'+spec.key);group.position.set(...descriptor.pivot);body.add(group);return{group,kind:descriptor.kind};
}

export function updateRoWeaponRig(rig,unit,effects,time){
 if(!rig)return;let latest=null,profile=null;for(const event of effects||[]){if(event.type!=='roAttack'||event.source!==unit?.id||!Number.isFinite(event.time)||event.time>time||latest&&event.time<latest.time)continue;const p=roAttackProfile(event,unit);if((rig.arms?p.family==='dagger':['overhead','axeSlam'].includes(p.motion))&&time-event.time<p.duration){latest=event;profile=p;}}
 if(rig.arms){const pose=latest?roThiefCombatPose(time-latest.time,profile.duration,rig.job):roThiefCombatPose(-1);for(const arm of rig.arms){const p=pose.arms[arm.key];arm.group.rotation.set(p.x,p.y,p.z);arm.group.position.set(arm.pivot[0],arm.pivot[1],arm.pivot[2]+p.push);}return pose;}
 const pose=latest?roSwordPose(time-latest.time,profile.duration):roSwordPose(-1);rig.group.rotation.set(pose.x,pose.y,pose.z);return pose;
}
