import {RO_EQUIPMENT,RO_BAG_CAPACITY,roBagUsage,createRoEquipment,roReceiveEquipment} from './ragnarok-equipment.js';
import {RO_BUILD_EQUIPMENT} from './ro-build-equipment.js';
import {roBuildEquipmentPool} from './ro-build-loot.js';

// Normal equipment identities already sourced by the RO equipment catalog.
// MVP-exclusive database drops remain on their respective boss loot tables.
export const RO_CHEST_EQUIPMENT_KEYS=Object.freeze(Object.values(RO_BUILD_EQUIPMENT).filter(d=>d.minStage>=2).map(d=>d.key));
export const canReceiveRoChestEquipment=hero=>!!hero&&typeof hero==='object'&&roBagUsage(hero)<RO_BAG_CAPACITY;
export function roChestEquipmentPool(hero={},progress=0,{weaponOnly=false}={}){
 return roBuildEquipmentPool(hero,progress,{weaponOnly}).map(p=>({...p,weight:p.weight*((hero.roInventory||[]).some(i=>i.key===p.key)?.5:1)}));
}
export function rollRoChestEquipment(hero,{random,id,progress=0,weaponOnly=false}={}){
 if(!hero||typeof random!=='function')return null;const pool=roChestEquipmentPool(hero,progress,{weaponOnly}),roll=random();if(!Number.isFinite(roll)||roll<0||roll>=1||!pool.length)return null;let threshold=roll*pool.reduce((sum,p)=>sum+p.weight,0),key=pool.at(-1).key;for(const entry of pool){threshold-=entry.weight;if(threshold<0){key=entry.key;break;}}
 const item=createRoEquipment(key,id);return item?{item,pending:false,definition:RO_EQUIPMENT[key]}:null;
}
export function awardRoChestEquipment(hero,options){
 if(!canReceiveRoChestEquipment(hero))return null;const award=rollRoChestEquipment(hero,options);return award&&roReceiveEquipment(hero,award.item)?award:null;
}
