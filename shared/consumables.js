export const CONSUMABLE_SLOTS=2,CONSUMABLE_STACK=3;
export const RO_CONSUMABLE_SLOTS=6,RO_CONSUMABLE_STACK=10;
export const RO_CONSUMABLE_KEYS=Object.freeze(['Z','X','C','V','B','N']);
export const CONSUMABLES=Object.freeze({potion:Object.freeze({name:'Poção de vida',color:'#ee806f',heal:300,hpRatio:.30}),manapot:Object.freeze({name:'Poção de mana',color:'#82c7f2',mana:200,spRatio:.35}),yggberry:Object.freeze({name:'Fruto de Yggdrasil',color:'#f4ce63',heal:1,mana:1,hpRatio:1,spRatio:1,fullRestore:true})});
const slotsFor=unit=>unit?.bonkHero?RO_CONSUMABLE_SLOTS:CONSUMABLE_SLOTS,stackFor=unit=>unit?.bonkHero?RO_CONSUMABLE_STACK:CONSUMABLE_STACK;
export function validateConsumables(value,{survivor=false}={}){
 const capacity=survivor?RO_CONSUMABLE_SLOTS:CONSUMABLE_SLOTS,stack=survivor?RO_CONSUMABLE_STACK:CONSUMABLE_STACK;
 if(!Array.isArray(value)||!(value.length===capacity||survivor&&value.length===CONSUMABLE_SLOTS))return null;
 const result=[];for(const slot of value){if(slot===null){result.push(null);continue;}if(!slot||!Object.hasOwn(CONSUMABLES,slot.key)||!Number.isInteger(slot.charges)||slot.charges<1||slot.charges>stack)return null;result.push({key:slot.key,charges:slot.charges});}
 while(result.length<capacity)result.push(null);return result;
}
export function canCarryConsumable(unit,key){const slots=slotsFor(unit);return Object.hasOwn(CONSUMABLES,key)&&(!unit.consumables||unit.consumables.length<slots||unit.consumables.slice(0,slots).some(s=>!s||s.key===key&&s.charges<stackFor(unit)));}
export function addConsumable(unit,key){if(!canCarryConsumable(unit,key))return false;unit.consumables??=[];while(unit.consumables.length<slotsFor(unit))unit.consumables.push(null);const slot=unit.consumables.find(s=>s?.key===key&&s.charges<stackFor(unit));if(slot)slot.charges++;else unit.consumables[unit.consumables.findIndex(s=>!s)]={key,charges:1};return true;}
export function consumePouch(unit,index,time,{survivor=false}={}){
 if(!unit?.alive||!Number.isInteger(index)||index<0||index>=slotsFor(unit)||!Number.isFinite(time)||(unit.potionUntil||0)>time)return null;
 const slot=unit.consumables?.[index],item=CONSUMABLES[slot?.key];if(!item||slot.charges<1||!((item.heal&&unit.hp<unit.maxHp)||(item.mana&&unit.mana<unit.maxMana)))return null;
 const hp=Math.min(Math.max(0,unit.maxHp-unit.hp),item.heal?(item.fullRestore?unit.maxHp:survivor?unit.maxHp*item.hpRatio:item.heal):0),mana=Math.min(Math.max(0,unit.maxMana-unit.mana),item.mana?(item.fullRestore?unit.maxMana:survivor?unit.maxMana*item.spRatio:item.mana):0);
 unit.hp+=hp;unit.mana+=mana;if(--slot.charges<=0)unit.consumables[index]=null;unit.potionUntil=time+10;return{key:slot.key,hp,mana};
}
