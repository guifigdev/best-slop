import {RO_EQUIPMENT,roItemFitsSlot} from './ragnarok-equipment.js';
export function roEquippedWeapon(unit){const item=unit?.roInventory?.find(item=>item.id===unit.roEquipment?.weapon);return RO_EQUIPMENT[item?.key]||null;}
export function roEquippedWeaponModel(unit){const weapon=roEquippedWeapon(unit);if(!weapon)return null;return ({staff:'staff',knuckle:'fists',instrument:'lute',sword:weapon.hands===2?'greatsword':'sword'})[weapon.weaponType]||weapon.weaponType||null;}
export function roEquippedOffhandModel(unit){const item=unit?.roInventory?.find(item=>item.id===unit.roEquipment?.offhand);if(!item||!roItemFitsSlot(unit,item,'offhand')||roEquippedWeapon(unit)?.hands===2)return null;const d=RO_EQUIPMENT[item.key];return d.shield||d.slot==='offhand'?'shield':d.weaponType;}
