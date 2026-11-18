import {SKILLS} from './catalog.js';

// A requirement is about acquisition/upgrading, not whether a monster can cast
// its natural loadout. Invalid keys/ranks are never eligible.
export function skillRequirement(key,rank=1){
 const skill=Object.hasOwn(SKILLS,key)?SKILLS[key]:null;
 if(!skill||!Number.isInteger(rank)||rank<1||rank>5)return Infinity;
 return skill.rankHeroLevels?.[rank-1]??skill.minHeroLevel??1;
}
export function canLearnSkill(u,key,rank=1){return Number.isFinite(u?.level)&&u.level>=skillRequirement(key,rank);}
