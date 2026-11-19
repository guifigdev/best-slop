import {SKILLS} from './catalog.js';

// Single source for monster loadouts. Only an actual fragment acquisition bypasses catalog exclusivity.
// All current techniques may be carried by a beast and consequently dropped.
export const LOOT_SKILLS=Object.freeze(Object.keys(SKILLS));
const lootSkills=new Set(LOOT_SKILLS);
export const isLootSkill=key=>lootSkills.has(key);
