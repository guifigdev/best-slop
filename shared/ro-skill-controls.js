import {activeRoManualAim} from './ro-manual-aim.js';
import {roHasSight,roIsHidden,roMageBolt} from './ro-mage-spells.js';
import {unitBodyGap} from './unit-body-shape.js';
import {roSkillTargetRange} from './ro-skill-range.js';
import {RO_NATIVE_SKILL_DATA} from './ro-native-skill-data.js';
import {roSkillSource} from './ro-skill-source.js';
import {roIsMount,roMountedKind,toggleRoMount} from './ro-mounts.js';
import {RO_CAST_TIMES} from './ro-cast-time-data.js';
import {RO_SP_COSTS} from './ro-sp-cost-data.js';
import {roActiveSkillKeys,roIsPassive} from './ro-skill-loadout.js';
import {roUtilitySkillReadiness} from './ro-skill-mechanics.js';
import {roBasicAttack} from './ragnarok-jobs.js';
import {BONK_WEAPONS} from './bonk-catalog.js';

const own=(value,key)=>!!value&&typeof key==='string'&&Object.hasOwn(value,key);
export const roSkillAuto=(unit,key)=>!roIsMount(key)&&(unit?.bonkSkillAuto?.[key]??key!=='tf_backsliding');
const originalNames={bash:'SM_BASH',bowlingbash:'KN_BOWLINGBASH',fireball:'MG_FIREBALL',firebolt:'MG_FIREBOLT',coldbolt:'MG_COLDBOLT',stormgust:'WZ_STORMGUST',chainlightning:'WL_CHAINLIGHTNING',heavensdrive:'WZ_HEAVENDRIVE',psychicwave:'SO_PSYCHIC_WAVE',doublestrafe:'AC_DOUBLE',blitzbeat:'HT_BLITZBEAT',arrowstorm:'RA_ARROWSTORM',musicalstrike:'BA_MUSICALSTRIKE',severerainstorm:'WM_SEVERE_RAINSTORM',holylight:'AL_HOLYLIGHT',magnusexorcismus:'PR_MAGNUS',judex:'AB_JUDEX',adoramus:'AB_ADORAMUS',fingeroffensive:'MO_FINGEROFFENSIVE',tigercannon:'SR_TIGERCANNON',cartrevolution:'MC_CARTREVOLUTION',hammerfall:'BS_HAMMERFALL',axetornado:'NC_AXETORNADO',demonstration:'AM_DEMONSTRATION',cartcannon:'GN_CARTCANNON',envenom:'TF_POISON',sonicblow:'AS_SONICBLOW',rollingcutter:'GC_ROLLINGCUTTER',backstab:'RG_BACKSTAP',shieldboomerang:'CR_SHIELDBOOMERANG',overbrand:'LG_OVERBRAND',dragonbreath:'RK_DRAGONBREATH'};
export const roSkillManaCost=(weapon,level=weapon?.level||1,stats={})=>{if(weapon?.key==='basic'||(weapon?.kind==='passive'||roIsMount(weapon?.key)))return 0;const cost=RO_SP_COSTS[weapon?.sourceAegis||originalNames[weapon?.key]],rank=Math.max(1,Math.floor(level));return Math.max(0,(Array.isArray(cost)?cost[Math.min(cost.length-1,rank-1)]:typeof cost==='number'?cost:Math.max(8,weapon?.manaCost||8))-(stats.skillBonuses?.[roSkillSource(weapon)]?.sp||0))*(1-Math.min(1,stats.spCostReduction||0));};
export function roSkillCastTime(weapon,level=1,stats={}){
 if(!weapon||weapon.key==='basic'||(weapon.kind==='passive'||roIsMount(weapon.key)))return{variable:0,fixed:0,total:0};const source=RO_CAST_TIMES[roSkillSource(weapon)],at=value=>(Array.isArray(value)?value[Math.min(value.length-1,Math.max(0,level-1))]:value)||0,a=stats.attributes||{},reduction=Math.max(0,1-Math.sqrt(Math.max(0,((a.dex||0)*2+(a.int||0))/530))),bonus=stats.skillBonuses?.[roSkillSource(weapon)]||{},variable=Math.max(0,at(source?.variable)/1000-(bonus.variableSeconds||0))*reduction*Math.max(0,1-(stats.variableCastReduction||0)-(bonus.variable||0)),fixed=Math.max(0,at(source?.fixed)/1000-(stats.fixedCastSeconds||0)-(bonus.fixedSeconds||0))*Math.max(0,1-Math.max(stats.fixedCastReduction||0,bonus.fixed||0));return{variable,fixed,total:Math.min(30,variable+fixed)};
}
export function finishRoSkillCast(game,unit,stats,attack){
 const casting=unit.roCasting;if(!casting||game.bonk.stage!=='playing'||game.bonk.offer||unit.bonkOffer||game.paused||game.bonk.elapsed<casting.finishAt)return false;
 delete unit.roCasting;if(!unit.alive||!unit.bonkBuild.weapons[casting.key])return false;
 const weapon=BONK_WEAPONS[casting.key],level=unit.bonkBuild.weapons[casting.key];if(!weapon||(unit.mana||0)<roSkillManaCost(weapon,level,stats)||!attack(weapon,level,stats,casting.aim))return false;
 recordRoSkillRelease(game,unit,weapon);lockRoAction(unit,weapon,level,stats,game.bonk.elapsed);(unit.bonkWeaponAt||={})[casting.key]=game.bonk.elapsed+roSkillCooldown(weapon,level,stats);return true;
}
const nativeAt=(value,level)=>(Array.isArray(value)?value[Math.min(value.length-1,Math.max(0,level-1))]:value)||0;
export const roSkillCooldown=(weapon,level,stats={})=>{if(weapon?.key==='basic')return stats.attackDelay??weapon.cooldown/Math.max(.01,stats.haste||1);const native=RO_NATIVE_SKILL_DATA[roSkillSource(weapon)],bonus=stats.skillBonuses?.[roSkillSource(weapon)]||{},seconds=native?nativeAt(native.cooldown,level)/1000:weapon.cooldown/(Math.max(.01,stats.haste||1)*(1+(level-1)*.045));return Math.max(0,(seconds-(bonus.cooldownSeconds||0))*(1-Math.min(1,(bonus.cooldown||0)+(stats.cooldownReduction||0))));};
export const roSkillAfterCast=(weapon,level,stats={})=>Math.max(0,nativeAt(RO_NATIVE_SKILL_DATA[roSkillSource(weapon)]?.afterCast,level)/1000)*(1-Math.min(1,(stats.afterCastReduction||0)+(stats.skillBonuses?.[roSkillSource(weapon)]?.afterCast||0)));
function lockRoAction(unit,weapon,level,stats,elapsed){unit.roAfterCastUntil=Math.max(unit.roAfterCastUntil||0,elapsed+roSkillAfterCast(weapon,level,stats));unit.roSkillActionUntil=elapsed+(stats.attackMotion??Math.max(.08,.22/Math.max(1,stats.haste||1)));}
// A successful release survives snapshot interpolation, including utility skills
// that do not emit a weapon attack. Starting or cancelling a cast never sets it.
function recordRoSkillRelease(game,unit,weapon){unit.roSkillRelease={time:game.time,key:weapon.key,element:weapon.element||'physical',kind:weapon.kind};}


export function roSkillStatus(game,unit,key,stats={},options={manual:true}){
 const level=own(unit?.bonkBuild?.weapons,key)?unit.bonkBuild.weapons[key]:0,weapon=key==='basic'?roBasicAttack(unit||{}):own(BONK_WEAPONS,key)?BONK_WEAPONS[key]:null,learned=!!weapon&&Number.isInteger(level)&&level>=1&&level<=8,elapsed=game?.bonk?.elapsed||0,cooldownRemaining=Math.max(0,(unit?.bonkWeaponAt?.[key]||0)-elapsed),manaCost=roSkillManaCost(weapon,level,stats),cooldown=weapon?roSkillCooldown(weapon,Math.max(1,level),stats):0;
 let reasonCode='ready',readyReason='Pronta';
 if(!learned){reasonCode='unlearned';readyReason='Não aprendida';}
 else if(roIsPassive(key)){reasonCode='passive';readyReason='Passiva sempre ativa';}
 else if(!roActiveSkillKeys(unit).includes(key)){reasonCode='unequipped';readyReason='Equipe na barra de habilidades';}
 else if(!unit?.alive){reasonCode='dead';readyReason='Herói derrotado';}
 else if(game?.options?.mode!=='bonk'||game?.bonk?.stage!=='playing'||game?.bonk?.offer||unit?.bonkOffer||game?.paused){reasonCode='paused';readyReason=game?.bonk?.offer?'Escolha uma melhoria':game?.bonk?.stage==='preparation'?'Comece a partida':'Pausado';}
 else if(elapsed<(unit.roHitStunUntil||0)){reasonCode='hitstun';readyReason='Recebendo golpe';}
 else if(roIsMount(key)){readyReason=unit.roMountSkill===key?'Desmontar':'Montar';}
 else if(unit.roCasting){reasonCode='casting';readyReason='Conjurando '+(BONK_WEAPONS[unit.roCasting.key]?.name||'habilidade');}
 else if(key!=='basic'&&elapsed<(unit.roAfterCastUntil||0)){reasonCode='aftercast';readyReason='Pós-conjuração';}
 else if(elapsed<(unit.roSkillActionUntil||0)){reasonCode='animation';readyReason='Animação do ataque';}
 else if(cooldownRemaining>0){reasonCode='cooldown';readyReason='Recarregando';}
 else if((unit.mana||0)<manaCost){reasonCode='mana';readyReason='SP insuficiente';}
 else if(key==='wz_sightrasher'&&!roHasSight(unit,elapsed)){reasonCode='sight';readyReason='Ative Chama Reveladora';}
 else{const utility=roUtilitySkillReadiness(game,unit,weapon,stats,{...options,aim:options.aim||activeRoManualAim(game,unit)});if(utility){reasonCode=utility.reasonCode;readyReason=utility.readyReason;}else{const range=roSkillTargetRange(weapon,stats,level),freeAim=(options.aim||activeRoManualAim(game,unit))&&weapon.kind==='projectile'&&!roMageBolt(key);if(!freeAim&&!(game.units||[]).some(enemy=>enemy.bonkEnemy&&enemy.alive&&!roIsHidden(enemy,elapsed)&&unitBodyGap(enemy,unit)<=range)){reasonCode='target';readyReason='Sem inimigo no alcance';}}}
 return{variableCast:weapon?roSkillCastTime(weapon,Math.max(1,level),stats).variable:0,fixedCast:weapon?roSkillCastTime(weapon,Math.max(1,level),stats).fixed:0,attackDelay:stats.attackDelay||0,animationRemaining:Math.max(0,(unit.roSkillActionUntil||0)-elapsed),afterCastRemaining:Math.max(0,(unit.roAfterCastUntil||0)-elapsed),afterCast:weapon?roSkillAfterCast(weapon,Math.max(1,level),stats):0,mount:roIsMount(key),mounted:roIsMount(key)&&unit.roMountSkill===key&&!!roMountedKind(unit),castTime:roSkillCastTime(weapon,level,stats).total,castingRemaining:unit?.roCasting?Math.max(0,unit.roCasting.finishAt-elapsed):0,learned,auto:roSkillAuto(unit,key),manaCost,cooldown,cooldownRemaining:Number(cooldownRemaining.toFixed(2)),ready:reasonCode==='ready',reasonCode,readyReason};
}

export function castRoSkill(game,unit,key,stats,attack,options={manual:true}){
 const status=roSkillStatus(game,unit,key,stats,options);if(!status.ready)return{ok:false,reason:status.readyReason,reasonCode:status.reasonCode};
 if(roIsMount(key)){const ok=toggleRoMount(unit,key);return {ok,reason:unit.roMountSkill===key?'Montado':'Desmontado',reasonCode:'mount'};}
 const weapon=key==='basic'?roBasicAttack(unit):BONK_WEAPONS[key],level=unit.bonkBuild.weapons[key],cast=roSkillCastTime(weapon,level,stats),aim=options.aim||activeRoManualAim(game,unit);if(cast.total>1e-6){unit.castAt=game.time;unit.bonkDashUntil=0;delete unit.roIceMotion;unit.roCasting={key,level,...(aim?{aim:{x:aim.x,z:aim.z,...(aim.target!==undefined?{target:aim.target}:{})}}:{}),started:game.bonk.elapsed,finishAt:game.bonk.elapsed+cast.total,duration:cast.total,variable:cast.variable,fixed:cast.fixed};return{ok:true,reason:'Conjurando '+weapon.name,reasonCode:'casting'};}if(typeof attack!=='function'||!attack(weapon,level,stats,aim))return{ok:false,reason:'Sem inimigo no alcance',reasonCode:'target'};
 recordRoSkillRelease(game,unit,weapon);lockRoAction(unit,weapon,level,stats,game.bonk.elapsed);(unit.bonkWeaponAt||={})[key]=game.bonk.elapsed+status.cooldown;return{ok:true,reason:'Habilidade usada',reasonCode:'cast'};
}

export function setRoSkillAuto(game,unit,key,enabled){
 if(roIsMount(key)||game?.options?.mode!=='bonk'||!unit?.bonkHero||typeof enabled!=='boolean'||!own(unit.bonkBuild?.weapons,key)||key!=='basic'&&!own(BONK_WEAPONS,key))return false;
 (unit.bonkSkillAuto||={})[key]=enabled;return true;
}
