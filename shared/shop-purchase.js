import {ITEMS} from './catalog.js';
import {CONSUMABLES,canCarryConsumable} from './consumables.js';

// A capacity plan, not permission to trade: phase, physical NPC access, stock
// and gold are still checked by buyShopItem before applying any effect.
export function shopPurchasePlan(unit,key,time=0){
 const item=Object.hasOwn(ITEMS,key)?ITEMS[key]:null;if(!item)return {ok:false,reason:'Item inválido.'};
 if(Object.hasOwn(CONSUMABLES,key)){
  if(canCarryConsumable(unit,key))return {ok:true,destination:'pouch'};
  if(item.heal&&unit.hp>=unit.maxHp)return {ok:false,reason:'Vida cheia e bolsas de poções cheias.'};
  if(item.mana&&unit.mana>=unit.maxMana)return {ok:false,reason:'SP cheio e bolsas de poções cheias.'};
  if((unit.potionUntil||0)>time)return {ok:false,reason:'Poções em recarga e bolsas cheias.'};
  return {ok:true,destination:'consume',immediate:true};
 }
 const inventory=unit.inventory||[],stackIndex=item.consumable?inventory.findIndex(slot=>slot?.key===key&&!slot.xpValue&&slot.charges<3):-1,emptyIndex=inventory.findIndex(slot=>!slot);
 if(stackIndex>=0)return {ok:true,destination:'stack',index:stackIndex};
 if(emptyIndex>=0||inventory.length<6)return {ok:true,destination:'inventory',index:emptyIndex>=0?emptyIndex:inventory.length};
 if(item.consumable&&(item.xp||item.attributeTome))return {ok:true,destination:'consume',immediate:true};
 return {ok:false,reason:'Mochila cheia.'};
}
