import {blocked} from './field.js';
import {unitRadius} from './unit-collision.js';

const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const finitePoint=p=>Number.isFinite(p?.x)&&Number.isFinite(p?.z);
const sameCell=(a,b)=>!!(a&&b&&Math.abs(a.x-b.x)<.01&&Math.abs((a.z||0)-(b.z||0))<.01);
const insideCell=(point,cell)=>finitePoint(point)&&point.x>=cell.x+(cell.minX??-cell.r)-1.6&&point.x<=cell.x+(cell.maxX??cell.r)+1.6&&point.z>=(cell.z||0)+(cell.minZ??-cell.r)-1.6&&point.z<=(cell.z||0)+(cell.maxZ??cell.r)+1.6;
const identity=u=>String(u.owner??u.id);
const idle=(hero,reason)=>{hero.lineDefense={routeId:null,threats:0,assignedThreats:0,reason,targetId:null,eta:null,remaining:null,routes:[]};delete hero.lineDefensePlan;return false;};

function project(point,path){
 let best=null,total=0;const lengths=path.slice(1).map((p,i)=>distance(path[i],p));
 for(let i=0;i<lengths.length;i++){
  const a=path[i],b=path[i+1],length=lengths[i],dx=b.x-a.x,dz=b.z-a.z;
  const t=length?Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.z-a.z)*dz)/(length*length))):0;
  const p={x:a.x+dx*t,z:a.z+dz*t},d=distance(point,p),progress=total+length*t;
  if(!best||d<best.distance-.001||Math.abs(d-best.distance)<.001&&progress>best.progress)best={point:p,distance:d,progress,index:i};
  total+=length;
 }
 return{...(best||{point:path[0]||point,distance:0,progress:0,index:0}),length:total};
}
function pointAt(path,progress){
 for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],length=distance(a,b);if(progress<=length){const t=length?Math.max(0,progress/length):0;return{x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t};}progress-=length;}
 return{...path.at(-1)};
}
function routeAtZ(route,z){
 for(let i=1;i<route.path.length;i++){const a=route.path[i-1],b=route.path[i];if(Math.abs(b.z-a.z)>.01&&z>=Math.min(a.z,b.z)&&z<=Math.max(a.z,b.z)){const t=(z-a.z)/(b.z-a.z);return{x:a.x+(b.x-a.x)*t,z};}}
 return pointAt(route.path,project({x:route.path[0].x,z},route.path).progress);
}
function fieldRoutes(game,hero,lanes){
 const routes=new Map();
 for(const lane of lanes){
  const entries=lane.routes?.length?lane.routes:[{id:lane.routeId||'main',name:'Entrada principal',spawn:lane.entrance,path:lane.route||[lane.entrance,lane.portal]}];
  for(const entry of entries){const path=(entry.path||[]).filter(finitePoint),portal=game.options.lineTeams&&lane.routeId===entry.id?lane.portal:path.at(-1)||lane.portal;if(path.length&&finitePoint(portal)&&distance(path.at(-1),portal)>.1)path.push(portal);if(path.length<2)continue;
   const id=entry.id||lane.routeId||'main';if(!routes.has(id))routes.set(id,{id,name:entry.name||id,path,portal:finitePoint(portal)?portal:path.at(-1),owner:lane.owner});
  }
 }
 return[...routes.values()].sort((a,b)=>a.id.localeCompare(b.id));
}
function directClear(game,hero,to){
 const obstacles=(game.obstacles||[]).filter(o=>!(hero.flying&&o.map)),radius=unitRadius(hero),steps=Math.max(1,Math.ceil(distance(hero,to)*2));let previous=hero;
 for(let i=1;i<=steps;i++){const point={x:hero.x+(to.x-hero.x)*i/steps,z:hero.z+(to.z-hero.z)*i/steps};if(blocked(point,obstacles,radius)||game.unitTerrainBlocked?.(hero,point,radius,previous))return false;previous=point;}return true;
}
function movementDestination(game,hero,route,destination,routes){
 const old=hero.lineDefensePlan;
 if(old?.routeId===route.id){while(old.points.length&&distance(hero,old.points[0])<.85)old.points.shift();if(old.points.length)return{point:{...old.points[0]},crossing:true};}
 delete hero.lineDefensePlan;
 if(directClear(game,hero,destination)||routes.length<2)return{point:destination,crossing:false};
 // At the broad base/confluence ordinary navigation can enter either lane;
 // do not send a defender all the way back through the northern crossing.
 if(hero.z>=Math.max(...routes.map(r=>r.portal.z))-11)return{point:destination,crossing:false};
 const current=[...routes].sort((a,b)=>project(hero,a.path).distance-project(hero,b.path).distance)[0];
 if(current.id===route.id)return{point:destination,crossing:false};
 const marker=game.voxelMap?.markers?.crossing,crossZ=(hero.cell.z||0)+(Number.isFinite(marker?.z)?marker.z:-7),from=routeAtZ(current,crossZ),to=routeAtZ(route,crossZ);
 if(!finitePoint(from)||!finitePoint(to)||blocked(from,game.obstacles||[],unitRadius(hero))||blocked(to,game.obstacles||[],unitRadius(hero))||game.unitTerrainBlocked?.(hero,from,unitRadius(hero),from)||game.unitTerrainBlocked?.(hero,to,unitRadius(hero),to))return{point:destination,crossing:false};
 const points=[from,to];while(points.length&&distance(hero,points[0])<.85)points.shift();if(!points.length)return{point:destination,crossing:false};
 hero.lineDefensePlan={routeId:route.id,points};return{point:{...points[0]},crossing:true};
}
function preferredRoute(game,hero,routes,allies){
 const lane=game.lineWars.lanes.find(l=>l.owner===hero.owner),id=lane?.routeId||hero.lineRoute||hero.defenseRoute;
 if(routes.some(r=>r.id===id))return id;
 if(lane?.routes?.length===1&&routes.some(r=>r.id===lane.routes[0].id))return lane.routes[0].id;
 return routes[allies.findIndex(h=>identity(h)===identity(hero))%routes.length]?.id||routes[0].id;
}
function chooseGroup(game,hero,groups,routes,allies){
 if(!game.options.lineTeams||allies.length<2||groups.length<2){
  const ordered=[...groups].sort((a,b)=>b.risk-a.risk||a.id.localeCompare(b.id)),previous=ordered.find(g=>g.id===hero.lineDefense?.routeId);
  return previous&&previous.risk>=ordered[0].risk*.85?previous:ordered[0];
 }
 const assignment=new Map(),available=new Set(groups.map(g=>g.id));
 // Stable owner/route affinity keeps both active lanes covered independently
 // of the order in which allied bots call this function during a server tick.
 for(const ally of allies){const own=preferredRoute(game,ally,routes,allies);if(available.has(own)){assignment.set(identity(ally),groups.find(g=>g.id===own));available.delete(own);}}
 for(const ally of allies){if(assignment.has(identity(ally)))continue;const pool=groups.filter(g=>available.has(g.id)).sort((a,b)=>b.risk-a.risk||distance(ally,a.target.unit)-distance(ally,b.target.unit));const selected=pool[0]||[...groups].sort((a,b)=>b.risk-a.risk)[0];assignment.set(identity(ally),selected);available.delete(selected.id);}
 return assignment.get(identity(hero));
}

// Called after the normal bot allocation/equipment/autocast work. This module
// steers walking only; combat retains its ordinary acquisition radius/rules.
export function lineDefenseThink(game,hero){
 if(!hero||typeof hero!=='object')return false;
 if(game?.options?.mode!=='linewars'||!game.lineWars||game.phase!=='wave'||!hero.bot||!hero.hero||hero.summon)return idle(hero,'inactive');
 if(!hero.alive||hero.lineEliminated)return idle(hero,'dead');
 if(hero.shopInteraction||hero.pendingShop||hero.pendingPurchase)return idle(hero,'shopping');
 if(hero.channel||hero.stun>0)return idle(hero,hero.channel?'channeling':'stunned');
 if(!hero.cell)return idle(hero,'no-field');
 const lanes=game.lineWars.lanes.filter(l=>l.alive!==false&&sameCell(l.cell||{x:l.x,z:l.z||0},hero.cell)),routes=fieldRoutes(game,hero,lanes);
 if(!routes.length)return idle(hero,'no-route');
 const heroes=typeof game.heroes==='function'?game.heroes():(game.units||[]).filter(u=>u.hero&&!u.summon),allies=heroes.filter(h=>h.alive&&!h.summon&&h.team===hero.team&&sameCell(h.cell,hero.cell)).sort((a,b)=>identity(a).localeCompare(identity(b))),threats=[];
 for(const unit of game.units||[]){
  if(!unit.alive||!unit.lineCreep||unit.lineResolved||unit.escaped||unit.team===hero.team)continue;
  const lane=game.lineWars.lanes.find(l=>l.owner===unit.lineLane);if(!lane||lane.alive===false||!sameCell(unit.cell||lane.cell,hero.cell)||!insideCell(unit,hero.cell))continue;
  let route=routes.find(r=>r.id===unit.lineRoute)||routes.find(r=>r.id===lane.routeId);if(!route)route=[...routes].sort((a,b)=>project(unit,a.path).distance-project(unit,b.path).distance)[0];
  const position=project(unit,route.path),remaining=Math.max(0,position.length-position.progress),slow=(unit.frostUntil||0)>(game.time||0)?.55:1,speed=Math.max(.25,(Number(unit.speed)||0)*slow*(unit.wading?.55:1)),eta=remaining/speed+Math.max(0,Number(unit.stun)||0);
  const dps=Math.max(0,Number(unit.damage)||0)/Math.max(.2,Number(unit.interval)||1.5)*Math.max(.1,Number(unit.attackSpeed)||1),hp=Math.max(0,Number(unit.hp)||0)*(1+.06*Math.max(0,Number(unit.armor)||0)),size=Math.max(.2,Math.min(3,Number(unit.size)||1));
  const severity=(unit.linePortalDamage||1)*(1+Math.min(2,Math.sqrt(hp/250)*.15)+Math.min(1,Math.sqrt(dps/15)*.15)+size*.1),urgency=1/(eta+3)+(eta<6?(6-eta)*.4:0);
  threats.push({unit,route,position,remaining,eta,speed,dps,risk:severity*urgency});
 }
 const grouped=new Map();for(const threat of threats){if(!grouped.has(threat.route.id))grouped.set(threat.route.id,{id:threat.route.id,route:threat.route,count:0,risk:0,target:threat});const group=grouped.get(threat.route.id);group.count++;group.risk+=threat.risk;if(threat.risk>group.target.risk)group.target=threat;}
 const groups=[...grouped.values()];let route,destination,target=null,reason;
 if(groups.length){const group=chooseGroup(game,hero,groups,routes,allies);route=group.route;target=group.target;destination=pointAt(route.path,Math.min(target.position.length,target.position.progress+target.speed*1.5));reason=game.options.lineTeams&&allies.length>1?(groups.length>1?'assigned-lane':preferredRoute(game,hero,routes,allies)===route.id?'intercept':'assist'):'intercept';delete hero.lineDefensePatrol;
 }else{
  const preferred=preferredRoute(game,hero,routes,allies);let patrol=hero.lineDefensePatrol;
  if(!patrol||!routes.some(r=>r.id===patrol.routeId))patrol=hero.lineDefensePatrol={routeId:preferred,holdUntil:null};
  route=routes.find(r=>r.id===patrol.routeId);const z=(hero.cell.z||0)+8;destination=routeAtZ(route,z);
  if(distance(hero,destination)<1.2){patrol.holdUntil??=(game.time||0)+8;if(!game.options.lineTeams&&(game.time||0)>=patrol.holdUntil){route=routes[(routes.findIndex(r=>r.id===route.id)+1)%routes.length];patrol.routeId=route.id;patrol.holdUntil=null;destination=routeAtZ(route,z);}}
  reason='patrol';
 }
 const movement=movementDestination(game,hero,route,destination,routes);
 hero.lineDefense={routeId:route.id,threats:threats.length,assignedThreats:grouped.get(route.id)?.count||0,reason:movement.crossing?'crossing':reason,intent:reason,targetId:target?.unit.id??null,eta:target?.eta??null,remaining:target?.remaining??null,dps:target?.dps??null,routes:groups.map(g=>({routeId:g.id,threats:g.count,risk:g.risk,eta:g.target.eta})),destination:{...movement.point}};
 hero.order='attackMove';hero.destination={...movement.point};hero.target=null;return true;
}
