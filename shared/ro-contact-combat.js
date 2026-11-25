import {unitFootprintRadius} from './unit-footprint.js';
// Match the physical bodies, with a small skin for collision separation tolerance.
export const RO_CONTACT_INTERVAL=.75;
export const RO_HIT_STUN=.18;
export function roEnemyTouchesHero(enemy,hero){
 if(!enemy?.alive||!hero?.alive||!enemy.bonkEnemy||!hero.bonkHero)return false;
 if((hero.bonkJumpHeight||0)>=1.05&&!enemy.flying)return false;
 const radius=unitFootprintRadius(enemy,{profile:'bonk'})+unitFootprintRadius(hero,{profile:'bonk'})+.04;
 return Math.hypot(enemy.x-hero.x,enemy.z-hero.z)<=radius;
}
export function roRecordHitReaction(unit,source,time){
 const dx=unit.x-(source?.x??unit.x),dz=unit.z-(source?.z??unit.z),length=Math.hypot(dx,dz);
 unit.roHitReaction={at:time,dx:length>1e-6?dx/length:0,dz:length>1e-6?dz/length:0};
}

export const RO_CONTACT_KNOCKBACK=Object.freeze({distance:.4,duration:.14});
export function roContactKnockback(hero,enemy){const dx=hero.x-enemy.x,dz=hero.z-enemy.z,d=Math.hypot(dx,dz),angle=enemy.facing||0;hero.roContactPush={dx:d>1e-6?dx/d:Math.sin(angle),dz:d>1e-6?dz/d:Math.cos(angle),remaining:RO_CONTACT_KNOCKBACK.distance};}
