// Tower rooms are finite, dense rosters, unlike the adventure's continual horde.
// Keep character level/job/skills shared; change only newly earned tower XP.
export const RO_TOWER_PROGRESSION_RULES=Object.freeze({floorsPerBand:25,maxBand:4,normal:1,elite:4,guardian:8,boss:18});
export function roTowerXpReward(enemy={},floor=1){
 const n=Number.isFinite(floor)?Math.max(1,Math.min(101,Math.floor(floor))):1,band=Math.min(RO_TOWER_PROGRESSION_RULES.maxBand,1+Math.floor((n-1)/RO_TOWER_PROGRESSION_RULES.floorsPerBand));
 const category=enemy.bonkBoss?'boss':enemy.bonkGuardian!==undefined?'guardian':enemy.bonkElite?'elite':'normal';
 return band*RO_TOWER_PROGRESSION_RULES[category];
}
