import {castleSupportEffectSupported,tickCastleSupport,castleSupportOnSpawn,resetCastleSupportStats,castleSupportIncomingDamage,castleSupportAttackDamage} from './castle-support.js';
import {CASTLE_RESCUE_STRIKE,castleRescueApproach,tickCastleRescueOrder} from './castle-rescue.js';
import {castleCombatProfile} from './castle-spatial.js';
import {animalBasicProjectile} from './animal-projectiles.js';
import {queueCastleWork,pauseCastleWork,tickCastleWorker} from './castle-workers.js';
import {castleWeaponFor} from './castle-weapons.js';
import {castleArmyRoute,castleProducerSpawn} from './castle-production.js';
import {launchCastleBlast,tickCastleItemProjectiles} from './castle-item-effects.js';
import {advanceCastleRoute} from './castle-marching.js';
import {castleBuildCheck,castleUpgradeAvailability} from './castle-build-rules.js';
import {constructionDisplacements,applyConstructionDisplacements,castlePassable,moveCastleUnit,castleNavigationRadius,castleSegmentClear} from './castle-navigation.js';
import {castleBuilderFor} from './castle-builders.js';
import {unitsPhysicallyCollide} from './unit-footprint.js';
import {sceneryObstacles} from './scenery.js';
import {CASTLE_RACES,CASTLE_BUILDINGS,CASTLE_UNITS,CASTLE_ITEMS,CASTLE_ECONOMY_REFERENCE,castleDamageMultiplier} from './castle-catalog.js';
import {castleReferenceScenery,castleMap,castlePoint,castleBuildPosition,castleBuildPlacement,castleOverlap} from './castle-map.js';

export const CASTLE_START_GOLD=CASTLE_ECONOMY_REFERENCE.defaultStartingGold;
export const CASTLE_START_LUMBER=CASTLE_ECONOMY_REFERENCE.defaultStartingLumber;
export {CASTLE_RESCUE_STRIKE} from './castle-rescue.js';
export const CASTLE_INCOME_INTERVAL=10;
export const CASTLE_BASE_INCOME=Math.floor(CASTLE_ECONOMY_REFERENCE.baseIncomeRate*CASTLE_ECONOMY_REFERENCE.defaultPlayerMultiplier*CASTLE_ECONOMY_REFERENCE.displayMultiplier);
export const CASTLE_UNIT_CAP=60;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const own=(object,key)=>typeof key==='string'&&Object.hasOwn(object,key);
const radius=u=>u.castleStructure?Math.max(u.w||2,u.d||2)/2:castleNavigationRadius(u);
const active=game=>game.castleFight&&game.phase==='wave'&&!game.castleFight.finished;
const passiveItems=new Set(['speed_aura','repair_aura','damage_aura','passive_blast']);
const playable=b=>!!b&&b.playable!==false&&(!!catalogUnit(b)||castleSupportEffectSupported(b.castleEffect));
const catalogUnit=building=>typeof building.unit==='string'?CASTLE_UNITS[building.unit]:building.unit;
const canHit=(u,t)=>!!castleWeaponFor(u,t);
const passable=castlePassable,move=moveCastleUnit;
function hurt(game,target,amount,source,element=null){if(!target?.alive||!Number.isFinite(amount)||amount<=0)return 0;amount=castleSupportIncomingDamage(game,target,amount,source,element);if(!(amount>0))return 0;const actual=Math.min(target.hp,amount);target.hp=Math.max(0,target.hp-amount);target.hitAt=game.time;game.fx('damage',target.x,target.z,{source:source?.id,target:target.id,amount:Math.round(actual),magic:source?.attackType==='magic'||source?.attackType==='spells',element,castle:true});if(target.hp<=0){target.alive=false;if(target.castleStructure)game.castleFight.navigationRevision++;target.died=game.time;game.fx('castleDeath',target.x,target.z,{source:source?.id,target:target.id,structure:!!target.castleStructure});if(source?.owner&&target.castleUnit){const owner=game.player(source.owner);if(owner)owner.gold+=target.bounty??4;}}return actual;}
function itemReady(game,u,key){return(game.castleFight.players[u.owner].cooldowns[key]||0)<=game.castleFight.elapsed;}
function incomeRate(cf,p){return(p.baseIncomeRate??CASTLE_ECONOMY_REFERENCE.baseIncomeRate)+cf.buildings.filter(b=>b.alive&&b.owner===p.owner&&b.economyReady).reduce((sum,b)=>sum+(b.incomeContribution||0),0);}
function effectiveIncome(cf,p){const base=Math.floor(incomeRate(cf,p)*(p.incomeMultiplier??1)*CASTLE_ECONOMY_REFERENCE.displayMultiplier),count=cf.buildings.filter(b=>b.alive&&b.owner===p.owner&&b.economyReady&&CASTLE_BUILDINGS[b.key].castleEffect?.type==='income').length,weights=CASTLE_ECONOMY_REFERENCE.treasureWeights,weight=count<weights.length?weights[count]:weights.at(-1)+(count-9)*.25;return Math.floor(base*(1+.25*weight));}


export const CastleFightMethods={
 setupCastleBuilder(u){const profile=castleBuilderFor(u);if(!profile)return false;u.castleBuilderKey=profile.key;u.castleRace=profile.race;u.castleProfile=profile;u.castleBuilderTitle=profile.title;u.castleRaceName=profile.raceName;u.name=profile.name;u.gold=CASTLE_START_GOLD;u.lumber=CASTLE_START_LUMBER;u.rescueCharges=CASTLE_RESCUE_STRIKE.charges;u.castleBuilder=true;u.skills=[];u.skillLevels={};u.inventory=[];u.cooldowns={};u.autoSkills={};u.channel=null;u.mana=u.maxMana=0;u.target=null;u.destination=null;u.order='stop';u.speed=7;u.castleWorkQueue=[];u.castleAutoRepair=true;u.castleWorkPaused=false;return u;},
 initCastleFight(){
  if(this.castleFight)return false;const heroes=this.heroes();if(heroes.length<2)return false;if(heroes.some(u=>!castleBuilderFor(u)))return false;const map=castleMap(this.options.laneCount);
  const cf=this.castleFight={map,elapsed:0,nextIncome:CASTLE_INCOME_INTERVAL,navigationRevision:0,players:{},buildings:[],units:[],projectiles:[],rescueStrikes:[],finished:false,winnerTeam:null,teams:[],shop:{...map.tower,stock:Object.fromEntries(Object.entries(CASTLE_ITEMS).map(([key,item])=>[key,Number.isFinite(item.stock)?item.stock:null]))}};
  cf.shop.nextStock={};cf.shop.availableAt=Object.fromEntries(Object.entries(CASTLE_ITEMS).map(([key,item])=>[key,item.initialDelay??item.sourceStats?.stockInitialDelay??0]));for(const[key,item]of Object.entries(CASTLE_ITEMS))cf.shop.stock[key]=item.stock??item.sourceStats?.stockMaximum??null;
  cf.teams=map.castles.map(castle=>({...castle,id:this.id(),castleStructure:true,castle:true,name:'Castelo do clã',hp:map.castleHp,maxHp:map.castleHp,armor:map.castleArmor,armorType:map.castleArmorType,alive:true}));
  for(const [seat,u]of heroes.entries()){this.setupCastleBuilder(u);const team=seat%2+1,race=castleBuilderFor(u).race;cf.players[u.owner]={owner:u.owner,team,race,income:CASTLE_BASE_INCOME,baseIncomeRate:CASTLE_ECONOMY_REFERENCE.baseIncomeRate,incomeMultiplier:CASTLE_ECONOMY_REFERENCE.defaultPlayerMultiplier,cooldowns:{},items:{},legendarySlots:1,rescueCharges:CASTLE_RESCUE_STRIKE.charges,rescueDamage:0,rescueKills:0,hasBuilt:false,nextBot:seat*.65};u.castleBuilder=true;u.castleTeam=team;u.castleRace=race;u.team=team;u.gold=CASTLE_START_GOLD;u.lumber=CASTLE_START_LUMBER;u.x=team===1?-38:38;u.z=(Math.floor(seat/2)-.5)*3;u.speed=7;u.order='stop';u.destination=null;u.target=null;u.mana=u.maxMana=0;u.castleBlinkUntil=0;u.ready=false;delete u.cell;delete u.challenge;}
  this.phase='wave';this.wave=0;this.timer=0;this.bounds=map.maxX;cf.scenery=castleReferenceScenery(map);cf.obstacles=[...sceneryObstacles(cf.scenery),{id:'castle-central-market',type:'structure',x:map.tower.x,z:map.tower.z,w:2.4,d:2.4}];this.obstacles=cf.obstacles;this.zones=[];this.units=heroes;this.message='Castle Fight: construa seu exército. As tropas lutam sozinhas; vença destruindo o castelo inimigo.';return true;
 },

 castleCommand(u,c){
  this.commandFailureReason=null;
  if(!u||!c||typeof c!=='object')return false;
  if(c.type==='ready'){if(this.castleFight||this.phase!=='preparation')return false;u.ready=true;if(this.heroes().length>=2&&this.heroes().every(h=>h.ready||h.bot))this.initCastleFight();return true;}
  if(c.type==='cfRace'){const profile=castleBuilderFor(u);if(!profile||c.race!==profile.race||['victory','defeat'].includes(this.phase)||this.castleFight?.players[u.owner]?.hasBuilt||this.castleFight?.finished)return false;u.castleRace=profile.race;if(this.castleFight?.players[u.owner])this.castleFight.players[u.owner].race=profile.race;return true;}
  if(!active(this)||!u.castleBuilder||!u.alive)return false;const cf=this.castleFight,p=cf.players[u.owner];if(!p)return false;
  if(c.type==='cfRescueStrike')return this.castleRescueStrike(u,c);
  if(c.type==='cfProduction')return this.castleProduction(u,c);
  if(c.type==='cfAutoRepair'){u.castleAutoRepair=c.enabled===undefined?!u.castleAutoRepair:!!c.enabled;return true;}
  if(c.type==='cfRepair'){const target=[...cf.buildings,...cf.teams].find(b=>b.id===c.buildingId&&b.alive&&b.team===p.team&&!(b.workRemaining>0));if(!target)return false;u.castleRescueOrder=null;u.destination=null;u.castleRepairTarget=target.id;return true;}
  if(c.type==='cfResume'){const target=cf.buildings.find(b=>b.id===c.buildingId&&b.alive&&b.owner===u.owner&&b.workRemaining>0);if(!target)return false;queueCastleWork(u,target);return true;}
  if(c.type==='cfMove'){const point=castlePoint(cf.map,c);if(!point)return false;pauseCastleWork(u);u.destination=point;u.order='move';return true;}
  if(c.type==='cfStop'){pauseCastleWork(u);u.destination=null;u.order='stop';u.moving=false;return true;}
  if(c.type==='cfBlink'){const point=castlePoint(cf.map,c);if(!point||distance(point,c)>.01||distance(u,point)>20||cf.elapsed<(u.castleBlinkUntil||0)||!passable(cf,point,.5))return false;pauseCastleWork(u);const from={x:u.x,z:u.z};u.x=point.x;u.z=point.z;u.destination=null;u.order='stop';u.castleBlinkUntil=cf.elapsed+8;this.fx('blink',from.x,from.z,{source:u.id,tx:u.x,tz:u.z,castle:true});return true;}
  if(c.type==='cfBuild'){
   const check=castleBuildCheck(this,u,c.building,c);if(!check.allowed){this.commandFailureReason=check.reason;return false;}const definition=check.definition,point=check.point,footprint=definition.footprint||{w:3,d:3};
   const buildTime=Math.max(0,definition.buildTime||0),spawnInterval=Math.max(1,definition.spawnInterval??definition.spawnTime??20),lane=cf.map.lanes.reduce((a,b)=>Math.abs(a.z-point.z)<=Math.abs(b.z-point.z)?a:b),maxHp=definition.hp||800+definition.cost*1.5;
   const building={id:this.id(),key:c.building,name:definition.name,owner:u.owner,team:p.team,race:p.race,...point,...footprint,castleStructure:true,hp:maxHp*.1,maxHp,armor:definition.armor??5,armorType:definition.armorType||'fortified',alive:true,invested:definition.cost,created:cf.elapsed,readyAt:null,workRemaining:Math.max(.05,buildTime),workTotal:Math.max(.05,buildTime),workProgress:0,spawnInterval,nextSpawn:null,productionPaused:false,productionRemaining:null,lane:lane.id,spawnCount:0,economyReady:false,registeredCost:0,incomeContribution:0};const exits=constructionDisplacements(cf,building,[...this.units,...cf.units.filter(t=>!this.units.includes(t))]);if(!exits){this.commandFailureReason='Não há espaço livre ao lado para retirar as unidades da obra.';return false;}applyConstructionDisplacements(exits);u.gold-=definition.cost;u.lumber-=definition.lumberCost||0;p.hasBuilt=true;cf.buildings.push(building);cf.navigationRevision++;queueCastleWork(u,building);this.fx('castleBuild',point.x,point.z,{source:u.id,building:c.building,buildingId:building.id,duration:buildTime});return true;
  }
  if(c.type==='cfUpgrade')return this.castleUpgrade(u,c);
  if(c.type==='cfSell'){
   const building=cf.buildings.find(b=>b.id===c.buildingId&&b.alive&&b.owner===u.owner);if(!building)return false;const refund=Math.floor(building.invested*.65*clamp(building.hp/building.maxHp,0,1));building.alive=false;cf.navigationRevision++;building.sold=true;building.died=this.time;u.gold+=refund;this.fx('castleSell',building.x,building.z,{source:u.id,amount:refund,buildingId:building.id});return true;
  }
  if(c.type==='cfItem')return this.castleBuyItem(u,c);
  if(c.type==='cfUseItem'){if(!Number.isInteger(c.slot)||c.slot<0||c.slot>=6)return false;const entry=u.inventory[c.slot];if(!entry)return false;return this.castleBuyItem(u,{...c,item:entry.key},c.slot);}
  return false;
 },

 castleRescueStrike(u,c){
  const cf=this.castleFight,p=cf?.players[u?.owner],point=cf&&castlePoint(cf.map,c),rules=CASTLE_RESCUE_STRIKE;
  if(!active(this)||!u?.alive||!u.castleBuilder||!p||!point||distance(point,c)>.001){this.commandFailureReason='Escolha uma área válida dentro do campo durante a batalha.';return false;}
  if(!(p.rescueCharges>0)){this.commandFailureReason='Seu Golpe de resgate já foi usado nesta partida.';return false;}
  if(distance(u,point)>rules.range){const approach=castleRescueApproach(cf,u,point);if(!approach){this.commandFailureReason='Não há caminho livre para alcançar essa área. Mova o construtor ou use Blink.';return false;}pauseCastleWork(u);u.destination=null;u.order='rescue';u.castleRescueOrder={...point,approach,revision:cf.navigationRevision};return true;}
  pauseCastleWork(u);u.castleRescueOrder=null;u.destination=null;u.moving=false;u.order='stop';u.facing=Math.atan2(point.x-u.x,point.z-u.z);
  p.rescueCharges--;u.rescueCharges=p.rescueCharges;cf.rescueStrikes.push({id:this.id(),owner:u.owner,source:u.id,team:p.team,...point,fireAt:cf.elapsed+rules.delay});this.fx('castleRescueWarning',point.x,point.z,{source:u.id,radius:rules.radius,duration:rules.delay,castle:true});return true;
 },

 castleRescueTick(){
  const cf=this.castleFight,waiting=[];for(const strike of cf.rescueStrikes||[]){if(cf.elapsed+1e-8<strike.fireAt){waiting.push(strike);continue;}const p=cf.players[strike.owner],source={id:strike.source,owner:strike.owner,team:strike.team,attackType:'spells'};for(const unit of cf.units.filter(t=>t.alive&&t.castleUnit&&!t.castleStructure&&!t.castleBuilder&&!t.castle&&t.team!==strike.team&&distance(t,strike)<=CASTLE_RESCUE_STRIKE.radius)){const actual=hurt(this,unit,CASTLE_RESCUE_STRIKE.damage,source,'arcane');if(p){p.rescueDamage+=actual;if(!unit.alive)p.rescueKills++;}}this.fx('castleRescueStrike',strike.x,strike.z,{source:strike.source,radius:CASTLE_RESCUE_STRIKE.radius,castle:true});}cf.rescueStrikes=waiting;
 },

 castleProduction(u,c){
  const cf=this.castleFight;if(!active(this)||!u?.alive||!u.castleBuilder||!Array.isArray(c.buildingIds)||!c.buildingIds.length||typeof c.paused!=='boolean')return false;
  const ids=[...new Set(c.buildingIds)],buildings=ids.map(id=>cf.buildings.find(b=>b.id===id&&b.alive&&b.owner===u.owner));if(buildings.some(b=>!b||!catalogUnit(CASTLE_BUILDINGS[b.key])))return false;
  // Resuming a mixed group restarts every cycle, aligning equal producers.
  // Repeating resume on an already-running group cannot manipulate its clock.
  if(buildings.every(b=>!!b.productionPaused===c.paused))return true;
  for(const b of buildings){if(c.paused){if(!b.productionPaused)b.productionRemaining=b.nextSpawn===null?b.spawnInterval:Math.max(0,b.nextSpawn-cf.elapsed);b.productionPaused=true;b.nextSpawn=null;}
   else{b.productionPaused=false;b.productionRemaining=null;b.nextSpawn=b.economyReady&&!(b.workRemaining>0)&&!b.pendingUpgrade?cf.elapsed+b.spawnInterval:null;}delete b.nextSpawnAttempt;delete b.spawnAttemptRevision;}
  this.fx('castleProduction',u.x,u.z,{source:u.id,buildingIds:ids,paused:c.paused,castle:true});return true;
 },

 castleUpgrade(u,c){
  const cf=this.castleFight,key=c.building??c.upgrade,check=castleUpgradeAvailability(this,u,c.buildingId,key);if(!check.allowed){this.commandFailureReason=check.reason;return false;}const definition=check.definition,building=cf.buildings.find(b=>b.id===c.buildingId);
  u.gold-=definition.cost;u.lumber-=definition.lumberCost||0;building.invested+=definition.cost;building.pendingUpgrade=key;building.w=Math.max(building.w,definition.footprint.w);building.d=Math.max(building.d,definition.footprint.d);cf.navigationRevision++;building.workRemaining=building.workTotal=Math.max(.05,definition.buildTime||0);building.workProgress=0;building.readyAt=null;building.nextSpawn=null;queueCastleWork(u,building);this.fx('castleUpgrade',building.x,building.z,{source:u.id,buildingId:building.id,building:key,duration:definition.buildTime||0});return true;
 },

 castleBuyItem(u,c,inventorySlot=null){
  const cf=this.castleFight,p=cf.players[u.owner],item=own(CASTLE_ITEMS,c.item)?CASTLE_ITEMS[c.item]:null,handlers=new Set(['speed_aura','repair_aura','damage_aura','passive_blast','double_damage','quad_damage','chain_orb','stone_scroll','legendary_slot']);
  const fromInventory=inventorySlot!==null,stored=fromInventory?u.inventory[inventorySlot]:null,passive=!!item&&passiveItems.has(item.effect),store=c.store===true&&!passive&&!fromInventory;
  if(!item||!item.playable||!handlers.has(item.effect)||fromInventory&&(!stored||stored.key!==c.item||!(stored.charges>0)||passive)||!store&&!itemReady(this,u,c.item)||!fromInventory&&(distance(u,cf.map.tower)>cf.map.tower.radius||u.gold<item.cost||(u.lumber||0)<(item.lumberCost||0)||cf.elapsed<(cf.shop.availableAt[c.item]||0)||cf.shop.stock[c.item]===0||passive&&p.items[c.item]))return false;
  if(!fromInventory&&(store||passive)&&u.inventory.filter(Boolean).length>=6){this.commandFailureReason='Sua mochila está cheia. Use um consumível antes de comprar.';return false;}
  const spendPurchase=()=>{u.gold-=item.cost;u.lumber-=item.lumberCost||0;if(cf.shop.stock[c.item]!==null){cf.shop.stock[c.item]--;if(!cf.shop.nextStock[c.item])cf.shop.nextStock[c.item]=cf.elapsed+(item.sourceStats?.stockReplenish||Infinity);}};
  if(store){spendPurchase();const slot=u.inventory.findIndex(i=>!i);const entry={key:c.item,charges:1};if(slot<0)u.inventory.push(entry);else u.inventory[slot]=entry;this.fx('castleItem',u.x,u.z,{source:u.id,item:c.item,pickup:true});return true;}
  const allies=cf.units.filter(unit=>unit.alive&&unit.team===p.team),point=castlePoint(cf.map,c.x===undefined?cf.map.tower:c);if(!point)return false;let changed=false;
  if(passiveItems.has(item.effect)){p.items[c.item]={key:c.item,boughtAt:cf.elapsed,nextAt:cf.elapsed};const index=u.inventory.findIndex(i=>!i),entry={key:c.item,charges:1,passive:true};if(index<0)u.inventory.push(entry);else u.inventory[index]=entry;changed=true;}
  if(item.effect==='legendary_slot'){p.legendarySlots+=item.extraSlots||1;changed=true;}
  if(item.effect==='stone_scroll')for(const target of allies.filter(t=>distance(t,point)<=item.radius)){target.hp=Math.min(target.maxHp,target.hp+item.heal);target.mana=Math.min(target.maxMana||0,(target.mana||0)+item.mana);target.castleBuffs||={};target.castleBuffs[c.item]={until:cf.elapsed+item.duration,armor:item.armor};changed=true;this.fx('heal',target.x,target.z,{source:u.id,amount:item.heal,castle:true});}
  if(['double_damage','quad_damage'].includes(item.effect))for(const target of allies.filter(t=>distance(t,point)<=item.radius)){target.castleBuffs||={};target.castleBuffs[c.item]={until:cf.elapsed+item.duration,damageBonus:item.damageBonus};changed=true;}
  if(item.effect==='chain_orb'){
   let target=c.target===undefined?cf.units.filter(t=>t.alive&&t.team!==p.team&&distance(u,t)<=(item.range||100)).sort((a,b)=>distance(u,a)-distance(u,b)||a.id-b.id)[0]:cf.units.find(t=>t.id===c.target&&t.alive&&t.team!==p.team&&distance(u,t)<=(item.range||100)),from=u;const visited=new Set();
   for(let i=0;target&&i<item.jumps;i++){visited.add(target.id);hurt(this,target,item.damage*item.retention**i,{...u,attackType:'spells'},'lightning');this.fx('bolt',from.x,from.z,{source:u.id,tx:target.x,tz:target.z,castle:true});from=target;changed=true;target=cf.units.filter(t=>t.alive&&t.team!==p.team&&!visited.has(t.id)&&distance(from,t)<=item.radius).sort((a,b)=>distance(from,a)-distance(from,b)||a.id-b.id)[0];}
  }
  if(!changed)return false;if(fromInventory){stored.charges--;if(stored.charges<=0)u.inventory[inventorySlot]=null;}else spendPurchase();p.cooldowns[c.item]=cf.elapsed+Math.max(0,item.cooldown||0);this.fx('castleItem',point.x,point.z,{source:u.id,item:c.item,radius:item.radius||4});return true;
 },

 castleBuildingDefinition(building){return CASTLE_BUILDINGS[building.key];},

 castleCompleteBuildings(atTime=this.castleFight.elapsed){
  const cf=this.castleFight;for(const building of cf.buildings.filter(b=>b.alive&&!(b.workRemaining>0)&&b.readyAt!==null&&atTime>=b.readyAt)){
   if(building.pendingUpgrade){const definition=CASTLE_BUILDINGS[building.pendingUpgrade],ratio=building.hp/building.maxHp;building.key=building.pendingUpgrade;building.name=definition.name;building.maxHp=definition.hp;building.hp=definition.hp*ratio;building.armor=definition.armor;building.armorType=definition.armorType;building.w=definition.footprint.w;building.d=definition.footprint.d;building.spawnInterval=Math.max(1,definition.spawnInterval??definition.spawnTime??20);building.pendingUpgrade=null;cf.navigationRevision++;}
   if(building.completedKey===building.key)continue;if(building.productionPaused){building.nextSpawn=null;building.productionRemaining=building.spawnInterval;}const definition=CASTLE_BUILDINGS[building.key],data=definition.provenance||{},cost=data.scriptIncomeCost??definition.cost;
   building.registeredCost+=cost;building.incomeContribution=(data.registeredIncomeFactor||0)*building.registeredCost/100;building.economyReady=true;building.completedKey=building.key;
   const woodFactor=data.registeredKind===0?CASTLE_ECONOMY_REFERENCE.woodAwardNormalFactor:data.registeredKind===1?CASTLE_ECONOMY_REFERENCE.woodAwardSiegeFactor:0,wood=Math.floor(cost*woodFactor),owner=this.player(building.owner);if(owner&&wood){owner.lumber=(owner.lumber||0)+wood;this.fx('castleLumber',building.x,building.z,{source:owner.id,amount:wood,buildingId:building.id});}
  }
 },

 castleItemTick(dt){
  const cf=this.castleFight;
  for(const[key,next]of Object.entries(cf.shop.nextStock))if(cf.elapsed>=next){const item=CASTLE_ITEMS[key],max=item.stock??item.sourceStats?.stockMaximum??0;cf.shop.stock[key]=Math.min(max,(cf.shop.stock[key]||0)+1);if(cf.shop.stock[key]<max)cf.shop.nextStock[key]+=item.sourceStats?.stockReplenish||Infinity;else delete cf.shop.nextStock[key];}
  for(const unit of cf.units.filter(t=>t.alive)){const buffs=Object.values(unit.castleBuffs||{}).filter(b=>b.until>cf.elapsed);unit.damage=(unit.baseDamage??unit.damage)*(1+Math.max(0,...buffs.map(b=>b.damageBonus||0)));unit.armor=(unit.baseArmor??unit.armor)+Math.max(0,...buffs.map(b=>b.armor||0));unit.castleSpeedBonus=0;unit.castleAttackBonus=0;
   let auraDamage=0;for(const p of Object.values(cf.players).filter(p=>p.team===unit.team)){const holder=this.player(p.owner);for(const key of Object.keys(p.items)){const item=CASTLE_ITEMS[key];if(distance(holder,unit)>(item.radius||100))continue;if(item.effect==='speed_aura'){unit.castleSpeedBonus=Math.max(unit.castleSpeedBonus,item.moveSpeed||0);unit.castleAttackBonus=Math.max(unit.castleAttackBonus,item.attackSpeed||0);}if(item.effect==='damage_aura')auraDamage=Math.max(auraDamage,item.damageBonus||0);}}
   unit.damage+=(unit.baseDamage??unit.damage)*auraDamage;
  }
  for(const p of Object.values(cf.players)){const holder=this.player(p.owner);for(const[key,owned]of Object.entries(p.items)){const item=CASTLE_ITEMS[key];if(item.effect==='repair_aura')for(const target of [...cf.buildings,...cf.teams].filter(t=>t.alive&&t.team===p.team&&distance(holder,t)<=item.radius))target.hp=Math.min(target.maxHp,target.hp+item.healPerSecond*dt);if(item.effect==='passive_blast'&&cf.elapsed>=owned.nextAt){const target=cf.units.filter(t=>t.alive&&t.team!==p.team&&distance(holder,t)<=item.radius).sort((a,b)=>distance(holder,a)-distance(holder,b)||a.id-b.id)[0];if(target)launchCastleBlast(this,holder,target,item,key);}}}
 },

 castleSupportTick(dt){tickCastleSupport(this,dt,{hurt:(target,amount,source,element)=>hurt(this,target,amount,source,element)});},

 // Castle defense is an explicit adaptation: the v1.14b Guard Tower weapon.
 castleDefenseTick(dt){
  const cf=this.castleFight,weapon=castleCombatProfile(CASTLE_BUILDINGS.human_h006.castleEffect);
  for(const castle of cf.teams.filter(c=>c.alive)){
   castle.hp=Math.min(castle.maxHp,castle.hp+.5*dt);castle.defense={...weapon,reference:'Guard Tower v1.14b',adapted:true};
   if(cf.elapsed<(castle.nextAttack||0))continue;
   const target=cf.units.filter(t=>t.alive&&t.team!==castle.team&&distance(castle,t)<=weapon.range+radius(castle)+radius(t)).sort((a,b)=>distance(castle,a)-distance(castle,b)||a.id-b.id)[0];if(!target)continue;
   castle.nextAttack=cf.elapsed+weapon.interval;castle.attackAt=this.time;
   const damage=weapon.damage*castleDamageMultiplier(weapon.attackType,target.armorType)/(1+.06*Math.max(0,target.armor||0));
   this.fx('arrow',castle.x,castle.z,{source:castle.id,target:target.id,tx:target.x,tz:target.z,castle:true,castleDefense:true});hurt(this,target,damage,{...castle,attackType:weapon.attackType});
  }
 },

 castleSpawn(building){
  const cf=this.castleFight,definition=CASTLE_BUILDINGS[building.key],data=castleCombatProfile(catalogUnit(definition));if(building.productionPaused||!data||cf.units.filter(u=>u.alive&&u.team===building.team).length>=CASTLE_UNIT_CAP)return null;
  const lane=cf.map.lanes[building.lane]||cf.map.lanes[0],route=castleArmyRoute(cf,building,lane),unit={...data,unitKey:definition.unit,kind:data.kind||'wolf',name:data.name||definition.name,castleUnit:true,owner:building.owner,team:building.team,building:building.id,lane:lane.id,x:building.x,z:building.z,hp:data.hp,maxHp:data.hp,damage:data.damage,baseDamage:data.damage,armor:data.armor||0,baseArmor:data.armor||0,armorType:data.armorType||'medium',attackType:data.attackType||'normal',range:data.range||1.5,speed:data.speed||3,interval:data.interval||1.3,ranged:(data.sourceStats?.range||0)>200||data.range>1.2||!!data.flying,projectileKind:/sniper|marksman|gunner/i.test(data.name||'')?'bullet':null,canHitGround:data.targetsGround??true,canHitAir:data.targetsAir??data.canHitAir??(data.range>=3||!!data.flying),flying:!!data.flying,altitude:data.altitude||0,size:data.size||1,alive:true,cd:0,stun:0,route,pathIndex:0};const spawn=castleProducerSpawn(cf,building,unit,route[0]);if(!spawn)return null;Object.assign(unit,spawn);unit.id=this.id();building.spawnCount=(building.spawnCount||0)+1;cf.units.push(unit);castleSupportOnSpawn(this,unit,building);this.fx('summon',unit.x,unit.z,{source:unit.id,buildingId:building.id,castle:true});return unit;
 },

 castleBotThink(u){
  const cf=this.castleFight,p=cf.players[u.owner];if(!u.bot||cf.elapsed<p.nextBot)return;p.nextBot=cf.elapsed+3;
  const choices=Object.entries(CASTLE_BUILDINGS).filter(([,b])=>b.race===p.race&&!b.requiresBuilding&&playable(b)&&b.cost<=u.gold&&(b.lumberCost||0)<=(u.lumber||0));if(!choices.length)return;const start=Math.floor(this.random()*choices.length);
  for(let i=0;i<choices.length;i++){const [key,b]=choices[(start+i)%choices.length],zone=cf.map.buildZones.find(z=>z.team===p.team),points=[];const footprint=b.footprint||{w:3,d:3};for(let x=Math.ceil((zone.minX+footprint.w/2)/cf.map.grid)*cf.map.grid;x<=zone.maxX-footprint.w/2;x+=2.5)for(let z=Math.ceil((zone.minZ+footprint.d/2)/cf.map.grid)*cf.map.grid;z<=zone.maxZ-footprint.d/2;z+=2.5)if(castleBuildPosition(cf.map,p.team,{x,z},footprint,[...cf.buildings,...cf.obstacles]))points.push({x,z});if(!points.length)continue;const first=Math.floor(this.random()*points.length);for(let j=0;j<points.length;j++)if(this.castleCommand(u,{type:'cfBuild',building:key,...points[(first+j)%points.length]}))return;}
 },

 tickCastleFight(dt){
  if(!Number.isFinite(dt)||dt<=0)return;if(dt>.101){const end=this.time;this.time-=dt;for(let remaining=dt;remaining>1e-8;){const step=Math.min(.1,remaining);this.time+=step;this.tickCastleFight(step);remaining-=step;}this.time=end;return;}this.effects=this.effects.filter(e=>this.time-e.time<(e.duration||1.5));if(!this.castleFight){if(this.phase==='preparation'){this.timer-=dt;if(this.heroes().length>=2&&(this.timer<=0||this.heroes().every(h=>h.ready||h.bot)))this.initCastleFight();}return;}if(!active(this))return;const cf=this.castleFight;cf.elapsed+=dt;
  while(cf.elapsed+1e-7>=cf.nextIncome){const payoutTime=cf.nextIncome;cf.nextIncome+=CASTLE_INCOME_INTERVAL;this.castleCompleteBuildings(payoutTime);for(const p of Object.values(cf.players)){const builder=this.player(p.owner);if(builder){const amount=effectiveIncome(cf,p);builder.gold+=amount;this.fx('gold',builder.x,builder.z,{source:builder.id,amount,reason:'castleIncome'});}}}
  this.castleCompleteBuildings();this.castleRescueTick();
  for(const builder of this.heroes()){builder.castleBuilder=true;builder.target=null;builder.moving=false;if(!tickCastleRescueOrder(this,builder,dt))tickCastleWorker(this,builder,dt);if(!builder.castleRescueOrder)this.castleBotThink(builder);}
  for(const building of cf.buildings.filter(b=>b.alive)){if(building.castleFrozenUntil>cf.elapsed||building.productionPaused||!building.economyReady||building.workRemaining>0||building.nextSpawn===null||building.pendingUpgrade||!catalogUnit(CASTLE_BUILDINGS[building.key])||cf.elapsed<building.nextSpawn||cf.elapsed<(building.nextSpawnAttempt||0)&&building.spawnAttemptRevision===cf.navigationRevision)continue;const unit=this.castleSpawn(building);if(unit){building.nextSpawn=cf.elapsed+building.spawnInterval;delete building.nextSpawnAttempt;delete building.spawnAttemptRevision;}else{building.nextSpawnAttempt=cf.elapsed+.5;building.spawnAttemptRevision=cf.navigationRevision;}}
  resetCastleSupportStats(cf);tickCastleItemProjectiles(this,dt,(target,damage,shot)=>hurt(this,target,damage,{id:shot.source,owner:shot.owner,attackType:'spells'},'arcane'));this.castleItemTick(dt);this.castleSupportTick(dt);this.castleDefenseTick(dt);
  for(const unit of cf.units.filter(u=>u.alive)){
   unit.cd=Math.max(0,unit.cd-dt);unit.stun=Math.max(0,unit.stun-dt);unit.moving=false;if(unit.stun>0)continue;if(unit.castleHexed){const destination=unit.route[Math.min(unit.pathIndex,unit.route.length-1)];const speed=unit.speed;unit.speed*=unit.castleSupportMoveFactor??.4;move(cf,unit,destination,dt);unit.speed=speed;continue;}
   advanceCastleRoute(cf,unit);
   const enemyUnits=cf.units.filter(t=>t.alive&&t.team!==unit.team&&canHit(unit,t)&&distance(unit,t)<=Math.max(9,(castleWeaponFor(unit,t)?.range??unit.range)+radius(t))),enemyStructures=[...cf.buildings,...cf.teams].filter(t=>t.alive&&t.team!==unit.team&&canHit(unit,t)&&distance(unit,t)<=(castleWeaponFor(unit,t)?.range??unit.range)+radius(t)+2),target=[...enemyUnits,...enemyStructures].sort((a,b)=>distance(unit,a)-distance(unit,b)||a.id-b.id)[0];
   if(target){unit.target=target.id;const weapon=castleWeaponFor(unit,target),reach=(weapon.slot===1?unit.range:weapon.range)+radius(target);if(distance(unit,target)<=reach){if(unit.cd<=0){const haste=(unit.hasteUntil||0)>cf.elapsed?1+(unit.hasteAttackSpeed||0)+(unit.castleAttackBonus||0):1+(unit.castleAttackBonus||0),amount=(weapon.slot===2?weapon.damage*(unit.baseDamage?unit.damage/unit.baseDamage:1):unit.damage)*castleDamageMultiplier(weapon.slot===2?weapon.attackType:unit.attackType,target.armorType)/(1+.06*Math.max(0,target.armor||0));unit.attackAt=this.time;unit.cd=(weapon.slot===2?weapon.interval:unit.interval)/(haste*(unit.castleSupportAttackFactor??1));unit.facing=Math.atan2(target.x-unit.x,target.z-unit.z);this.fx(unit.ranged||unit.range>=3||unit.flying?'arrow':'slash',unit.x,unit.z,{source:unit.id,target:target.id,tx:target.x,tz:target.z,element:['magic','spells'].includes(unit.attackType)?'arcane':null,projectileKind:animalBasicProjectile(unit),basicAttack:true,castle:true});hurt(this,target,castleSupportAttackDamage(this,unit,target,amount),{...unit,attackType:weapon.slot===2?weapon.attackType:unit.attackType});}}else{const speed=unit.speed;unit.speed*=(1+(unit.castleSpeedBonus||0)+((unit.hasteUntil||0)>cf.elapsed?unit.hasteMoveSpeed||0:0))*(unit.castleSupportMoveFactor??1);move(cf,unit,target,dt);unit.speed=speed;}}
   else{unit.target=null;const destination=unit.route[Math.min(unit.pathIndex,unit.route.length-1)],speed=unit.speed;unit.speed*=(1+(unit.castleSpeedBonus||0)+((unit.hasteUntil||0)>cf.elapsed?unit.hasteMoveSpeed||0:0))*(unit.castleSupportMoveFactor??1);if(move(cf,unit,destination,dt)&&unit.pathIndex<unit.route.length-1)unit.pathIndex++;advanceCastleRoute(cf,unit);unit.speed=speed;}
  }
  // Keep ground and air formations separate without consuming game RNG.
  const units=cf.units.filter(u=>u.alive);for(let i=0;i<units.length;i++)for(let j=i+1;j<units.length;j++){const a=units[i],b=units[j];if(!unitsPhysicallyCollide(a,b))continue;const min=radius(a)+radius(b),d=distance(a,b);if(d>=min)continue;const dx=d?(b.x-a.x)/d:(a.id<b.id?1:-1),dz=d?(b.z-a.z)/d:0,push=(min-d)*.5;for(const [u,sign]of [[a,-1],[b,1]]){const point=castlePoint(cf.map,{x:u.x+dx*push*sign,z:u.z+dz*push*sign});if(passable(cf,point,radius(u),{flying:u.flying})&&castleSegmentClear(cf,u,point,radius(u),{flying:u.flying})){u.x=point.x;u.z=point.z;}}}
  cf.units=cf.units.filter(u=>u.alive||this.time-(u.died||0)<1.2);cf.buildings=cf.buildings.filter(b=>b.alive||this.time-(b.died||0)<1.2);
  const surviving=cf.teams.filter(t=>t.alive);if(surviving.length<2){cf.finished=true;cf.winnerTeam=surviving[0]?.team||null;this.winningOwners=Object.values(cf.players).filter(p=>p.team===cf.winnerTeam).map(p=>p.owner);this.winner=this.winningOwners[0]||null;this.phase='victory';this.message=cf.winnerTeam?`A equipe ${cf.winnerTeam} destruiu o castelo inimigo!`:'Os dois castelos ruíram. Empate.';}
 },

 snapshotCastleFight(){if(!this.castleFight)return null;const cf=this.castleFight,{supportCorpses,supportRevivals,...publicState}=cf;return{...publicState,buildings:cf.buildings.map(b=>({...b,productionRemaining:b.productionPaused?b.productionRemaining:b.nextSpawn===null?null:Math.max(0,b.nextSpawn-cf.elapsed)})),players:Object.fromEntries(Object.entries(cf.players).map(([owner,p])=>[owner,{...p,baseIncome:p.income,incomeRate:incomeRate(cf,p),income:effectiveIncome(cf,p),lumberIncome:0,lumberRule:'completedProductionInvestment',gold:this.player(owner)?.gold||0,lumber:this.player(owner)?.lumber||0}]))};}
};
