import {CLASSIC_RO_AURAS,classicRagnarokMethods} from './classic-ragnarok-skills.js';
import {BonkMethods} from './bonk.js';
import {treeTagVision,kodoTagVision,filterExplorationSnapshot} from './exploration-vision.js';
import {DungeonMethods} from './dungeon.js';
import {BloodyTournamentMethods} from './bloody-tournament.js';
import {PHASE_KILLER_CHARACTERS} from './phase-killer-catalog.js';
import {PhaseKillerMethods} from './phase-killer.js';
import {KODO_TAG_CHARACTERS} from './kodo-tag-catalog.js';
import {KodoTagMethods} from './kodo-tag.js';
import {TREE_TAG_CHARACTERS} from './tree-tag-catalog.js';
import {WARLOCK_CHARACTERS} from './warlock-catalog.js';
import {TreeTagMethods} from './tree-tag.js';
import {WarlockMethods} from './warlock.js';
import {CASTLE_BUILDERS,castleBuilderFor} from './castle-builders.js';
import {animalBasicProjectile} from './animal-projectiles.js';
import {freshShopStock,stockForHero} from './shop-stock.js';
import {lineDefenseThink} from './line-defense.js';
import {canUseSkill} from './archetypes.js';
import {CastleFightMethods} from './castle-fight.js';
import {generateScenery,sceneryObstacles} from './scenery.js';
import {canLearnSkill} from './skill-access.js';
import {HEROES,SKILLS,ITEMS,ATTRIBUTES,levelOf,skillAt,itemUpgradePrice,ITEM_MAX_LEVEL} from './catalog.js';
import {ARENAS,arenaForWave} from './arenas.js';
import {ENCHANTMENTS,enchantAt,enchantPrice,isEnchantable,canEnchant} from './enchantments.js';
import {equipmentEffectAt} from './equipment-effects.js';
import {MONSTERS,MONSTER_PROFILES,monsterKind,monsterLoadout} from './monsters.js';
import {CUSTOM_HERO_COMMON_VISUALS} from './customhero-bestiary.js';
import {monsterReferenceName} from './monster-visual-references.js';
import {ARENA_BOUNDS} from './arena-size.js';
import {lineMap,mapMethods} from './map-runtime.js';
import {AbilityMethods,abilityScaling,magicSkillDamage,physicalSkillDamage} from './ability-rules.js';
import {resolveUnitCollisions,unitBlocked,unitRadius,unitSolidBlocked} from './unit-collision.js';
import {LineWarsMethods} from './line-wars.js';
import {permanentMethods} from './permanent-enchants.js';
import {nordicMethods} from './nordic-skills.js';
import {skillFor} from './skill-quality.js';
import {bossMethods} from './boss-patterns.js';
import {ownershipMethods} from './skill-ownership.js';
import {instanceMethods,privateTrials} from './instances.js';
import {monsterMethods} from './monster-abilities.js';
import {shopMethods} from './shop-system.js';
import {techniqueMethods} from './technique-system.js';
import {shopForItem} from './shops.js';
import {baseAttributes,recompute} from './stats.js';
import {modeOptions,capacity} from './modes.js';
import {attributeCost,attributePointsForLevel} from './progression.js';
import {competitionMethods} from './competition.js';
import {blocked,limitPoint,moveUnit,navigation,navigationInfo} from './field.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const BATTLE=new Set(['wave','bonus','final']);
const TERMINAL=new Set(['victory','defeat']);
export class Game {
 constructor(seed=7381,options={}){
  this.drops=[];this.projectiles=[];this.specials=[];this.options=modeOptions(options);this.voxelMap=this.options.mode==='linewars'?lineMap(options.voxelMap,this.options):null;this.bounds=ARENA_BOUNDS;this.obstacles=[];this.obstacleRevision=0;this.stageResults=[];this.winningOwners=[];
  this.worldSeed=seed;this.seed=seed;this.time=0;this.units=[];this.effects=[];this.players={};this.phase='preparation';this.wave=0;this.timer=90;this.serial=0;this.message='Mercado aberto: clique num comerciante para conversar. Distribua os atributos na ficha do herói.';
  this.arena='forest';this.zones=[];this.nextWeather=8;this.stock={};this.shopVisit=0;this.bonusResults=[];this.winner=null;this.restock();
 }
 random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 id(){return ++this.serial;}
 fx(type,x,z,extra={}){this.effects.push({id:this.id(),type,x,z,time:this.time,...extra});}
 heroes(){return this.units.filter(u=>u.hero&&!u.summon);}
 player(id){return this.units.find(u=>u.id===this.players[id]);}
 addPlayer(id,type='knight',name='Aventureiro',bot=false,squad=null,roProfile=null){
  const builder=this.options.mode==='castlefight'?castleBuilderFor(type):null,legacy=this.options.mode==='phasekiller'?PHASE_KILLER_CHARACTERS:this.options.mode==='treetag'?TREE_TAG_CHARACTERS:this.options.mode==='warlock'?WARLOCK_CHARACTERS:this.options.mode==='kodotag'?KODO_TAG_CHARACTERS:null,character=legacy&&typeof type==='string'&&Object.hasOwn(legacy,type)?legacy[type]:null,baseHero=legacy?(this.options.mode==='warlock'?'mage':'knight'):builder?.hero||type;
  if(typeof type!=='string'||this.players[id]||(legacy?!character:this.options.mode==='castlefight'?!builder:!Object.hasOwn(HEROES,type))||Object.keys(this.players).length>=capacity(this.options)||this.phase!=='preparation'||this.wave!==0)return false;
  const h=HEROES[baseHero],i=Array.from({length:capacity(this.options)},(_,i)=>i).find(i=>!this.heroes().some(u=>u.seat===i)),startSkill=h.skill;
  const u={id:this.id(),owner:id,hero:baseHero,...(builder?{castleBuilderKey:builder.key}:{}),name:String(name).slice(0,20),bot,size:({knight:1.05,mage:.88,ranger:.94,turtle:1.12,owl:.87,raccoon:.92,fenrir:1.05})[baseHero],seat:i,squad:squad||Math.floor(i/this.options.teamSize)+1,score:0,team:1,x:-4+(i%5)*2,z:-8.8,hp:h.hp,maxHp:h.hp,mana:h.mana,maxMana:h.mana,damage:h.damage,armor:h.armor,range:h.range,speed:h.speed,interval:h.interval,cd:0,stun:0,skills:[startSkill],skillLevels:{[startSkill]:1},skillRarities:{},cooldowns:{},inventory:[],attributes:baseAttributes(baseHero),attributePoints:6,skillPoints:0,essence:0,techniqueOffers:[],gold:1100,level:1,xp:0,kills:0,alive:true,order:'auto',botBuyAt:this.time+12+i*2};
  recompute(u,this.time);if(legacy){if(this.options.mode==='phasekiller'){this.setupPhaseKillerPlayer(u);}else if(this.options.mode==='kodotag'){u.kodoTagCharacter=type;this.setupKodoTagPlayer(u,type);}else if(this.options.mode==='treetag'){u.treeTagCharacter=type;this.setupTreeTagPlayer(u,type);}else{u.warlockCharacter=type;this.setupWarlockPlayer(u,type);}this.players[id]=u.id;this.units.push(u);return true;}if(this.options.mode==='castlefight')this.setupCastleBuilder(u);this.players[id]=u.id;this.units.push(u);u.team=this.homeTeam(u);this.setupHome(u,-4+(i%5)*2,-8.8);if(this.options.mode==='dungeon')this.setupDungeonPlayer(u);if(this.options.mode==='bloody')this.setupBloodyPlayer(u);if(this.options.mode==='bonk')this.setupBonkPlayer(u,roProfile?.lineage);if(this.voxelMap){u.marketShops=this.voxelMap.markers.shops;const home=this.voxelMap.markers.heroSpawn||this.voxelMap.markers.fountain,route=this.voxelMap.markers.routes[i%2],point=this.options.lineTeams?{x:route?.portal?.x??route?.spawn.x??home.x,z:home.z}:home;u.x=(u.cell?.x||0)+point.x;u.z=(u.cell?.z||0)+point.z;}this.prepareLineTerrain?.();return true;
 }
 addBots(count=3){if(this.options.mode==='bonk')return;if(this.options.mode==='phasekiller'){for(let i=0;i<Math.max(5,count);i++)this.addPlayer('bot-'+i,'townsperson','Habitante '+(i+2),true);return;}if(this.options.mode==='kodotag'){for(let i=0;i<count;i++)this.addPlayer('bot-'+i,'runner','Runner '+(i+2),true);return;}if(this.options.mode==='treetag'){const infernal=this.heroes().some(u=>TREE_TAG_CHARACTERS[u.treeTagCharacter]?.role==='infernal');for(let i=0;i<count;i++){const key=!infernal&&i===count-1?'blaze':'ent';this.addPlayer(`bot-${i}`,key,TREE_TAG_CHARACTERS[key].name+' '+(i+1),true);}return;}if(this.options.mode==='warlock'){const types=Object.keys(WARLOCK_CHARACTERS),selected=this.heroes()[0]?.warlockCharacter,choices=types.filter(k=>k!==selected);for(let i=0;i<count;i++){const key=choices[i%choices.length];this.addPlayer(`bot-${i}`,key,WARLOCK_CHARACTERS[key].name+' '+(i+1),true);}return;}const castle=this.options.mode==='castlefight',types=castle?Object.keys(CASTLE_BUILDERS):['raccoon','owl','turtle','ranger','mage','knight'];for(let i=0;i<count;i++){const type=types[castle?Math.floor(this.random()*types.length):i%types.length];this.addPlayer(`bot-${i}`,type,(castle?castleBuilderFor(type):HEROES[type]).name+' '+(i+1),true);}}
 restock(){this.stock=freshShopStock();this.teamStock=this.options.mode==='linewars'&&this.options.lineTeams?{1:freshShopStock(true),2:freshShopStock(true)}:null;this.shopVisit++;}
 stockFor(u){return stockForHero(this,u);}
 auraFor(u,key){let best=null;const group=unit=>unit.challenge||(this.phase==='bonus'?unit.owner:null);for(const ally of this.units)if(ally.alive&&ally.team===u.team&&group(ally)===group(u)&&distance(ally,u)<=9 ){for(const candidate of [key,...Object.keys(CLASSIC_RO_AURAS).filter(k=>CLASSIC_RO_AURAS[k]===key)]){if(!levelOf(ally,candidate)||!canUseSkill(ally,candidate))continue;const s=skillAt(candidate,levelOf(ally,candidate));if(!best||s.level>best.level)best=s;}}return best;}
 refresh(u){if(!u.hero)return this.refreshMonsterStats(u);recompute(u,this.time,Object.fromEntries(['endurance','devotion','brilliance','packaura','lifeaura'].map(k=>[k,this.auraFor(u,k)])));}
 canTarget(u,t){if(this.options.mode==='dungeon')return this.dungeonCanTarget(u,t);if(this.options.mode==='linewars'&&this.lineWars)return this.lineCanTarget(u,t);if(!t||!t.alive||u.id===t.id||u.team===t.team)return false;if(this.phase==='wave'&&privateTrials(this.options.mode))return !!(u.challenge&&u.challenge===t.challenge);if(this.phase==='bonus')return !!(t.challenge&&t.challenge===u.owner||u.challenge&&u.challenge===t.owner);return true;}
 enemies(u,r=Infinity){return this.units.filter(t=>this.canTarget(u,t)&&distance(u,t)<=r).sort((a,b)=>distance(u,a)-distance(u,b));}
 command(id,c){
  this.commandFailureReason=null;
  const u=this.player(id);if(!u||!c||typeof c!=='object'||TERMINAL.has(this.phase))return false;
  if(this.options.mode==='bonk')return this.bonkCommand(u,c);if(this.options.mode==='bloody')return this.bloodyTournamentCommand(u,c);if(this.options.mode==='dungeon'&&c.type==='dropItem')return this.dungeonCommand(u,{type:'dgDrop',slot:c.slot});if(this.options.mode==='dungeon'&&c.type?.startsWith('dg'))return this.dungeonCommand(u,c);if(this.options.mode==='phasekiller')return this.phaseKillerCommand(u,c);if(this.options.mode==='kodotag')return this.kodoTagCommand(u,c);if(this.options.mode==='treetag')return this.treeTagCommand(u,c);if(this.options.mode==='warlock')return this.warlockCommand(u,c);if(this.options.mode==='castlefight')return this.castleCommand(u,c);
  if(c.type==='queueLineUnit')return this.queueLineUnit(u,c);
  if(c.type==='cancelLineQueue')return this.cancelLineQueue(u,c);
  if(c.type==='sendLineUnit')return this.sendLineUnit(u,c);
  if(c.type==='enchantPermanent')return this.enchantPermanent(u,c);
  if(c.type==='lootToXp')return this.lootToXp(u,c);
  if(c.type==='recycleLoot')return this.recycleLoot(u,c);
  if(c.type==='distillSkillPoint')return this.distillSkillPoint(u);
  if(c.type==='rollTechniques')return this.rollTechniques(u);
  if(c.type==='chooseTechnique')return this.chooseTechnique(u,c);
  if(c.type==='interact')return this.interactShop(u,c.npc);
  if(c.type==='leaveShop'){this.closeShop(u,true);return true;}
  if(c.type==='attribute'){
   if(!Object.hasOwn(ATTRIBUTES,c.attribute)||u.attributePoints<attributeCost(u.attributes[c.attribute])||u.attributes[c.attribute]>=99)return false;
   u.attributePoints-=attributeCost(u.attributes[c.attribute]);u.attributes[c.attribute]++;this.refresh(u);return true;
  }
  if(c.type==='buy'){
   if(!Object.hasOwn(SKILLS,c.skill))return false;
   const level=levelOf(u,c.skill),next=level+1;if(SKILLS[c.skill].dropOnly&&!level)return false;
   if(!canLearnSkill(u,c.skill,next)||!this.skillAvailable(u,c.skill)||level>=5||!(u.skillPoints>0)||(!level&&u.skills.length>=7))return false;
   u.skillPoints--;if(!level){u.skills.push(c.skill);u.skillOrigins||={};u.skillOrigins[c.skill]='catalog';}u.skillLevels[c.skill]=next;this.refresh(u);return true;
  }
  if(c.type==='item'){
   const s=Object.hasOwn(ITEMS,c.item)?ITEMS[c.item]:null,stock=this.stockFor(u);
   if(!s||!this.atShop(u,shopForItem(c.item))||u.gold<s.cost||!(stock[c.item]>0))return false;
   const stack=s.consumable&&u.inventory.find(slot=>slot?.key===c.item&&!slot.xpValue&&slot.charges<3),empty=u.inventory.findIndex(slot=>!slot);
   if(!stack&&empty===-1&&u.inventory.length>=6)return false;
   u.gold-=s.cost;stock[c.item]--;
   if(stack)stack.charges++;else{const slot={key:c.item,charges:1,...(!s.consumable?{level:1,invested:s.cost}:{})};if(empty>=0)u.inventory[empty]=slot;else u.inventory.push(slot);}
   this.refresh(u);return true;
  }
  if(c.type==='enchantItem'){
   if(!this.atShop(u,'enchanter')||!Number.isInteger(c.slot)||c.slot<0||c.slot>=6||!Object.hasOwn(ENCHANTMENTS,c.enchantment))return false;const slot=u.inventory[c.slot];if(!slot||!canEnchant(slot.key,c.enchantment)||slot.enchantment===c.enchantment)return false;const cost=enchantPrice(c.enchantment,slot.level||1);if(cost===null||u.gold<cost)return false;u.gold-=cost;slot.invested=(slot.invested??ITEMS[slot.key].cost)+cost;slot.enchantment=c.enchantment;this.refresh(u);return true;
  }
  if(c.type==='upgradeItem'){

   if(!this.atShop(u,'smith')||!Number.isInteger(c.slot)||c.slot<0||c.slot>=6)return false;const slot=u.inventory[c.slot];if(!slot)return false;const cost=itemUpgradePrice(slot.key,slot.level||1);if(cost===null||u.gold<cost)return false;u.gold-=cost;slot.invested=(slot.invested??ITEMS[slot.key].cost)+cost;slot.level=(slot.level||1)+1;this.refresh(u);return true;
  }
  if(['move','attackMove','attack','stop','hold','interact'].includes(c.type))u.pendingDropId=null;
  if(c.type==='dropItem'){
   if(!u.alive||!Number.isInteger(c.slot)||c.slot<0||c.slot>=6||!u.inventory[c.slot]||!ITEMS[u.inventory[c.slot].key])return false;
   const entry=structuredClone(u.inventory[c.slot]),point=Array.from({length:8},(_,i)=>({x:u.x+Math.cos(i*Math.PI/4)*.85,z:u.z+Math.sin(i*Math.PI/4)*.85})).find(p=>!unitSolidBlocked(this,{...u,collisionRadius:.3},p))||{x:u.x,z:u.z};this.drops.push({id:this.id(),item:entry.key,entry,level:entry.level||1,rarity:entry.rarity||'common',owner:u.owner,team:u.team,dropped:true,x:point.x,z:point.z,expires:this.time+86400});u.inventory[c.slot]=null;this.refresh(u);this.fx('lootDrop',point.x,point.z,{source:u.id,item:entry.key});return true;
  }
  if(c.type==='sell'){

   if(!this.atShop(u)||!Number.isInteger(c.slot)||c.slot<0||c.slot>=6)return false;const slot=u.inventory[c.slot];if(!slot)return false;
   u.gold+=Math.floor((ITEMS[slot.key].consumable?ITEMS[slot.key].cost*slot.charges:(slot.invested??ITEMS[slot.key].cost))*.5);u.inventory[c.slot]=null;this.refresh(u);return true;
  }
  if(c.type==='use'){
   if(!u.alive||!Number.isInteger(c.slot)||c.slot<0||c.slot>=6)return false;
   const slot=u.inventory[c.slot],item=ITEMS[slot?.key];if(item?.xp||item?.attributeTome){if(this.phase!=='preparation'&&!(this.options.mode==='linewars'&&this.atShop(u)))return false;const tome=item.attributeTome;if(tome){u.tomeAttributes||={};u.tomeAttributes[tome.attribute]=(u.tomeAttributes[tome.attribute]||0)+tome.amount;this.refresh(u);}else this.gainXp(u,(slot.xpValue||item.xp));if(--slot.charges<=0)u.inventory[c.slot]=null;this.fx(tome?'tomeRead':'bookRead',u.x,u.z,{source:u.id,item:slot.key,attribute:tome?.attribute,amount:tome?.amount||slot.xpValue||item.xp});return true;}if(item?.active)return this.activateEquipment(u,slot);if(!item?.consumable||(u.potionUntil||0)>this.time||(item.heal&&u.hp>=u.maxHp)||(item.mana&&u.mana>=u.maxMana))return false;
   if(item.heal)this.heal(u,item.heal);if(item.mana){u.mana=Math.min(u.maxMana,u.mana+item.mana);this.fx('mana',u.x,u.z,{source:u.id,amount:item.mana});}
   if(--slot.charges<=0)u.inventory[c.slot]=null;u.potionUntil=this.time+10;return true;
  }
  if(!u.alive)return false;
  if(c.type==='ready'&&this.phase==='preparation'){u.ready=true;if(this.heroes().filter(h=>!h.bot).every(h=>h.ready))this.timer=Math.min(this.timer,3);return true;}
  if(['move','attackMove'].includes(c.type)&&Number.isFinite(c.x)&&Number.isFinite(c.z)){this.closeShop(u);this.prioritizeCommand(u);u.destination=limitPoint(this,u,c);u.order=c.type;u.target=null;return true;}
  if(c.type==='attack'){const t=this.units.find(t=>t.id===c.target&&this.canTarget(u,t));if(!t)return false;this.closeShop(u);this.prioritizeCommand(u);u.target=t.id;u.order='attack';u.destination=null;return true;}
  if(c.type==='stop'||c.type==='hold'){this.closeShop(u);this.prioritizeCommand(u);u.order=c.type;u.destination=null;u.target=null;return true;}
  if(c.type==='auto'){this.closeShop(u);this.prioritizeCommand(u);u.order='auto';u.destination=null;u.target=null;return true;}
  if(c.type==='claimLoot')return this.claimLoot(u,c);
  if(c.type==='setCastPending'){if(typeof c.enabled!=='boolean')return false;u.manualCastPending=c.enabled;return true;}
  if(c.type==='toggleAutocast')return this.toggleAutocast(u,c);
  if(c.type==='cast'){const accepted=this.cast(u,c);if(accepted)u.nextAutoCastAt=Math.max(u.nextAutoCastAt||0,this.time+.3);return accepted;}
  return false;
 }
 activateEquipment(u,slot){const s=equipmentEffectAt(slot.key,slot.level||1);if(!s||s.type!=='active'||!BATTLE.has(this.phase)||u.stun>0||u.stageDone&&this.phase==='wave'||(u.itemCooldowns?.[slot.key]||0)>this.time||u.mana<s.mana)return false;u.itemCooldowns||={};u.itemCooldowns[slot.key]=this.time+s.cooldown;u.mana-=s.mana;
  if(slot.key==='mirror'){u.itemReflect=s.reflect;u.itemReflectUntil=this.time+s.duration;this.fx('mirror',u.x,u.z,{source:u.id,radius:1.5});}
  if(slot.key==='restoration')for(const ally of this.heroes().filter(h=>h.alive&&h.team===u.team&&distance(u,h)<=s.radius))this.heal(ally,s.heal,u);
  this.fx('itemUse',u.x,u.z,{source:u.id,item:slot.key});return true;
 }
 equipmentTick(){if(!BATTLE.has(this.phase)||this.time<(this.nextEquipmentTick||0))return;this.nextEquipmentTick=this.time+.5;const sources=this.heroes().filter(h=>h.alive&&h.itemEffects?.solar&&!(h.stageDone&&this.phase==='wave'));for(const target of this.units.filter(u=>u.alive)){const teams=new Map();for(const owner of sources){const effect=equipmentEffectAt('solar',owner.itemEffects.solar);if(!this.canTarget(owner,target)||distance(owner,target)>effect.radius)continue;const old=teams.get(owner.team);if(!old||old.effect.damage<effect.damage)teams.set(owner.team,{owner,effect});}for(const {owner,effect}of teams.values()){if(this.hit(target,effect.damage*.5*(1-(target.fireResist||0)),owner,true,false,false,false,'fire','proc')>0)target.solarUntil=this.time+.6;this.fx('solarHit',target.x,target.z,{source:owner.id});}}
 }
 cancelChannel(u){u.channel=null;for(const e of this.effects)if(e.owner===u.id&&e.channel)e.pulses=0;}
 prioritizeCommand(u){this.cancelChannel(u);u.manualCastPending=false;u.nextAutoCastAt=Math.max(u.nextAutoCastAt||0,this.time+.3);if(!u.sliding)u.vx=u.vz=0;u.pathKey=null;}
 heal(u,amount,source=null){const actual=Math.min(u.maxHp-u.hp,amount);u.hp+=actual;if(source)this.recordWaveSupport?.(source,u,actual);if(actual>0)this.fx('heal',u.x,u.z,{amount:Math.round(actual),source:u.id});return actual;}
 // Creature affinities are independent of hero equipment/attributes.
 elementDamage(target,amount,element){const resistance=element?target?.resistances?.[element]:null;return amount*(1-(Number.isFinite(resistance)?clamp(resistance,-.5,.75):0))*(1-Math.min(.75,Math.max(0,target?.wardResistances?.[element]||0)));}
 spellDamage(u,damage,element='arcane',key=null){const weather=ARENAS[this.arena],scaling=abilityScaling(key,levelOf(u,key));return magicSkillDamage(u,damage,scaling.matkCoefficient)*(weather[element]||1);}
 attackReach(u,t){return u.range+(u.range<3?Math.max(0,unitRadius(u)+unitRadius(t)-.8):0);}
 cast(u,c){
  if(u.stageDone&&this.phase==='wave'&&privateTrials(this.options.mode))return false;
  const key=u.skills[c.slot],s=skillFor(u,key);if(!s||!canUseSkill(u,key)||s.kind!=='active'||(u.cooldowns[key]||0)>0||u.mana<s.mana||!BATTLE.has(this.phase)||u.stun>0||!u.alive)return false;
  const t=this.units.find(t=>t.id===c.target&&(s.target==='unit'?t.alive&&t.id!==u.id&&(this.phase!=='wave'||!privateTrials(this.options.mode)||t.challenge===u.challenge):this.canTarget(u,t)));
  if(s.target==='unit'&&(!t||distance(u,t)>12))return false;
  if(['blink','dash'].includes(key)&&Number.isFinite(c.x)&&Number.isFinite(c.z)&&unitBlocked(this,u,c))return false;
  if(key==='swap'&&t&&(unitBlocked(this,u,t,[u.id,t.id])||unitBlocked(this,t,u,[u.id,t.id])||distance(t,limitPoint(this,u,t))>.01||distance(u,limitPoint(this,t,u))>.01))return false;
  let wall=null;if(key==='icewall'){wall={id:`wall-${this.serial+1}`,x:c.x,z:c.z,w:s.width,d:.8,h:2.5,type:'icewall',expires:this.time+s.duration};if(!Number.isFinite(c.x)||!Number.isFinite(c.z)||u.cell&&(Math.abs(c.x-u.cell.x)+s.width/2>u.cell.r||Math.abs(c.z-u.cell.z)+.4>u.cell.r)||this.units.some(v=>v.alive&&blocked(v,[wall],.65))||blocked(c,this.obstacles,1))return false;}
  if(s.target==='enemy'&&(!t||distance(u,t)>12))return false;
  if(s.target==='ground'&&(!Number.isFinite(c.x)||!Number.isFinite(c.z)||distance(u,c)>14||distance(c,limitPoint(this,u,c))>.01))return false;
  if(this.options.mode==='dungeon'&&!this.dungeonCastValid(u,s,c,t))return false;
  if(!this.canCastClassicRo(u,key,s,t)||!this.canCastNordic(u,key,s,t))return false;
  this.cancelChannel(u);u.mana-=s.mana;u.cooldowns[key]=s.cooldown;u.castAt=this.time;u.castSkill=key;this.fx('cast',u.x,u.z,{source:u.id,skill:key});
  if(this.castClassicRo(u,key,s,c,t)||this.castSpecial(u,key,s,c,t)||this.castNordic(u,key,s,c,t)||this.castAbility(u,key,s))return true;
  const hit=(v,n,element)=>s.damageType==='physical'?this.hit(v,physicalSkillDamage(u,n,s.atkCoefficient),u):this.hit(v,this.spellDamage(u,n,element,key),u,true,false,false,false,element||null),stun=v=>{if((v.avatar||0)<=this.time){v.stun=v.hero?s.heroStun||s.stun:s.stun;this.cancelChannel(v);}};
  if(key==='bolt'){hit(t,s.damage,'lightning');stun(t);this.fx('bolt',u.x,u.z,{tx:t.x,tz:t.z});}
  if(key==='stomp'){this.fx('stomp',u.x,u.z,{radius:s.radius});for(const e of this.enemies(u,s.radius)){hit(e,s.damage);stun(e);}}
  if(key==='heal')this.heal(u,s.heal*(u.magicPower||1),u);
  if(key==='chain'){let last=t,from=u;const visited=new Set();for(let i=0;i<s.jumps&&last;i++){visited.add(last.id);hit(last,s.damage*.85**i,'lightning');this.fx('bolt',from.x,from.z,{tx:last.x,tz:last.z});from=last;last=this.enemies(u).filter(e=>!visited.has(e.id)&&distance(from,e)<6)[0];}}
  if(key==='blizzard'){u.channel='blizzard';u.destination=null;u.order='hold';this.effects.push({id:this.id(),type:'blizzard',x:c.x,z:c.z,time:this.time,next:this.time+.25,pulses:s.pulses,damage:this.spellDamage(u,s.damage,'ice',key),radius:s.radius,owner:u.id,channel:true,duration:s.pulses+1});}
  if(key==='summon'){const owner=u.owner||('npc-'+u.id);this.units=this.units.filter(v=>!(v.summon&&v.summoner===u.id&&(!v.summonSkill||v.summonSkill==='summon')));for(let i=0;i<2;i++)this.spawnEnemy('wolf',u.x+(i?1:-1),u.z+1,{owner,summon:true,summoner:u.id,summonSkill:'summon',lineLane:u.lineLane,challenge:u.challenge,cell:u.cell,team:u.team,hp:s.hp,damage:s.damage,armor:1,range:1.4,speed:5.6,interval:.8,accuracy:1,critChance:0,level:u.level,skills:[],skillLevels:{},expires:this.time+s.duration});this.fx('summon',u.x,u.z);}
  if(key==='multishot')for(const e of this.enemies(u,10).slice(0,s.count)){this.hit(e,physicalSkillDamage(u,s.damage,s.atkCoefficient),u);this.fx('arrow',u.x,u.z,{tx:e.x,tz:e.z,source:u.id,target:e.id,projectileKind:animalBasicProjectile(u),skill:key});}
  if(key==='avatar'){u.avatar=this.time+s.duration;u.avatarData={hp:s.hp,armor:s.armor,damage:s.damage};this.refresh(u);this.fx('avatar',u.x,u.z);}
  if(key==='shockwave'){const dx=c.x-u.x,dz=c.z-u.z,len=Math.hypot(dx,dz)||1;for(const e of this.enemies(u,12).filter(e=>{const proj=((e.x-u.x)*dx+(e.z-u.z)*dz)/len;return proj>=0&&Math.abs((e.x-u.x)*dz-(e.z-u.z)*dx)/len<s.radius;}).slice(0,12))hit(e,s.damage);this.fx('shockwave',u.x,u.z,{tx:c.x,tz:c.z,radius:s.radius});}
  if(key==='fireball'){for(const e of this.enemies(u).filter(e=>distance(e,c)<s.radius)){hit(e,s.damage,'fire');this.applyDot(e,'burn',s.burn,4,u);}this.fx('fireball',c.x,c.z,{radius:s.radius});}
  if(key==='frostnova'){for(const e of this.enemies(u,s.radius)){hit(e,s.damage,'ice');e.frostUntil=this.time+s.duration;}this.fx('frostnova',u.x,u.z,{radius:s.radius});}
  if(key==='dash'){const d=distance(u,c)||1,n=Math.min(d,s.distance);u.facing=Math.atan2(c.x-u.x,c.z-u.z);moveUnit(this,u,{x:u.x+Math.sin(u.facing)*n,z:u.z+Math.cos(u.facing)*n});u.destination=null;u.order='auto';for(const e of this.enemies(u,2.2))this.hit(e,physicalSkillDamage(u,s.damage,s.atkCoefficient),u);this.fx('dash',u.x,u.z);}
  if(key==='drain'){const damage=hit(t,s.damage);this.heal(u,damage*.5,u);this.fx('drain',u.x,u.z,{tx:t.x,tz:t.z});}
  if(key==='blink'){const from={x:u.x,z:u.z},d=distance(u,c)||1,n=Math.min(d,s.distance),p=limitPoint(this,u,{x:u.x+(c.x-u.x)/d*n,z:u.z+(c.z-u.z)/d*n});if(!blocked(p,this.obstacles)){u.x=p.x;u.z=p.z;}u.destination=null;u.target=null;u.order='auto';u.vx=u.vz=0;this.fx('blink',from.x,from.z,{tx:u.x,tz:u.z});this.fx('blink',u.x,u.z);}
  if(key==='swap'){const from={x:u.x,z:u.z};u.x=t.x;u.z=t.z;t.x=from.x;t.z=from.z;for(const v of [u,t]){v.vx=v.vz=0;v.destination=null;v.target=null;v.order='auto';}this.fx('swap',u.x,u.z,{tx:t.x,tz:t.z});}
  if(key==='icewall'){this.obstacles.push(wall);this.obstacleRevision++;this.fx('frostnova',c.x,c.z,{radius:s.width});}
  if(key==='forcepush'){const dx=c.x-u.x,dz=c.z-u.z,len=Math.hypot(dx,dz)||1;for(const e of this.enemies(u,12)){const proj=((e.x-u.x)*dx+(e.z-u.z)*dz)/len;if(proj<0||Math.abs((e.x-u.x)*dz-(e.z-u.z)*dx)/len>s.radius)continue;hit(e,s.damage);if((e.avatar||0)<=this.time)this.displace(e,dx/len*s.push,dz/len*s.push);}this.fx('forcepush',u.x,u.z,{tx:c.x,tz:c.z});}
  if(key==='hook'){hit(t,s.damage);const d=distance(u,t)||1,n=Math.min(s.pull,Math.max(0,d-1.5));if((t.avatar||0)<=this.time)this.displace(t,(u.x-t.x)/d*n,(u.z-t.z)/d*n);this.fx('hook',u.x,u.z,{tx:t.x,tz:t.z});}
  if(key==='gravity'){this.effects.push({id:this.id(),type:'gravity',x:c.x,z:c.z,owner:u.id,time:this.time,next:this.time+1,damage:this.spellDamage(u,s.damage,'arcane',key),radius:s.radius,duration:s.duration});}
  if(key==='shield'){u.shieldPhysicalOnly=false;u.shieldHits=null;u.shield=s.shield*(u.magicPower||1);u.shieldUntil=this.time+s.duration;this.fx('shield',u.x,u.z);}
  return true;
 }
 displace(u,dx,dz){const n=Math.ceil(Math.hypot(dx,dz)/.2);for(let i=0;i<n;i++){const p=limitPoint(this,u,{x:u.x+dx/n,z:u.z+dz/n});if(blocked(p,this.obstacles))break;u.x=p.x;u.z=p.z;}u.vx=u.vz=0;u.pathKey=null;}
 applyDot(u,key,damage,duration,source=null){if(key==='burn')damage*=1-(u.fireResist||0);u.dots||={};const old=u.dots[key];const active=old&&old.until>=this.time;u.dots[key]={damage:active?Math.max(damage,old.damage):damage,until:active?Math.max(old.until,this.time+duration):this.time+duration,next:active?old.next:this.time+1,source:active&&old.damage>damage?old.source:source?.id,element:({burn:'fire',lava:'fire',frost:'ice',poison:'poison'})[key]||null};}
 hit(t,amount,source=null,magic=false,reflect=false,critical=false,environment=false,element=null,damageKind='direct'){
  if(!t?.alive||!Number.isFinite(amount)||amount<0)return 0;
  if(magic&&!environment&&Math.max(t.avatar||0,t.magicWardUntil||0)>this.time)return 0;
  const attacker=source?.id?this.units.find(u=>u.id===source.id)||source:source;if(!environment&&(attacker?.weakenedUntil||0)>this.time)amount*=1-Math.min(.8,attacker.damageReduction||0);
  amount=this.techniqueModifyDamage(t,amount,source,magic,environment);if(!environment)amount=this.permanentModifyDamage(t,amount,source);amount=this.elementDamage(t,amount,element);let dmg=environment?amount:magic?amount/(1+.03*Math.max(0,t.magicDefense||0)):amount/(1+.06*Math.max(0,t.armor||0));
  if((t.shieldUntil||0)>this.time&&t.shield>0&&(!t.shieldPhysicalOnly||!magic&&!environment)&&(t.shieldHits==null||t.shieldHits>0)){const absorbed=Math.min(t.shield,dmg);t.shield-=absorbed;dmg-=absorbed;if(t.shieldHits!=null&&absorbed>0){t.shieldHits--;if(!t.shieldHits)t.shield=0;}}
  const actual=Math.min(t.hp,Math.max(0,dmg));t.hp=Math.max(0,t.hp-dmg);t.hitAt=this.time;
  if(!environment)this.recordWaveDamage?.(source,t,actual);
  this.fx('damage',t.x,t.z,{amount:Math.round(actual),magic,critical,source:source?.id,target:t.id,environment,element});
  if(critical)this.fx('critical',t.x,t.z,{source:source?.id,target:t.id});
  // Resolve death once before retaliation to prevent duplicate kills and reflection recursion.
  if(t.hp<=0){t.alive=false;t.died=this.time;this.cancelChannel(t);this.monsterLoot(t,source);if(source&&t.team!==source.team&&this.options.mode!=='dungeon'){const p=this.player(source.owner);if(p){p.gold+=t.lineBounty??12+this.wave;p.kills++;}if(!t.hero&&!t.summon)for(const h of this.heroes().filter(h=>!t.challenge||this.groupKey(h)===t.challenge||t.lineLane&&(h.lineLane===t.lineLane||this.options.lineTeams&&h.team!==t.team&&h.cell&&t.cell&&h.cell.x===t.cell.x&&h.cell.z===t.cell.z)))this.gainXp(h,12);}}
  const leecher=source?.id?this.units.find(unit=>unit.id===source.id)||source:source;if(!reflect&&!environment&&damageKind==='direct'&&leecher?.alive&&leecher.team!==t.team&&leecher.lifesteal>0){const h=Math.min(leecher.maxHp-leecher.hp,actual*leecher.lifesteal);leecher.hp+=h;if(h>0)this.fx('lifesteal',leecher.x,leecher.z,{amount:Math.round(h),source:leecher.id,tx:t.x,tz:t.z});}
  if(!reflect&&!environment&&source?.alive&&source.team!==t.team&&(t.itemReflectUntil||0)>this.time){this.hit(source,actual*t.itemReflect,t,true,true);this.fx('mirror',t.x,t.z,{source:t.id,tx:source.x,tz:source.z});}
  if(!magic&&!reflect&&source?.alive&&source.range<3&&(t.reflect||0)>0){this.hit(source,actual*t.reflect,t,true,true);this.fx('thorns',t.x,t.z,{source:t.id,tx:source.x,tz:source.z});}
  return actual;
 }
 gainXp(u,amount){u.xp+=amount;while(u.xp>=u.level*55){u.xp-=u.level*55;u.level++;u.attributePoints+=attributePointsForLevel(u.level);u.skillPoints++;this.refresh(u);this.heal(u,80);this.fx('levelup',u.x,u.z,{source:u.id});}}
 attack(u,t){
  u.attackAt=this.time;u.facing=Math.atan2(t.x-u.x,t.z-u.z);const weather=ARENAS[this.arena],magicBasic=u.hero?HEROES[u.hero]?.attackType==='magic':!u.summon&&!!u.element,attackElement=magicBasic?(u.element||'arcane'):null,projectileKind=animalBasicProjectile(u);
  if(!magicBasic&&(t.perfectEvasion||0)>0&&this.random()<t.perfectEvasion){this.fx(u.range>3||attackElement||projectileKind?'arrow':'slash',u.x,u.z,{tx:t.x,tz:t.z,source:u.id,target:t.id,element:attackElement||Object.keys(u.enchantments||{})[0]||null,basicAttack:true,projectileKind});this.fx('miss',t.x,t.z,{source:u.id,target:t.id,perfect:true});return;}
  const crit=!magicBasic&&this.random()<(u.critChance||0),accuracy=clamp((u.accuracy??.88)+(weather.accuracy||0)-(t.evasion||0)-(weather.evasion||0),.05,1);
  this.fx(u.range>3||attackElement||projectileKind?'arrow':'slash',u.x,u.z,{tx:t.x,tz:t.z,source:u.id,target:t.id,element:attackElement||Object.keys(u.enchantments||{})[0]||null,basicAttack:true,projectileKind});
  if(!magicBasic&&!crit&&this.random()>=accuracy){this.fx('miss',t.x,t.z,{source:u.id,target:t.id});return;}
  const baseDamage=(u.hero&&magicBasic?(u.magicAttack||0)*.9:u.damage)*(crit?u.critMultiplier||2:1),damage=this.hit(t,attackElement?baseDamage*(weather[attackElement]||1):baseDamage,u,!!attackElement,false,crit,false,attackElement);
  this.permanentAttack(u,t,damage);this.attackTechniques(u,t,damage);
  if(canUseSkill(u,'bash')&&levelOf(u,'bash')){const s=skillFor(u,'bash');if(this.random()<s.chance&&t.alive){this.hit(t,physicalSkillDamage(u,s.damage,s.atkCoefficient),u,false,false,false,false,null,'proc');t.stun=t.hero?s.heroStun:s.stun;this.cancelChannel(t);this.fx('bash',t.x,t.z,{source:u.id});}}
  if(canUseSkill(u,'cleave')&&levelOf(u,'cleave')&&u.range<3){const s=skillFor(u,'cleave');for(const e of this.enemies(u).filter(e=>e.id!==t.id&&distance(t,e)<2.8))this.hit(e,u.damage*(crit?u.critMultiplier||2:1)*s.cleave,u,false,true);this.fx('cleave',t.x,t.z,{source:u.id,radius:2.8});}
  if(canUseSkill(u,'bounce')&&levelOf(u,'bounce')&&u.range>=3){const s=skillFor(u,'bounce'),visited=new Set([t.id]);let last=t;for(let i=0;i<s.bounces;i++){const next=this.enemies(u).find(e=>!visited.has(e.id)&&distance(last,e)<=5);if(!next)break;visited.add(next.id);this.hit(next,u.damage*s.retention**(i+1),u,false,true);this.fx('bounce',last.x,last.z,{tx:next.x,tz:next.z,source:u.id,target:next.id,projectileKind:animalBasicProjectile(u)});last=next;}}
  if(u.itemEffects?.stormcoil){const s=equipmentEffectAt('stormcoil',u.itemEffects.stormcoil);if(this.random()<s.chance){const visited=new Set();let last=t,from=u;for(let i=0;i<s.jumps&&last;i++){visited.add(last.id);this.hit(last,s.damage*s.retention**i,u,true,false,false,false,'lightning','proc');this.fx('bolt',from.x,from.z,{tx:last.x,tz:last.z,source:u.id,item:'stormcoil'});from=last;last=this.enemies(u).find(e=>!visited.has(e.id)&&distance(from,e)<=s.radius);}}}
  if(t.alive&&(t.avatar||0)<=this.time)for(const [key,rank]of Object.entries(u.enchantments||{})){const s=enchantAt(key,rank);if(key==='frost'){t.frostUntil=Math.max(t.frostUntil||0,this.time+s.duration);this.fx('frost',t.x,t.z,{source:u.id,enchantment:true});}else{this.applyDot(t,key==='fire'?'burn':'poison',s.damage,s.duration,u);this.fx(key==='fire'?'burn':'poison',t.x,t.z,{source:u.id,enchantment:true});}}
  if(canUseSkill(u,'poison')&&levelOf(u,'poison')&&t.alive){const s=skillFor(u,'poison');this.applyDot(t,'poison',s.poison,4,u);this.fx('poison',t.x,t.z);}
 }
 setupArenaScenery(){if(['castlefight','linewars'].includes(this.options.mode)||this.field)return;const props=generateScenery({seed:this.worldSeed+this.wave*101,bounds:ARENA_BOUNDS,count:10,keepClear:[...(ARENAS[this.arena]?.zones||[]).map(z=>({...z,r:z.r+1})),...this.units.filter(u=>u.alive).map(u=>({x:u.x-(u.cell?.x||0),z:u.z-(u.cell?.z||0),r:unitRadius(u)+.5}))]}),origins=this.cells?.length?this.cells:[{x:0,z:0}];this.obstacles=this.obstacles.filter(o=>o.type!=='scenery').concat(origins.flatMap(origin=>sceneryObstacles(props,origin)));this.obstacleRevision++;}
 setArena(key){this.arena=key;this.zones=ARENAS[key].zones.map((z,i)=>({...z,id:`${key}-${i}`}));this.nextWeather=this.time+8;this.setupArenaScenery();}
 arenaAt(wave){const keys=Object.keys(ARENAS),start=Math.max(0,keys.indexOf(this.startingArena||'forest'));return keys[(start+Math.floor(Math.max(0,wave-1)/10))%keys.length];}
 restoreHeroes(full=true){for(const [i,u]of this.heroes().entries()){this.closeShop(u);u.alive=true;u.team=this.homeTeam(u);this.homePosition(u,-4+(i%5)*2,2);u.destination=null;u.target=null;u.order='auto';u.stun=0;u.itemReflectUntil=0;u.itemReflect=0;u.rageUntil=0;u.rageData=null;u.violentForce=null;u.hurricane=null;u.dots={};u.frostUntil=0;u.weakenedUntil=0;u.damageReduction=0;u.magicWardUntil=0;u.shield=0;u.shieldHits=null;u.shieldPhysicalOnly=false;u.vx=0;u.vz=0;this.cancelChannel(u);this.refresh(u);u.hp=full?u.maxHp:Math.min(u.maxHp,u.hp+u.maxHp*.3);u.mana=full?u.maxMana:Math.min(u.maxMana,u.mana+u.maxMana*.3);}}
 spawnWave(){if(this.options.mode==='dungeon')return this.spawnDungeonFloor();if(this.options.mode==='bloody')return this.initBloodyTournament();if(this.options.mode==='castlefight')return this.initCastleFight();if(this.options.mode==='linewars')return this.initLineWars();const result=this.spawnCompetitionWave();this.setupArenaScenery();return result;}
 spawnEnemy(kind,x,z,data){
  const variant=Number.isFinite(data.variantRoll)?data.variantRoll:this.random();let boss=data.boss===true?'boss':data.boss;
  if(!data.summon&&!data.lineCreep&&['goblin','duck','frog','hare','brute','ram','bat','tortoise','hedgehog','champion'].includes(kind)){if(kind==='champion')boss||='boss';kind=monsterKind(kind,this.wave,variant,!!boss);}
  const species=MONSTERS[kind],profile=species||MONSTER_PROFILES[kind]||{},level=Math.max(1,data.level||this.wave+(boss==='boss'?10:boss==='miniboss'?5:species?2:0));let seed=(Math.floor(variant*4294967296)^Math.imul(level,2654435761))>>>0;for(const char of kind)seed=(Math.imul(seed,31)+char.charCodeAt(0))>>>0;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},loadout=monsterLoadout(kind,level,boss,random);
  if(species)data={...data,hp:data.hp*species.hpMultiplier,damage:data.damage*species.damageMultiplier,armor:(data.armor||0)+species.armorBonus,name:species.name,flying:!!species.flying,altitude:species.flying?species.altitude||1.4:0,range:species.range||data.range||1.4,element:species.element||null,resistances:{...(species.resistances||{})}};
  else data={...data,damage:data.damage*(profile.attackMultiplier||1)};
  // Common wave roles retain their combat values while sharing the new art.
  // Explicit scenario units and summons keep their own visual/name metadata.
  if(!data.summon&&!data.hero&&!data.lineCreep&&!data.castleUnit&&!data.dungeonEnemy&&!data.bonkEnemy){const visual=data.ragnarokVisual||species?.ragnarokVisual||CUSTOM_HERO_COMMON_VISUALS[kind];if(visual)data={...data,ragnarokVisual:visual,...(species?.ragnarokMvp?{ragnarokMvp:species.ragnarokMvp}:{}),name:monsterReferenceName(visual,data.name||profile.name)};}
  const useRaw=data.summon||kind==='bonus',speed=useRaw||data.speed===0?data.speed??profile.moveSpeed??2.8:profile.moveSpeed??data.speed??2.8,interval=useRaw?data.interval??profile.attackInterval??1.5:profile.attackInterval??data.interval??1.5;
  const skills=data.summon?[]:Array.isArray(data.skills)?[...data.skills]:loadout.skills,skillLevels=Object.fromEntries(skills.map(key=>[key,data.skillLevels?.[key]||loadout.skillLevels[key]||loadout.rank]));
  const cd=data.cd??random(),size=data.size||clamp((species?.size||profile.size||1)*(boss?1.2:1),.55,2.1);
  const u={id:this.id(),kind,name:profile.name||'Criatura dos Nove Reinos',team:2,x,z,hp:data.hp,maxHp:data.hp,damage:data.damage,armor:data.armor||0,range:data.range||1.4,accuracy:data.accuracy??profile.accuracy??.9,evasion:data.evasion??profile.evasion??0,critChance:data.critChance??profile.critChance??0,critMultiplier:data.critMultiplier??profile.critMultiplier??1.5,cd,stun:0,alive:true,...data,boss,level,skills,skillLevels,speed,interval,size,cooldowns:{},rarity:loadout.rarity,monsterRank:loadout.rank};
  u.monsterBase=Object.freeze({hp:u.maxHp,damage:u.damage,armor:u.armor,speed:u.speed,interval:u.interval,accuracy:u.accuracy,evasion:u.evasion,critChance:u.critChance,critMultiplier:u.critMultiplier,mana:260+u.level*12,manaRegen:2.5,hpRegen:0,magicDefense:Math.max(0,data.magicDefense||0),magicPower:boss==='boss'?1:boss==='miniboss'?.8:.55});u.mana=u.maxMana=u.monsterBase.mana;this.units.push(u);this.refresh(u);return u;
 }
 finishWave(){if(this.options.mode!=='campaign')return this.finishCompetitionWave();this.settleSurvivalWave();this.units=this.units.filter(u=>u.hero&&!u.summon);if(this.wave===50){this.phase='finalCountdown';this.timer=12;this.message='50 ondas vencidas. Prepare-se: todos contra todos!';this.restoreHeroes();}
  else if(this.wave%5===0)this.startBonus();else{this.phase='intermission';this.timer=7;this.restoreHeroes(false);this.message='Respire. A próxima onda começa em instantes; loja a cada cinco ondas.';}}
 startBonus(){
  this.phase='bonus';this.bonusStarted=this.time;this.bonusResults=[];this.beginSurvivalBonus();this.message='Bônus de velocidade: derrote seus três Ecos. O mais rápido ganha mais ouro!';this.restoreHeroes();
  for(const [i,u]of this.heroes().entries()){const x=u.cell?.x||0,z=u.cell?.z||0;u.x=x;u.z=z;u.challengeDone=false;for(let j=0;j<3;j++){const a=j/3*Math.PI*2;this.spawnEnemy('bonus',x+Math.cos(a)*3,z+Math.sin(a)*3,{hp:100+this.wave*12,damage:4,challenge:u.owner,cell:u.cell,team:100+i,range:1.4,speed:1.8});}}
 }
 checkBonus(){for(const u of this.heroes()){if(u.challengeDone)continue;if(u.alive&&!this.units.some(e=>!e.hero&&!e.summon&&e.alive&&e.challenge===u.owner)){u.challengeDone=true;const elapsed=this.time-this.bonusStarted;this.bonusResults.push({owner:u.owner,name:u.name,time:elapsed});this.recordSurvivalBonus(u,elapsed);this.fx('bonus',u.x,u.z,{source:u.id});}else if(!u.alive||this.time-this.bonusStarted>=45){u.challengeDone=true;this.bonusResults.push({owner:u.owner,name:u.name,time:null});this.recordSurvivalBonus(u,null);}}
  if(this.heroes().every(u=>u.challengeDone)){this.bonusResults.sort((a,b)=>(a.time??Infinity)-(b.time??Infinity)||a.owner.localeCompare(b.owner));this.settleSurvivalBonus();this.phase='bonusResults';this.timer=8;this.message=`Desafio concluído! ${this.bonusResults.find(r=>r.time!==null)?.name||'Ninguém'} venceu a corrida. Mercado em 8s.`;}}
 openShop(){this.clearField();this.cells=[];this.phase='preparation';this.timer=65;this.restock();this.units=this.units.filter(u=>u.hero&&!u.summon);this.restoreHeroes();this.setArena(this.arenaAt(this.wave+1));for(const [i,h]of this.heroes().entries()){h.z=(h.cell?.z||0)-8.8;h.ready=false;h.botBuyAt=this.time+12+i*2;}this.message='Mercado do coliseu aberto. Estoque compartilhado: quem comprar primeiro leva!';}
 startFinal(){if(this.options.mode!=='campaign')return this.startCompetitionClash();this.clearField();this.phase='final';this.units=this.units.filter(u=>u.hero&&!u.summon);this.restoreHeroes();for(const [i,u]of this.heroes().entries()){u.team=10+i;u.x=Math.sin(i/this.heroes().length*Math.PI*2)*8;u.z=Math.cos(i/this.heroes().length*Math.PI*2)*8;}this.phase='final';this.finalStarted=this.time;this.message='Grande final: todos contra todos. Somente um nome no pedestal!';if(this.heroes().length===1)this.finishFinal(this.heroes()[0]);}
 finishFinal(winner){this.winningOwners=winner?[winner.owner]:[];this.phase='victory';this.winner=winner?.owner||null;this.message=winner?`${winner.name} é o herói perfeito do Coliseu das Mil Formas!`:'A final terminou sem sobreviventes.';}
 learnBotSkills(u){const plan=['heal','vampiric','critical','endurance','multishot','devotion'];while(u.skillPoints>0){const next=plan.find(k=>!u.skills.includes(k)&&u.skills.length<7&&canLearnSkill(u,k)&&this.skillAvailable(u,k))||[...u.skills].sort((a,b)=>levelOf(u,a)-levelOf(u,b)).find(k=>levelOf(u,k)<5&&canLearnSkill(u,k,levelOf(u,k)+1));if(!next||!this.command(u.owner,{type:'buy',skill:next}))break;}}
 allocateBot(u){while(u.attributePoints>0){const key=[HEROES[u.hero].focus,'vit','agi','dex','int','str','luk'].find(k=>u.attributes[k]<99&&attributeCost(u.attributes[k])<=u.attributePoints);if(!key)break;this.command(u.owner,{type:'attribute',attribute:key});}}
 botThink(u){
  if(this.phase==='preparation')this.botShopThink(u);
  if(!BATTLE.has(this.phase)||!u.alive)return;
  this.allocateBot(u);this.learnBotSkills(u);
  if(u.hp<u.maxHp*.45){const slot=u.inventory.findIndex(i=>ITEMS[i?.key]?.heal);if(slot>=0)this.command(u.owner,{type:'use',slot});}
  for(const slot of u.inventory)if(slot&&ITEMS[slot.key]?.active&&(slot.key==='mirror'&&u.hp<u.maxHp*.7||slot.key==='restoration'&&this.heroes().some(h=>h.alive&&h.team===u.team&&h.hp<h.maxHp*.6)))this.activateEquipment(u,slot);
  const target=this.enemies(u,12)[0];for(const [slot,key]of u.skills.entries()){const s=skillFor(u,key);if(s.kind!=='active'||s.heal&&u.hp>u.maxHp*.65)continue;if(!target&&s.target!=='self')continue;if(this.cast(u,{slot,target:target?.id,x:target?.x,z:target?.z}))break;}
  lineDefenseThink(this,u);
 }
 environment(u,dt){
  if(!BATTLE.has(this.phase)||u.stageDone&&this.phase==='wave'&&privateTrials(this.options.mode))return;const active=this.zones.filter(z=>distance(u,z)<z.r&&(!u.flying||z.type==='lightning'));u.sliding=active.some(z=>z.type==='ice')||(this.options.mode==='dungeon'&&!!this.dungeonIceAt?.(u));u.wading=active.some(z=>z.type==='water');
  for(const z of active.filter(z=>z.type==='trap')){const cycle=Math.floor((this.time+z.offset)/z.period),age=(this.time+z.offset)%z.period;u.trapCycles||={};if(age>=1.5&&age<2&&u.trapCycles[z.id]!==cycle){u.trapCycles[z.id]=cycle;this.hit(u,90+this.wave*3,null,true,true,false,true);u.stun=Math.max(u.stun,.6);this.fx('thunder',z.x,z.z,{radius:z.r});}}
  if(active.some(z=>z.type==='lava'))this.applyDot(u,'lava',(12+u.maxHp*.015)*(1-(u.fireResist||0)),3);
  if(active.some(z=>z.type==='frost')){u.frostUntil=this.time+2;this.applyDot(u,'frost',(8+this.wave*.3)*(1-(u.coldResist||0)),2);}
  for(const [key,dot]of Object.entries(u.dots||{})){if(dot.until<this.time){delete u.dots[key];continue;}if(dot.next<=this.time){dot.next+=1;const source=this.units.find(v=>v.id===dot.source);this.hit(u,dot.damage,source,true,false,false,!source,dot.element||({burn:'fire',lava:'fire',frost:'ice',poison:'poison'})[key]||null,'dot');this.fx(key,u.x,u.z);}}
  if(this.arena==='tempest')for(const z of active.filter(z=>z.type==='lightning'&&z.strike<=this.time&&!z.hit?.includes(u.id))){z.hit||=[];z.hit.push(u.id);this.hit(u,100+this.wave*2,null,true,true,false,true,'lightning');this.fx('thunder',z.x,z.z);}
 }
 tick(dt){
  if(!Number.isFinite(dt)||dt<=0)return;if(this.options.mode==='bonk'){if(this.bonk?.stage!=='levelup')this.time+=dt;if(this.roClassicEffects?.length)this.tickClassicRoEffects();this.tickBonk(dt);return;}this.time+=dt;if(this.roClassicEffects?.length)this.tickClassicRoEffects();if(this.options.mode==='bloody'){this.tickBloodyTournament(dt);return;}if(this.options.mode==='phasekiller'){this.tickPhaseKiller(dt);return;}if(this.options.mode==='kodotag'){this.tickKodoTag(dt);return;}if(this.options.mode==='treetag'){this.tickTreeTag(dt);return;}if(this.options.mode==='warlock'){this.tickWarlock(dt);return;}if(this.options.mode==='castlefight'){this.tickCastleFight(dt);return;}this.tickSpecials(dt);
  const previousObstacles=this.obstacles.length;this.obstacles=this.obstacles.filter(o=>!o.expires||o.expires>this.time);if(previousObstacles!==this.obstacles.length)this.obstacleRevision++;
  this.effects=this.effects.filter(e=>this.time-e.time<(e.duration|| (e.type==='blizzard'?16:1.1)));
  if(!this.heroes().length||TERMINAL.has(this.phase))return;
  if(this.options.mode==='linewars'&&this.options.lineTeams&&this.phase==='preparation'&&this.heroes().length<4){this.timer=Math.max(3+dt,this.timer);this.message='Aguardando '+(4-this.heroes().length)+' defensor(es) para formar as duas equipes.';}
  if(['preparation','intermission','bonusResults','finalCountdown'].includes(this.phase)){this.timer-=dt;if(this.timer<=0){if(this.phase==='bonusResults')this.openShop();else if(this.phase==='finalCountdown')this.startFinal();else this.spawnWave();}}
  if(this.arena==='tempest'&&BATTLE.has(this.phase)&&this.time>=this.nextWeather){this.nextWeather=this.time+7;this.weatherStrike();}this.zones=this.zones.filter(z=>!z.expires||z.expires>this.time);
  for(const e of this.effects.filter(e=>e.type==='blizzard'&&e.pulses>0&&this.time>=e.next)){const owner=this.units.find(u=>u.id===e.owner);if(!owner?.alive||owner.channel!=='blizzard'||owner.stun>0){e.pulses=0;continue;}e.next+=1;e.pulses--;const targets=this.enemies(owner).filter(t=>distance(t,e)<e.radius),damage=e.damage*Math.min(1,5/Math.max(1,targets.length));for(const t of targets)this.hit(t,damage,owner,true,false,false,false,'ice','dot');if(e.pulses===0){owner.channel=null;owner.order='auto';}}
  for(const e of this.effects.filter(e=>e.type==='gravity')){const owner=this.units.find(u=>u.id===e.owner);if(!owner)continue;for(const t of this.enemies(owner).filter(t=>distance(t,e)<e.radius)){const d=distance(t,e)||1;if((t.avatar||0)<=this.time)this.displace(t,(e.x-t.x)/d*dt*2.5,(e.z-t.z)/d*dt*2.5);if(this.time>=e.next)this.hit(t,e.damage,owner,true,false,false,false,null,'dot');}if(this.time>=e.next)e.next+=1;}
  this.tickLinePaths();
  for(const u of [...this.units]){
   if(!u.alive)continue;if(u.expires&&u.expires<this.time){u.alive=false;u.died=this.time;continue;}
   if(u.hero){if(this.time>=(u.nextStats||0)){u.nextStats=this.time+.5;this.refresh(u);}u.mana=Math.min(u.maxMana,u.mana+dt*u.manaRegen*(ARENAS[this.arena].manaRegen||1));u.hp=Math.min(u.maxHp,u.hp+dt*u.hpRegen);for(const key of Object.keys(u.cooldowns))u.cooldowns[key]=Math.max(0,u.cooldowns[key]-dt);if(u.bot&&this.options.mode!=='dungeon')this.botThink(u);this.tickAutocast(u);}
   if(!u.hero){if(this.time>=(u.nextStats||0)){u.nextStats=this.time+.5;this.refresh(u);}u.mana=Math.min(u.maxMana,u.mana+dt*u.manaRegen*(ARENAS[this.arena].manaRegen||1));u.hp=Math.min(u.maxHp,u.hp+dt*(u.hpRegen||0));for(const key of Object.keys(u.cooldowns||{}))u.cooldowns[key]=Math.max(0,u.cooldowns[key]-dt);if(!u.summon)this.monsterThink(u,dt);}if(u.pendingDropId){const d=this.drops.find(d=>d.id===u.pendingDropId);if(!d)u.pendingDropId=null;else if(distance(u,d)<=2){const id=u.pendingDropId;u.pendingDropId=null;this.claimLoot(u,{dropId:id});}}this.environment(u,dt);if(!u.alive)continue;u.cd=Math.max(0,u.cd-dt);u.stun=Math.max(0,u.stun-dt);u.moving=false;if(u.stun>0||u.channel)continue;
   const targeting=u.hero&&u.manualCastPending,canAttack=u.order!=='move'&&u.order!=='stop'&&!targeting;
   let t=canAttack&&BATTLE.has(this.phase)?this.units.find(t=>t.id===u.target&&this.canTarget(u,t)):null;
   if(canAttack&&u.order==='attack'&&!t){u.target=null;u.order='auto';}
   if(!t&&canAttack&&BATTLE.has(this.phase))t=this.enemies(u,u.order==='hold'?u.range+(u.range<3?Math.max(0,unitRadius(u)+1.6-.8):0):u.hero?(this.phase==='final'&&(u.bot||u.order==='auto')?Infinity:9):(u.acquireRange??Infinity))[0];
   let dest=['move','attackMove'].includes(u.order)?u.destination:null;
   if(u.stageDone&&this.phase==='wave'&&privateTrials(this.options.mode)){u.moving=false;continue;}
   if(t&&u.order!=='move'){if(distance(u,t)<=this.attackReach(u,t)&&(this.options.mode!=='dungeon'||this.dungeonAttackReady(u,t))){dest=null;if(u.cd<=0){this.attack(u,t);u.cd=u.interval/(u.attackSpeed||1);}}else if(u.order!=='hold'&&u.order!=='stop')dest=t;}
   const followingDestination=dest&&dest===u.destination&&['move','attackMove'].includes(u.order);if(dest)dest=navigation(this,u,dest);let vx=0,vz=0;if(dest){const d=distance(u,dest);if(d>.04){const slow=1-Math.max((u.frostUntil||0)>this.time?.45*(1-(u.coldResist||0)):0,(u.abilitySlowUntil||0)>this.time?u.abilitySlowAmount||0:0),speed=u.speed*slow*(u.wading?.55:1)*(ARENAS[this.arena].move||1);u.facing=Math.atan2(dest.x-u.x,dest.z-u.z);vx=Math.sin(u.facing)*Math.min(d/dt,speed);vz=Math.cos(u.facing)*Math.min(d/dt,speed);u.moving=true;}else if(followingDestination&&navigationInfo(u)?.status==='arrived'){u.order='auto';u.destination=null;}}
   if(u.sliding){const blend=1-Math.exp(-dt*2.8);u.vx=(u.vx||0)+(vx-(u.vx||0))*blend;u.vz=(u.vz||0)+(vz-(u.vz||0))*blend;}else{u.vx=vx;u.vz=vz;}moveUnit(this,u,{x:u.x+u.vx*dt,z:u.z+u.vz*dt});
  }
  this.collisionStats=resolveUnitCollisions(this,dt);
  for(const hero of this.heroes())this.tickNPC(hero);
  this.tickAbilityEffects(dt);this.equipmentTick();this.tickBossPatterns();this.permanentTick(dt);if(this.options.mode==='linewars')this.tickLineWars(dt);
  if(this.phase==='bonus')this.checkBonus();
  if(this.options.mode==='dungeon')this.tickDungeon(dt);if(this.phase==='wave'&&!['linewars','dungeon'].includes(this.options.mode))this.checkCompetitionWave();

  if(this.phase==='final'&&!['campaign','dungeon'].includes(this.options.mode))this.checkCompetitionClash(dt);
  if(this.phase==='final'&&this.options.mode==='campaign'){const alive=this.heroes().filter(u=>u.alive);if(alive.length<=1)this.finishFinal(alive[0]);else if(this.time-this.finalStarted>60){for(const u of alive)this.hit(u,u.maxHp*.02*dt,null,true,true,false,true);if(this.time-this.finalStarted>120)this.finishFinal(alive.sort((a,b)=>b.hp/b.maxHp-a.hp/a.maxHp||a.id-b.id)[0]);}}
  this.units=this.units.filter(u=>u.hero||u.alive||this.time-(u.died||0)<1);
 }
 snapshotFor(owner){if(this.options.mode==='bonk'){const state=this.snapshot(owner);state.units=[...state.units.filter(u=>u.owner===owner&&u.bonkHero),...state.units.filter(u=>!(u.owner===owner&&u.bonkHero)).map(u=>{if(!u.bonkHero)return u;const {bonkOffer,bonkRewardKills,roCardLoadout,roInventory,roUnclaimed,...publicUnit}=u;return publicUnit;})];return state;}if(this.options.mode==='phasekiller')return this.snapshotPhaseKiller(owner);const state=this.snapshot();if(this.options.mode==='dungeon'){state.dungeon=this.snapshotDungeon(owner);return filterExplorationSnapshot(state,state.dungeon?.visibility);}if(this.options.mode==='treetag')return filterExplorationSnapshot(state,treeTagVision(this,owner));if(this.options.mode==='kodotag')return filterExplorationSnapshot(state,kodoTagVision(this,owner));return state;}
 snapshot(owner){if(this.options.mode==='bonk')return{options:this.options,bonk:this.snapshotBonk(owner),worldSeed:this.worldSeed,units:this.units,players:this.players,effects:this.effects,obstacles:this.obstacles,bounds:this.bounds,time:this.time,phase:this.phase,wave:this.wave,timer:this.timer,message:this.message,winningOwners:this.winningOwners,arena:this.bonk?.map?.biome==='frost'?'glacier':this.bonk?.map?.biome==='forge'?'volcano':'forest',zones:[],drops:[],projectiles:[],cells:[],stock:{},skillOwners:{},standings:[]};if(this.options.mode==='bloody')return{options:this.options,bloodyTournament:this.snapshotBloodyTournament(),units:this.units,players:this.players,effects:this.effects,obstacles:[],bounds:this.bounds,time:this.time,phase:this.phase,wave:this.wave,timer:this.timer,message:this.message,winner:this.winner,winningOwners:this.winningOwners,arena:'forest',zones:[],drops:[],projectiles:[],cells:[],stock:{},skillOwners:{},standings:[]};if(this.options.mode==='phasekiller')return this.snapshotPhaseKiller();if(['treetag','warlock','kodotag'].includes(this.options.mode)){return{options:this.options,kodoTag:this.options.mode==='kodotag'?this.snapshotKodoTag():null,treeTag:this.options.mode==='treetag'?this.snapshotTreeTag():null,warlock:this.options.mode==='warlock'?this.snapshotWarlock():null,units:this.units,players:this.players,effects:this.effects,obstacles:this.obstacles,bounds:this.bounds,time:this.time,phase:this.phase,wave:this.wave,timer:this.timer,message:this.message,winner:this.winner,winningOwners:this.winningOwners,arena:this.options.mode==='warlock'?'volcano':'forest',zones:[],drops:[],projectiles:[],cells:[],stock:{},skillOwners:{},standings:this.heroes().map(u=>({owner:u.owner,name:u.name,score:u.score||0}))};}if(this.options.mode==='castlefight'){const castleFight=this.snapshotCastleFight();return {castleFight,voxelMap:castleFight?.map?.terrain||null,options:this.options,bounds:this.bounds,time:this.time,units:[...this.units,...(castleFight?.units||[])],players:this.players,effects:this.effects,obstacles:this.obstacles,phase:this.phase,wave:this.wave,timer:this.timer,message:this.message,winner:this.winner,winningOwners:this.winningOwners,arena:this.arena,zones:[],drops:[],projectiles:[],cells:[],standings:this.standings(),stock:{},skillOwners:{}};}return {dungeon:this.options.mode==='dungeon'?this.snapshotDungeon():null,voxelMap:this.voxelMap,lineWars:this.snapshotLineWars(),bossWarnings:this.bossWarnings||[],skillOwners:this.skillOwnership(),drops:this.drops,projectiles:this.projectiles,options:this.options,bounds:this.bounds,field:this.field,obstacles:this.obstacles,cells:this.cells||[],standings:this.standings(),stageResults:this.stageResults,waveResults:this.waveResults||null,roundResults:this.roundResults||[],lastClash:this.lastClash,waveKind:this.waveKind,winningOwners:this.winningOwners,time:this.time,units:this.units,effects:this.effects,players:this.players,phase:this.phase,wave:this.wave,timer:this.timer,message:this.message,stock:this.stock,teamStock:this.teamStock,shopVisit:this.shopVisit,arena:this.arena,zones:this.zones,bonusResults:this.bonusResults,winner:this.winner};}
}

Object.assign(Game.prototype,classicRagnarokMethods,DungeonMethods,BloodyTournamentMethods,PhaseKillerMethods,KodoTagMethods,TreeTagMethods,WarlockMethods,competitionMethods,monsterMethods,shopMethods,techniqueMethods,ownershipMethods,instanceMethods,bossMethods,nordicMethods,LineWarsMethods,permanentMethods,mapMethods,AbilityMethods,CastleFightMethods);

Object.assign(Game.prototype,BonkMethods);
