import {WARLOCK_POLISH} from './warlock-polish.js';

export const WARLOCK_GROUND_RULES=Object.freeze({islands:8,collapseRadius:16,minIslandRadius:1.7,maxIslandRadius:2.35});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function generateWarlockIslands(seed=1,round=1){
 let value=((Number(seed)||1)^Math.imul(round+1,2654435761))>>>0;const random=()=>((value=(Math.imul(value,1664525)+1013904223)>>>0)/4294967296),out=[];
 // Offset sectors reserve the cardinal spawn/escape lines and keep all ground
 // outside the original arena, with a genuine lava gap between each island.
 for(let i=0;i<WARLOCK_GROUND_RULES.islands;i++){const angle=(i+.5)*Math.PI/4+(random()-.5)*.16,distance=28.1+random()*.55,radiusX=1.7+random()*.65,radiusZ=1.7+random()*.65;out.push({id:`island-${round}-${i}`,x:Math.sin(angle)*distance,z:Math.cos(angle)*distance,radiusX,radiusZ});}return out;
}
export function warlockIslandScale(war){return clamp(((war?.arenaRadius??WARLOCK_POLISH.arena.radius)-WARLOCK_GROUND_RULES.collapseRadius)/(WARLOCK_POLISH.arena.radius-WARLOCK_GROUND_RULES.collapseRadius),0,1);}
export function warlockIslandContains(war,island,point,padding=0){const scale=warlockIslandScale(war),rx=island.radiusX*scale-padding,rz=island.radiusZ*scale-padding;return rx>0&&rz>0&&((point.x-island.x)/rx)**2+((point.z-island.z)/rz)**2<=1;}
export function warlockSafeGround(war,point,padding=0){if(!war||!Number.isFinite(point?.x)||!Number.isFinite(point?.z))return false;const radius=war.arenaRadius??WARLOCK_POLISH.arena.radius;return Math.hypot(point.x,point.z)<=Math.max(0,radius-padding)||(war.islands||[]).some(island=>warlockIslandContains(war,island,point,padding));}
export function warlockNearestGround(war,point,padding=.8){
 const radius=Math.max(0,(war.arenaRadius??WARLOCK_POLISH.arena.radius)-padding),d=Math.hypot(point.x,point.z)||1,candidates=[{x:point.x*Math.min(1,radius/d),z:point.z*Math.min(1,radius/d)}];
 for(const island of war.islands||[]){if(warlockIslandScale(war)*Math.min(island.radiusX,island.radiusZ)>padding)candidates.push({x:island.x,z:island.z});}
 return candidates.sort((a,b)=>Math.hypot(a.x-point.x,a.z-point.z)-Math.hypot(b.x-point.x,b.z-point.z))[0];
}
