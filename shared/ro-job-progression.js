import {roJob,advanceRoJob} from './ragnarok-jobs.js';
export const RO_JOB_LEVEL_CAPS=Object.freeze([50,70,70,50]);
export const roJobLevelCap=tier=>RO_JOB_LEVEL_CAPS[Math.max(0,Math.min(3,tier||0))];
export const roJobXpNeeded=(level,tier=0)=>Math.floor(12+Math.max(1,level)*1.5+Math.max(0,tier)*8);
export function normalizeRoJobProgress(u){
 const cap=roJobLevelCap(u.roTier);u.roJobLevel=Number.isInteger(u.roJobLevel)?Math.max(1,Math.min(cap,u.roJobLevel)):Math.min(cap,1+Math.floor(Math.max(0,(u.level||1)-1)*1.5));
 u.roJobXp=Number.isFinite(u.roJobXp)?Math.max(0,Math.min(20000,u.roJobXp)):0;if(u.roJobLevel>=cap)u.roJobXp=0;return u;
}
export function roJobProgress(u){
 const cap=roJobLevelCap(u.roTier),level=Math.max(1,Math.min(cap,u.roJobLevel||1)),next=(u.roTier||0)<3?roJob(u.roLineage,(u.roTier||0)+1):null;
 return{level,cap,xp:u.roJobXp||0,xpNeeded:roJobXpNeeded(level,u.roTier),ready:level>=cap&&!!next,next};
}
export function gainRoJobXp(u,amount){
 normalizeRoJobProgress(u);if(!Number.isFinite(amount)||amount<=0)return 0;const cap=roJobLevelCap(u.roTier);if(u.roJobLevel>=cap)return 0;u.roJobXp+=amount;let levels=0;
 while(u.roJobLevel<cap&&u.roJobXp>=roJobXpNeeded(u.roJobLevel,u.roTier)){u.roJobXp-=roJobXpNeeded(u.roJobLevel,u.roTier);u.roJobLevel++;levels++;}if(u.roJobLevel>=cap)u.roJobXp=0;return levels;
}
export function evolveRoJob(u){const progress=roJobProgress(u);if(!progress.ready)return null;return advanceRoJob(u,(u.roTier||0)+1);}
