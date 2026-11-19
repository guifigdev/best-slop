import {castleNavigationRadius} from './castle-navigation.js';

// A lane waypoint is a gate across the corridor, not a single spot that every
// body must occupy. Collision separation can otherwise keep an army orbiting it.
export function advanceCastleRoute(cf,unit){
 const route=unit?.route;if(!Array.isArray(route)||route.length<2)return false;
 const index=unit.pathIndex||0;if(index>=route.length-1)return false;
 const gate=route[index],lane=cf.map.lanes.find(l=>l.id===unit.lane),r=castleNavigationRadius(unit),direction=unit.team===1?1:-1;
 if(!lane||!Number.isFinite(unit.x)||!Number.isFinite(unit.z)||direction*(unit.x-gate.x)<-(r*.75+.15)||Math.abs(unit.z-gate.z)>4.2+r)return false;
 unit.pathIndex=index+1;return true;
}
