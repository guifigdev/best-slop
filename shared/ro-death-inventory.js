import {RO_EQUIPMENT_SLOTS,roItemFitsSlot,RO_EQUIPMENT,roEquipmentQuantity} from './ragnarok-equipment.js';

export function roLoseBagOnDeath(unit){
 const equipment=unit.roEquipment||{},inventory=unit.roInventory||[],kept=[],seen=new Set(),main=inventory.find(i=>i.id===equipment.weapon),twoHanded=RO_EQUIPMENT[main?.key]?.hands===2;
 for(const slot of RO_EQUIPMENT_SLOTS){const item=inventory.find(i=>i.id===equipment[slot]);if(!item||seen.has(item.id)||!roItemFitsSlot(unit,item,slot)||slot==='offhand'&&twoHanded){equipment[slot]=null;continue;}seen.add(item.id);const copy={...item};delete copy.quantity;kept.push(copy);}
 const lost=inventory.reduce((sum,item)=>sum+roEquipmentQuantity(item),0)-kept.length+(unit.roUnclaimed||[]).reduce((sum,item)=>sum+roEquipmentQuantity(item),0);
 unit.roBlacksmithBlessings=0;unit.roInventory=kept;unit.roUnclaimed=[];unit.roCards=[];unit.roLegacyEnchants={};unit.consumables=[null,null];unit.roDeathCount=(unit.roDeathCount||0)+1;unit.roDeathLostItems=lost;
 return lost;
}
