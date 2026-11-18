import {ITEMS,itemAt,ITEM_MAX_LEVEL} from './catalog.js';
import {ARENAS} from './arenas.js';
import {LOOT_RARITIES,rarityRoll} from './rarity.js';

const definitions={
 keen_edge:{name:'Gume de Týr',rarity:'common',stats:{damageFlat:8},description:'+8 dano físico.'},
 iron_script:{name:'Selo de Algiz',rarity:'common',stats:{armor:2},description:'+2 armadura.'},
 quick_lace:{name:'Fio de Ullr',rarity:'common',stats:{attackSpeed:.06},description:'+6% velocidade de ataque.'},
 steady_step:{name:'Passo de Sleipnir',rarity:'common',stats:{moveSpeed:.05},description:'+5% movimento.'},
 quiet_spring:{name:'Fonte de Mímir',rarity:'common',stats:{manaRegen:.6},description:'+0,6 mana/s.'},
 moss_heart:{name:'Seiva de Yggdrasil',rarity:'common',stats:{hpRegen:2},description:'+2 vida/s.'},
 spark_thread:{name:'Fagulha de Thor',rarity:'rare',effect:{type:'chain',chance:.15,damage:30,jumps:3,radius:5,retention:.8},description:'Acertos primários têm 15% de chance de uma corrente elétrica: 30 dano, até 3 alvos únicos, −20% por salto.'},
 winter_mark:{name:'Marca de Skaði',rarity:'rare',effect:{type:'frost',chance:.2,damage:28,duration:1.1,slow:.45},description:'Acertos primários têm 20% de chance de causar 28 dano mágico de gelo e frost por 1,1s.'},
 venom_rune:{name:'Peçonha de Jörmungandr',rarity:'rare',effect:{type:'poison',chance:.25,damage:6,duration:4},description:'Acertos primários têm 25% de chance de aplicar 6 dano de veneno/s por 4s; renova, sem acumular.'},
 blood_stitch:{name:'Laço de Fenrir',rarity:'rare',stats:{lifesteal:.06},description:'+6% roubo de vida físico, sujeito ao limite da build.'},
 living_mark:{name:'Bênção de Eir',rarity:'rare',stats:{hpRegen:4},description:'+4 vida/s.'},
 ember_tracks:{name:'Brasas de Múspell',rarity:'epic',items:['boots'],stats:{moveSpeed:.08},effect:{type:'trail',damage:8,radius:1.25,duration:3,interval:.65},description:'Somente botas: +8% movimento; caminhar deixa fogo no solo por 3s, causando 8 dano/s. Não atinge voadores.'},
 storm_script:{name:'Escrita de Mjölnir',rarity:'epic',stats:{attackSpeed:.05},effect:{type:'chain',chance:.15,damage:45,jumps:3,radius:5,retention:.8},description:'+5% velocidade de ataque; 15% de chance de corrente elétrica de 45 dano, até 3 alvos únicos.'},
 life_pulse:{name:'Pulso de Iðunn',rarity:'epic',effect:{type:'heal',chance:.15,heal:45},description:'Acertos primários têm 15% de chance de restaurar 45 vida do portador, sem escalar com INT.'},
 stone_oath:{name:'Juramento dos Jötnar',rarity:'epic',stats:{armor:6,moveSpeed:-.06},description:'+6 armadura. Maldição: −6% movimento.'},
 doom_edge:{name:'Fio de Níðhöggr',rarity:'legendary',stats:{damageMultiplier:1.2,damageTaken:.4,moveSpeed:-.12},description:'+120% dano dos ataques físicos. Maldição: +40% dano recebido de inimigos e −12% movimento.'},
 hollow_star:{name:'Vazio de Ginnungagap',rarity:'legendary',stats:{magicPower:.8},curse:{manaDrain:10},description:'+80% poder mágico. Maldição: perde 10 mana/s durante o combate.'},
 barbed_pact:{name:'Pacto de Garmr',rarity:'legendary',stats:{attackSpeed:.25,damageFlat:20,damageTaken:.15},curse:{hpDrainPercent:.015},description:'+25% velocidade de ataque e +20 dano físico. Maldição: +15% dano recebido de inimigos e perde 1,5% da vida máxima/s em combate.'},
 winter_veil:{name:'Véu de Niflheim',rarity:'legendary',stats:{armor:5,evasion:.1,moveSpeed:-.15},effect:{type:'frost',chance:.3,damage:50,duration:1.5,slow:.45},description:'+5 armadura, +10% esquiva comum e 30% de chance de gelo mágico de 50 dano/frost por 1,5s. Maldição: −15% movimento.'},
 god_hunger:{name:'Fome do Ragnarök',rarity:'heroic',stats:{damageMultiplier:4,damageTaken:1,moveSpeed:-.3},curse:{hpDrainPercent:.03,manaDrain:10},description:'+400% dano dos ataques físicos. Maldição: recebe o dobro de dano de inimigos, −30% movimento, perde 3% da vida máxima e 10 mana por segundo em combate.'},
 worldfire_steps:{name:'Passos de Surtr',rarity:'heroic',items:['boots'],stats:{moveSpeed:.15,damageTaken:.3},effect:{type:'trail',damage:20,radius:1.8,duration:3,interval:.65},curse:{hpDrainPercent:.015},description:'Somente botas: +15% movimento e rastros de fogo de 20 dano/s por 3s. Maldição: +30% dano recebido de inimigos e perde 1,5% da vida máxima/s em combate.'},
 sky_tyrant:{name:'Mandato de Gungnir',rarity:'heroic',stats:{magicPower:.3,damageTaken:.25},effect:{type:'chain',chance:.15,damage:90,jumps:3,radius:6.5,retention:.85},curse:{manaDrain:12},description:'+30% poder mágico; 15% de chance de corrente elétrica de 90 dano, até 3 alvos únicos. Maldição: +25% dano recebido de inimigos e perde 12 mana/s em combate.'}
};

const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
export const PERMANENT_ENCHANTS=freeze(Object.fromEntries(Object.entries(definitions).map(([id,definition])=>[id,{id,...definition}])));
const BATTLE=new Set(['wave','bonus','final']);
const STATS=['damageFlat','damageMultiplier','armor','attackSpeed','moveSpeed','manaRegen','hpRegen','evasion','critChance','magicPower','damageTaken','lifesteal'];
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const positiveRoll=random=>{const value=typeof random==='function'?random():.5;return clamp(Number.isFinite(value)?value:.5,0,.999999999);};
const rank=value=>clamp(Number.isFinite(value)?Math.floor(value):1,1,ITEM_MAX_LEVEL);
const eligible=(definition,key)=>!definition.items||definition.items.includes(key);
const scopeOf=u=>JSON.stringify([u.team,u.challenge,u.cell?.key,u.cell?.x,u.cell?.z,u.cell?.r,u.instance,u.instanceId,u.arenaId,u.laneId,u.trialId]);

export const permanentEnchantPrice=level=>350+150*rank(level);
export function permanentEnchantAt(record,itemKey=null){
 const id=typeof record==='string'?record:record?.id;
 return Object.hasOwn(PERMANENT_ENCHANTS,id)&&(!itemKey||eligible(PERMANENT_ENCHANTS[id],itemKey))?PERMANENT_ENCHANTS[id]:null;
}

export function permanentEntries(u){
 const result=[],seen=new Set();
 for(const slot of u?.inventory||[]){const item=Object.hasOwn(ITEMS,slot?.key)?ITEMS[slot.key]:null;if(!slot||!item||item.consumable)continue;const definition=permanentEnchantAt(slot.permanentEnchant,slot.key);if(definition&&!seen.has(definition.id)){seen.add(definition.id);result.push(definition);}}
 return result;
}

export function permanentStats(u){
 const result=Object.fromEntries(STATS.map(key=>[key,0]));
 for(const definition of permanentEntries(u))for(const [key,value]of Object.entries(definition.stats||{}))if(Object.hasOwn(result,key))result[key]+=value;
 return result;
}

export function rollPermanentEnchant(itemKey,random){
 const item=itemAt(itemKey);if(!item||item.consumable)return null;
 const rarity=rarityRoll(random),pool=Object.values(PERMANENT_ENCHANTS).filter(definition=>definition.rarity===rarity&&eligible(definition,itemKey));
 return pool[Math.min(pool.length-1,Math.floor(positiveRoll(random)*pool.length))]||null;
}

function bestEffects(u,entries=permanentEntries(u)){const byType=new Map();for(const definition of entries){const effect=definition.effect;if(!effect)continue;const old=byType.get(effect.type),power=(effect.damage||effect.heal||0)*(effect.chance||1);if(!old||power>(old.effect.damage||old.effect.heal||0)*(old.effect.chance||1))byType.set(effect.type,definition);}return [...byType.values()];}
function weatherDamage(game,damage,element){return damage*(ARENAS[game.arena]?.[element]||1);}
function directDamage(game,u,target,damage,element){const resist=element==='fire'?target.fireResist||0:element==='ice'?target.coldResist||0:0;return game.hit(target,weatherDamage(game,damage,element)*(1-resist),u,true,false,false,false,element);}
function isActive(game,u){return u?.alive&&BATTLE.has(game.phase)&&!(u.stageDone&&game.phase==='wave');}

export const permanentMethods={
 enchantPermanent(u,command){
  if(!u?.hero||!u.alive||!Number.isInteger(command?.slot)||command.slot<0||command.slot>=6||!this.atShop(u,'runemaster'))return false;
  const slot=u.inventory?.[command.slot],item=itemAt(slot?.key,slot?.level),cost=permanentEnchantPrice(slot?.level);
  if(!slot||!item||item.consumable||!Number.isFinite(u.gold)||u.gold<cost)return false;
  const seed=Math.floor(positiveRoll(()=>this.random())*4294967296)>>>0;let state=seed;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;},definition=rollPermanentEnchant(slot.key,random);
  if(!definition)return false;
  u.gold-=cost;slot.invested=(slot.invested||item.cost)+cost;slot.permanentEnchant={id:definition.id,rarity:definition.rarity,seed,roll:state,rolledAt:this.time};
  this.refresh(u);this.fx('permanentEnchant',u.x,u.z,{source:u.id,slot:command.slot,enchant:definition.id,rarity:definition.rarity,color:LOOT_RARITIES[definition.rarity].color});return true;
 },

 permanentModifyDamage(target,amount,source){
  if(!Number.isFinite(amount)||amount<=0||!source||source.id===target?.id||source.team===target?.team||!target?.inventory?.some(slot=>slot?.permanentEnchant))return amount;
  return amount*Math.max(.1,1+permanentStats(target).damageTaken);
 },

 permanentAttack(u,target,damage){
  if(!isActive(this,u)||!target||!(damage>0)||!this.canTarget(u,{...target,alive:true}))return;
  for(const definition of bestEffects(u)){
   const effect=definition.effect;if(effect.type==='trail'||positiveRoll(()=>this.random())>=effect.chance)continue;
   if(effect.type==='chain'){
    const visited=new Set();let current=target,from=u;
    for(let i=0;i<Math.min(3,effect.jumps)&&current;i++){
     visited.add(current.id);if(current.alive&&this.canTarget(u,current))directDamage(this,u,current,effect.damage*effect.retention**i,'lightning');
     this.fx('bolt',from.x,from.z,{source:u.id,tx:current.x,tz:current.z,permanent:definition.id});from=current;
     current=this.units.filter(candidate=>!visited.has(candidate.id)&&this.canTarget(u,candidate)&&distance(from,candidate)<=effect.radius).sort((a,b)=>distance(from,a)-distance(from,b)||a.id-b.id)[0];
    }
   }else if(effect.type==='heal')this.heal(u,effect.heal);
   else if(target.alive&&this.canTarget(u,target)&&(target.avatar||0)<=this.time){
    if(effect.type==='frost'){directDamage(this,u,target,effect.damage,'ice');target.frostUntil=Math.max(target.frostUntil||0,this.time+effect.duration);this.fx('frost',target.x,target.z,{source:u.id,permanent:definition.id});}
    else if(effect.type==='poison'){this.applyDot(target,'poison',weatherDamage(this,effect.damage,'poison'),effect.duration,u);this.fx('poison',target.x,target.z,{source:u.id,permanent:definition.id});}
   }
  }
 },

 permanentTick(dt){
  if(!Number.isFinite(dt)||dt<=0)return;
  const phaseKey=`${this.phase}:${this.wave}`;
  if(this.permanentPhase!==phaseKey){this.permanentPhase=phaseKey;this.permanentTrails=[];this.permanentAreaAt=this.time;for(const u of this.heroes())u.permanentDrainElapsed=0;}
  if(!BATTLE.has(this.phase)){this.permanentTrails=[];return;}
  this.permanentTrails=(this.permanentTrails||[]).filter(patch=>patch.expires>this.time&&patch.phase===this.phase&&patch.wave===this.wave);
  for(const u of this.heroes()){
   if(!isActive(this,u))continue;
   const entries=permanentEntries(u),curse={manaDrain:0,hpDrainPercent:0};for(const definition of entries)for(const key of Object.keys(curse))curse[key]+=definition.curse?.[key]||0;
   if(curse.manaDrain||curse.hpDrainPercent){u.permanentDrainElapsed=(u.permanentDrainElapsed||0)+dt;const pulses=Math.min(5,Math.floor(u.permanentDrainElapsed+1e-8));if(pulses){u.permanentDrainElapsed-=pulses;const mana=Math.min(u.mana||0,curse.manaDrain*pulses);u.mana=Math.max(0,(u.mana||0)-mana);if(curse.hpDrainPercent)this.hit(u,u.maxHp*curse.hpDrainPercent*pulses,null,true,true,false,true);this.fx('permanentCurse',u.x,u.z,{source:u.id,mana,hp:u.maxHp*curse.hpDrainPercent*pulses});}}
   else u.permanentDrainElapsed=0;
   if(!u.alive||!u.moving)continue;
   const definition=bestEffects(u,entries).find(entry=>entry.effect.type==='trail');if(!definition||this.time<(u.permanentTrailAt||0))continue;
   const effect=definition.effect;u.permanentTrailAt=this.time+effect.interval;
   const own=this.permanentTrails.filter(patch=>patch.source===u.id);if(own.length>=6){const oldest=own[0];this.permanentTrails=this.permanentTrails.filter(patch=>patch!==oldest);}
   this.permanentTrails.push({id:this.id(),source:u.id,scope:scopeOf(u),x:u.x,z:u.z,damage:effect.damage,radius:effect.radius,expires:this.time+effect.duration,phase:this.phase,wave:this.wave});if(this.permanentTrails.length>60)this.permanentTrails.shift();
   this.fx('permanentTrail',u.x,u.z,{source:u.id,radius:effect.radius,duration:effect.duration,permanent:definition.id});
  }
  if(this.time<(this.permanentAreaAt||0))return;this.permanentAreaAt=this.time+.5;
  const hits=new Map();
  for(const patch of this.permanentTrails){const source=this.units.find(u=>u.id===patch.source);if(!source||scopeOf(source)!==patch.scope)continue;
   for(const target of this.units){if(target.flying||!this.canTarget(source,target)||distance(target,patch)>patch.radius)continue;const key=`${target.id}:${source.team}`,old=hits.get(key);if(!old||patch.damage>old.patch.damage)hits.set(key,{source,target,patch});}
  }
  for(const {source,target,patch}of hits.values())directDamage(this,source,target,patch.damage*.5,'fire');
 }
};
