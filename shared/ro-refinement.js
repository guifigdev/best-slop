import {RO_EQUIPMENT,roEquipmentQuantity,roDrop} from './ragnarok-equipment.js';
import {RO_REFINEMENT_FACTS} from './ro-refinement-facts.js';
// Normal ore rates, no temporary refine event or Enriched/HD ore bonus.
export const RO_REFINEMENT_SOURCE='https://irowiki.org/wiki/Refinement_System#Success_Chances';
const rates={1:[1,1,1,1,1,1,1,.6,.4,.19],2:[1,1,1,1,1,1,.6,.4,.2,.19],3:[1,1,1,1,1,.6,.5,.2,.2,.19],4:[1,1,1,1,.6,.4,.4,.2,.2,.09],5:[1,1,1,.6,.6,.4,.4,.2,.2,.09]};
export const roBlessingCost=rank=>rank===7?1:rank===8?2:rank===9?4:0;
export function roRefinePlan(item){
 const d=RO_EQUIPMENT[item?.key],facts=RO_REFINEMENT_FACTS[d?.sourceId],rank=item?.refine||0;if(!d||!facts?.refineable||!Number.isInteger(rank)||rank<0||rank>=10)return null;
 const level=d.slot==='weapon'?facts.weaponLevel||1:facts.armorLevel===2?5:4,chance=rates[level]?.[rank];if(chance===undefined)return null;
 return {rank,next:rank+1,level,weapon:d.slot==='weapon',chance,price:60*(rank+1),blessings:chance<1?roBlessingCost(rank):0,failure:level===5?'downgrade':'break',safe:chance===1};
}
export function roRefineEquipment(game,unit,itemId,{protect=false}={}){
 const item=unit.roInventory?.find(i=>i.id===itemId),plan=roRefinePlan(item);if(!plan||unit.gold<plan.price||protect&&(!plan.blessings||(unit.roBlacksmithBlessings||0)<plan.blessings))return false;
 // Split only one physical copy. Breaking it cannot destroy the rest of a stack.
 if(roEquipmentQuantity(item)>1){unit.roInventory.push({...structuredClone(item),id:'refine-stack:'+game.worldSeed+':'+game.id(),quantity:roEquipmentQuantity(item)-1});delete item.quantity;}
 unit.gold-=plan.price;if(protect)unit.roBlacksmithBlessings-=plan.blessings;
 const success=plan.safe||game.random()<plan.chance;let outcome='success';if(success)item.refine=plan.next;else if(protect)outcome='protected';else if(plan.failure==='downgrade'){outcome='downgrade';item.refine=Math.max(0,plan.rank-3);}else{outcome='broken';roDrop(unit,item.id);}
 unit.roRefineResult={id:game.id(),key:item.key,name:RO_EQUIPMENT[item.key].name,from:plan.rank,to:item.refine||0,outcome,spent:plan.price,blessings:protect?plan.blessings:0};
 return true;
}
