import {SKILLS,levelOf} from './catalog.js';

export const TECHNIQUE_ROLL_COST=3;
export const TECHNIQUE_OFFER_COUNT=3;
export const canDistillSkillPoints=u=>!!(u?.skillPoints>=1&&u.skills?.length===7&&new Set(u.skills).size===7&&u.skills.every(key=>Object.hasOwn(SKILLS,key)&&levelOf(u,key)===5));
const available=(game,u)=>!!(u?.hero&&u.alive&&!u.summon&&!['victory','defeat'].includes(game.phase));

export const techniqueMethods={
 recycleLoot(u,c){
  if(!available(this,u))return false;const drop=(this.drops||[]).find(d=>d.id===c.dropId&&d.owner===u.owner&&d.expires>this.time);if(!drop)return false;
  this.drops=this.drops.filter(d=>d.id!==drop.id);u.essence=(u.essence||0)+(drop.essence||1);this.fx('essence',u.x,u.z,{source:u.id,amount:drop.essence||1,reason:'loot',skill:drop.skill});return true;
 },

 distillSkillPoint(u){
  if(!available(this,u)||!canDistillSkillPoints(u))return false;u.skillPoints--;u.essence=(u.essence||0)+1;this.fx('essence',u.x,u.z,{source:u.id,amount:1,reason:'skillPoint'});return true;
 },

 rollTechniques(u){
  if(!available(this,u)||(u.essence||0)<TECHNIQUE_ROLL_COST)return false;
  const pool=Object.keys(SKILLS).filter(key=>!u.skills.includes(key)&&this.skillAvailable(u,key));if(pool.length<TECHNIQUE_OFFER_COUNT)return false;
  for(let i=0;i<TECHNIQUE_OFFER_COUNT;i++){const j=i+Math.min(pool.length-i-1,Math.floor(this.random()*(pool.length-i)));[pool[i],pool[j]]=[pool[j],pool[i]];}
  u.essence-=TECHNIQUE_ROLL_COST;u.techniqueOffers=pool.slice(0,TECHNIQUE_OFFER_COUNT);this.fx('techniqueRoll',u.x,u.z,{source:u.id,cost:TECHNIQUE_ROLL_COST,offers:[...u.techniqueOffers]});return true;
 },

 // Both direct loot and essence choices use the same replacement rules. Keep
 // cooldown history by key and carry the replaced slot's remaining cooldown.
 swapTechniqueSlot(u,key,slot,rank){
  const replaced=u.skills[slot]||null;u.cooldowns||={};const oldCooldown=replaced?u.cooldowns[replaced]||0:0;
  if(replaced){if(u.skillRarities)delete u.skillRarities[replaced];delete u.skillLevels[replaced];u.skills[slot]=key;
   if(replaced==='avatar'){u.avatar=0;u.avatarData=null;}
   if(replaced==='shield'){u.shield=0;u.shieldUntil=0;}
   if(['rage','battlecry'].includes(replaced)&&(!u.rageSkill||u.rageSkill===replaced)){u.rageUntil=0;u.rageData=null;u.rageSkill=null;}
  }else u.skills.push(key);
  u.skillLevels[key]=rank;u.cooldowns[key]=Math.max(u.cooldowns[key]||0,oldCooldown);return replaced;
 },

 chooseTechnique(u,c){
  if(!available(this,u)||typeof c.skill!=='string'||!Object.hasOwn(SKILLS,c.skill)||!u.techniqueOffers?.includes(c.skill)||u.skills.includes(c.skill)||!this.skillAvailable(u,c.skill))return false;
  let slot=c.slot;if(slot===undefined&&u.skills.length<7)slot=u.skills.length;
  if(!Number.isInteger(slot)||slot<0||slot>=7||slot>u.skills.length)return false;
  const inherited=u.skills[slot]?Math.max(1,Math.min(5,levelOf(u,u.skills[slot]))):1,replaced=this.swapTechniqueSlot(u,c.skill,slot,inherited);
  u.techniqueOffers=[];this.cancelChannel(u);this.refresh(u);this.fx('techniqueClaim',u.x,u.z,{source:u.id,skill:c.skill,level:inherited,replaced,slot});return true;
 }
};
