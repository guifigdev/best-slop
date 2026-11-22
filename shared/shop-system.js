import {merchantPosition} from './instances.js';
import {SHOPS,shopForItem} from './shops.js';
import {ITEMS,itemUpgradePrice,ITEM_MAX_LEVEL} from './catalog.js';
import {isWeapon,enchantPrice} from './enchantments.js';
import {shopPurchasePlan} from './shop-purchase.js';
import {addConsumable} from './consumables.js';
const trading=game=>game.phase==='preparation'||game.options.mode==='linewars'&&game.phase==='wave';
const eligibleShop=(game,key)=>Object.hasOwn(SHOPS,key)&&(!SHOPS[key].lineWarsOnly||game.options.mode==='linewars');
const distance=(a,b)=>{const p=merchantPosition(a,b);return Math.hypot(a.x-p.x,a.z-p.z);};

export const shopMethods={
 buyShopItem(u,key){
  const item=Object.hasOwn(ITEMS,key)?ITEMS[key]:null,stock=this.stockFor(u);
  if(!item||!this.atShop(u,shopForItem(key))||u.gold<item.cost||!(stock[key]>0))return false;
  const plan=shopPurchasePlan(u,key,this.time);if(!plan.ok){this.commandFailureReason=plan.reason;return false;}
  if(plan.destination==='pouch'&&!addConsumable(u,key))return false;
  u.gold-=item.cost;stock[key]--;
  if(plan.destination==='stack')u.inventory[plan.index].charges++;
  else if(plan.destination==='inventory')u.inventory[plan.index]={key,charges:1,...(!item.consumable?{level:1,invested:item.cost}:{})};
  else if(plan.destination==='consume'){
   if(item.attributeTome){const tome=item.attributeTome;u.tomeAttributes||={};u.tomeAttributes[tome.attribute]=(u.tomeAttributes[tome.attribute]||0)+tome.amount;this.refresh(u);this.fx('tomeRead',u.x,u.z,{source:u.id,item:key,attribute:tome.attribute,amount:tome.amount});}
   else if(item.xp){this.gainXp(u,item.xp);this.fx('bookRead',u.x,u.z,{source:u.id,item:key,amount:item.xp});}
   else{if(item.heal)this.heal(u,item.heal);if(item.mana){const restored=Math.min(item.mana,Math.max(0,u.maxMana-u.mana));u.mana+=restored;this.fx('mana',u.x,u.z,{source:u.id,amount:restored});}u.potionUntil=this.time+10;}
  }
  this.refresh(u);return true;
 },
 atShop(u,id=null){const key=u?.shopInteraction,npc=eligibleShop(this,key)?SHOPS[key]:null;return !!(u?.alive&&trading(this)&&npc&&(!id||key===id||npc.universal&&Object.hasOwn(SHOPS,id))&&distance(u,npc)<=npc.range+.35);},
 closeShop(u,stop=false){const wasOpen=u.shopInteraction;u.shopInteraction=null;u.pendingShop=null;u.pendingPurchase=null;if(stop){u.destination=null;u.target=null;u.order='stop';u.vx=u.vz=0;}if(wasOpen)this.fx('shopClose',u.x,u.z,{source:u.id,npc:wasOpen});},
 openShopInteraction(u,key){const npc=SHOPS[key];if(!eligibleShop(this,key)||!npc||!u.alive||!trading(this)||distance(u,npc)>npc.range+.001)return false;const alreadyOpen=u.shopInteraction===key;u.pendingShop=null;u.shopInteraction=key;if(!alreadyOpen)u.shopSessionId=this.id();u.destination=null;u.target=null;u.order='stop';u.vx=u.vz=0;if(!alreadyOpen)this.fx('shopOpen',u.x,u.z,{source:u.id,npc:key});return true;},
 interactShop(u,key){if(!u.alive||!trading(this)||typeof key!=='string'||!eligibleShop(this,key))return false;const npc=SHOPS[key];this.cancelChannel(u);u.shopInteraction=null;u.pendingShop=key;u.target=null;if(distance(u,npc)<=npc.range+.001)return this.openShopInteraction(u,key);u.order='move';u.destination={...merchantPosition(u,npc),z:merchantPosition(u,npc).z+1.5};return true;},
 tickNPC(u){if(!u.hero||u.summon)return;if(!u.alive||!trading(this)){if(u.pendingShop||u.shopInteraction||u.pendingPurchase)this.closeShop(u,!!u.pendingShop);return;}const current=eligibleShop(this,u.shopInteraction)?SHOPS[u.shopInteraction]:null;if(u.shopInteraction&&(!current||distance(u,current)>current.range+.35))this.closeShop(u);if(u.pendingShop&&eligibleShop(this,u.pendingShop)){const npc=SHOPS[u.pendingShop];if(distance(u,npc)<=npc.range+.001)this.openShopInteraction(u,u.pendingShop);}},

 botShopThink(u){
  if(!trading(this)||!u.alive)return;
  if(u.pendingPurchase){const plan=u.pendingPurchase;if(this.atShop(u,plan.npc)){this.command(u.owner,plan.command);u.pendingPurchase=null;u.botBuyAt=this.time+1.2;}else if(u.pendingShop!==plan.npc)this.interactShop(u,plan.npc);return;}
  if(this.time<(u.botBuyAt||0))return;u.botBuyAt=this.time+2;this.allocateBot(u);this.learnBotSkills(u);
  const count=u.inventory.filter(Boolean).length,weapon=u.inventory.findIndex(s=>s&&isWeapon(s.key)&&!s.enchantment),enchantment=['fire','frost','poison'][u.seat%3];let command=null,npc=null;
  if(count>=3&&weapon>=0&&u.gold>=enchantPrice(enchantment,u.inventory[weapon].level||1)){command={type:'enchantItem',slot:weapon,enchantment};npc='enchanter';}
  else{const item=count<6&&Object.keys(ITEMS).find(k=>!ITEMS[k].consumable&&this.stockFor(u)[k]>0&&u.gold>=ITEMS[k].cost&&!u.inventory.some(i=>i?.key===k));if(item){command={type:'item',item};npc=shopForItem(item);}else{const slot=u.inventory.findIndex(s=>s&&!ITEMS[s.key].consumable&&(s.level||1)<ITEM_MAX_LEVEL&&u.gold>=itemUpgradePrice(s.key,s.level||1));if(slot>=0){command={type:'upgradeItem',slot};npc='smith';}}}
  if(command){u.pendingPurchase={npc,command};this.interactShop(u,npc);}
 }
};
