import {RO_WEAPON_MODEL_DATA} from './ro-weapon-model-data.js';
import {RO_EQUIPMENT} from '../shared/ragnarok-equipment.js';
export const RO_VOXEL_WEAPON_BUDGET=Object.freeze({parts:960,planes:0});
const models=new Map();
function authoredWeapon(d){
 const p=[],b=(x,y,z,w,h,depth,c)=>p.push([x,y,z,w,h,depth,c]),wood=0x694429,leather=0x382c29,steel=0x8cabc0,edge=0xdcebf0,gold=0xc4a167,kind=d.weaponType;
 if(kind==='bow'){
  for(let i=-12;i<=12;i++){const y=i*.055,x=.16*(1-(i/12)**2);b(x,y,0,.06,.063,.07,i%4===0?0xb5834b:wood);b(x-.026,y,.033,.016,.058,.014,0xc99b62);}
  for(let i=-3;i<=3;i++)b(.16,i*.022,0,.08,.018,.09,leather);
  b(0,0,0,.008,1.32,.008,0xe3d3aa);for(const s of [-1,1])b(0,s*.65,0,.075,.04,.09,gold);
 }else if(kind==='instrument'){
  for(let i=-6;i<=6;i++){const y=i*.034,width=.22+Math.abs(Math.sin(i*.6))*.06;b(0,y,0,width,.037,.12,0x9b5f30);b(0,y,.067,width*.82,.033,.025,0xd99c50);}
  b(0,.35,0,.07,.42,.06,wood);for(let i=-2;i<=2;i++)b(i*.012,.19,.088,.004,.75,.004,edge);b(0,.09,.088,.09,.06,.01,0x241c18);
 }else{
  const long=kind==='sword'?1.12:kind==='axe'?.85:.70;
  b(0,.08,0,.075,.36,.085,wood);for(let i=0;i<6;i++)b(0,-.06+i*.045,.006,.09,.018,.095,leather);b(0,-.11,0,.11,.07,.11,gold);
  if(kind==='sword'){
   b(0,.21,0,.32,.055,.12,gold);for(let i=0;i<25;i++){const y=.25+i*.04,width=i>20?.13-(i-20)*.024:.13;b(0,y,0,Math.max(.024,width),.043,.065,steel);b(0,y,.037,Math.max(.014,width*.35),.043,.012,edge);}b(0,.25,0,.09,.12,.09,0x9182b1);
  }else if(kind==='axe'){
   b(0,long*.5,0,.075,long,.085,wood);for(let i=-6;i<=6;i++){const y=.82+i*.035,width=.16+.16*Math.abs(i)/6;b(.10,y,0,width,.039,.12,steel);b(.10+width/2,y,0,.035,.039,.13,edge);}b(0,.82,0,.14,.22,.16,gold);
  }else{
   b(0,.40,0,.065,.55,.075,wood);for(let i=-4;i<=4;i++){const y=.68+i*.028,r=.16-Math.abs(i)*.019;b(0,y,0,r*2,.032,r*1.65,steel);b(-r*.67,y,r*.62,.035,.029,.035,edge);}for(const side of [-1,1])b(side*.20,.68,0,.08,.07,.07,gold);
  }
 }
 return p;
}
export function roVoxelWeapon(key){
 if(models.has(key))return models.get(key);const d=RO_EQUIPMENT[key];if(d?.slot!=='weapon')return null;
 const source=RO_WEAPON_MODEL_DATA[key],parts=source?.parts||authoredWeapon(d);
 if(parts.length>RO_VOXEL_WEAPON_BUDGET.parts)throw Error('Weapon sculpture exceeds its geometry budget');
 const model=Object.freeze({key,sourceId:d.sourceId,kind:d.weaponType,parts:Object.freeze(parts.map(p=>Object.freeze([...p]))),planes:0});models.set(key,model);return model;
}
export function roHeldWeaponKey(unit,slot='weapon'){return unit?.roInventory?.find(i=>i.id===unit.roEquipment?.[slot])?.key||null;}
