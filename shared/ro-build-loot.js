import {RO_BUILD_EQUIPMENT} from './ro-build-equipment.js';
export const roEquipmentGrade=(hero={},progress=0)=>Math.min(3,1+Math.max(Math.floor(Math.max(0,(hero.level||1)-1)/12),Math.floor(Math.max(0,progress)/3)));
export function roBuildEquipmentPool(hero={},progress=0,{weaponOnly=false}={}){
 const grade=Math.max(2,roEquipmentGrade(hero,progress));
 return Object.values(RO_BUILD_EQUIPMENT).filter(d=>d.minStage>=2&&d.minStage<=grade&&(!weaponOnly||d.slot==='weapon')&&(!hero.roLineage||d.lineages.includes(hero.roLineage))).map(d=>({key:d.key,weight:(d.grade===grade?4:1)*(d.synergy?2.5:1)}));
}
export function roDrawBuildEquipment(hero,progress,random){const pool=roBuildEquipmentPool(hero,progress),roll=random();if(!pool.length||!Number.isFinite(roll)||roll<0||roll>=1)return null;let n=roll*pool.reduce((sum,p)=>sum+p.weight,0);for(const p of pool){n-=p.weight;if(n<0)return p.key;}return pool.at(-1).key;}
