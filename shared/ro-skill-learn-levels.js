// Base-level pacing for this game's 150-level expedition. The fourth-job
// preview is adapted to that cap; it is not RO's level-200 job change.
export const RO_SKILL_TIER_BASE_LEVELS=Object.freeze([1,40,99,130]);
export function roSkillLearnLevels(unit,skill,rank=1,tier=skill?.tier||0){
 const requiredBaseLevel=RO_SKILL_TIER_BASE_LEVELS[Math.max(0,Math.min(3,tier))],requiredJobLevel=Math.max(1,rank);
 return{requiredBaseLevel,requiredJobLevel,allowed:(!Number.isFinite(unit?.level)||unit.level>=requiredBaseLevel)&&((unit?.roTier||0)>tier||!Number.isFinite(unit?.roJobLevel)||unit.roJobLevel>=requiredJobLevel)};
}
