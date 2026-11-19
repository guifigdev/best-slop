import {PHASE_KILLER_SKILLS as SKILLS,PHASE_KILLER_ITEMS as ITEMS} from './phase-killer-catalog.js';

const number=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const positive=value=>Math.max(0,number(value));
const chance=value=>Math.min(1,positive(value));
const native=(data,field,fallback)=>number(data?.[field],number(data?.[fallback]));
const roll=(probability,random)=>probability>=1||probability>0&&number((typeof random==='function'?random:Math.random)(),1)<probability;
const melee=u=>u?.ranged!==true&&u?.attackStyle!=='ranged'&&positive(u?.range)<=2;

// Same first-item-per-hand rule as refresh(); a spare shield in the same hand
// must not provide a second block roll. Armor suits replace a unit profile.
function equipped(u){
 const hands=new Set();return (u?.inventory||[]).flatMap(entry=>{const item=ITEMS[entry?.key];if(!item||item.category==='armor')return[];if(item.hand){if(hands.has(item.hand))return[];hands.add(item.hand);}return[item];});
}

export function phaseKillerPassiveProfile(u){
 const result={criticalChance:0,criticalMultiplier:1,bonusDamage:0,evasion:0,blockChance:0,blockAmount:0,blockMinimumDamage:0,healingFactor:0,cleaveFactor:0,cleaveRadius:0,manaBurn:0,manaBurnChance:0,manaBurnDamageFactor:0,bashChance:0,bashDamage:0,stunDuration:0,cripple:null,crippleChance:0,creep:false,fadeTime:1};
 if(!u||u.pkGhost)return result;
 const seen=new Set(),derived={},life={melee:0,all:0},items=equipped(u);
 const add=(key,value)=>{derived[key]=(derived[key]||0)+number(value);};
 const max=(key,value)=>{result[key]=Math.max(result[key],positive(value));};
 function effect(key,base,data={},radius=0,duration=0){
  if(seen.has(key))return;seen.add(key);
  if(base==='ANdb'||base==='AOcr'){
   max('criticalChance',native(data,'Ocr1','DataA')/100);max('criticalMultiplier',native(data,'Ocr2','DataB'));max('bonusDamage',native(data,'Ocr3','DataC'));max('evasion',native(data,'Ocr4','DataD'));
  }else if(base==='ANca'){max('cleaveFactor',native(data,'nca1','DataA'));max('cleaveRadius',radius);}
  else if(base==='Assk'){max('blockChance',native(data,'Ssk1','DataA')/100);max('blockMinimumDamage',native(data,'Ssk2','DataB'));max('blockAmount',native(data,'Ssk3','DataC'));}
  else if(base==='AUav')life.melee=Math.max(life.melee,native(data,'Uav1','DataA'));
  else if(base==='AIva')life.all=Math.max(life.all,native(data,'Ivam','DataA'));
  else if(base==='ACbh'||base==='AHbh'){
   max('bashChance',native(data,'Hbh1','DataA')/100);max('bashDamage',native(data,'Hbh3','DataC'));max('stunDuration',duration);
  }else if(base==='Ashm'){result.creep=true;result.fadeTime=Math.max(0,native(data,'Shm1','DataA'));}
  else if(base==='Acri'){result.cripple={duration:positive(duration),moveSlow:chance(native(data,'Cri1','DataA')),attackSlow:chance(native(data,'Cri2','DataB')),damageReduction:chance(native(data,'Cri3','DataC'))};result.crippleChance=1;}
  else if(base==='Afbk'){max('manaBurn',native(data,'fbk1','DataA'));result.manaBurnChance=1;result.manaBurnDamageFactor=1;}
 }
 for(const item of items){
  for(const [key,value]of Object.entries(item.stats||{}))add(key,value);
  for(const attached of item.statEffects||[]){
   const definition=SKILLS[attached.rawId];effect(attached.rawId,attached.baseId,attached.nativeData,item.stats?.cleaveRadius||definition?.radius||0,definition?.heroDuration||definition?.duration||0);
  }
 }
 // Native monster passives can be intrinsic or appear both in snapshot skills
 // and innate items. Raw ability IDs prevent applying either representation twice.
 for(const key of [...(u.skills||[]),...(u.abilities||[])]){const s=SKILLS[key];if(s?.kind==='passive')effect(key,s.baseId,s.nativeData,s.radius,s.heroDuration||s.duration);}
 const stats={...derived};for(const [key,value]of Object.entries(u.pkEquipmentStats||{}))if(Number.isFinite(value))stats[key]=Math.max(stats[key]||0,value);
 for(const key of ['criticalChance','criticalMultiplier','bonusDamage','evasion','blockChance','blockAmount','blockMinimumDamage'])max(key,stats[key]);
 max('cleaveFactor',stats.cleave);max('cleaveRadius',stats.cleaveRadius);max('manaBurn',stats.manaBurn);
 const knownLife=life.melee+life.all,extraLife=Math.max(0,positive(stats.lifesteal)-knownLife);
 result.healingFactor=Math.max(0,life.all+(melee(u)?life.melee:0)+extraLife);
 if(!melee(u)){result.cleaveFactor=0;result.cleaveRadius=0;}
 if(result.manaBurn>0&&!result.manaBurnChance){result.manaBurnChance=1;result.manaBurnDamageFactor=1;}
 // war3map.w3a A040 (Staff of Energy orb) -> Iobu A059, AEmb Emb1=7.5.
 // All three target proc chances Iob2/Iob3/Iob4 are 50%. A04G is unused.
 if(items.some(item=>item.key==='I02E')&&result.manaBurn<7.5){result.manaBurn=7.5;result.manaBurnChance=.5;result.manaBurnDamageFactor=1;}
 // A046 (Staff of Death orb) attaches A047/Acri, with the same 50% target
 // chances. The attachment is not a separately equipped/castable item skill.
 if(items.some(item=>item.key==='I02C')){const s=SKILLS.A047;result.cripple={duration:positive(s.heroDuration||s.duration),moveSlow:chance(native(s.nativeData,'Cri1','DataA')),attackSlow:chance(native(s.nativeData,'Cri2','DataB')),damageReduction:chance(native(s.nativeData,'Cri3','DataC'))};result.crippleChance=.5;}
 for(const key of ['criticalChance','evasion','blockChance','manaBurnChance','bashChance'])result[key]=chance(result[key]);
 return result;
}

// Does not mutate units or apply armor, shields, lifesteal or secondary damage.
// The caller applies physical `damage` through hurt() and magicBonusDamage as a
// separate spell packet; critical flat damage does not enter the multiplier.
export function phaseKillerResolveAttack({source,target,random=Math.random,amount=source?.damage}={}){
 const empty={miss:false,damage:0,critical:false,manaBurn:0,manaBurnDamageFactor:0,magicBonusDamage:0,healingFactor:0,cleaveFactor:0,cleaveRadius:0,bash:false,stunDuration:0,cripple:null};
 if(!source||!target||source.alive===false||target.alive===false||source.pkGhost||target.pkGhost)return empty;
 const base=positive(amount);if(!base)return empty;
 const attack=phaseKillerPassiveProfile(source),defense=phaseKillerPassiveProfile(target);
 if(roll(defense.evasion,random))return {...empty,miss:true};
 const critical=roll(attack.criticalChance,random),bash=roll(attack.bashChance,random);
 const burn=attack.manaBurn>0&&roll(attack.manaBurnChance,random)?Math.min(positive(target.mana),attack.manaBurn):0;
 const cripple=attack.cripple&&roll(attack.crippleChance,random)?{...attack.cripple}:null;
 return {miss:false,damage:base*(critical?Math.max(1,attack.criticalMultiplier):1),critical,manaBurn:burn,manaBurnDamageFactor:attack.manaBurnDamageFactor,magicBonusDamage:(critical?attack.bonusDamage:0)+(bash?attack.bashDamage:0),healingFactor:attack.healingFactor,cleaveFactor:attack.cleaveFactor,cleaveRadius:attack.cleaveRadius,bash,stunDuration:bash?attack.stunDuration:0,cripple};
}

// Hardened Skin's minimum is the residual damage floor, not an activation
// threshold. Never increase a small hit up to that floor.
export function phaseKillerMitigatePhysical(target,damage,random=Math.random){
 const value=positive(damage);if(!value)return 0;
 const p=phaseKillerPassiveProfile(target);return roll(p.blockChance,random)?Math.min(value,Math.max(p.blockMinimumDamage,value-p.blockAmount)):value;
}

// This map's browser scene is night. The caller can disable Shadowmeld for a
// daytime variant; active invisibility still works independently of night.
// Keep pkLastMoveAt current while moving so the one-second native fade begins
// after the last movement, not after an unrelated old attack.
export function phaseKillerInvisible(u,time,{night=true}={}){
 if(!u||u.alive===false||u.pkGhost)return false;
 const now=number(time);if(number(u.pkInvisibleUntil)>now)return true;
 const p=phaseKillerPassiveProfile(u);if(!p.creep||!night||u.moving)return false;
 const actions=[u.attackAt,u.castAt,u.pkLastMoveAt,u.pkMovedAt,u.pkCreatedAt,u.created,u.spawnAt,0].filter(v=>Number.isFinite(v));
 return now-Math.max(...actions)>=p.fadeTime;
}
