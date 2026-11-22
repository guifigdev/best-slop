import {RO_EQUIPMENT,createRoEquipment,roReceiveEquipment} from './ragnarok-equipment.js';

// Normal equipment identities already sourced by the RO equipment catalog.
// MVP-exclusive database drops remain on their respective boss loot tables.
export const RO_CHEST_EQUIPMENT_KEYS=Object.freeze(['knife','maingauche','sword','katana','rod','staff','bow','compositebow','mace','axe','battleaxe','spear','guard','buckler','cottonshirt','adventurersuit','coat','manteau','muffler','shoes','boots','clip','ring','cap','criticalring','katar']);
const advanced=new Set(['maingauche','katana','staff','compositebow','battleaxe','spear','buckler','coat','manteau','boots','clip','ring']),preferred={dragonknight:'sword',imperialguard:'spear',archmage:'staff',elementalmaster:'staff',windhawk:'bow',troubadour:'bow',cardinal:'mace',inquisitor:'mace',meister:'axe',biolo:'axe',shadowcross:'dagger',abysschaser:'dagger'};
export const canReceiveRoChestEquipment=hero=>!!hero&&typeof hero==='object';
export function roChestEquipmentPool(hero={},progress=0,{weaponOnly=false}={}){
 const level=Number.isFinite(hero.level)?hero.level:1,grade=Math.min(2,Math.max(0,Math.floor((level-1)/12),Number.isFinite(progress)?Math.floor(progress/2):0));
 return RO_CHEST_EQUIPMENT_KEYS.filter(key=>Object.hasOwn(RO_EQUIPMENT,key)&&(!weaponOnly||RO_EQUIPMENT[key].slot==='weapon')).map(key=>{const gear=RO_EQUIPMENT[key],high=advanced.has(key),native=gear.weaponType===preferred[hero.roLineage],missing=!hero.roEquipment?.[gear.slot],duplicate=(hero.roInventory||[]).some(item=>item.key===key);let weight=grade===0?(high?.3:1):grade===1?(high?1.8:.6):(high?2.8:.2);if(native)weight*=weaponOnly?6:2.5;if(missing)weight*=1.3;if(duplicate)weight*=.4;return{key,weight};});
}
export function awardRoChestEquipment(hero,{random,id,progress=0,weaponOnly=false}={}){
 if(!hero||typeof random!=='function'||!canReceiveRoChestEquipment(hero))return null;const pool=roChestEquipmentPool(hero,progress,{weaponOnly}),roll=random();if(!Number.isFinite(roll)||roll<0||roll>=1||!pool.length)return null;let threshold=roll*pool.reduce((sum,p)=>sum+p.weight,0),key=pool.at(-1).key;for(const entry of pool){threshold-=entry.weight;if(threshold<0){key=entry.key;break;}}
 const item=createRoEquipment(key,id),stored=item&&roReceiveEquipment(hero,item);if(!stored)return null;return{item:stored,pending:false,definition:RO_EQUIPMENT[key]};
}
