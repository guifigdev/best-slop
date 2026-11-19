import {castleNavigationRadius} from './castle-navigation.js';

// A lane waypoint is a gate across the corridor, not a single spot that every
// body must occupy. Collision separation can otherwise keep an army orbiting it.
export function advanceCastleRoute(cf,unit){
 const route=unit?.route;if(!Array.isArray(route)||route.length<2)return false;
 let advanced=false;
 while((unit.pathIndex||0)<route.length-1){
 const index=unit.pathIndex||0;
 const gate=route[index],lane=cf.map.lanes.find(l=>l.id===unit.lane),r=castleNavigationRadius(unit),direction=unit.team===1?1:-1;
 if(!lane||!Number.isFinite(unit.x)||!Number.isFinite(unit.z))return advanced;
 const passed=direction*(unit.x-gate.x),base=cf.map.buildZones?.find(zone=>zone.team!==unit.team),insideEnemyBase=base&&unit.x-r>=base.minX&&unit.x+r<=base.maxX&&unit.z-r>=base.minZ&&unit.z+r<=base.maxZ;
 // Combat can pull a troop off the lane before the waypoint is recorded.
 // Once it has entered the opposing base, returning to that entry is backwards.
 // Once a real corridor gate's plane is reached, dispersed troops may proceed
 // to the next leg. Seeking its exact z again makes large formations collect
 // beside the exit and return there after every short skirmish.
 const crossedRouteGate=gate.stage&&passed>=-(r*.75+.15);
 if(!crossedRouteGate&&!(passed>=-(r*.75+.15)&&Math.abs(unit.z-gate.z)<=4.2+r)&&!(passed>=r&&(gate.stage==='entry'||insideEnemyBase)))return advanced;
 unit.pathIndex=index+1;advanced=true;
 }
 return advanced;
}
