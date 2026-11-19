import {HEROES} from './catalog.js';
import {isLootSkill} from './loot-skills.js';
export const SHARED_STARTERS=Object.freeze([...new Set(Object.values(HEROES).map(hero=>hero.skill))]);
const sharedStarters=new Set(SHARED_STARTERS);
export const isSharedStarter=key=>sharedStarters.has(key);
export const isSharedSkill=key=>isSharedStarter(key)||isLootSkill(key);
export function skillOwner(game,key,except=null){return isSharedSkill(key)?null:game.heroes().find(h=>h.owner!==except&&h.skills.includes(key))||null;}
export const ownershipMethods={
 skillOwner(key,except=null){return skillOwner(this,key,except);},
 skillAvailable(u,key){return !this.skillOwner(key,u?.owner);},
 skillOwnership(){return Object.fromEntries(this.heroes().flatMap(h=>h.skills.filter(key=>!isSharedSkill(key)).map(key=>[key,{owner:h.owner,name:h.name}])));}
};
