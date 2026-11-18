import {LINE_UNITS,LINE_UNIT_ORDER,LINE_START_LIVES,LINE_START_INCOME,LINE_INCOME_INTERVAL,LINE_MAX_POPULATION,LINE_LANE_SPACING,LINE_LANE_HALF,LINE_START_Z,LINE_PORTAL_Z} from './line-units.js';

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const laneByOwner=(game,owner)=>game.lineWars?.lanes.find(lane=>lane.owner===owner);
export const LINE_QUEUE_LIMIT=50;

export const LineWarsMethods={
 lineCanTarget(u,t){return !!(t&&t.alive&&u.id!==t.id&&u.team!==t.team&&u.lineLane&&u.lineLane===t.lineLane);},
 initLineWars(){
  if(this.lineWars)return true;const heroes=this.heroes();if(heroes.length<2||heroes.length>4){this.message='Line Wars precisa de dois a quatro defensores antes do primeiro sino.';return false;}
  this.units=heroes;this.effects=[];this.projectiles=[];this.specials=[];this.drops=[];this.obstacles=[];this.zones=[];this.wave=1;this.phase='wave';this.timer=0;this.winner=null;this.winningOwners=[];
  const lanes=heroes.map((u,index)=>{const x=(index-(heroes.length-1)/2)*LINE_LANE_SPACING,cell={x,z:0,r:LINE_LANE_HALF},lane={owner:u.owner,heroId:u.id,name:u.name,index,x,z:0,cell,lives:LINE_START_LIVES,maxLives:LINE_START_LIVES,income:LINE_START_INCOME,alive:true,sent:0,defeated:0,leaks:0,breaches:0,incomeEarned:0,nextSendAt:0,nextBotSendAt:this.time+4+index,queue:[],queueStatus:null,fountain:{x,z:13.8,radius:2.6,hpRate:.06,manaRate:.04},portal:{x,z:LINE_PORTAL_Z},entrance:{x,z:LINE_START_Z}};
   this.closeShop?.(u);u.lineLane=u.owner;u.challenge=`line-${u.owner}`;u.cell=cell;u.team=10+index;u.x=x;u.z=8;u.alive=true;u.stageDone=false;u.lineEliminated=false;u.lineRespawnAt=null;u.destination=null;u.target=null;u.order='auto';u.stun=0;u.dots={};u.vx=u.vz=0;this.cancelChannel(u);this.refresh(u);u.hp=u.maxHp;u.mana=u.maxMana;return lane;});
  this.bounds=Math.max(...lanes.map(lane=>Math.abs(lane.x)+LINE_LANE_HALF+4));this.cells=lanes.map(lane=>({...lane.cell,key:lane.owner}));
  const buildings=lanes.flatMap(lane=>LINE_UNIT_ORDER.map((unitKey,index)=>({id:`line-${lane.index}-${unitKey}`,owner:lane.owner,unitKey,x:lane.x+[-13,-9,9,13][index%4],z:-9+Math.floor(index/4)*6,readyAt:0})));
  this.lineWars={startedAt:this.time,nextIncomeAt:this.time+LINE_INCOME_INTERVAL,incomeInterval:LINE_INCOME_INTERVAL,maxPopulation:LINE_MAX_POPULATION,lanes,buildings,elapsed:0};
  this.setupLineTerrain?.();this.message='Line Wars começou! Clique nas suas casinhas: envie tropas à próxima linha inimiga e aumente sua renda.';this.fx('lineStart',lanes[0].x,0,{players:heroes.length});return true;
 },

 lineTargetFor(owner){const lanes=this.lineWars?.lanes||[],own=lanes.findIndex(lane=>lane.owner===owner);if(own<0)return null;for(let step=1;step<lanes.length;step++){const lane=lanes[(own+step)%lanes.length];if(lane.alive)return lane;}return null;},

 queueLineUnit(u,c){
  const state=this.lineWars,lane=laneByOwner(this,u?.owner);if(!state||this.phase!=='wave'||!u?.hero||u.summon||!lane?.alive||!this.lineTargetFor(u.owner))return false;
  const building=state.buildings.find(entry=>entry.id===c.building&&entry.owner===u.owner);if(!building||!LINE_UNITS[building.unitKey])return false;lane.queue||=[];if(lane.queue.length>=LINE_QUEUE_LIMIT)return false;
  const entry={id:this.id(),building:building.id,unitKey:building.unitKey,queuedAt:this.time};lane.queue.push(entry);this.fx('lineQueued',building.x,building.z,{source:u.id,entryId:entry.id,building:building.id,unit:entry.unitKey,position:lane.queue.length});return true;
 },

 cancelLineQueue(u,c){
  const lane=laneByOwner(this,u?.owner);if(!this.lineWars||this.phase!=='wave'||!u?.hero||u.summon||!lane?.alive)return false;const index=(lane.queue||[]).findIndex(entry=>entry.id===c.entryId);if(index<0)return false;
  const [entry]=lane.queue.splice(index,1);if(!lane.queue.length)lane.queueStatus=null;this.fx('lineQueueCancelled',u.x,u.z,{source:u.id,entryId:entry.id,unit:entry.unitKey});return true;
 },

 processLineQueue(u,lane){
  lane.queue||=[];lane.queueStatus=null;const entry=lane.queue[0];if(!entry)return;const building=this.lineWars.buildings.find(b=>b.id===entry.building&&b.owner===u.owner),recipe=building&&LINE_UNITS[building.unitKey],target=this.lineTargetFor(u.owner);
  if(!recipe||!target){lane.queueStatus='unavailable';return;}if(u.gold<recipe.cost){lane.queueStatus='gold';return;}if(this.time<building.readyAt||this.time<lane.nextSendAt){lane.queueStatus='cooldown';return;}
  if(this.units.filter(unit=>unit.alive&&unit.lineCreep&&unit.lineLane===target.owner).length>=LINE_MAX_POPULATION){lane.queueStatus='population';return;}
  if(this.sendLineUnit(u,{building:entry.building})){lane.queue.shift();this.fx('lineQueueSent',building.x,building.z,{source:u.id,entryId:entry.id,unit:entry.unitKey});}else lane.queueStatus='unavailable';
 },

 tickLineFountains(dt){
  for(const unit of this.units){unit.fountainHealing=false;unit.fountainMana=false;unit.nearFountain=false;}
  for(const lane of this.lineWars.lanes.filter(entry=>entry.alive)){const fountain=lane.fountain,hero=this.player(lane.owner);if(!fountain||!hero)continue;
   for(const unit of this.units){if(!unit.alive||unit.team!==hero.team||unit.lineLane!==lane.owner||unit.owner!==lane.owner||!unit.hero&&!unit.summon||!unit.cell||unit.cell.x!==lane.cell.x||unit.cell.z!==lane.cell.z||Math.hypot(unit.x-fountain.x,unit.z-fountain.z)>fountain.radius)continue;
    unit.nearFountain=true;const hp=Math.min(Math.max(0,unit.maxHp-unit.hp),unit.maxHp*fountain.hpRate*dt),mana=Math.min(Math.max(0,(unit.maxMana||0)-(unit.mana||0)),(unit.maxMana||0)*fountain.manaRate*dt);unit.hp+=hp;if(mana>0)unit.mana=(unit.mana||0)+mana;unit.fountainHealing=hp>0;unit.fountainMana=mana>0;
    if(hp>0||mana>0){unit.fountainUntil=this.time+.25;unit.fountainHpPending=(unit.fountainHpPending||0)+hp;unit.fountainManaPending=(unit.fountainManaPending||0)+mana;if(this.time>=(unit.nextFountainFx||0)){this.fx('fountainHeal',unit.x,unit.z,{source:unit.id,amount:Math.round(unit.fountainHpPending),mana:Math.round(unit.fountainManaPending)});unit.fountainHpPending=unit.fountainManaPending=0;unit.nextFountainFx=this.time+.75;}}
   }
  }
 },

 sendLineUnit(u,c){
  const state=this.lineWars,lane=laneByOwner(this,u?.owner);if(!state||this.phase!=='wave'||!u?.hero||u.summon||!lane?.alive)return false;
  const building=state.buildings.find(entry=>entry.id===c.building&&entry.owner===u.owner),recipe=building&&LINE_UNITS[building.unitKey],target=this.lineTargetFor(u.owner);
  if(!recipe||!target||u.gold<recipe.cost||this.time<building.readyAt||this.time<lane.nextSendAt)return false;
  if(this.units.filter(unit=>unit.alive&&unit.lineCreep&&unit.lineLane===target.owner).length>=LINE_MAX_POPULATION)return false;
  const elapsed=this.time-state.startedAt,level=1+Math.floor(elapsed/30),rank=clamp(1+Math.floor((level-1)/10),1,5),hp=recipe.hp*(1+elapsed/300),damage=recipe.damage*(1+elapsed/600),x=target.entrance.x;
  const unit=this.spawnEnemy(recipe.kind,x,target.entrance.z,{lineCreep:true,hp,damage,armor:recipe.armor,range:recipe.range,speed:recipe.speed,interval:recipe.interval,accuracy:recipe.accuracy,evasion:recipe.evasion,critChance:recipe.critChance,critMultiplier:recipe.critMultiplier,level,skills:[...recipe.skills],skillLevels:Object.fromEntries(recipe.skills.map(key=>[key,rank])),variantRoll:.999999,team:1000+target.index,owner:`line-creep:${u.owner}`,challenge:`line-${target.owner}`,cell:target.cell});
  // SpawnEnemy shares the combat engine but species modifiers must not silently
  // change a priced Line Wars recipe. Keep its explicitly advertised profile.
  Object.assign(unit,{name:recipe.name,hp,maxHp:hp,damage,armor:recipe.armor,speed:recipe.speed,interval:recipe.interval,range:recipe.range,size:recipe.size,flying:recipe.flying,altitude:recipe.altitude,element:recipe.element||null,resistances:{},lineCreep:true,lineLane:target.owner,lineAttacker:u.owner,lineKey:building.unitKey,lineBounty:recipe.bounty,linePortalDamage:recipe.lifeDamage,lineResolved:false,rarity:'line',acquireRange:6,destination:{...target.entrance},order:'attackMove',target:null});
  unit.monsterBase=Object.freeze({...unit.monsterBase,hp,damage,armor:recipe.armor,speed:recipe.speed,interval:recipe.interval,accuracy:recipe.accuracy,evasion:recipe.evasion,critChance:recipe.critChance,critMultiplier:recipe.critMultiplier,magicPower:.65});this.refresh(unit);unit.hp=unit.maxHp;
  u.gold-=recipe.cost;lane.income+=recipe.income;lane.sent++;lane.nextSendAt=this.time+.35;building.readyAt=this.time+clamp(1.5+recipe.cost/180,1.5,6);
  this.fx('lineSend',building.x,building.z,{source:u.id,unit:building.unitKey,target:target.owner,cost:recipe.cost,income:recipe.income});this.fx('lineArrival',unit.x,unit.z,{source:unit.id,unit:building.unitKey});return true;
 },

 eliminateLineLane(lane){
  if(!lane.alive)return;lane.alive=false;lane.eliminatedAt=this.time;lane.lives=0;lane.queue=[];lane.queueStatus=null;const hero=this.player(lane.owner);if(hero){hero.alive=false;hero.hp=0;hero.died=this.time;hero.lineEliminated=true;hero.lineRespawnAt=null;hero.destination=null;hero.target=null;hero.order='stop';this.cancelChannel(hero);this.closeShop?.(hero);}
  for(const unit of this.units)if(!unit.hero&&(unit.lineLane===lane.owner||unit.lineAttacker===lane.owner)){unit.alive=false;unit.died=this.time;unit.lineResolved=true;}
  this.fx('lineEliminated',lane.x,LINE_PORTAL_Z,{owner:lane.owner});this.message=`O portal de ${lane.name} caiu. As tropas agora seguem para o próximo defensor vivo.`;
 },

 tickLineWars(dt){
  const state=this.lineWars;if(!state||this.phase!=='wave'||!Number.isFinite(dt)||dt<=0)return;state.elapsed=this.time-state.startedAt;this.wave=1+Math.floor(state.elapsed/60);
  // This catch-up loop is deterministic even when a server frame is delayed.
  while(this.time>=state.nextIncomeAt){for(const lane of state.lanes.filter(entry=>entry.alive)){const hero=this.player(lane.owner);if(!hero)continue;hero.gold+=lane.income;lane.incomeEarned+=lane.income;if(hero.alive)this.gainXp(hero,6);this.fx('lineIncome',hero.x,hero.z,{source:hero.id,amount:lane.income});}state.nextIncomeAt+=LINE_INCOME_INTERVAL;}
  for(const unit of this.units){if(!unit.lineCreep||unit.lineResolved)continue;const lane=laneByOwner(this,unit.lineLane);if(!lane?.alive){unit.alive=false;unit.died=this.time;unit.lineResolved=true;continue;}
   if(!unit.alive){unit.lineResolved=true;lane.defeated++;continue;}
   if(Math.hypot(unit.x-lane.portal.x,unit.z-lane.portal.z)<.9){unit.lineResolved=true;unit.alive=false;unit.escaped=true;unit.died=this.time;lane.lives=Math.max(0,lane.lives-unit.linePortalDamage);lane.leaks++;lane.lastAttacker=unit.lineAttacker;const attacker=laneByOwner(this,unit.lineAttacker);if(attacker){attacker.breaches+=unit.linePortalDamage;const hero=this.player(attacker.owner);if(hero)hero.score=(hero.score||0)+unit.linePortalDamage*100;}this.fx('lineLeak',lane.x,LINE_PORTAL_Z,{owner:lane.owner,attacker:unit.lineAttacker,amount:unit.linePortalDamage,lives:lane.lives});}
  }
  for(const lane of state.lanes)if(lane.alive&&lane.lives<=0)this.eliminateLineLane(lane);
  const remaining=state.lanes.filter(lane=>lane.alive);if(remaining.length<=1){this.phase='victory';this.winner=remaining[0]?.owner||null;this.winningOwners=remaining.map(lane=>lane.owner);this.message=remaining.length?`${remaining[0].name} protegeu o último portal e venceu Line Wars!`:'Todos os portais caíram no mesmo instante. Line Wars terminou empatado.';return;}
  for(const lane of remaining){const hero=this.player(lane.owner);if(!hero)continue;
   if(!hero.alive){hero.lineRespawnAt??=this.time+5;if(this.time>=hero.lineRespawnAt){hero.alive=true;hero.lineRespawnAt=null;const point=this.voxelMap?.markers.heroSpawn||this.voxelMap?.markers.fountain;hero.x=lane.x+(point?.x||0);hero.z=point?.z??8;hero.destination=null;hero.target=null;hero.order='auto';hero.stun=0;hero.dots={};hero.frostUntil=0;hero.vx=hero.vz=0;this.cancelChannel(hero);this.refresh(hero);hero.hp=hero.maxHp;hero.mana=hero.maxMana;this.fx('lineRevive',hero.x,hero.z,{source:hero.id});}}
   this.processLineQueue(hero,lane);
   if(hero.bot&&this.time>=lane.nextBotSendAt&&(lane.queue?.length||0)<5){lane.nextBotSendAt=this.time+3.5+this.random()*2;const budget=Math.max(50,hero.gold*.5),pool=LINE_UNIT_ORDER.filter(key=>LINE_UNITS[key].cost<=budget);if(pool.length){const key=pool[Math.floor(this.random()*pool.length)],building=state.buildings.find(entry=>entry.owner===hero.owner&&entry.unitKey===key);if(building)this.queueLineUnit(hero,{building:building.id});}}
  }
  this.tickLineFountains(dt);
 },

 snapshotLineWars(){
  const state=this.lineWars;if(!state)return null;return{startedAt:state.startedAt,elapsed:state.elapsed,nextIncomeAt:state.nextIncomeAt,incomeInterval:state.incomeInterval,maxPopulation:state.maxPopulation,lanes:state.lanes.map(lane=>({...lane,target:this.lineTargetFor(lane.owner)?.owner||null,population:this.units.filter(unit=>unit.alive&&unit.lineCreep&&unit.lineLane===lane.owner).length})),buildings:state.buildings};
 }
};
