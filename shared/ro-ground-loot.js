import {RO_EQUIPMENT,RO_BAG_CAPACITY,roEquipmentQuantity,roBagUsage,roReceiveEquipment,roEquip,roItemFitsSlot} from './ragnarok-equipment.js';

// Work on a copy: picking up and replacing gear is one authoritative action.
// A full backpack puts the displaced pieces on the ground, never in a queue.
export function roEquipGroundItem(hero,item,slot,newId){
 if(!item||!roItemFitsSlot(hero,item,slot)||typeof newId!=='function'||hero.roInventory.some(i=>i.id===item.id))return null;
 const trial={...hero,roInventory:structuredClone(hero.roInventory),roEquipment:{...hero.roEquipment}},incoming={...item,quantity:1,cards:structuredClone(item.cards||[]),...(item.enchants?{enchants:structuredClone(item.enchants)}:{})},dropped=[];
 trial.roInventory.push(incoming);
 if(!roEquip(trial,item.id,slot)){
  const positions=[slot,...(slot==='weapon'&&RO_EQUIPMENT[item.key].hands===2?['offhand']:[])];
  for(const position of positions){const id=trial.roEquipment[position],old=trial.roInventory.find(i=>i.id===id);if(!old)continue;trial.roEquipment[position]=null;
   if(roEquipmentQuantity(old)>1){old.quantity--;dropped.push({...old,id:newId(),quantity:1,cards:structuredClone(old.cards||[]),...(old.enchants?{enchants:structuredClone(old.enchants)}:{})});}else{trial.roInventory=trial.roInventory.filter(i=>i!==old);dropped.push(old);}
  }
  if(!roEquip(trial,item.id,slot))return null;
 }
 if(roBagUsage(trial)>RO_BAG_CAPACITY)return null;
 hero.roInventory=trial.roInventory;hero.roEquipment=trial.roEquipment;return {item:incoming,dropped};
}

export function roClaimLegacyItem(hero,itemId,newId){
 const index=(hero.roUnclaimed||[]).findIndex(i=>i.id===itemId);if(index<0)return false;
 const old=hero.roUnclaimed[index],many=roEquipmentQuantity(old)>1,item={...old,id:many?newId():old.id,quantity:1,cards:structuredClone(old.cards||[]),...(old.enchants?{enchants:structuredClone(old.enchants)}:{})};
 if(!roReceiveEquipment(hero,item))return false;if(many)old.quantity--;else hero.roUnclaimed.splice(index,1);return true;
}

export function roDropOne(hero,itemId,newId){
 const item=hero.roInventory?.find(i=>i.id===itemId);if(!item)return null;
 const quantity=roEquipmentQuantity(item),worn=Object.entries(hero.roEquipment||{}).filter(([,id])=>id===itemId);
 if(quantity>1){item.quantity--;return {...item,id:newId(),quantity:1,cards:structuredClone(item.cards||[]),...(item.enchants?{enchants:structuredClone(item.enchants)}:{})};}
 for(const [slot] of worn)hero.roEquipment[slot]=null;hero.roInventory=hero.roInventory.filter(i=>i!==item);return item;
}
