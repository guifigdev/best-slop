import {RO_CAST_TIMES} from './ro-cast-time-data.js';
import {RO_SP_COSTS} from './ro-sp-cost-data.js';
import {roActiveSkillKeys,roIsPassive} from './ro-skill-loadout.js';
import {roUtilitySkillReadiness} from './ro-skill-mechanics.js';
import {roBasicAttack} from './ragnarok-jobs.js';
import {BONK_WEAPONS} from './bonk-catalog.js';

const own=(value,key)=>!!value&&typeof key==='string'&&Object.hasOwn(value,key);
export const roSkillAuto=(unit,key)=>unit?.bonkSkillAuto?.[key]!==false;
const originalNames={bash:'SM_BASH',bowlingbash:'KN_BOWLINGBASH',fireball:'MG_FIREBALL',firebolt:'MG_FIREBOLT',coldbolt:'MG_COLDBOLT',stormgust:'WZ_STORMGUST',chainlightning:'WL_CHAINLIGHTNING',heavensdrive:'WZ_HEAVENDRIVE',psychicwave:'SO_PSYCHIC_WAVE',doublestrafe:'AC_DOUBLE',blitzbeat:'HT_BLITZBEAT',arrowstorm:'RA_ARROWSTORM',musicalstrike:'BA_MUSICALSTRIKE',severerainstorm:'WM_SEVERE_RAINSTORM',holylight:'AL_HOLYLIGHT',magnusexorcismus:'PR_MAGNUS',judex:'AB_JUDEX',adoramus:'AB_ADORAMUS',fingeroffensive:'MO_FINGEROFFENSIVE',tigercannon:'SR_TIGERCANNON',cartrevolution:'MC_CARTREVOLUTION',hammerfall:'BS_HAMMERFALL',axetornado:'NC_AXETORNADO',demonstration:'AM_DEMONSTRATION',cartcannon:'GN_CARTCANNON',envenom:'TF_POISON',sonicblow:'AS_SONICBLOW',rollingcutter:'GC_ROLLINGCUTTER',backstab:'RG_BACKSTAP',shieldboomerang:'CR_SHIELDBOOMERANG',overbrand:'LG_OVERBRAND',dragonbreath:'RK_DRAGONBREATH'};
export const roSkillManaCost=(weapon,level=weapon?.level||1)=>{if(weapon?.key==='basic'||weapon?.kind==='passive')return 0;const cost=RO_SP_COSTS[weapon?.sourceAegis||originalNames[weapon?.key]],rank=Math.max(1,Math.floor(level));return Math.max(0,Array.isArray(cost)?cost[Math.min(cost.length-1,rank-1)]:typeof cost==='number'?cost:Math.max(8,weapon?.manaCost||8));};
export function roSkillCastTime(weapon,level=1,stats={}){
 if(!weapon||weapon.key==='basic'||weapon.kind==='passive')return{variable:0,fixed:0,total:0};const source=RO_CAST_TIMES[weapon.sourceAegis||originalNames[weapon.key]],at=value=>(Array.isArray(value)?value[Math.min(value.length-1,Math.max(0,level-1))]:value)||0,a=stats.attributes||{},reduction=Math.max(0,1-Math.sqrt(Math.max(0,((a.dex||0)*2+(a.int||0))/530))),variable=Math.max(0,at(source?.variable)/1000)*reduction,fixed=Math.max(0,at(source?.fixed)/1000);return{variable,fixed,total:Math.min(30,variable+fixed)};
}
export function finishRoSkillCast(game,unit,stats,attack){
 const casting=unit.roCasting;if(!casting||game.bonk.stage!=='playing'||game.bonk.offer||unit.bonkOffer||game.paused||game.bonk.elapsed<casting.finishAt)return false;
 delete unit.roCasting;if(!unit.alive||!unit.bonkBuild.weapons[casting.key])return false;
 const weapon=BONK_WEAPONS[casting.key],level=unit.bonkBuild.weapons[casting.key];if(!weapon||(unit.mana||0)<roSkillManaCost(weapon,level)||!attack(weapon,level,stats))return false;
 (unit.bonkWeaponAt||={})[casting.key]=game.bonk.elapsed+roSkillCooldown(weapon,level,stats);return true;
}
export const roSkillCooldown=(weapon,level,stats={})=>Math.max(.12,weapon.cooldown/(Math.max(.01,stats.haste||1)*(1+(level-1)*.045)));

export function roSkillStatus(game,unit,key,stats={},options={manual:true}){
 const level=own(unit?.bonkBuild?.weapons,key)?unit.bonkBuild.weapons[key]:0,weapon=key==='basic'?roBasicAttack(unit||{}):own(BONK_WEAPONS,key)?BONK_WEAPONS[key]:null,learned=!!weapon&&Number.isInteger(level)&&level>=1&&level<=8,elapsed=game?.bonk?.elapsed||0,cooldownRemaining=Math.max(0,(unit?.bonkWeaponAt?.[key]||0)-elapsed),manaCost=roSkillManaCost(weapon,level),cooldown=weapon?roSkillCooldown(weapon,Math.max(1,level),stats):0;
 let reasonCode='ready',readyReason='Pronta';
 if(!learned){reasonCode='unlearned';readyReason='Não aprendida';}
 else if(roIsPassive(key)){reasonCode='passive';readyReason='Passiva sempre ativa';}
 else if(!roActiveSkillKeys(unit).includes(key)){reasonCode='unequipped';readyReason='Equipe na barra de habilidades';}
 else if(!unit?.alive){reasonCode='dead';readyReason='Herói derrotado';}
 else if(game?.options?.mode!=='bonk'||game?.bonk?.stage!=='playing'||game?.bonk?.offer||unit?.bonkOffer||game?.paused){reasonCode='paused';readyReason=game?.bonk?.offer?'Escolha uma melhoria':game?.bonk?.stage==='preparation'?'Comece a partida':'Pausado';}
 else if(unit.roCasting){reasonCode='casting';readyReason='Conjurando '+(BONK_WEAPONS[unit.roCasting.key]?.name||'habilidade');}
 else if(cooldownRemaining>0){reasonCode='cooldown';readyReason='Recarregando';}
 else if((unit.mana||0)<manaCost){reasonCode='mana';readyReason='SP insuficiente';}
 else{const utility=roUtilitySkillReadiness(game,unit,weapon,stats,options);if(utility){reasonCode=utility.reasonCode;readyReason=utility.readyReason;}else{const range=weapon.range*(stats.area||1);if(!(game.units||[]).some(enemy=>enemy.bonkEnemy&&enemy.alive&&Math.hypot(enemy.x-unit.x,enemy.z-unit.z)<=range)){reasonCode='target';readyReason='Sem inimigo no alcance';}}}
 return{castTime:roSkillCastTime(weapon,level,stats).total,castingRemaining:unit?.roCasting?Math.max(0,unit.roCasting.finishAt-elapsed):0,learned,auto:roSkillAuto(unit,key),manaCost,cooldown,cooldownRemaining:Number(cooldownRemaining.toFixed(2)),ready:reasonCode==='ready',reasonCode,readyReason};
}

export function castRoSkill(game,unit,key,stats,attack,options={manual:true}){
 const status=roSkillStatus(game,unit,key,stats,options);if(!status.ready)return{ok:false,reason:status.readyReason,reasonCode:status.reasonCode};
 const weapon=key==='basic'?roBasicAttack(unit):BONK_WEAPONS[key],level=unit.bonkBuild.weapons[key],cast=roSkillCastTime(weapon,level,stats);if(cast.total>.04){unit.roCasting={key,level,started:game.bonk.elapsed,finishAt:game.bonk.elapsed+cast.total,duration:cast.total,variable:cast.variable,fixed:cast.fixed};return{ok:true,reason:'Conjurando '+weapon.name,reasonCode:'casting'};}if(typeof attack!=='function'||!attack(weapon,level,stats))return{ok:false,reason:'Sem inimigo no alcance',reasonCode:'target'};
 (unit.bonkWeaponAt||={})[key]=game.bonk.elapsed+status.cooldown;return{ok:true,reason:'Habilidade usada',reasonCode:'cast'};
}

export function setRoSkillAuto(game,unit,key,enabled){
 if(game?.options?.mode!=='bonk'||!unit?.bonkHero||typeof enabled!=='boolean'||!own(unit.bonkBuild?.weapons,key)||key!=='basic'&&!own(BONK_WEAPONS,key))return false;
 (unit.bonkSkillAuto||={})[key]=enabled;return true;
}
