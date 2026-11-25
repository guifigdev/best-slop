import {roMonsterProperties} from './ro-monster-properties.js';

export const RO_TARGET_BONUS_FAMILIES=Object.freeze(['raceDamage','magicRaceDamage','raceResistance','targetElementDamage','magicTargetElementDamage','sizeDamage','magicSizeDamage','sizeResistance']);
export const RO_RACE_NAMES=Object.freeze({demihuman:'Humanoide',human:'Humano',brute:'Bruto',insect:'Inseto',plant:'Planta',undead:'Morto-vivo',demon:'Demônio',formless:'Amorfo',fish:'Peixe',angel:'Anjo',dragon:'Dragão',all:'Todas as raças'});
const races={'Humano':'demihuman','Humanoide':'demihuman','Bruto':'brute','Inseto':'insect','Planta':'plant','Morto-vivo':'undead','Demônio':'demon','Amorfo':'formless','Peixe':'fish','Anjo':'angel','Dragão':'dragon'};
const value=(map,key)=>(map?.all||0)+(map?.[key]||0);
// Race, target property and size are separate damage groups. Weapon property
// and magical elemental power remain in the elemental-table calculation.
export function roEquipmentTargetMultiplier(bonuses,enemy,category='physical'){
 const properties=roMonsterProperties(enemy);if(!properties||!['physical','magic'].includes(category))return 1;
 const prefix=category==='magic'?'magic':'',race=races[properties.race]||properties.race;
 return Math.max(0,1+value(bonuses?.[prefix?'magicRaceDamage':'raceDamage'],race))*Math.max(0,1+value(bonuses?.[prefix?'magicTargetElementDamage':'targetElementDamage'],properties.element))*Math.max(0,1+value(bonuses?.[prefix?'magicSizeDamage':'sizeDamage'],properties.size));
}
export function roEquipmentSourceResistance(bonuses,source){
 const properties=roMonsterProperties(source);if(!properties)return 1;
 return (1-Math.min(.85,value(bonuses?.raceResistance,races[properties.race]||properties.race)))*(1-Math.min(.85,value(bonuses?.sizeResistance,properties.size)));
}
