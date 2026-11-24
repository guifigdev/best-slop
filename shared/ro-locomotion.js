import {RO_CONTACT_KNOCKBACK} from './ro-contact-combat.js';
import {bonkBlocked} from './bonk-level.js';
import {roIceMovement} from './ro-ice-terrain.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function moveRoActor(map,u,dx,dz,dt,speed=u.speed){const length=Math.hypot(dx,dz);if(!length||!Number.isFinite(length)){u.moving=false;return;}dx/=length;dz/=length;const distance=Math.min(dt,.1)*speed,steps=Math.max(1,Math.ceil(distance/.25)),step=distance/steps,r=u.collisionRadius||.45,bottom=u.bonkJumpHeight||0;u.moving=false;
 for(let i=0;i<steps;i++){const x=u.x+dx*step,z=u.z+dz*step,blocked=p=>bonkBlocked(map,p,r,bottom);if(!blocked({x,z})){u.x=x;u.z=z;u.moving=true;}else if(!blocked({x,z:u.z})){u.x=x;u.moving=true;}else if(!blocked({x:u.x,z})){u.z=z;u.moving=true;}else if(u.bonkEnemy){for(const sign of [1,-1]){const p={x:u.x+(-dz*.8+dx*.2)*step*sign,z:u.z+(dx*.8+dz*.2)*step*sign};if(!blocked(p)){Object.assign(u,p);u.moving=true;break;}}}}
 u.x=clamp(u.x,-113,113);u.z=clamp(u.z,-113,113);if(u.moving)u.facing=Math.atan2(dx,dz);
}

// Shared by authoritative physics and bounded client movement replay.
export function stepRoMotion(map,u,elapsed,dt,speed=u.speed){
 u.bonkJumpVelocity=(u.bonkJumpVelocity||0)-23*dt;u.bonkJumpHeight=Math.max(0,(u.bonkJumpHeight||0)+u.bonkJumpVelocity*dt);if(u.bonkJumpHeight===0)u.bonkJumpVelocity=0;
 const push=u.roContactPush;if(push?.remaining>0){const distance=Math.min(push.remaining,Math.min(.1,Math.max(0,dt))*RO_CONTACT_KNOCKBACK.distance/RO_CONTACT_KNOCKBACK.duration),facing=u.facing;moveRoActor(map,u,push.dx,push.dz,dt,distance/Math.max(1e-6,dt));u.facing=facing;push.remaining=Math.max(0,push.remaining-distance);if(push.remaining<1e-6)delete u.roContactPush;return;}
 if(elapsed<(u.roHitStunUntil||0)){u.moving=false;return;}
 const input=elapsed-(u.bonkMoveAt??-100)<.55?u.bonkMove:{dx:0,dz:0},dash=elapsed<(u.bonkDashUntil||0),v=dash?u.bonkDashVector:input;
 const motion=roIceMovement(map,u,v||{dx:0,dz:0},dt,speed*(u.bonkWebUntil>elapsed?.55:1),{dash}),beforeX=u.x,beforeZ=u.z;
 moveRoActor(map,u,motion.dx,motion.dz,dt,motion.speed*(dash?2.9:1));
 if(u.roIceMotion){if(Math.abs(u.x-beforeX)<1e-7)u.roIceMotion.x=0;if(Math.abs(u.z-beforeZ)<1e-7)u.roIceMotion.z=0;}
}
