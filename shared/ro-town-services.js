import {RO_STARTER_CHEST_WEAPONS,roBuildEquipmentUnlockLevel} from './ro-build-loot.js';
import {RO_BUILD_EQUIPMENT,RO_BUILD_EQUIPMENT_SOURCES} from './ro-build-equipment.js';
import {roTradeHub,RO_TRADE_HUBS} from './ro-region-services.js';
import {RO_EQUIPMENT,roEquipmentQuantity,roBagUsage,RO_BAG_CAPACITY,roReceiveEquipment,createRoEquipment} from './ragnarok-equipment.js';
import {canCarryConsumable,addConsumable} from './consumables.js';
import {roKafraTransfer} from './ro-kafra.js';
import {roRefineEquipment} from './ro-refinement.js';
export const RO_TOWN_SERVICE_TYPES=Object.freeze(['kafra','potionShop','equipmentShop','healer','blacksmith']);
export function roTownServices(map){
 if(!map||!roTradeHub(map))return[];
 const root=map.spawn||{x:0,z:23},anchor={x:Math.max(-80,Math.min(80,root.x-18)),z:Math.max(-80,Math.min(80,root.z-14))};
 map.town={...anchor,radius:18,name:roTradeHub(map).name};
 const retained=map.obstacles.filter(o=>Math.hypot(o.x-anchor.x,o.z-anchor.z)>20);map.obstacles.length=0;map.obstacles.push(...retained);map.decorations=(map.decorations||[]).filter(o=>Math.hypot(o.x-anchor.x,o.z-anchor.z)>20);for(const [i,[x,z,scale]]of [[-10,-8,.85],[10,-10,.85],[-12,9,.75]].entries())map.obstacles.push({id:'town-house:'+i,type:'town-building',x:anchor.x+x,z:anchor.z+z,w:7.4*scale,d:5.9*scale,h:6*scale,alive:true});map.obstacles.push({id:'town-fountain',type:'town-building',x:anchor.x,z:anchor.z,w:3.2,d:3.2,h:2,alive:true});map.revision=(map.revision||0)+1;
 const positions=[[-6,-2],[-8,6],[8,6],[0,-7],[8,-5]];
 return RO_TOWN_SERVICE_TYPES.map((type,i)=>{const [dx,dz]=positions[i];return{id:'town:'+map.seed+':'+type,type,x:anchor.x+dx,z:anchor.z+dz,townCenter:anchor,name:({kafra:'Kafra · armazém',potionShop:'Loja de poções',equipmentShop:'Loja de equipamentos',healer:'Curandeira',blacksmith:'Ferreiro'})[type],used:false};});
}
export function nearbyRoTownService(game,unit){return(game.bonk.objects||[]).filter(o=>RO_TOWN_SERVICE_TYPES.includes(o.type)&&Math.hypot(o.x-unit.x,o.z-unit.z)<=3.2).sort((a,b)=>Math.hypot(a.x-unit.x,a.z-unit.z)-Math.hypot(b.x-unit.x,b.z-unit.z))[0]||null;}
function safe(game,unit){return unit.alive&&game.bonk.stage==='playing'&&!unit.bonkOffer&&!game.bonk.offer&&!game.units.some(e=>e.bonkEnemy&&e.alive&&Math.hypot(e.x-unit.x,e.z-unit.z)<10);}
export function roTownStock(game,unit,service){
 if(service.type!=='equipmentShop')return[];const hub=roTradeHub(game.bonk.map)||RO_TRADE_HUBS.prontera,hash=s=>[...String(s)].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,17),sort=(a,b)=>hash(service.id+hub.name+a.key)-hash(service.id+hub.name+b.key),pool=Object.values(RO_BUILD_EQUIPMENT).filter(d=>d.grade<=hub.grade&&(unit.level||1)>=roBuildEquipmentUnlockLevel(d)&&hub.sources.some(source=>(d.nameSource||RO_BUILD_EQUIPMENT_SOURCES.database)===RO_BUILD_EQUIPMENT_SOURCES[source])).sort(sort),chosen=[],seen=new Set(),add=d=>{if(d&&!seen.has(d.key)){seen.add(d.key);chosen.push(d);}};
 for(const key of new Set(Object.values(RO_STARTER_CHEST_WEAPONS)))add(RO_EQUIPMENT[key]);const weapons=pool.filter(d=>d.slot==='weapon');for(const lineage of new Set(weapons.flatMap(d=>d.lineages)))add(weapons.find(d=>d.lineages.includes(lineage)&&!seen.has(d.key)));
 const other=pool.filter(d=>d.slot!=='weapon');for(const slot of new Set(other.map(d=>d.slot)))add(other.find(d=>d.slot===slot));for(const d of other.filter(d=>d.synergy).slice(0,6))add(d);
 return chosen.slice(0,28).map(d=>({key:d.key,name:d.name,price:Math.round((d.slot==='weapon'?190:125)*(d.grade===3?1.6:1))}));
}
export function roTownServiceSnapshot(game,unit){const object=game.bonk.objects.find(o=>o.id===unit.roTownService&&RO_TOWN_SERVICE_TYPES.includes(o.type));if(!object||!unit.alive||game.bonk.offer||unit.bonkOffer||game.bonk.stage!=='playing'||Math.hypot(object.x-unit.x,object.z-unit.z)>9)return null;return{...object,safe:safe(game,unit),stock:roTownStock(game,unit,object),tradeRegion:roTradeHub(game.bonk.map)?.name||null,warehouse:unit.roWarehouse||{version:1,revision:0,items:[]},healPrice:Math.round(20+(unit.level||1)*.6),potionPrices:{potion:20,manapot:30}};}
export function roTownServiceCommand(game,unit,c){if(c.type==='bkTownClose'){delete unit.roTownService;return true;}if(c.type==='bkTownOpen'){const object=game.bonk.objects.find(o=>o.id===c.object&&RO_TOWN_SERVICE_TYPES.includes(o.type));if(!object||Math.hypot(object.x-unit.x,object.z-unit.z)>8||!safe(game,unit))return false;unit.roTownService=object.id;return true;}const service=roTownServiceSnapshot(game,unit);if(!service?.safe)return false;
 if(c.type==='bkKafraTransfer'&&service.type==='kafra')return roKafraTransfer(unit,c.direction,c.item,{id:()=>game.worldSeed+':'+game.id()}).ok;
 if(c.type==='bkTownBuy'&&service.type==='potionShop'){const cost=service.potionPrices[c.key];if(!cost||unit.gold<cost||!canCarryConsumable(unit,c.key)||!addConsumable(unit,c.key))return false;unit.gold-=cost;return true;}
 if(c.type==='bkTownBuy'&&service.type==='equipmentShop'){const offer=service.stock.find(o=>o.key===c.key);if(!offer||unit.gold<offer.price||roBagUsage(unit)>=RO_BAG_CAPACITY)return false;const item=createRoEquipment(offer.key,'shop:'+game.worldSeed+':'+game.id());if(!item||!roReceiveEquipment(unit,item))return false;unit.gold-=offer.price;return true;}
 if(c.type==='bkTownHeal'&&service.type==='healer'){if(unit.gold<service.healPrice||unit.hp>=unit.maxHp&&unit.mana>=unit.maxMana)return false;unit.gold-=service.healPrice;unit.hp=unit.maxHp;unit.mana=unit.maxMana;game.fx('heal',unit.x,unit.z,{source:unit.id,duration:.8});return true;}
 if(c.type==='bkTownRefine'&&service.type==='blacksmith')return roRefineEquipment(game,unit,c.item,{protect:c.protect===true});
 return false;
}
