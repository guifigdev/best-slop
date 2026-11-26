import {RO_EQUIPMENT} from '../shared/ragnarok-equipment.js';
import {roEquipmentRequiredLevel} from '../shared/ro-equipment-requirements.js';

// Equipment/offer tests intentionally exercise an earned loadout. Qualify the
// fixture instead of weakening production level checks or bypassing roEquip.
export function qualifiedRoTestHero(unit,{level=1,jobLevel=10,items=[]}={}){
 const starter=unit.roInventory?.find(i=>String(i.id).endsWith(':ro:starter:weapon'));
 unit.level=Math.max(unit.level||1,level,...[starter?.key,...items].map(key=>roEquipmentRequiredLevel(RO_EQUIPMENT[key])));
 unit.roJobLevel=Math.max(unit.roJobLevel||1,jobLevel);
 if(starter&&!unit.roEquipment.weapon)unit.roEquipment.weapon=starter.id;
 return unit;
}
