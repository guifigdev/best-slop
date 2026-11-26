import {roRollingCutterRadius} from './ro-rolling-cutter.js';
export const RO_TRAP_PLACEMENT_RANGE=4;
export const isRoTrapSkill=weapon=>weapon?.kind==='zone'&&typeof weapon.role==='string'&&weapon.role.startsWith('trap_');
// Placement reach and effect radius are separate. Area bonuses enlarge traps,
// but never turn a nearby placement into a long-distance projectile cast.
export function roSkillTargetRange(weapon,stats={},level=weapon?.level||1){
 if(weapon?.key==='axetornado')return (level<3?2:3)*(Number.isFinite(stats.area)&&stats.area>0?stats.area:1);
 if(weapon?.key==='gc_counterslash')return (level<=5?1:2)*(Number.isFinite(stats.area)&&stats.area>0?stats.area:1);
 if(weapon?.key==='rollingcutter')return roRollingCutterRadius(level)*(Number.isFinite(stats.area)&&stats.area>0?stats.area:1);
 const range=Number.isFinite(weapon?.range)?Math.max(0,weapon.range):0;
 if(isRoTrapSkill(weapon))return Math.min(RO_TRAP_PLACEMENT_RANGE,range||RO_TRAP_PLACEMENT_RANGE);
 return range*(Number.isFinite(stats?.area)&&stats.area>0?stats.area:1);
}
