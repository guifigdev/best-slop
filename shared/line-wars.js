import {mapCellBounds} from './map-runtime.js';
import {LINE_UNITS,LINE_UNIT_ORDER,LINE_START_LIVES,LINE_START_INCOME,LINE_INCOME_INTERVAL,LINE_MAX_POPULATION,LINE_LANE_SPACING,LINE_LANE_HALF,LINE_START_Z,LINE_PORTAL_Z} from './line-units.js';

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const laneByOwner=(game,owner)=>game.lineWars?.lanes.find(lane=>lane.owner===owner);
const ownBuilding=(game,u,c)=>game.lineWars?.buildings.find(b=>b.owner===u.owner&&(c.building!==undefined?b.id===c.building:typeof c.unitKey==='string'&&b.unitKey===c.unitKey));
const teamMode=game=>!!game.options.lineTeams;
const sameCell=(a,b)=>!!(a?.cell&&b?.cell&&a.cell.x===b.cell.x&&a.cell.z===b.cell.z);
const orderTarget=(game,u,c)=>{const target=Object.hasOwn(c,'target')?(typeof c.target==='string'&&c.target!==u.owner?game.lineWars?.lanes.find(l=>l.owner===c.target&&l.alive):null):game.lineTargetFor(u.owner),own=laneByOwner(game,u.owner);return target&&(!teamMode(game)||target.team!==own?.team)?target:null;};
export const LINE_QUEUE_LIMIT=50;

export const LineWarsMethods={
 lineCanTarget(u,t){return !!(t&&t.alive&&u.id!==t.id&&u.team!==t.team&&(teamMode(this)?sameCell(u,t):u.lineLane&&u.lineLane===t.lineLane));},
 initLineWars(){
  if(this.lineWars)return true;const heroes=this.heroes();if(heroes.length<2||heroes.length>4||teamMode(this)&&heroes.length!==4){this.message=teamMode(this)?'Line Wars 2×2 precisa de quatro defensores: dois por equipe.':'Line Wars precisa de dois a quatro defensores antes do primeiro sino.';return false;}
  this.units=heroes;this.effects=[];this.projectiles=[];this.specials=[];this.drops=[];this.obstacles=[];this.zones=[];this.wave=1;this.phase='wave';this.timer=0;this.winner=null;this.winningOwners=[];
  const shape=this.voxelMap?mapCellBounds(this.voxelMap):{r:LINE_LANE_HALF},spacing=this.voxelMap?shape.maxX-shape.minX+16:LINE_LANE_SPACING;
  const sharedCells=new Map();
  const lanes=heroes.map((u,index)=>{const team=teamMode(this)?Math.floor(index/2)+1:index+1,routeId=index%2===0?'west':'east',x=(teamMode(this)?team-1:index-(heroes.length-1)/2)*spacing;let cell=sharedCells.get(team);if(!cell){cell={x,z:0,...shape,key:teamMode(this)?`line-team-${team}`:u.owner};sharedCells.set(team,cell);}const lane={team,routeId,owner:u.owner,heroId:u.id,name:u.name,index,x,z:0,cell,lives:LINE_START_LIVES,maxLives:LINE_START_LIVES,income:LINE_START_INCOME,alive:true,sent:0,defeated:0,leaks:0,breaches:0,incomeEarned:0,nextSendAt:0,nextBotSendAt:this.time+4+index,queue:[],queueStatus:null,fountain:{x,z:13.8,radius:2.6,hpRate:.06,manaRate:.04},portal:{x,z:LINE_PORTAL_Z},entrance:{x,z:LINE_START_Z}};
   this.closeShop?.(u);u.lineLane=u.owner;u.challenge=teamMode(this)?`line-team-${team}`:`line-${u.owner}`;u.cell=cell;u.team=teamMode(this)?10+team:10+index;if(teamMode(this))u.squad=team;u.x=x;u.z=8;u.alive=true;u.stageDone=false;u.lineEliminated=false;u.lineRespawnAt=null;u.destination=null;u.target=null;u.order='auto';u.stun=0;u.dots={};u.vx=u.vz=0;this.cancelChannel(u);this.refresh(u);u.hp=u.maxHp;u.mana=u.maxMana;return lane;});
  this.bounds=Math.max(...lanes.map(lane=>Math.max(Math.abs(lane.x+(shape.minX??-shape.r)),Math.abs(lane.x+(shape.maxX??shape.r)),Math.abs(shape.minZ??-shape.r),Math.abs(shape.maxZ??shape.r))+4));this.cells=[...sharedCells.values()];
  const buildings=lanes.flatMap(lane=>LINE_UNIT_ORDER.map((unitKey,index)=>({id:`line-${lane.index}-${unitKey}`,owner:lane.owner,unitKey,x:lane.x+[-13,-9,9,13][index%4],z:-9+Math.floor(index/4)*6,readyAt:0})));
  this.lineWars={lineTeams:teamMode(this),teamMode:teamMode(this),startedAt:this.time,nextIncomeAt:this.time+LINE_INCOME_INTERVAL,incomeInterval:LINE_INCOME_INTERVAL,maxPopulation:LINE_MAX_POPULATION,lanes,buildings,elapsed:0};
  this.setupLineTerrain?.();if(teamMode(this)){const fountains=new Map();for(const lane of lanes){lane.portal={x:lane.x+(lane.routeId==='west'?-10:10),z:lane.z+35};const route=lane.routes?.find(r=>r.id===lane.routeId);if(route){const path=route.path.map(p=>({...p}));path[path.length-1]={...lane.portal};lane.routes=[{...route,path}];lane.route=path;lane.entrance={...route.spawn};}else{lane.entrance={x:lane.x+(lane.routeId==='west'?-10:10),z:lane.z+(this.voxelMap?.markers.spawn?.z??LINE_START_Z)};lane.route=[{...lane.entrance},{...lane.portal}];lane.routes=[{id:lane.routeId,name:lane.routeId==='west'?'Corredor oeste':'Corredor leste',spawn:{...lane.entrance},path:lane.route}];}if(!fountains.has(lane.team))fountains.set(lane.team,{...lane.fountain,x:lane.x,z:lane.z+46,radius:5});lane.fountain=fountains.get(lane.team);const hero=this.player(lane.owner);lane.heroSpawn={x:lane.portal.x,z:lane.z+(this.voxelMap?.markers.heroSpawn?.z??42)};hero.x=lane.heroSpawn.x;hero.z=lane.heroSpawn.z;}for(const building of this.lineWars.buildings){const target=this.lineTargetFor(building.owner);building.target=target?.owner;building.targetTeam=target?.team;}}this.message='Line Wars começou! Visite o campo de um rival e escolha as tropas que invadirão aquela base. Proteja seu próprio portal e use a fonte para recuperar e comprar.';this.fx('lineStart',lanes[0].x,0,{players:heroes.length});return true;
 },

 lineTargetFor(owner){const lanes=this.lineWars?.lanes||[],own=lanes.findIndex(lane=>lane.owner===owner);if(own<0)return null;if(teamMode(this)){const candidates=lanes.filter(l=>l.alive&&l.team!==lanes[own].team);return candidates.find(l=>l.routeId===lanes[own].routeId)||candidates[0]||null;}for(let step=1;step<lanes.length;step++){const lane=lanes[(own+step)%lanes.length];if(lane.alive)return lane;}return null;},

 queueLineUnit(u,c){
  const state=this.lineWars,lane=laneByOwner(this,u?.owner);if(!state||this.phase!=='wave'||!u?.hero||u.summon||!lane?.alive)return false;
  const building=ownBuilding(this,u,c),target=orderTarget(this,u,c);if(!building||!LINE_UNITS[building.unitKey]||!target)return false;lane.queue||=[];if(lane.queue.length>=LINE_QUEUE_LIMIT)return false;
  const entry={id:this.id(),building:building.id,unitKey:building.unitKey,queuedAt:this.time,...(Object.hasOwn(c,'target')?{target:target.owner}:{})};lane.queue.push(entry);this.fx('lineQueued',building.x,building.z,{source:u.id,entryId:entry.id,building:building.id,unit:entry.unitKey,target:target.owner,targetName:target.name,position:lane.queue.length});return true;
 },

 cancelLineQueue(u,c){
  const lane=laneByOwner(this,u?.owner);if(!this.lineWars||this.phase!=='wave'||!u?.hero||u.summon||!lane?.alive)return false;const index=(lane.queue||[]).findIndex(entry=>entry.id===c.entryId);if(index<0)return false;
  const [entry]=lane.queue.splice(index,1);if(!lane.queue.length)lane.queueStatus=null;this.fx('lineQueueCancelled',u.x,u.z,{source:u.id,entryId:entry.id,unit:entry.unitKey});return true;
 },

 processLineQueue(u,lane){
  lane.queue||=[];lane.queueStatus=null;while(lane.queue.length&&Object.hasOwn(lane.queue[0],'target')&&!orderTarget(this,u,lane.queue[0])){const removed=lane.queue.shift();this.fx('lineQueueCancelled',u.x,u.z,{source:u.id,entryId:removed.id,unit:removed.unitKey,target:removed.target,reason:'targetEliminated'});}const entry=lane.queue[0];if(!entry)return;const building=ownBuilding(this,u,entry),recipe=building&&LINE_UNITS[building.unitKey],target=orderTarget(this,u,entry);
  if(!recipe||!target){lane.queueStatus='unavailable';return;}if(u.gold<recipe.cost){lane.queueStatus='gold';return;}if(this.time<building.readyAt||this.time<lane.nextSendAt){lane.queueStatus='cooldown';return;}
  if(this.units.filter(unit=>unit.alive&&unit.lineCreep&&unit.lineLane===target.owner).length>=LINE_MAX_POPULATION){lane.queueStatus='population';return;}
  if(this.sendLineUnit(u,{building:entry.building,...(Object.hasOwn(entry,'target')?{target:entry.target}:{})})){lane.queue.shift();this.fx('lineQueueSent',building.x,building.z,{source:u.id,entryId:entry.id,unit:entry.unitKey,target:target.owner});}else lane.queueStatus='unavailable';
 },

 tickLineFountains(dt){
  for(const unit of this.units){unit.fountainHealing=false;unit.fountainMana=false;unit.nearFountain=false;}
  const seen=new Set();for(const lane of this.lineWars.lanes.filter(entry=>entry.alive)){const fountain=lane.fountain,hero=this.player(lane.owner);if(!fountain||!hero)continue;const key=teamMode(this)?`${lane.team}:${lane.cell.x}:${lane.cell.z}:${fountain.x}:${fountain.z}`:lane.owner;if(seen.has(key))continue;seen.add(key);
   for(const unit of this.units){if(!unit.alive||unit.team!==hero.team||(!teamMode(this)&&(unit.lineLane!==lane.owner||unit.owner!==lane.owner))||!unit.hero&&!unit.summon||!unit.cell||unit.cell.x!==lane.cell.x||unit.cell.z!==lane.cell.z||Math.hypot(unit.x-fountain.x,unit.z-fountain.z)>fountain.radius)continue;
    unit.nearFountain=true;const hp=Math.min(Math.max(0,unit.maxHp-unit.hp),unit.maxHp*fountain.hpRate*dt),mana=Math.min(Math.max(0,(unit.maxMana||0)-(unit.mana||0)),(unit.maxMana||0)*fountain.manaRate*dt);unit.hp+=hp;if(mana>0)unit.mana=(unit.mana||0)+mana;unit.fountainHealing=hp>0;unit.fountainMana=mana>0;
    if(hp>0||mana>0){unit.fountainUntil=this.time+.25;unit.fountainHpPending=(unit.fountainHpPending||0)+hp;unit.fountainManaPending=(unit.fountainManaPending||0)+mana;if(this.time>=(unit.nextFountainFx||0)){this.fx('fountainHeal',unit.x,unit.z,{source:unit.id,amount:Math.round(unit.fountainHpPending),mana:Math.round(unit.fountainManaPending)});unit.fountainHpPending=unit.fountainManaPending=0;unit.nextFountainFx=this.time+.75;}}
   }
  }
 },

 sendLineUnit(u,c){
  const state=this.lineWars,lane=laneByOwner(this,u?.owner);if(!state||this.phase!=='wave'||!u?.hero||u.summon||!lane?.alive)return false;
  const building=ownBuilding(this,u,c),recipe=building&&LINE_UNITS[building.unitKey],target=orderTarget(this,u,c);
  if(!recipe||!target||u.gold<recipe.cost||this.time<building.readyAt||this.time<lane.nextSendAt)return false;
  if(this.units.filter(unit=>unit.alive&&unit.lineCreep&&unit.lineLane===target.owner).length>=LINE_MAX_POPULATION)return false;
  const routes=target.routes||[],route=teamMode(this)?routes.find(r=>r.id===target.routeId)||routes[0]:routes.find(r=>r.id===building.routeId)||routes[LINE_UNIT_ORDER.indexOf(building.unitKey)%Math.max(1,routes.length)],entry=route?.spawn||target.entrance;
  const elapsed=this.time-state.startedAt,level=1+Math.floor(elapsed/30),rank=clamp(1+Math.floor((level-1)/10),1,5),hp=recipe.hp*(1+elapsed/300),damage=recipe.damage*(1+elapsed/600),x=entry.x;
  const unit=this.spawnEnemy(recipe.kind,x,entry.z,{lineCreep:true,hp,damage,armor:recipe.armor,range:recipe.range,speed:recipe.speed,interval:recipe.interval,accuracy:recipe.accuracy,evasion:recipe.evasion,critChance:recipe.critChance,critMultiplier:recipe.critMultiplier,level,skills:[...recipe.skills],skillLevels:Object.fromEntries(recipe.skills.map(key=>[key,rank])),variantRoll:.999999,team:teamMode(this)?10+lane.team:1000+target.index,owner:`line-creep:${u.owner}`,challenge:teamMode(this)?`line-team-${target.team}`:`line-${target.owner}`,cell:target.cell});
  // SpawnEnemy shares the combat engine but species modifiers must not silently
  // change a priced Line Wars recipe. Keep its explicitly advertised profile.
  Object.assign(unit,{name:recipe.name,hp,maxHp:hp,damage,armor:recipe.armor,speed:recipe.speed,interval:recipe.interval,range:recipe.range,size:recipe.size,flying:recipe.flying,altitude:recipe.altitude,element:recipe.element||null,resistances:{},lineCreep:true,lineLane:target.owner,lineTeam:teamMode(this)?lane.team:null,lineAttacker:u.owner,lineKey:building.unitKey,lineRoute:route?.id||'main',lineEntryName:route?.name||'Entrada principal',lineBounty:recipe.bounty,linePortalDamage:recipe.lifeDamage,lineResolved:false,rarity:'line',acquireRange:6,destination:{...entry},order:'attackMove',target:null});
  unit.monsterBase=Object.freeze({...unit.monsterBase,hp,damage,armor:recipe.armor,speed:recipe.speed,interval:recipe.interval,accuracy:recipe.accuracy,evasion:recipe.evasion,critChance:recipe.critChance,critMultiplier:recipe.critMultiplier,magicPower:.65});this.refresh(unit);unit.hp=unit.maxHp;
  u.gold-=recipe.cost;lane.income+=recipe.income;lane.sent++;lane.nextSendAt=this.time+.35;building.readyAt=this.time+clamp(1.5+recipe.cost/180,1.5,6);
  this.fx('lineSend',building.x,building.z,{source:u.id,unit:building.unitKey,target:target.owner,route:unit.lineRoute,entryName:unit.lineEntryName,cost:recipe.cost,income:recipe.income});this.fx('lineArrival',unit.x,unit.z,{source:unit.id,unit:building.unitKey});return true;
 },

 eliminateLineLane(lane){
  if(!lane.alive)return;lane.alive=false;lane.eliminatedAt=this.time;lane.lives=0;lane.queue=[];lane.queueStatus=null;const hero=this.player(lane.owner);if(hero){hero.alive=false;hero.hp=0;hero.died=this.time;hero.lineEliminated=true;hero.lineRespawnAt=null;hero.destination=null;hero.target=null;hero.order='stop';this.cancelChannel(hero);this.closeShop?.(hero);}
  for(const unit of this.units)if(!unit.hero&&(unit.lineLane===lane.owner||!teamMode(this)&&unit.lineAttacker===lane.owner)){unit.alive=false;unit.died=this.time;unit.lineResolved=true;}
  this.fx('lineEliminated',lane.portal.x,lane.portal.z,{owner:lane.owner});this.message=`O portal de ${lane.name} caiu. As tropas agora seguem para o próximo defensor vivo.`;
 },

 tickLineWars(dt){
  const state=this.lineWars;if(!state||this.phase!=='wave'||!Number.isFinite(dt)||dt<=0)return;state.elapsed=this.time-state.startedAt;this.wave=1+Math.floor(state.elapsed/60);
  // This catch-up loop is deterministic even when a server frame is delayed.
  while(this.time>=state.nextIncomeAt){for(const lane of state.lanes.filter(entry=>entry.alive)){const hero=this.player(lane.owner);if(!hero)continue;hero.gold+=lane.income;lane.incomeEarned+=lane.income;if(hero.alive)this.gainXp(hero,6);this.fx('lineIncome',hero.x,hero.z,{source:hero.id,amount:lane.income});}state.nextIncomeAt+=LINE_INCOME_INTERVAL;}
  for(const unit of this.units){if(!unit.lineCreep||unit.lineResolved)continue;const lane=laneByOwner(this,unit.lineLane);if(!lane?.alive){unit.alive=false;unit.died=this.time;unit.lineResolved=true;continue;}
   if(!unit.alive){unit.lineResolved=true;lane.defeated++;continue;}
   if(Math.hypot(unit.x-lane.portal.x,unit.z-lane.portal.z)<.9){unit.lineResolved=true;unit.alive=false;unit.escaped=true;unit.died=this.time;lane.lives=Math.max(0,lane.lives-unit.linePortalDamage);lane.leaks++;lane.lastAttacker=unit.lineAttacker;const attacker=laneByOwner(this,unit.lineAttacker);if(attacker){attacker.breaches+=unit.linePortalDamage;const hero=this.player(attacker.owner);if(hero)hero.score=(hero.score||0)+unit.linePortalDamage*100;}this.fx('lineLeak',lane.portal.x,lane.portal.z,{owner:lane.owner,attacker:unit.lineAttacker,amount:unit.linePortalDamage,lives:lane.lives});}
  }
  for(const lane of state.lanes)if(lane.alive&&lane.lives<=0)this.eliminateLineLane(lane);
  const remaining=state.lanes.filter(lane=>lane.alive);if(teamMode(this)&&new Set(remaining.map(l=>l.team)).size<=1){const team=remaining[0]?.team||null;this.phase='victory';state.winnerTeam=team;this.winningOwners=state.lanes.filter(l=>l.team===team).map(l=>l.owner);this.winner=this.winningOwners[0]||null;this.message=team?`A equipe ${team} protegeu seu último portal e venceu Line Wars!`:'Todos os portais caíram no mesmo instante. Line Wars terminou empatado.';return;}if(!teamMode(this)&&remaining.length<=1){this.phase='victory';this.winner=remaining[0]?.owner||null;this.winningOwners=remaining.map(lane=>lane.owner);this.message=remaining.length?`${remaining[0].name} protegeu o último portal e venceu Line Wars!`:'Todos os portais caíram no mesmo instante. Line Wars terminou empatado.';return;}
  for(const lane of remaining){const hero=this.player(lane.owner);if(!hero)continue;
   if(!hero.alive){hero.lineRespawnAt??=this.time+5;if(this.time>=hero.lineRespawnAt){hero.alive=true;hero.lineRespawnAt=null;const point=this.voxelMap?.markers.heroSpawn||this.voxelMap?.markers.fountain;hero.x=lane.heroSpawn?.x??lane.x+(point?.x||0);hero.z=lane.heroSpawn?.z??point?.z??8;hero.destination=null;hero.target=null;hero.order='auto';hero.stun=0;hero.dots={};hero.frostUntil=0;hero.vx=hero.vz=0;this.cancelChannel(hero);this.refresh(hero);hero.hp=hero.maxHp;hero.mana=hero.maxMana;this.fx('lineRevive',hero.x,hero.z,{source:hero.id});}}
   this.processLineQueue(hero,lane);
   if(hero.bot&&this.time>=lane.nextBotSendAt&&(lane.queue?.length||0)<5){lane.nextBotSendAt=this.time+3.5+this.random()*2;const budget=Math.max(50,hero.gold*.5),pool=LINE_UNIT_ORDER.filter(key=>LINE_UNITS[key].cost<=budget);if(pool.length){const key=pool[Math.floor(this.random()*pool.length)],building=state.buildings.find(entry=>entry.owner===hero.owner&&entry.unitKey===key);if(building)this.queueLineUnit(hero,{building:building.id});}}
  }
  this.tickLineFountains(dt);
 },

 snapshotLineWars(){
  const state=this.lineWars;if(!state)return null;return{lineTeams:!!state.lineTeams,teamMode:!!state.lineTeams,winnerTeam:state.winnerTeam??null,teams:state.lineTeams?[1,2].map(team=>({team,owners:state.lanes.filter(l=>l.team===team).map(l=>l.owner),alive:state.lanes.some(l=>l.team===team&&l.alive),lives:state.lanes.filter(l=>l.team===team).reduce((sum,l)=>sum+l.lives,0)})):[],startedAt:state.startedAt,elapsed:state.elapsed,nextIncomeAt:state.nextIncomeAt,incomeInterval:state.incomeInterval,maxPopulation:state.maxPopulation,lanes:state.lanes.map(lane=>({...lane,queue:(lane.queue||[]).map(entry=>{const target=Object.hasOwn(entry,'target')?laneByOwner(this,entry.target):this.lineTargetFor(lane.owner);return{...entry,target:target?.owner||entry.target||null,targetName:target?.name||null,explicitTarget:Object.hasOwn(entry,'target')};}),target:this.lineTargetFor(lane.owner)?.owner||null,population:this.units.filter(unit=>unit.alive&&unit.lineCreep&&unit.lineLane===lane.owner).length})),buildings:teamMode(this)?state.buildings.map(b=>{const target=this.lineTargetFor(b.owner);return{...b,target:target?.owner||null,targetTeam:target?.team||null};}):state.buildings};
 }
};
