import {castlePassable,castleRouteAvailable,moveCastleUnit} from './castle-navigation.js';
import {CASTLE_RANGED_SCALE} from './castle-spatial.js';

// Verified A005/A02C/FD values, before the explicit voxel distance adaptation.
export const CASTLE_RESCUE_REFERENCE=Object.freeze({charges:1,radius:700/256,range:1000/256,delay:.35,damage:100000});
export const CASTLE_RESCUE_STRIKE=Object.freeze({...CASTLE_RESCUE_REFERENCE,radius:CASTLE_RESCUE_REFERENCE.radius*CASTLE_RANGED_SCALE,range:CASTLE_RESCUE_REFERENCE.range*CASTLE_RANGED_SCALE});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function castleRescueApproach(cf,builder,target){
 const angle=Math.atan2(builder.x-target.x,builder.z-target.z),r=CASTLE_RESCUE_STRIKE.range-.4,points=[];
 for(let i=0;i<24;i++){const a=angle+i*Math.PI*2/24;points.push({x:target.x+Math.sin(a)*r,z:target.z+Math.cos(a)*r});}
 return points.sort((a,b)=>distance(builder,a)-distance(builder,b)).find(p=>castlePassable(cf,p,.45)&&castleRouteAvailable(cf,builder,p,.45))||null;
}
export function tickCastleRescueOrder(game,builder,dt){
 const order=builder.castleRescueOrder;if(!order)return false;const cf=game.castleFight;
 if(!builder.alive||game.phase!=='wave'||cf.finished||!(cf.players[builder.owner]?.rescueCharges>0)){builder.castleRescueOrder=null;return false;}
 if(distance(builder,order)<=CASTLE_RESCUE_STRIKE.range){game.castleRescueStrike(builder,order);return true;}
 if(order.revision!==cf.navigationRevision){order.approach=castleRescueApproach(cf,builder,order);order.revision=cf.navigationRevision;}
 builder.order='rescue';builder.moving=false;order.blocked=!order.approach;
 if(order.approach)moveCastleUnit(cf,builder,order.approach,dt);
 return true;
}
