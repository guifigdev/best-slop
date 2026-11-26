import {roActiveSkillKeys,roIsPassive} from './ro-skill-loadout.js';
import {roSkillAuto,roSkillStatus,castRoSkill} from './ro-skill-controls.js';

export const RO_AUTO_TIMING=Object.freeze({gap:.15,minGap:.05,maxGap:10,maxInterval:120});
const own=(o,k)=>o&&Object.hasOwn(o,k),seconds=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
export function validateRoAutoSkills(value,weapons){
 if(!value||typeof value!=='object'||Array.isArray(value)||!seconds(value.gap,RO_AUTO_TIMING.minGap,RO_AUTO_TIMING.maxGap)||!value.intervals||typeof value.intervals!=='object'||Array.isArray(value.intervals))return null;
 const entries=Object.entries(value.intervals);if(entries.length>128||entries.some(([k,v])=>!own(weapons,k)||roIsPassive(k)||!seconds(v,0,RO_AUTO_TIMING.maxInterval)))return null;
 return{gap:value.gap,intervals:Object.fromEntries(entries)};
}
export const roAutoSkillConfig=unit=>validateRoAutoSkills(unit?.roAutoSkills,unit?.bonkBuild?.weapons)||{gap:RO_AUTO_TIMING.gap,intervals:{}};
export function setRoAutoSkillTiming(unit,command){
 const config=roAutoSkillConfig(unit);if(command.key!==undefined){if(!own(unit?.bonkBuild?.weapons,command.key)||roIsPassive(command.key)||!seconds(command.interval,0,RO_AUTO_TIMING.maxInterval))return false;config.intervals[command.key]=Math.round(command.interval*100)/100;if(unit.roAutoQueue)delete unit.roAutoQueue.due[command.key];}
 else if(seconds(command.gap,RO_AUTO_TIMING.minGap,RO_AUTO_TIMING.maxGap))config.gap=Math.round(command.gap*100)/100;else return false;
 unit.roAutoSkills=config;return true;
}
export function noteRoAutoSkillCast(unit,key,elapsed){
 const config=roAutoSkillConfig(unit),queue=unit.roAutoQueue||={keys:[],due:{},readyAt:0,lastTime:elapsed};queue.keys=queue.keys.filter(k=>k!==key);queue.due[key]=elapsed+(config.intervals[key]||0);queue.readyAt=Math.max(queue.readyAt||0,(unit.roCasting?.finishAt??elapsed)+config.gap);
}
export function tickRoAutoSkillQueue(game,unit,stats,attack){
 const now=game.bonk.elapsed;if(!unit.alive||game.bonk.stage!=='playing')return false;const config=roAutoSkillConfig(unit);
 let queue=unit.roAutoQueue;if(!queue||now<queue.lastTime)queue=unit.roAutoQueue={keys:[],due:{},readyAt:0,lastTime:now};queue.lastTime=now;
 const keys=roActiveSkillKeys(unit).filter(k=>roSkillAuto(unit,k)),valid=new Set(keys);queue.keys=queue.keys.filter(k=>valid.has(k));for(const k of Object.keys(queue.due))if(!valid.has(k))delete queue.due[k];
 for(const key of keys)if(now>=(queue.due[key]||0)&&!queue.keys.includes(key))queue.keys.push(key);
 if(now<(queue.readyAt||0)||unit.roCasting)return false;
 // An unavailable head stays pending without starving a ready skill behind it.
 // At most one successful start per tick, including skills with zero recast.
 for(const key of queue.keys){if(!roSkillStatus(game,unit,key,stats,{manual:false}).ready)continue;const result=castRoSkill(game,unit,key,stats,attack,{manual:false});if(result.ok){noteRoAutoSkillCast(unit,key,now);return true;}}
 return false;
}
