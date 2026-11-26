import {RO_EQUIPMENT_NATIVE} from './ro-equipment-native-data.js';
import {RO_BUILD_EQUIPMENT} from './ro-build-equipment.js';
export const roEquipmentGrade=(hero={},progress=0)=>Math.min(3,1+Math.max(Math.floor(Math.max(0,(hero.level||1)-1)/40),Math.floor(Math.max(0,progress)/3)));
// High-level database equipment is unlocked by progression, not the opening chest.
export const roBuildEquipmentUnlockLevel=definition=>Math.max(1,RO_EQUIPMENT_NATIVE[definition.sourceId]?.EquipLevelMin||definition.requiredLevel||1);
export function roBuildEquipmentPool(hero={},progress=0,{weaponOnly=false}={}){
 const grade=Math.max(2,roEquipmentGrade(hero,progress));
 return Object.values(RO_BUILD_EQUIPMENT).filter(d=>d.minStage>=2&&d.minStage<=grade&&(hero.level||1)>=roBuildEquipmentUnlockLevel(d)&&(!weaponOnly||d.slot==='weapon')&&(!hero.roLineage||d.lineages.includes(hero.roLineage))).map(d=>({key:d.key,weight:(d.grade===grade?4:1)*(d.synergy?2.5:1)}));
}
export function roDrawBuildEquipment(hero,progress,random){const pool=roBuildEquipmentPool(hero,progress),roll=random();if(!pool.length||!Number.isFinite(roll)||roll<0||roll>=1)return null;let n=roll*pool.reduce((sum,p)=>sum+p.weight,0);for(const p of pool){n-=p.weight;if(n<0)return p.key;}return pool.at(-1).key;}

export const RO_STARTER_CHEST_WEAPONS=Object.freeze({dragonknight:'sword',imperialguard:'spear',archmage:'staff',elementalmaster:'staff',windhawk:'bow',troubadour:'bow',cardinal:'mace',inquisitor:'mace',meister:'axe',biolo:'axe',shadowcross:'knife',abysschaser:'knife'});
