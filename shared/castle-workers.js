import {castlePassable,castleRouteAvailable,castleSpawnPoint,moveCastleUnit} from './castle-navigation.js';

const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const CASTLE_REPAIR={reach:.35,scan:14,hpPerSecond:35,goldFraction:.35};

export function queueCastleWork(builder,building){
 builder.castleWorkQueue||=[];
 if(!builder.castleWorkQueue.includes(building.id))builder.castleWorkQueue.push(building.id);
 builder.castleWorkPaused=false;builder.destination=null;builder.order='build';
}
export function pauseCastleWork(builder){
 builder.castleWorkPaused=true;builder.castleRepairTarget=null;builder.castleWorking=false;builder.castleWorker=null;
}
function workPoint(cf,builder,target){
 const r=.45+CASTLE_REPAIR.reach,points=[],origin=castlePassable(cf,builder,.45)?builder:castleSpawnPoint(cf,builder,.45,{maxDistance:2.25});
 if(!origin)return null;
 for(const side of [-1,1])for(const fraction of [-.75,0,.75]){
  points.push({x:target.x+side*(target.w/2+r),z:target.z+fraction*target.d/2});
  points.push({x:target.x+fraction*target.w/2,z:target.z+side*(target.d/2+r)});
 }
 return points.sort((a,b)=>distance(origin,a)-distance(origin,b)).find(p=>castlePassable(cf,p,.45)&&castleRouteAvailable(cf,origin,p,.45))||null;
}

export function tickCastleWorker(game,builder,dt){
 const cf=game.castleFight,team=cf.players[builder.owner]?.team;
 builder.castleWorking=false;builder.castleWorker=null;
 builder.castleWorkQueue=(builder.castleWorkQueue||[]).filter(id=>cf.buildings.some(b=>b.id===id&&b.alive&&b.workRemaining>0));
 if(builder.destination){if(moveCastleUnit(cf,builder,builder.destination,dt)){builder.destination=null;builder.order='stop';}return;}
 let target=[...cf.buildings,...cf.teams].find(b=>b.id===builder.castleRepairTarget&&b.alive&&b.team===team&&!(b.workRemaining>0)&&b.hp<b.maxHp),kind='repair';
 if(!target&&!builder.castleWorkPaused){target=cf.buildings.find(b=>b.id===builder.castleWorkQueue[0]);kind='build';}
 if(!target&&builder.castleAutoRepair!==false){
  target=[...cf.buildings,...cf.teams].filter(b=>b.alive&&b.team===team&&!(b.workRemaining>0)&&b.hp<b.maxHp-.01&&distance(builder,b)<=CASTLE_REPAIR.scan).sort((a,b)=>distance(builder,a)-distance(builder,b)||a.id-b.id)[0];kind='repair';
 }
 if(!target)return;
 const cache=builder.castleWorkApproach,key=`${target.id}:${cf.navigationRevision}`;
 const point=cache?.key===key?cache.point:workPoint(cf,builder,target);
 builder.castleWorkApproach={key,point};builder.castleWorker={kind,target:target.id,state:point?'walking':'blocked'};
 if(!point)return;
 if(distance(builder,point)>.18){moveCastleUnit(cf,builder,point,dt);return;}
 builder.facing=Math.atan2(target.x-builder.x,target.z-builder.z);builder.order=kind;builder.moving=false;
 if(kind==='build'){
  target.workStartedAt??=cf.elapsed-dt;target.workRemaining=Math.max(0,target.workRemaining-dt);
  target.workProgress=1-target.workRemaining/target.workTotal;
  if(!target.pendingUpgrade)target.hp=Math.min(target.maxHp,target.hp+target.maxHp*.9*dt/target.workTotal);
  target.readyAt=cf.elapsed+target.workRemaining;
  if(target.workRemaining===0){target.completedAt=cf.elapsed;target.nextSpawn=cf.elapsed+target.spawnInterval;game.castleCompleteBuildings(cf.elapsed);}
 }else{
  const repair=Math.min(target.maxHp-target.hp,CASTLE_REPAIR.hpPerSecond*dt),definition=game.castleBuildingDefinition(target),cost=repair/target.maxHp*(definition?.cost??1000)*CASTLE_REPAIR.goldFraction;
  if(builder.gold+1e-8<cost){builder.castleWorker.state='resources';return;}
  builder.gold=Math.max(0,builder.gold-cost);target.hp=Math.min(target.maxHp,target.hp+repair);
 }
 builder.castleWorking=true;builder.castleWorker.state='working';builder.attackAt=game.time;
 if(cf.elapsed>=(builder.castleWorkFxAt||0)){builder.castleWorkFxAt=cf.elapsed+.65;game.fx('castleWork',builder.x,builder.z,{source:builder.id,target:target.id,tx:target.x,tz:target.z,repair:kind==='repair',duration:.5,castle:true});}
}
