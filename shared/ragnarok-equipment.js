import {RO_TOWER_CARDS,RO_TOWER_MVP_GEAR,RO_TOWER_DROP_MAP} from './ragnarok-tower-drops.js';
// Source identity, equipment positions and sockets follow Divine Pride.
// Combat numbers are deliberately scaled for Frenesi's ~200 HP opening, not
// copied from RO's much larger health/damage economy. Cards remain on the item.
const own=(catalog,key)=>typeof key==='string'&&Object.hasOwn(catalog,key);
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
const source=id=>`https://www.divine-pride.net/database/item/${id}`;
const gear=(key,name,sourceId,slot,sockets,stats,extra={})=>({key,name,sourceId,source:source(sourceId),slot,sockets,stats,...extra});
const BASE_RO_EQUIPMENT=freeze(Object.fromEntries([
 gear('knife','Knife [3]',1201,'weapon',3,{attack:2},{weaponType:'dagger',hands:1}),
 gear('maingauche','Main Gauche [4]',1208,'weapon',4,{attack:5},{weaponType:'dagger',hands:1}),
 gear('sword','Sword [3]',1101,'weapon',3,{attack:4},{weaponType:'sword',hands:1}),
 gear('katana','Katana [3]',1116,'weapon',3,{attack:11},{weaponType:'sword',hands:2}),
 gear('rod','Rod [4]',1602,'weapon',4,{matk:4},{weaponType:'staff',hands:1}),
 gear('staff','Staff [2]',1607,'weapon',2,{matk:8,int:1},{weaponType:'staff',hands:1}),
 gear('bow','Bow [3]',1701,'weapon',3,{attack:4},{weaponType:'bow',hands:2}),
 gear('compositebow','Composite Bow [4]',1705,'weapon',4,{attack:8,dex:1},{weaponType:'bow',hands:2}),
 gear('mace','Mace [3]',1504,'weapon',3,{attack:4},{weaponType:'mace',hands:1}),
 gear('axe','Axe [3]',1301,'weapon',3,{attack:6},{weaponType:'axe',hands:1}),
 gear('battleaxe','Battle Axe [3]',1351,'weapon',3,{attack:12},{weaponType:'axe',hands:2}),
 gear('spear','Spear [3]',1404,'weapon',3,{attack:6},{weaponType:'spear',hands:1}),
 gear('guard','Guard [1]',2102,'offhand',1,{armor:1},{shield:true}),
 gear('buckler','Buckler [1]',2104,'offhand',1,{armor:2},{shield:true}),
 gear('cottonshirt','Cotton Shirt [1]',2302,'armor',1,{armor:.5}),
 gear('adventurersuit',"Adventurer's Suit [1]",2306,'armor',1,{armor:1}),
 gear('coat','Coat [1]',2310,'armor',1,{armor:2}),
 gear('manteau','Manteau [1]',2506,'garment',1,{armor:1}),
 gear('muffler','Muffler [1]',2504,'garment',1,{armor:.7}),
 gear('shoes','Shoes [1]',2404,'shoes',1,{armor:.5}),
 gear('boots','Boots [1]',2406,'shoes',1,{armor:1}),
 gear('clip','Clip [1]',2607,'accessory',1,{maxHp:8}),
 gear('ring','Ring',2601,'accessory',0,{str:2}),
 gear('cap','Cap [1]',2227,'head',1,{armor:.6}),
 gear('criticalring','Anel Crítico',2616,'accessory',0,{crit:.05}),
 // Katar precision is a survivor adaptation; it preserves the class attack.
 gear('katar','Katar [2]',1253,'weapon',2,{attack:10,dex:1,crit:.06},{weaponType:'katar',hands:2}),
].map(item=>[item.key,item])));

const card=(key,name,sourceId,slot,stats,monsters,original)=>({key,name,sourceId,source:source(sourceId),slot,stats,monsters,original});
const mvpCard=(...args)=>({...card(...args),mvp:true});
const BASE_RO_CARDS=freeze(Object.fromEntries([
 card('poring','Poring Card',4001,'armor',{luk:2},['poring'],'LUK +2, perfect dodge +1'),
 card('fabre','Fabre Card',4002,'weapon',{vit:1,maxHp:10},['fabre'],'VIT +1, max HP +100'),
 card('pupa','Pupa Card',4003,'armor',{maxHp:70},['pupa'],'Max HP +700'),
 card('drops','Drops Card',4004,'weapon',{dex:1},['drops'],'DEX +1, hit +3'),
 card('lunatic','Lunatic Card',4006,'weapon',{luk:1,crit:.01},['lunatic'],'LUK +1, critical +1, perfect dodge +1'),
 card('picky','Picky Card',4008,'armor',{str:1,attack:1},['picky'],'STR +1, ATK +10'),
 card('pickyegg','Picky Egg Card',4011,'armor',{vit:1,maxHp:10},['pickyegg'],'VIT +1, max HP +100'),
 card('thiefbugegg','Thiefbug Egg Card',4012,'offhand',{maxHp:40},['thiefbugegg'],'Max HP +400, shield'),
 card('rodafrog','Roda Frog Card',4014,'armor',{maxHp:40},['rodafrog'],'Max HP +400, max SP +50'),
 card('thiefbug','Thief Bug Card',4016,'armor',{agi:1},['thiefbug','thiefbugfemale','thiefbugmale'],'AGI +1'),
 card('rocker','Rocker Card',4021,'armor',{dex:1,attack:.5},['rocker'],'DEX +1, ATK +5'),
 card('elderwillow','Elder Willow Card',4052,'head',{int:2},['elderwillow'],'INT +2'),
 mvpCard('ifrit','Ifrit Card',4430,'accessory',{attack:6,crit:.03,dex:2},['ifrit'],'Job-scaled ATK, CRI and HIT; reactive Earthquake'),
 mvpCard('valkyrierandgris','Randgris Card',4407,'weapon',{attack:7,str:2},['valkyrierandgris'],'Physical damage +10%, Dispell autocast, unbreakable weapon'),
 mvpCard('satanmorroc','Lord Morocc Card',4559,'shoes',{haste:.06,agi:2},['satanmorroc'],'ASPD +1, max SP -10%'),
 mvpCard('phreeoni','Phreeoni Card',4121,'weapon',{dex:5,attack:3},['phreeoni'],'HIT +100'),
 mvpCard('baphomet','Baphomet Card',4147,'weapon',{attack:8,str:2},['baphomet'],'Basic attacks splash over 3x3 cells, HIT -10'),
 mvpCard('osiris','Osiris Card',4144,'accessory',{maxHp:45,vit:2},['osiris'],'Full HP and SP when resurrected'),
 mvpCard('drake','Drake Card',4137,'weapon',{attack:6,dex:2},['drake'],'Removes weapon size damage penalties'),
 mvpCard('doppelganger','Doppelganger Card',4142,'weapon',{haste:.1},['doppelganger'],'Attack speed +10%'),
 mvpCard('amonra','Amon Ra Card',4236,'shoes',{str:1,agi:1,vit:1,int:1,dex:1,luk:1},['amonra'],'All stats +1, reactive Kyrie Eleison'),
 mvpCard('eddga','Eddga Card',4123,'shoes',{moveSpeed:.35,armor:1,vit:1},['eddga'],'Permanent Endure, max HP -25%'),
 mvpCard('gtb','Golden Thiefbug Card',4128,'offhand',{armor:3,vit:2},['gtb'],'Targeted magic immunity, doubled SP costs'),
 mvpCard('mistress','Mistress Card',4132,'head',{int:3,matk:5},['mistress'],'Removes gemstone requirement, SP costs +25%'),
 mvpCard('maya','Maya Card',4146,'offhand',{armor:2,int:2},['maya'],'Chance to reflect targeted magic'),
 mvpCard('stormyknight','Stormy Knight Card',4318,'weapon',{matk:6,attack:3},['stormyknight'],'Storm Gust autocast and freeze chance'),
 mvpCard('hatii','Hatii Card',4324,'armor',{vit:2,armor:2},['hatii'],'Chance to freeze an attacker when struck'),
 mvpCard('fallenbishop','Fallen Bishop Card',4441,'shoes',{int:3,matk:7},['fallenbishop'],'MATK +10%, max SP -50%, magic damage to Angel and Demihuman +50%'),
].map(item=>[item.key,item])));
export const RO_EQUIPMENT=freeze({...BASE_RO_EQUIPMENT,...RO_TOWER_MVP_GEAR});
export const RO_CARDS=freeze({...BASE_RO_CARDS,...RO_TOWER_CARDS});
export const RO_LOOT_RATES=freeze({card:.00015,bossCard:.0015,equipment:.06});
export const RO_EQUIPMENT_SLOTS=freeze(['weapon','offhand','armor','garment','shoes','accessory','head']);
const starter=freeze({dragonknight:'sword',imperialguard:'spear',archmage:'rod',elementalmaster:'staff',windhawk:'bow',troubadour:'bow',cardinal:'mace',inquisitor:'mace',meister:'axe',biolo:'axe',shadowcross:'knife',abysschaser:'knife'});
const validId=id=>(typeof id==='string'&&id.length>0)||(typeof id==='number'&&Number.isSafeInteger(id));
export function createRoEquipment(key,id){return own(RO_EQUIPMENT,key)&&validId(id)?{id,key,cards:[]}:null;}
export function initializeRoInventory(u,lineage){
 if(!u||typeof u!=='object')return false;
 u.roLineage=own(starter,lineage)?lineage:'dragonknight';
 if(Array.isArray(u.roInventory)&&u.roEquipment&&Array.isArray(u.roCards))return true;
 const prefix=`${u.id??'hero'}:ro:starter`,weapon=createRoEquipment(starter[u.roLineage],`${prefix}:weapon`),armor=createRoEquipment('adventurersuit',`${prefix}:armor`);
 u.roInventory=[weapon,armor];u.roCards=[];u.roEquipment={weapon:weapon.id,offhand:null,armor:armor.id,garment:null,shoes:null,accessory:null,head:null};
 if(u.roLineage==='shadowcross'&&(u.roTier||0)>=1){const second=createRoEquipment('knife',`${prefix}:offhand`);u.roInventory.push(second);u.roEquipment.offhand=second.id;}
 return true;
}
const inventory=u=>Array.isArray(u?.roInventory)?u.roInventory:[];
const findItem=(u,id)=>validId(id)?inventory(u).find(item=>item&&item.id===id&&own(RO_EQUIPMENT,item.key)):null;
const offhandWeapon=u=>u.roLineage==='shadowcross'&&(u.roTier||0)>=1;
function fits(u,item,slot){const definition=RO_EQUIPMENT[item.key];return definition.slot===slot||slot==='offhand'&&definition.slot==='weapon'&&definition.hands===1&&offhandWeapon(u)&&['dagger','sword','axe'].includes(definition.weaponType);}

// A successful swap preserves both items in the bag. A two-handed weapon
// unequips the offhand; equipping an offhand cannot silently remove the weapon.
export function roEquip(u,itemId,slot){
 const item=findItem(u,itemId);if(!item||!RO_EQUIPMENT_SLOTS.includes(slot)||!fits(u,item,slot)||!u.roEquipment)return false;
 const definition=RO_EQUIPMENT[item.key],main=findItem(u,u.roEquipment.weapon);
 if(slot==='offhand'&&main&&RO_EQUIPMENT[main.key].hands===2)return false;
 for(const position of RO_EQUIPMENT_SLOTS)if(u.roEquipment[position]===itemId)u.roEquipment[position]=null;
 if(slot==='weapon'&&definition.hands===2)u.roEquipment.offhand=null;
 u.roEquipment[slot]=itemId;return true;
}
export function roSocket(u,cardId,itemId){
 const item=findItem(u,itemId),cards=Array.isArray(u?.roCards)?u.roCards:[],index=cards.findIndex(card=>card&&card.id===cardId&&own(RO_CARDS,card.key));
 if(!item||index<0||!Array.isArray(item.cards))return false;
 const definition=RO_EQUIPMENT[item.key],card=cards[index],cardSpec=RO_CARDS[card.key];
 if(cardSpec.slot!==definition.slot||item.cards.length>=definition.sockets||inventory(u).some(gear=>Array.isArray(gear.cards)&&gear.cards.some(existing=>existing?.id===cardId)))return false;
 item.cards.push({id:card.id,key:card.key});cards.splice(index,1);return true;
}
export function roDrop(u,itemId){
 const items=inventory(u),index=items.findIndex(item=>item?.id===itemId);
 if(index>=0){for(const slot of RO_EQUIPMENT_SLOTS)if(u.roEquipment?.[slot]===itemId)u.roEquipment[slot]=null;items.splice(index,1);return true;}
 const cards=Array.isArray(u?.roCards)?u.roCards:[],cardIndex=cards.findIndex(card=>card?.id===itemId);if(cardIndex<0)return false;cards.splice(cardIndex,1);return true;
}
export function roEquipmentBonuses(u){
 const bonuses={str:0,agi:0,vit:0,int:0,dex:0,luk:0,maxHp:0,attack:0,armor:0,matk:0,moveSpeed:0,crit:0,haste:0},seenItems=new Set(),seenCards=new Set();
 const add=stats=>{for(const key of Object.keys(bonuses))bonuses[key]+=stats[key]||0;};
 const main=findItem(u,u?.roEquipment?.weapon),twoHanded=main&&RO_EQUIPMENT[main.key].hands===2;
 for(const slot of RO_EQUIPMENT_SLOTS){const item=findItem(u,u?.roEquipment?.[slot]);if(!item||seenItems.has(item.id)||!fits(u,item,slot)||slot==='offhand'&&twoHanded)continue;seenItems.add(item.id);
  const definition=RO_EQUIPMENT[item.key];add(definition.stats);
  for(const entry of (Array.isArray(item.cards)?item.cards:[]).slice(0,definition.sockets)){if(!entry||seenCards.has(entry.id)||!own(RO_CARDS,entry.key)||RO_CARDS[entry.key].slot!==definition.slot)continue;seenCards.add(entry.id);add(RO_CARDS[entry.key].stats);}
 }
 return bonuses;
}
export function rollRoLoot(random,monsterVisual,{boss=false}={}){
 if(typeof random!=='function')return null;const roll=random();if(!Number.isFinite(roll)||roll<0||roll>=1)return null;
 const chance=boss?RO_LOOT_RATES.bossCard:RO_LOOT_RATES.card,card=Object.values(RO_CARDS).find(card=>card.monsters.includes(monsterVisual));
 if(roll<chance&&card)return{kind:'card',key:card.key};
 if(roll>=chance&&roll<chance+RO_LOOT_RATES.equipment){const source=RO_TOWER_DROP_MAP[monsterVisual],list=[...new Set([...(source?.equipmentKeys?.length?source.equipmentKeys:Object.keys(BASE_RO_EQUIPMENT)),'criticalring','katar'])],selection=random();if(!Number.isFinite(selection)||selection<0||selection>=1)return null;return{kind:'equipment',key:list[Math.floor(selection*list.length)]};}
 return null;
}

export function rollRoEquipmentDrops(random,visual,{boss=false}={}){const source=RO_TOWER_DROP_MAP[visual];if(boss&&source){const drops=[];for(const d of source.sourceDrops||[])if(d.kind==='equipment'&&own(RO_EQUIPMENT,d.key)&&random()<d.sourceRate)drops.push(d.key);return drops.slice(0,4);}const result=rollRoLoot(random,visual,{boss});return result?.kind==='equipment'?[result.key]:[];}
