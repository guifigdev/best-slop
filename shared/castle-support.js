import {CASTLE_BUILDINGS,CASTLE_UNITS,castleDamageMultiplier} from './castle-catalog.js';
import {castleCombatProfile,castleCombatRange} from './castle-spatial.js';
import {castleWeaponFor} from './castle-weapons.js';
import {castleArmyRoute,castleProducerSpawn} from './castle-production.js';
import {castlePassable} from './castle-navigation.js';

export const CASTLE_SUPPORT_TYPES=Object.freeze(['tower','income','heal','damage','kill','stun','duplicate','haste','artillery','wave','earthquake','convert','chaos','erase','eruption','destroyBuilding','resurrection','hex','decay','raiseDead','bless','poison','frostTower','frostOrbs','weaken','tentacles','protection','restore','starfall','power','shield']);
const TYPES=new Set(CASTLE_SUPPORT_TYPES),distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),random=g=>typeof g.random==='function'?g.random():.5;
export const castleSupportEffectSupported=effect=>!!effect&&TYPES.has(effect.type);
const ready=(cf,b)=>b.alive&&b.economyReady&&!(b.workRemaining>0)&&!b.pendingUpgrade&&Number.isFinite(b.readyAt)&&cf.elapsed>=b.readyAt&&!(b.castleFrozenUntil>cf.elapsed);
const effectOf=b=>CASTLE_BUILDINGS[b.key]?.castleEffect;
const mechanical=u=>u.mechanical||u.isMechanical||/mechanical/.test(u.classification||'')||/tank|machine|shredder|glaive|ballista|catapult|mortar|golem|annihilator|roterothopter|gyrocopter/i.test(u.name||'');
const spellImmune=u=>u.magicImmune||u.spellImmune;
const spatial=(e,value)=>e.worldSpace||e.castleSpatialScale?value:castleCombatRange(value);
const spatialRadius=e=>e.global?Infinity:spatial(e,e.range??e.radius??100);
const allies=(cf,b)=>cf.units.filter(u=>u.alive&&u.team===b.team);
const enemies=(cf,b,e={})=>cf.units.filter(u=>u.alive&&u.team!==b.team&&(u.flying?e.targetsAir!==false:e.targetsGround!==false)&&distance(b,u)<=spatialRadius(e));
const structures=(cf,b,e={})=>cf.buildings.filter(u=>u.alive&&u.team!==b.team&&distance(b,u)<=spatialRadius(e));
const pick=(g,list)=>list.length?list[Math.min(list.length-1,Math.floor(random(g)*list.length))]:null;
const emit=(g,type,p,extra={})=>g.fx?.(type,p.x,p.z,{castle:true,...extra});
function restoreStat(u,key){const applied=u.castleSupportApplied?.[key];if(applied&&u[key]===applied.result)u[key]=applied.before;}
export function resetCastleSupportStats(cf){
 for(const u of [...cf.units,...cf.buildings,...cf.teams]){for(const key of ['damage','armor'])restoreStat(u,key);u.castleSupportApplied={};u.castleSupportMoveFactor=1;u.castleSupportAttackFactor=1;u.castlePowerDamageBonus=0;u.castlePowerCadenceBonus=0;u.castlePowered=false;u.castleHexed=false;}
}
function addStat(u,key,amount,multiplier=1){const before=Number(u[key])||0,result=(before+amount)*multiplier;u[key]=result;u.castleSupportApplied||={};u.castleSupportApplied[key]={before,result};}
function shieldBlocks(g,target){const shield=target.castleEnergyShield;if(!shield||!(shield.charges>0))return false;shield.charges--;if(shield.heal){const amount=Math.min(shield.heal,target.maxHp-target.hp);target.hp+=amount;shield.heal=0;if(amount)emit(g,'heal',target,{target:target.id,amount});}if(!shield.charges)target.castleEnergyShield=null;emit(g,'shield',target,{target:target.id,duration:.5});return true;}
export function castleSupportIncomingDamage(g,target,amount,source,element=null){
 const isSpell=source?.supportAbility||source?.attackType==='spells';
 if(amount>0&&target.castleRestorationWard){const ward=target.castleRestorationWard;target.castleRestorationWard=null;for(const t of g.castleFight.units.filter(t=>t.alive&&t.team===target.team&&distance(t,target)<=spatial(ward,ward.radius||1))){const heal=Math.min(t.maxHp-t.hp,ward.heal||175);t.hp+=heal;t.mana=Math.min(t.maxMana||0,(t.mana||0)+(ward.mana||50));t.castleBuffs||={};t.castleBuffs['support-restore']={until:g.castleFight.elapsed+(ward.duration||6),armor:ward.armor||6};emit(g,'heal',t,{source:ward.source,target:t.id,amount:heal});}}
 if(isSpell&&spellImmune(target))return 0;if(isSpell&&!source?.supportAbility&&shieldBlocks(g,target))return 0;
 if(isSpell&&target.castleProtection)amount*=1-clamp(target.castleProtection.spellReduction||0,0,.95);
 if(!isSpell&&target.castleProtection&&random(g)<(target.castleProtection.blockChance||0))amount=Math.max(0,amount-(target.castleProtection.blockAmount||0));
 if(!isSpell&&target.castleBlessing?.evasion&&random(g)<target.castleBlessing.evasion){emit(g,'miss',target,{source:source?.id,target:target.id});return 0;}
 return amount;
}
export function castleSupportAttackDamage(g,unit,target,amount){if(unit.castleBlessing?.demolish&&target.castleStructure)amount*=unit.castleBlessing.demolish;if(unit.castleBlessing?.critChance&&random(g)<unit.castleBlessing.critChance){amount*=unit.castleBlessing.critMultiplier||2;emit(g,'critical',target,{source:unit.id,target:target.id,amount:Math.round(amount)});}return amount;}
function sourceOf(b,e){return{...b,attackType:e.attackType||'spells',supportAbility:e.type!=='artillery'};}
function deal(g,target,damage,b,e,hooks,skipShield=false){if(!target.alive||target.team===b.team||spellImmune(target)&&!['chaos','siege','pierce','normal'].includes(e.attackType))return 0;if(!skipShield&&shieldBlocks(g,target))return 0;const attack=e.attackType||'spells',resistance=clamp(target.spellResistance||0,0,1),amount=damage*castleDamageMultiplier(attack,target.armorType)*(attack==='spells'?1-resistance:1)/(attack==='spells'?1:1+.06*Math.max(0,target.armor||0));return hooks.hurt(target,amount,sourceOf(b,e),e.element||'arcane');}
function status(g,target,b,e,apply){if(spellImmune(target)||shieldBlocks(g,target))return false;apply();emit(g,e.type==='hex'?'cast':'frost',target,{source:b.id,target:target.id,duration:Math.min(2,e.duration||1),element:e.element||'ice'});return true;}
function state(cf){cf.supportFields||=[];cf.supportCorpses||=[];cf.supportRevivals||=[];return cf;}
function modifier(u,key,at,value){u.castleSupportDebuffs||={};const old=u.castleSupportDebuffs[key];if(!old||value.until>=old.until)u.castleSupportDebuffs[key]={...value,at};}
function applyStatuses(g,dt,hooks){const cf=g.castleFight;
 for(const u of cf.units.filter(u=>u.alive)){
  let slow=0,attackSlow=0,armor=0;for(const [key,v]of Object.entries(u.castleSupportDebuffs||{})){if(v.until<=cf.elapsed){delete u.castleSupportDebuffs[key];continue;}slow=Math.max(slow,v.moveSlow||0);attackSlow=Math.max(attackSlow,v.attackSlow||0);armor=Math.min(armor,v.armor||0);if(v.dps>0){const b={id:v.source,owner:v.owner,team:v.team},amount=v.dps*dt;deal(g,u,amount,b,{attackType:'spells',element:v.element||'poison'},hooks,true);}}
  if(u.castleHexUntil>cf.elapsed){u.castleHexed=true;slow=Math.max(slow,.6);}u.castleSupportMoveFactor*=u.castleRootUntil>cf.elapsed?0:1-clamp(slow,0,.9);u.castleSupportAttackFactor*=1-clamp(attackSlow,0,.9);
  const bless=u.castleBlessing;if(bless){addStat(u,'damage',bless.damage||0);armor+=bless.armor||0;u.castleSupportAttackFactor*=1+(bless.attackSpeed||0);}
  if(u.castleEnergyShield?.charges>0)armor+=u.castleEnergyShield.armor||0;
  if(armor)addStat(u,'armor',armor);
  if(u.castleTemporaryUntil&&cf.elapsed>=u.castleTemporaryUntil){u.alive=false;u.died=g.time;u.castleNoCorpse=true;emit(g,'castleDeath',u,{target:u.id});}
 }
}
function routeFor(cf,unit,b){const lane=cf.map.lanes.find(l=>l.id===b.lane)||cf.map.lanes[0];return{lane:lane.id,route:castleArmyRoute(cf,{...b,team:unit.team},lane),pathIndex:0};}
function addUnit(g,b,definition,point,extra={}){const cf=g.castleFight;if(!definition||cf.units.filter(u=>u.alive&&u.team===b.team).length>=60)return null;const d=castleCombatProfile(definition),maxHp=d.hp||250,u={...d,id:g.id(),unitKey:d.key||definition.key,kind:d.kind||'skeleton',name:d.name||'Invocação',castleUnit:true,owner:b.owner,team:b.team,building:b.id,x:point.x,z:point.z,hp:maxHp,maxHp,damage:d.damage||20,baseDamage:d.damage||20,armor:d.armor||0,baseArmor:d.armor||0,armorType:d.armorType||'unarmored',attackType:d.attackType||'normal',range:d.range||1.2,speed:d.speed??2.7,interval:d.interval||1.4,ranged:(d.range||0)>1.5,flying:!!d.flying,canHitAir:d.targetsAir??false,canHitGround:d.targetsGround??true,alive:true,cd:0,stun:0,...extra};Object.assign(u,routeFor(cf,u,b));if(!castlePassable(cf,point,u.collisionRadius||.35,{flying:u.flying,ignoreUnits:false}))return null;cf.units.push(u);emit(g,'summon',u,{source:u.id,buildingId:b.id});return u;}
function summonAround(g,b,e,center,hooks){let count=0;for(let i=0;i<(e.count||1);i++){let added=null;for(let j=0;j<24&&!added;j++){const angle=(i/Math.max(1,e.count||1)+j/24)*Math.PI*2,ring=1+Math.floor(j/8)*.8,p={x:center.x+Math.sin(angle)*ring,z:center.z+Math.cos(angle)*ring};added=addUnit(g,b,e.summon,p,{castleNoCorpse:e.type==='tentacles',castleTemporaryUntil:(e.summon?.duration||e.type==='tentacles'&&e.duration)?g.castleFight.elapsed+(e.summon?.duration||e.duration):null});}if(added)count++;}return count;}
function copyAtProducer(g,unit,building,owner=building.owner){const cf=g.castleFight,p=cf.players[owner];if(!p||cf.units.filter(u=>u.alive&&u.team===p.team).length>=60)return null;const clone={...unit,id:g.id(),owner,team:p.team,hp:unit.maxHp,alive:true,cd:0,stun:0,castleDuplicate:true};delete clone.castleSupportApplied;const routed=routeFor(cf,clone,{...building,team:p.team}),point=castleProducerSpawn(cf,building,clone,routed.route[0]);if(!point)return null;Object.assign(clone,point,routed);cf.units.push(clone);emit(g,'summon',clone,{source:clone.id,buildingId:building.id});return clone;}
export function castleSupportOnSpawn(g,unit,building){const cf=g.castleFight;if(!cf||!unit||unit.castleDuplicate)return;
 const powered=cf.buildings.some(b=>ready(cf,b)&&b.team===building.team&&effectOf(b)?.type==='power'&&distance(b,building)<=spatialRadius(effectOf(b)));
 if(powered&&!unit.castlePowerTrained){unit.castlePowerTrained=true;const power=effectOf(cf.buildings.find(b=>ready(cf,b)&&b.team===building.team&&effectOf(b)?.type==='power'&&distance(b,building)<=spatialRadius(effectOf(b))));unit.maxHp+=power.trainedHp??100;unit.hp+=power.trainedHp??100;unit.baseArmor=(unit.baseArmor??unit.armor)+(power.trainedArmor??2);unit.armor=unit.baseArmor;unit.baseDamage=(unit.baseDamage??unit.damage)*(1+(power.trainedDamageBonus??.2));unit.damage=unit.baseDamage;}
 if(CASTLE_BUILDINGS[building.key]?.legendary)return;
 const shrines=cf.buildings.filter(b=>ready(cf,b)&&b.team===building.team&&effectOf(b)?.type==='duplicate');if(!shrines.length)return;const shrine=shrines.sort((a,b)=>a.id-b.id)[0],effect=effectOf(shrine);if(random(g)<(effect.chance??.24))copyAtProducer(g,unit,building,shrine.owner);
}
function collectDeaths(g){const cf=state(g.castleFight);for(const u of cf.units.filter(u=>!u.alive&&!u.castleNoCorpse)){if(cf.supportCorpses.some(c=>c.unitId===u.id))continue;const corpse={unitId:u.id,x:u.x,z:u.z,at:cf.elapsed,team:u.team,unit:{...u},used:false};cf.supportCorpses.push(corpse);const shrines=cf.buildings.filter(b=>ready(cf,b)&&b.team===u.team&&effectOf(b)?.type==='resurrection');if(shrines.length&&random(g)<Math.min(.4,(effectOf(shrines[0]).chance??.2)*Math.min(2,shrines.length)))cf.supportRevivals.push({unit:{...u},at:cf.elapsed+(effectOf(shrines[0]).delay||2),source:shrines[0].id});}
 cf.supportCorpses=cf.supportCorpses.filter(c=>cf.elapsed-c.at<30);
 const pending=[];for(const r of cf.supportRevivals){if(cf.elapsed<r.at){pending.push(r);continue;}const b=cf.buildings.find(b=>b.id===r.source&&ready(cf,b));if(!b)continue;const u=r.unit,point={x:u.x,z:u.z},definition={...u,hp:u.maxHp,damage:u.baseDamage??u.damage,armor:u.baseArmor??u.armor};let revived=null;for(let i=0;i<24&&!revived;i++){const a=i*Math.PI/12,ring=i?1+Math.floor(i/8):0;revived=addUnit(g,b,definition,{x:point.x+Math.sin(a)*ring,z:point.z+Math.cos(a)*ring},{owner:u.owner,team:u.team,castleResurrected:true});}if(revived){delete revived.castleSupportApplied;delete revived.castleSupportDebuffs;delete revived.castleEnergyShield;revived.stun=0;revived.castleHexUntil=0;revived.castleRootUntil=0;emit(g,'heal',revived,{target:revived.id,amount:revived.hp});}}
 cf.supportRevivals=pending;
}
function family(key){const seen=new Set([key]);let changed=true;while(changed){changed=false;for(const b of Object.values(CASTLE_BUILDINGS)){const unit=typeof b.unit==='string'?b.unit:b.unit?.key;if(!unit)continue;const related=[b,...(b.upgradesTo||[]).map(k=>CASTLE_BUILDINGS[k]),CASTLE_BUILDINGS[b.requiresBuilding]].filter(Boolean),units=related.map(x=>typeof x.unit==='string'?x.unit:x.unit?.key).filter(Boolean);if(units.some(k=>seen.has(k)))for(const k of units)if(!seen.has(k)){seen.add(k);changed=true;}}}return seen;}
function convert(g,b,target,definition=null){const cf=g.castleFight;target.owner=b.owner;target.team=b.team;target.target=null;target.cd=0;if(definition){const max=definition.hp||target.maxHp;Object.assign(target,castleCombatProfile(definition));target.unitKey=definition.key;target.maxHp=max;target.hp=max;target.baseDamage=target.damage;target.baseArmor=target.armor||0;}Object.assign(target,routeFor(cf,target,b));emit(g,'charm',target,{source:b.id,target:target.id});}
function field(g,b,e,p,kind=e.type,extra={}){const cf=state(g.castleFight),f={id:g.id(),source:b.id,owner:b.owner,team:b.team,x:p.x,z:p.z,start:cf.elapsed,until:cf.elapsed+(e.duration||1),kind,effect:{...e},...extra};cf.supportFields.push(f);emit(g,kind==='eruption'?'fireball':kind==='starfall'?'blizzard':'frostnova',p,{source:b.id,radius:castleCombatRange(e.radius||2),duration:Math.min(3,e.duration||1),element:e.element||'ice'});return f;}
function tickFields(g,dt,hooks){
 const cf=state(g.castleFight),keep=[];
 for(const f of cf.supportFields){
  if(cf.elapsed-dt>=f.until)continue;const e=f.effect,b={id:f.source,team:f.team,owner:f.owner},radius=spatial(e,e.radius??2),seconds=Math.max(0,Math.min(cf.elapsed,f.until)-Math.max(cf.elapsed-dt,f.start));
  if(f.kind==='frostOrbs'){
   f.x+=Math.sin(f.direction)*(e.speed??250/256)*dt;f.z+=Math.cos(f.direction)*(e.speed??250/256)*dt;
   if(f.x<cf.map.minX||f.x>cf.map.maxX||f.z<cf.map.minZ||f.z>cf.map.maxZ)continue;
   if(cf.elapsed>=(f.nextFx||0)){f.nextFx=cf.elapsed+.25;emit(g,'frost',f,{source:f.source,radius:.5,duration:.3});}
   const nearby=cf.units.filter(t=>t.alive&&t.team!==f.team&&!spellImmune(t)&&distance(t,f)<=spatial(e,e.chillRadius??e.radius??2));
   for(const t of nearby)modifier(t,'orb-chill',cf.elapsed,{until:cf.elapsed+.4,moveSlow:Math.max(0,-(e.moveSpeed??-.4)),attackSlow:Math.max(0,-(e.attackSpeed??-.4)),source:f.source,owner:f.owner,team:f.team});
   const inRange=nearby.filter(t=>distance(t,f)<=radius);
   if(inRange.length&&cf.elapsed>=(f.nextAttack||0)){const target=pick(g,inRange);f.nextAttack=cf.elapsed+(e.attackInterval||.33);deal(g,target,e.damage||20,b,e,hooks);}
   if(inRange.length&&cf.elapsed>=(f.nextControl||0)){const target=pick(g,inRange);f.nextControl=cf.elapsed+(e.controlInterval||2.04);status(g,target,b,e,()=>{if(target.flying){target.stun=Math.max(target.stun||0,e.airStun||8);deal(g,target,e.airDamage||125,b,e,hooks,true);}else{target.stun=Math.max(target.stun||0,e.groundStun||.5);target.castleRootUntil=Math.max(target.castleRootUntil||0,cf.elapsed+(e.rootDuration||15));modifier(target,'orb-roots',cf.elapsed,{until:target.castleRootUntil,dps:e.rootDamagePerSecond||15,source:f.source,owner:f.owner,team:f.team,element:'ice'});}});}
   keep.push(f);continue;
  }
  const troops=cf.units.filter(t=>t.alive&&t.team!==f.team&&(t.flying?e.targetsAir!==false:e.targetsGround!==false)&&distance(t,f)<=radius).sort((a,b)=>distance(a,f)-distance(b,f)||a.id-b.id),targets=[...troops,...((e.targetsBuildings||e.targetStructures)?cf.buildings.filter(t=>t.alive&&t.team!==f.team&&distance(t,f)<=radius):[])].slice(0,e.maxTargets||Infinity);
  for(const target of targets){f.checkedTargets||=[];f.blockedTargets||=[];if(!f.checkedTargets.includes(target.id)){f.checkedTargets.push(target.id);if(shieldBlocks(g,target))f.blockedTargets.push(target.id);}if(f.blockedTargets.includes(target.id)||spellImmune(target))continue;
   if(e.moveSlow||e.attackSlow||e.moveSpeed<0||e.attackSpeed<0)modifier(target,'field-'+f.id,cf.elapsed,{until:cf.elapsed+.25,moveSlow:e.moveSlow??Math.max(0,-(e.moveSpeed||0)),attackSlow:e.attackSlow??Math.max(0,-(e.attackSpeed||0)),source:f.source,owner:f.owner,team:f.team});
   const dps=e.dps??e.damagePerSecond??e.damage??0;if(dps&&(!e.damageBuildingsOnly||target.castleStructure))deal(g,target,dps*seconds*(target.castleStructure?(e.buildingFactor??e.buildingMultiplier??.4):1),b,e,hooks,true);
  }keep.push(f);
 }cf.supportFields=keep;
}

export function tickCastleSupport(g,dt,hooks){
 const cf=state(g.castleFight);resetCastleSupportStats(cf);collectDeaths(g);tickFields(g,dt,hooks);applyStatuses(g,dt,hooks);
 const decay=new Map();
 for(const source of cf.buildings.filter(b=>ready(cf,b)&&effectOf(b)?.type==='power')){const e=effectOf(source);for(const t of cf.buildings.filter(t=>t.alive&&t.team===source.team&&distance(source,t)<=spatialRadius(e))){if(!t.castlePowered){addStat(t,'armor',e.armor??2);t.castlePowered=true;}t.castlePowerDamageBonus=Math.max(t.castlePowerDamageBonus||0,e.towerDamageBonus??.25);if(effectOf(t)?.type!=='tower')t.castlePowerCadenceBonus=Math.max(t.castlePowerCadenceBonus||0,e.manaRegen??.25);if(e.dispel&&t.castleFrozenUntil>cf.elapsed&&cf.elapsed>=(t.castlePowerDispelAt||0)){t.castlePowerDispelAt=cf.elapsed+4;if(random(g)<.25)t.castleFrozenUntil=cf.elapsed;}}}
 for(const b of cf.buildings.filter(b=>ready(cf,b))){const original=effectOf(b),e=original?.type==='tower'?castleCombatProfile(original):original;if(!castleSupportEffectSupported(e)||['income','duplicate','resurrection'].includes(e.type))continue;
  if(e.type==='power')continue;
  if(e.type==='decay'){for(const t of enemies(cf,b,e).filter(t=>!mechanical(t)))if(!decay.has(t.id)||decay.get(t.id).e.damage<(e.damage||e.dps||8))decay.set(t.id,{target:t,b,e});continue;}
  if(e.type==='heal'){for(const t of [...cf.units,...cf.buildings,...cf.teams].filter(t=>t.alive&&t.team===b.team&&distance(b,t)<=castleCombatRange(e.radius)))t.hp=Math.min(t.maxHp,t.hp+(t.castleStructure?e.buildingHealPerSecond:e.healPerSecond)*dt);continue;}
  if(cf.elapsed<(b.nextEffect||0))continue;
  let targets=enemies(cf,b,e),target=null;
  if(['haste','bless','protection','restore','shield'].includes(e.type))targets=allies(cf,b).filter(t=>distance(b,t)<=spatialRadius(e));
  if(['frostTower','destroyBuilding'].includes(e.type))targets=structures(cf,b,e).filter(t=>e.type!=='destroyBuilding'||!CASTLE_BUILDINGS[t.key]?.legendary);
  if(e.type==='raiseDead'){const corpse=cf.supportCorpses.find(c=>!c.used&&distance(b,c)<=spatialRadius(e));if(!corpse||!e.summon&&!e.summons?.length)continue;const definition=e.general&&random(g)<(e.generalChance??.1)?e.general:e.summon||pick(g,e.summons);const n=summonAround(g,b,{...e,summon:definition},corpse,hooks);if(!n)continue;corpse.used=true;b.nextEffect=cf.elapsed+e.interval/(1+(b.castlePowerCadenceBonus||0));continue;}
  if(e.type==='frostOrbs'){for(let i=0;i<(e.count||3);i++)field(g,b,e,b,'frostOrbs',{direction:random(g)*Math.PI*2});b.nextEffect=cf.elapsed+e.interval/(1+(b.castlePowerCadenceBonus||0));continue;}
  if(e.type==='power')continue;
  if(e.type==='shield')targets.sort((a,b)=>Number(!!a.castleEnergyShield)-Number(!!b.castleEnergyShield)||a.id-b.id);
  if(e.type==='protection')targets.sort((a,b)=>Number(!!a.castleProtection)-Number(!!b.castleProtection)||a.id-b.id);
  if(e.type==='restore')targets=targets.filter(t=>!t.castleRestorationWard);
  if(e.type==='bless')targets=targets.filter(t=>!t.castleBlessing);
  if(e.type==='artillery')targets=structures(cf,b,e);
  if(e.type==='convert')targets=targets.filter(t=>!t.castleStructure&&!CASTLE_BUILDINGS[cf.buildings.find(b=>b.id===t.building)?.key]?.legendary);
  if(e.type==='tower')targets=targets.filter(t=>castleWeaponFor(e,t));
  if(!targets.length)continue;target=['tower','shield','protection'].includes(e.type)?targets[0]:pick(g,targets);b.nextEffect=cf.elapsed+(e.interval||1)/(1+(b.castlePowerCadenceBonus||0));
  if(e.type==='haste'){for(const t of targets.filter(t=>distance(t,target)<=castleCombatRange(e.radius||e.range||2))){t.hasteUntil=Math.max(t.hasteUntil||0,cf.elapsed+(e.duration||60));t.hasteAttackSpeed=Math.max(t.hasteAttackSpeed||0,e.attackSpeed??.66);t.hasteMoveSpeed=Math.max(t.hasteMoveSpeed||0,e.moveSpeed??0);emit(g,'rage',t,{source:b.id,target:t.id,duration:.5});}}
  else if(e.type==='restore'){target.castleRestorationWard={...e,source:b.id,owner:b.owner};emit(g,'shield',target,{source:b.id,target:target.id,duration:1});}
  else if(e.type==='bless'){const extra=pick(g,['demolish','crit','evasion']);target.castleBlessing={damage:e.damageBonusFlat??e.flatDamage??20,armor:e.armor??3,attackSpeed:e.attackSpeed??.2,...(extra==='demolish'?{demolish:1.5}:extra==='crit'?{critChance:.25,critMultiplier:2}:{evasion:.3})};target.maxHp+=e.hpBonus??e.healthBonus??200;target.hp+=e.hpBonus??e.healthBonus??200;emit(g,'battlecry',target,{source:b.id,target:target.id,duration:1});}
  else if(e.type==='protection'){target.castleProtection={spellReduction:e.spellReduction??e.reduction??.55,blockChance:e.blockChance??.4,blockAmount:e.blockAmount??e.blockDamage??40};emit(g,'shield',target,{source:b.id,target:target.id,duration:1});}
  else if(e.type==='shield'){target.castleEnergyShield={charges:e.charges||1,armor:e.armor||2,heal:e.heal||0};emit(g,'shield',target,{source:b.id,target:target.id,duration:1});}
  else if(e.type==='convert'){if(status(g,target,b,e,()=>convert(g,b,target))){} }
  else if(e.type==='hex')status(g,target,b,e,()=>{target.castleHexUntil=Math.max(target.castleHexUntil||0,cf.elapsed+(e.duration||45));});
  else if(e.type==='weaken'){for(const t of targets)status(g,t,b,e,()=>modifier(t,'global-weaken',cf.elapsed,{until:cf.elapsed+(e.duration||20),armor:e.armor??-12,source:b.id,owner:b.owner,team:b.team}));}
  else if(e.type==='poison'){for(const t of targets.filter(t=>distance(t,target)<=castleCombatRange(e.radius||2)))status(g,t,b,e,()=>modifier(t,'serpent-poison',cf.elapsed,{until:cf.elapsed+(e.duration||20),moveSlow:e.moveSlow??Math.max(0,-(e.moveSpeed??-.2)),attackSlow:e.attackSlow??Math.max(0,-(e.attackSpeed??-.2)),armor:e.armor??-5,dps:t===target?(e.damage||e.dps||10):(e.secondaryDamage||5),source:b.id,owner:b.owner,team:b.team,element:'poison'}));}
  else if(e.type==='earthquake'){for(const t of targets.filter(t=>distance(t,target)<=castleCombatRange(e.radius||1))){if(status(g,t,b,e,()=>modifier(t,'earthquake',cf.elapsed,{until:cf.elapsed+(e.duration||10),moveSlow:e.moveSlow??Math.max(0,-(e.moveSpeed||0)),attackSlow:e.attackSlow??Math.max(0,-(e.attackSpeed||0)),source:b.id,owner:b.owner,team:b.team})))deal(g,t,e.damage||40,b,e,hooks,true);}}
  else if(e.type==='tentacles')summonAround(g,b,e,target,hooks);
  else if(['eruption','starfall'].includes(e.type))field(g,b,e,target);
  else if(e.type==='destroyBuilding'){if(!shieldBlocks(g,target))hooks.hurt(target,target.hp,{...b,supportAbility:true,attackType:'chaos'});}
  else if(e.type==='erase'){const related=family(target.unitKey);for(const t of targets.filter(t=>related.has(t.unitKey)))if(!shieldBlocks(g,t))hooks.hurt(t,t.hp,{...b,supportAbility:true,attackType:'chaos'});}
  else if(e.type==='frostTower'){if(!shieldBlocks(g,target)){deal(g,target,e.damage||50,b,{...e,attackType:'chaos'},hooks,true);target.castleFrozenUntil=Math.max(target.castleFrozenUntil||0,cf.elapsed+(e.duration||10));if(e.radius)for(const t of [...structures(cf,b,{global:true}),...enemies(cf,b,{global:true})].filter(t=>t!==target&&distance(t,target)<=castleCombatRange(e.radius)))if(!shieldBlocks(g,t)){deal(g,t,e.damage||50,b,{...e,attackType:'chaos'},hooks,true);if(t.castleStructure)t.castleFrozenUntil=Math.max(t.castleFrozenUntil||0,cf.elapsed+(e.duration||10));else t.stun=Math.max(t.stun||0,e.duration||12);}emit(g,'frostnova',target,{source:b.id,radius:castleCombatRange(e.radius||1),duration:1});}}
  else if(e.type==='chaos'){if(shieldBlocks(g,target)||spellImmune(target))continue;const outcome=Math.floor(random(g)*8);if(outcome===0){target.alive=false;target.died=g.time;emit(g,'fireball',target,{source:b.id,target:target.id,radius:1});}else if(outcome===1)hooks.hurt(target,target.hp,{...b,supportAbility:true,attackType:'chaos'});else if(outcome===2)convert(g,b,target,e.mutation||e.summon);else if(outcome===3)target.castleHexUntil=cf.elapsed+(e.hexDuration||45);else if(outcome===4)deal(g,target,500,b,e,hooks,true);else if(outcome===5){target.maxHp+=400;target.hp=target.maxHp;target.baseDamage=(target.baseDamage??target.damage)+25;target.damage+=25;}else if(outcome===6){target.stun=Math.max(target.stun||0,6);deal(g,target,200,b,e,hooks,true);}emit(g,'cast',target,{source:b.id,target:target.id,duration:.7,chaosOutcome:outcome});}
  else if(e.type==='artillery'){const angle=random(g)*Math.PI*2,spread=Math.sqrt(random(g))*castleCombatRange(e.scatterRadius||0),impact={x:target.x+Math.sin(angle)*spread,z:target.z+Math.cos(angle)*spread},amount=e.damageMin!==undefined?e.damageMin+random(g)*(e.damageMax-e.damageMin):e.damage||350;for(const t of [...cf.units,...cf.buildings].filter(t=>t.alive&&t.team!==b.team&&!t.flying&&distance(t,impact)<=castleCombatRange(e.radius||1)))deal(g,t,amount,b,{...e,attackType:e.attackType||'siege'},hooks);emit(g,'fireball',impact,{source:b.id,radius:castleCombatRange(e.radius||1),duration:.7});}
  else if(e.type==='wave'){const dx=target.x-b.x,dz=target.z-b.z,len=Math.hypot(dx,dz)||1,width=castleCombatRange(e.radius||e.width||1);for(const t of targets){const tx=t.x-b.x,tz=t.z-b.z,along=(tx*dx+tz*dz)/len,cross=Math.abs(tx*dz-tz*dx)/len;if(along>=0&&along<=(e.length?castleCombatRange(e.length):len+width)&&cross<=width)deal(g,t,e.damage||270,b,e,hooks);}emit(g,'flamebreath',b,{source:b.id,tx:target.x,tz:target.z,element:'ice',duration:.7});}
  else if(e.type==='stun'){for(const t of e.singleTarget||e.maxTargets===1?[target]:targets){if(shieldBlocks(g,t)||spellImmune(t))continue;if(e.damage)deal(g,t,e.damage,b,e,hooks,true);t.stun=Math.max(t.stun||0,e.duration||1);emit(g,'frostnova',t,{source:b.id,target:t.id,radius:.8,duration:.7});}}
  else if(e.type==='kill'){if(!shieldBlocks(g,target))hooks.hurt(target,target.hp,{...b,supportAbility:true,attackType:'chaos'});}
  else if(e.type==='tower'){const weapon=castleWeaponFor(e,target);if(!weapon)continue;const damage=weapon.damage*(1+(b.castlePowerDamageBonus||0))*castleDamageMultiplier(weapon.attackType,target.armorType)/(1+.06*Math.max(0,target.armor||0));b.nextEffect=cf.elapsed+(weapon.interval||1);hooks.hurt(target,damage,{...b,attackType:weapon.attackType});emit(g,'arrow',b,{source:b.id,target:target.id,tx:target.x,tz:target.z,projectileKind:'arrow'});}
  else if(e.type==='damage'){for(const t of e.radius?targets.filter(t=>distance(t,target)<=castleCombatRange(e.radius)): [target])deal(g,t,e.damage||0,b,e,hooks);emit(g,'bolt',b,{source:b.id,tx:target.x,tz:target.z});}
 }
 for(const {target,b,e}of decay.values())deal(g,target,(e.dps??e.damage??8)*dt,b,e,hooks,true);
 // New shields/blessings and expired slows apply to this combat frame too.
 for(const u of cf.units){u.castleHexed=!!(u.castleHexUntil>cf.elapsed);}
 for(const b of cf.buildings)b.castlePowered=false;
 collectDeaths(g);
}
