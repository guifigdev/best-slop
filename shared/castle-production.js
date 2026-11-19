import {castleNavigationRadius,castlePassable,castleRouteAvailable} from './castle-navigation.js';

export function castleArmyRoute(cf,building,lane){
 const direction=building.team===1?1:-1,home=direction===1?lane.left:lane.right,enemy=direction===1?lane.right:lane.left,castle=cf.teams.find(t=>t.team!==building.team);
 return [{...home,stage:'entry'},{...enemy,stage:'exit'},{x:castle.x-direction*3,z:castle.z,stage:'castle'}];
}

// Birth stays at the producing building. Try nearby sides, never a remote
// fallback at the lane entrance. A blocked producer keeps its production due.
export function castleProducerSpawn(cf,building,unit,entry){
 if(!Number.isFinite(building?.x)||!Number.isFinite(building?.z)||building.alive===false)return null;
 const w=building.w||2,d=building.d||2,r=castleNavigationRadius(unit),direction=building.team===1?1:-1,index=building.spawnCount||0,offset=(index%5-2)*.35,seen=new Set();
 for(const gap of [.15,.45,.8,1.2])for(const face of ['front','north','south','back']){
  const xFace=face==='front'||face==='back',half=(xFace?d:w)/2,tangent=Math.max(0,half-.15),offsets=[Math.max(-tangent,Math.min(tangent,offset)),0,-tangent,tangent,-tangent*.5,tangent*.5];
  for(const shift of offsets){
   const point=xFace?{x:building.x+(face==='front'?direction:-direction)*(w/2+r+gap),z:building.z+shift}:{x:building.x+shift,z:building.z+(face==='north'?-1:1)*(d/2+r+gap)},key=`${point.x}:${point.z}`;
   if(seen.has(key))continue;seen.add(key);
   // Even flyers emerge clear of roofs; their travel may fly over structures.
   if(!castlePassable(cf,point,r,{flying:false})||!castlePassable(cf,point,r,{flying:unit.flying,ignoreUnits:false}))continue;
   if(castleRouteAvailable(cf,point,entry,r,{flying:unit.flying}))return point;
  }
 }
 return null;
}
