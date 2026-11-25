import {RO_JOB_ASPD} from './ro-aspd-data.js';
import {RO_EQUIPMENT} from './ragnarok-equipment.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const type=d=>!d?'Fist':({dagger:'Dagger',sword:d.hands===2?'2hSword':'1hSword',axe:d.hands===2?'2hAxe':'1hAxe',spear:d.hands===2?'2hSpear':'1hSpear',staff:d.hands===2?'2hStaff':'Staff',bow:'Bow',katar:'Katar',mace:'Mace',knuckle:'Knuckle',book:'Book',instrument:'Musical'})[d.weaponType]||'Fist';
export function roAttackTiming(unit,stats={},gear={},enchants={}){
 const a=stats.attributes||{},agi=Math.max(0,a.agi||1),dex=Math.max(0,a.dex||1),table=RO_JOB_ASPD[unit.bonkJob]||RO_JOB_ASPD.novice,find=slot=>RO_EQUIPMENT[unit.roInventory?.find(i=>i.id===unit.roEquipment?.[slot])?.key],right=find('weapon'),left=right?.hands===2?null:find('offhand'),weapon=type(right),ranged=['Bow','Musical','Whip'].includes(weapon);
 let penalty=table[weapon]??table.Fist??50;if(left)penalty+=left.slot==='offhand'?(table.Shield||0):(table[type(left)]||50)/4;
 const baseAspd=Math.floor(196+.25*Math.sqrt(dex*dex/(ranged?7:5)+agi*agi*.5))-Math.min(200,penalty),oldHaste=(1+(gear.haste||0)+agi*.01+Math.floor(agi/10)*.05)*(1+(enchants.haste||0)*.09),skillMultiplier=Math.max(.1,(stats.haste||oldHaste)/Math.min(5,oldHaste)),reduction=clamp((gear.haste||0)+(enchants.haste||0)*.09,0,.9),maximum=(unit.roTier||0)>=2?193:190;
 const attackDelay=Math.max((200-maximum)/50,(200-baseAspd)/50*(1-reduction)/skillMultiplier);
 return{aspd:clamp(200-attackDelay*50,0,maximum),attackDelay,attackMotion:attackDelay/2,aspdMax:maximum};
}
