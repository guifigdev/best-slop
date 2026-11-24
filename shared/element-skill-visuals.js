import {RO_SKILLS} from './ragnarok-jobs.js';
// Water remains the server's adapted ice element where appropriate. Only the
// appearance distinguishes liquid water from cold bolts and frozen crystals.
export const isLiquidWaterSkill=key=>/waterball|deluge|(?:^|_)water(?:_|$)|aqua|diluvio/i.test(String(key||''));
export function skillVisualElement(event={}){const key=event.skillKey||event.skill||event.key;return isLiquidWaterSkill(key)?'water':event.element||event.weapon?.element||RO_SKILLS[key]?.element;}
const impacts=new Set(['roSkillImpact','roNativeHit','abilityPulse','fireball','frostnova','waterball','splash','watersurge','earthspike','rockfall','earthquake']);
export function elementImpactRequest(event,state,time=state?.time||0){
 if(!event||event.basicAttack||['bossDanger','bossImpact','monsterWarning','damage','miss','cast'].includes(event.type)||event.skillKey==='lg_earthdrive')return null;
 const element=skillVisualElement(event);if(!['water','earth'].includes(element))return null;
 const skill=RO_SKILLS[event.skillKey],kind=event.attackKind||skill?.kind;
 if(event.type==='roAttack'&&['projectile','zone','summon','buff','heal'].includes(kind))return null;
 if(!impacts.has(event.type)&&event.type!=='roAttack')return null;
 if(![event.x,event.z,event.time].every(Number.isFinite)||time<event.time||time-event.time>1.2)return null;
 const atTarget=event.type==='roAttack'&&['slash','dash','chain'].includes(kind),x=atTarget&&Number.isFinite(event.tx)?event.tx:event.x,z=atTarget&&Number.isFinite(event.tz)?event.tz:event.z;
 return{key:'event:'+String(event.id??[event.type,event.source,event.skillKey,x,z].join(':'))+':'+event.time,element,x,z,time:event.time,age:time-event.time,radius:Math.max(.6,Math.min(7,event.radius||1.8)),source:event.source,skillKey:event.skillKey,duration:element==='water'?1.2:.95,event};
}
