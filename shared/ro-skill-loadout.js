import {BONK_WEAPONS} from './bonk-catalog.js';

// Index zero is the native attack, kept separate from the twelve skill slots.
export const RO_LEARNED_SKILL_LIMIT=128,RO_EQUIPPED_SKILL_COUNT=12,RO_ACTIVE_SLOT_COUNT=1+RO_EQUIPPED_SKILL_COUNT;
export const roIsPassive=key=>BONK_WEAPONS[key]?.kind==='passive';
export function roSkillSlots(unit){
 const learned=unit?.bonkBuild?.weapons||{},valid=key=>typeof key==='string'&&Object.hasOwn(learned,key)&&!roIsPassive(key);
 if(Array.isArray(unit?.bonkSkillSlots)){
  const seen=new Set(),slots=Array.from({length:RO_ACTIVE_SLOT_COUNT},(_,i)=>{const key=unit.bonkSkillSlots[i];if(!valid(key)||seen.has(key))return null;seen.add(key);return key;});
  if(valid('basic')){const i=slots.indexOf('basic');if(i>0)slots[i]=null;slots[0]='basic';}
  return slots;
 }
 const keys=Object.keys(learned).filter(valid),ordered=keys.includes('basic')?['basic',...keys.filter(key=>key!=='basic')]:keys;
 return Array.from({length:RO_ACTIVE_SLOT_COUNT},(_,i)=>ordered[i]||null);
}
export const roActiveSkillKeys=unit=>roSkillSlots(unit).filter(Boolean);
export function roEquipSkill(unit,key,slot){
 if(!Number.isInteger(slot)||slot<1||slot>=RO_ACTIVE_SLOT_COUNT||key==='basic'||!Object.hasOwn(unit?.bonkBuild?.weapons||{},key)||!Object.hasOwn(BONK_WEAPONS,key)||roIsPassive(key))return false;
 const slots=roSkillSlots(unit),previous=slots.indexOf(key),replaced=slots[slot];
 if(previous===slot)return true;
 slots[slot]=key;if(previous>=0)slots[previous]=replaced;unit.bonkSkillSlots=slots;return true;
}
export function roAutoEquipLearned(unit,key){
 if(roIsPassive(key))return;
 const slots=roSkillSlots(unit);if(slots.includes(key))return;
 const empty=slots.findIndex((value,i)=>i>0&&!value);if(empty>=0){slots[empty]=key;unit.bonkSkillSlots=slots;}
}
