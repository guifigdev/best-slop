import {RO_EQUIPMENT} from '../shared/ragnarok-equipment.js';
export const BONK_EQUIPMENT_ART_BUDGET=Object.freeze({partsPerItem:4,nearbyGlints:8,glintParts:24,glintDistance:20});
export function bonkEquipmentPickupParts(pickup,time=0){
 const d=RO_EQUIPMENT[pickup.item?.key],parts=[],b=(x,y,z,w,h,depth,c,a=0)=>parts.push([x,y,z,w,h,depth,c,a]),steel=0x9bb8ce,gold=0xe8c780,wood=0x795c42,bob=Math.sin(time*1.7+(Number(pickup.id)||0))*.05;
 if(d?.slot==='accessory'){for(let j=0;j<4;j++){const a=j*Math.PI/2;b(Math.sin(a)*.24,.45+bob,Math.cos(a)*.24,j%2?.15:.47,.16,j%2?.47:.15,gold,a*.15);}return parts;}
 b(0,.09,0,.86,.045,.68,0xb6c8dd,Math.PI/4);
 if(d?.slot==='weapon'&&d.weaponType==='staff'){b(0,.57+bob,0,.1,.86,.12,wood);b(0,1.05+bob,0,.3,.3,.3,0xc9a6dd,Math.PI/4);b(0,.91+bob,0,.46,.09,.18,gold);}
 else if(d?.slot==='weapon'&&d.weaponType==='bow'){b(-.16,.58+bob,0,.13,.7,.15,gold,-.3);b(.13,.58+bob,0,.08,.7,.12,wood,.3);b(0,.56+bob,.03,.12,.3,.15,steel);}
 else if(d?.slot==='weapon'){b(0,.69+bob,0,.13,.75,.18,steel,Math.PI/8);b(0,.34+bob,0,.52,.1,.22,gold,Math.PI/8);b(0,.19+bob,0,.13,.3,.16,wood,Math.PI/8);}
 else if(d?.slot==='head'){b(0,.57+bob,0,.62,.4,.5,steel);b(0,.77+bob,0,.42,.17,.4,steel);b(0,.4+bob,.28,.7,.1,.08,gold);}
 else if(d?.slot==='shoes'){b(-.2,.38+bob,0,.25,.46,.38,wood);b(.2,.38+bob,0,.25,.46,.38,wood);b(0,.59+bob,0,.68,.1,.4,gold);}
 else if(d?.slot==='offhand'){b(0,.53+bob,0,.6,.68,.15,steel);b(0,.53+bob,.1,.1,.52,.08,gold);b(0,.53+bob,.1,.46,.1,.08,gold);}
 else{b(0,.52+bob,0,.53,.62,.28,steel);b(-.35,.72+bob,0,.24,.24,.35,gold);b(.35,.72+bob,0,.24,.24,.35,gold);}
 return parts;
}
export function bonkEquipmentGlints(pickups,hero,time=0){
 const B=BONK_EQUIPMENT_ART_BUDGET,near=(pickups||[]).filter(p=>p.type==='equipment'&&Math.hypot(p.x-hero.x,p.z-hero.z)<=B.glintDistance).sort((a,b)=>Math.hypot(a.x-hero.x,a.z-hero.z)-Math.hypot(b.x-hero.x,b.z-hero.z)).slice(0,B.nearbyGlints),parts=[];
 for(const p of near){const phase=((time*.6+(Number(p.id)||0)*.173)%1+1)%1;if(phase>.65)continue;const y=1.2+Math.sin(phase*Math.PI)*.2,size=.025+Math.sin(phase*Math.PI)*.015;parts.push([p.x,y,p.z,size*3,.035,.035,0x9baf99,0],[p.x,y,p.z,.035,size*3,.035,0x9baf99,0],[p.x,y,p.z,.035,.035,size*3,0x9baf99,0]);}
 return parts;
}
