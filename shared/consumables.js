export const CONSUMABLE_SLOTS=2,CONSUMABLE_STACK=3;
export const CONSUMABLES=Object.freeze({potion:Object.freeze({name:'Poção de vida',color:'#ee806f',heal:300,hpRatio:.30}),manapot:Object.freeze({name:'Poção de mana',color:'#82c7f2',mana:200,spRatio:.35})});
export function validateConsumables(value){if(!Array.isArray(value)||value.length!==2)return null;const result=[];for(const slot of value){if(slot===null){result.push(null);continue;}if(!slot||!Object.hasOwn(CONSUMABLES,slot.key)||!Number.isInteger(slot.charges)||slot.charges<1||slot.charges>CONSUMABLE_STACK)return null;result.push({key:slot.key,charges:slot.charges});}return result;}
export function canCarryConsumable(unit,key){return Object.hasOwn(CONSUMABLES,key)&&(!unit.consumables||(unit.consumables.some(s=>!s||s.key===key&&s.charges<CONSUMABLE_STACK)));}
export function addConsumable(unit,key){if(!canCarryConsumable(unit,key))return false;unit.consumables??=[null,null];let slot=unit.consumables.find(s=>s?.key===key&&s.charges<CONSUMABLE_STACK);if(slot)slot.charges++;else unit.consumables[unit.consumables.findIndex(s=>!s)]={key,charges:1};return true;}
export function consumePouch(unit,index,time,{survivor=false}={}){
 if(!unit?.alive||!Number.isInteger(index)||index<0||index>=2||!Number.isFinite(time)||(unit.potionUntil||0)>time)return null;
 const slot=unit.consumables?.[index],item=CONSUMABLES[slot?.key];if(!item||slot.charges<1||item.heal&&unit.hp>=unit.maxHp||item.mana&&unit.mana>=unit.maxMana)return null;
 const hp=Math.min(Math.max(0,unit.maxHp-unit.hp),item.heal?(survivor?unit.maxHp*item.hpRatio:item.heal):0),mana=Math.min(Math.max(0,unit.maxMana-unit.mana),item.mana?(survivor?unit.maxMana*item.spRatio:item.mana):0);
 unit.hp+=hp;unit.mana+=mana;if(--slot.charges<=0)unit.consumables[index]=null;unit.potionUntil=time+10;return{key:slot.key,hp,mana};
}
