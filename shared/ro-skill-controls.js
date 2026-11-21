import {roBasicAttack} from './ragnarok-jobs.js';
import {BONK_WEAPONS} from './bonk-catalog.js';

const own=(value,key)=>!!value&&typeof key==='string'&&Object.hasOwn(value,key);
export const roSkillAuto=(unit,key)=>unit?.bonkSkillAuto?.[key]!==false;
export const roSkillManaCost=weapon=>weapon?.key==='basic'?0:2+(weapon?.tier||0)*2;
export const roSkillCooldown=(weapon,level,stats={})=>Math.max(.12,weapon.cooldown/(Math.max(.01,stats.haste||1)*(1+(level-1)*.045)));

export function roSkillStatus(game,unit,key,stats={}){
 const level=own(unit?.bonkBuild?.weapons,key)?unit.bonkBuild.weapons[key]:0,weapon=key==='basic'?roBasicAttack(unit||{}):own(BONK_WEAPONS,key)?BONK_WEAPONS[key]:null,learned=!!weapon&&Number.isInteger(level)&&level>=1&&level<=8,elapsed=game?.bonk?.elapsed||0,cooldownRemaining=Math.max(0,(unit?.bonkWeaponAt?.[key]||0)-elapsed),manaCost=roSkillManaCost(weapon),cooldown=weapon?roSkillCooldown(weapon,Math.max(1,level),stats):0;
 let reasonCode='ready',readyReason='Pronta';
 if(!learned){reasonCode='unlearned';readyReason='Não aprendida';}
 else if(!unit?.alive){reasonCode='dead';readyReason='Herói derrotado';}
 else if(game?.options?.mode!=='bonk'||game?.bonk?.stage!=='playing'||game?.bonk?.offer||game?.paused){reasonCode='paused';readyReason=game?.bonk?.offer?'Escolha uma melhoria':game?.bonk?.stage==='preparation'?'Comece a partida':'Pausado';}
 else if(cooldownRemaining>0){reasonCode='cooldown';readyReason='Recarregando';}
 else if((unit.mana||0)<manaCost){reasonCode='mana';readyReason='SP insuficiente';}
 else{const range=weapon.range*(stats.area||1);if(!(game.units||[]).some(enemy=>enemy.bonkEnemy&&enemy.alive&&Math.hypot(enemy.x-unit.x,enemy.z-unit.z)<=range)){reasonCode='target';readyReason='Sem inimigo no alcance';}}
 return{learned,auto:roSkillAuto(unit,key),manaCost,cooldown,cooldownRemaining:Number(cooldownRemaining.toFixed(2)),ready:reasonCode==='ready',reasonCode,readyReason};
}

export function castRoSkill(game,unit,key,stats,attack){
 const status=roSkillStatus(game,unit,key,stats);if(!status.ready)return{ok:false,reason:status.readyReason,reasonCode:status.reasonCode};
 const weapon=key==='basic'?roBasicAttack(unit):BONK_WEAPONS[key],level=unit.bonkBuild.weapons[key];if(typeof attack!=='function'||!attack(weapon,level,stats))return{ok:false,reason:'Sem inimigo no alcance',reasonCode:'target'};
 (unit.bonkWeaponAt||={})[key]=game.bonk.elapsed+status.cooldown;return{ok:true,reason:'Habilidade usada',reasonCode:'cast'};
}

export function setRoSkillAuto(game,unit,key,enabled){
 if(game?.options?.mode!=='bonk'||!unit?.bonkHero||typeof enabled!=='boolean'||!own(unit.bonkBuild?.weapons,key)||key!=='basic'&&!own(BONK_WEAPONS,key))return false;
 (unit.bonkSkillAuto||={})[key]=enabled;return true;
}
