import {roEquipmentRequiredLevel,roEquipmentLevelAllowed} from './ro-equipment-requirements.js';
import {roNativeEquipment,roNativeEquipmentDefinition} from './ro-equipment-native.js';
import {roSkillSource} from './ro-skill-source.js';
import {roCardRarity} from './ro-card-rarity.js';
import {RO_EQUIPMENT_TARGET_FACTS} from './ro-equipment-target-facts.js';
import {RO_TARGET_BONUS_FAMILIES} from './ro-equipment-target-bonuses.js';
import {RO_EQUIPMENT_ELEMENT_FACTS} from './ro-equipment-element-facts.js';
import {RO_TOWER_CARDS,RO_TOWER_MVP_GEAR,RO_TOWER_DROP_MAP} from './ragnarok-tower-drops.js';
import {RO_BUILD_EQUIPMENT} from './ro-build-equipment.js';
// Source identity, equipment positions and sockets follow Divine Pride.
// Base values and supported bonus instructions follow the source item database.
const own=(catalog,key)=>typeof key==='string'&&Object.hasOwn(catalog,key);
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
const source=id=>`https://www.divine-pride.net/database/item/${id}`;
const gear=(key,name,sourceId,slot,sockets,stats,extra={})=>({key,name,sourceId,source:source(sourceId),slot,sockets,stats,...RO_EQUIPMENT_ELEMENT_FACTS[sourceId],...extra});
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
 gear('sunglasses','Óculos Escuros [1]',2202,'headMid',1,{}, {headPosition:'middle'}),
 gear('flumask','Máscara Cirúrgica',2218,'headLow',0,{}, {headPosition:'lower'}),
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
 {...mvpCard('bio_eremes','Carta Algoz Eremes',4359,'garment',{flee:12},['bio_eremes'],'Habilita Furtividade nv. 3 no original. Aqui: +12 Esquiva; a habilidade ativa da carta ainda não foi adaptada.'),latamSource:'https://latamro.com/item/4359/',adaptation:'Proteção de Furtividade convertida em Esquiva nesta versão; não concede a habilidade ativa.'},
 mvpCard('fallenbishop','Fallen Bishop Card',4441,'shoes',{int:3,matk:7},['fallenbishop'],'MATK +10%, max SP -50%, magic damage to Angel and Demihuman +50%'),
].map(item=>[item.key,item])));
export const RO_EQUIPMENT=freeze(Object.fromEntries(Object.entries({...BASE_RO_EQUIPMENT,...RO_TOWER_MVP_GEAR,...RO_BUILD_EQUIPMENT}).map(([key,d])=>[key,RO_BUILD_EQUIPMENT[key]===d?d:{...roNativeEquipmentDefinition({...d,...RO_EQUIPMENT_TARGET_FACTS[d.sourceId]}),requiredLevel:roEquipmentRequiredLevel(d)}])));
export const RO_CARDS=freeze(Object.fromEntries(Object.entries({...BASE_RO_CARDS,...RO_TOWER_CARDS}).map(([key,card])=>[key,{...card,stats:{...card.stats,...({4145:{variableCastReduction:.3},4169:{variableCastReduction:.1},4077:{variableCastReduction:-.25},4327:{variableCastReduction:-.3}})[card.sourceId]},rarity:roCardRarity(card)}])));
export const RO_LOOT_RATES=freeze({card:.005,bossCard:.005,equipment:.06});
export const RO_EQUIPMENT_SLOTS=freeze(['weapon','offhand','head','headMid','headLow','armor','garment','shoes','accessory','accessory2']);
export const RO_EQUIPMENT_SLOT_NAMES=freeze({weapon:'Mão direita',offhand:'Mão esquerda',head:'Cabeça · topo',headMid:'Cabeça · meio',headLow:'Cabeça · baixo',armor:'Armadura',garment:'Capa',shoes:'Calçados',accessory:'Acessório 1',accessory2:'Acessório 2'});
export const RO_BAG_CAPACITY=30;
export const roSlotType=slot=>slot==='accessory2'?'accessory':['headMid','headLow'].includes(slot)?'head':slot;
export const roCardFitsSlot=(card,slot)=>card?.slot===roSlotType(slot)||slot==='offhand'&&card?.slot==='weapon';
const starter=freeze({dragonknight:'sword',imperialguard:'spear',archmage:'rod',elementalmaster:'staff',windhawk:'bow',troubadour:'bow',cardinal:'mace',inquisitor:'mace',meister:'axe',biolo:'axe',shadowcross:'knife',abysschaser:'knife'});
const validId=id=>(typeof id==='string'&&id.length>0)||(typeof id==='number'&&Number.isSafeInteger(id));
export function createRoEquipment(key,id){return own(RO_EQUIPMENT,key)&&validId(id)?{id,key,cards:[]}:null;}
export function initializeRoInventory(u,lineage){
 if(!u||typeof u!=='object')return false;
 u.roLineage=own(starter,lineage)?lineage:'dragonknight';
 if(Array.isArray(u.roInventory)&&u.roEquipment&&Array.isArray(u.roCards))return true;
 const prefix=`${u.id??'hero'}:ro:starter`,weapon=createRoEquipment(starter[u.roLineage],`${prefix}:weapon`),armor=createRoEquipment('adventurersuit',`${prefix}:armor`);
 u.roInventory=[weapon,armor];u.roCards=[];u.roEquipment=Object.fromEntries(RO_EQUIPMENT_SLOTS.map(slot=>[slot,slot==='weapon'?weapon.id:slot==='armor'?armor.id:null]));u.roBagVersion=1;
 if(u.roLineage==='shadowcross'&&(u.roTier||0)>=1){const second=createRoEquipment('knife',`${prefix}:offhand`);u.roInventory.push(second);u.roEquipment.offhand=second.id;}
 return true;
}
const inventory=u=>Array.isArray(u?.roInventory)?u.roInventory:[];
export const roEquipmentQuantity=item=>Number.isSafeInteger(item?.quantity)&&item.quantity>0?item.quantity:1;
export const roInventoryItemCount=u=>inventory(u).reduce((n,item)=>n+roEquipmentQuantity(item),0);
export const roBagUsage=u=>Math.max(0,roInventoryItemCount(u)-new Set(Object.values(u.roEquipment||{}).filter(id=>inventory(u).some(item=>item.id===id))).size);
export function roBagPieces(u){const worn=new Set(Object.values(u.roEquipment||{}));return inventory(u).flatMap(item=>Array.from({length:Math.min(RO_BAG_CAPACITY,roEquipmentQuantity(item)-Number(worn.has(item.id)))},(_,copy)=>({item,copy}))).slice(0,RO_BAG_CAPACITY);}
export function roMigrateBag(u,{force=false}={}){
 for(const [slot,id]of Object.entries(u?.roEquipment||{})){const item=inventory(u).find(i=>i.id===id);if(item&&!roEquipmentLevelAllowed(u,RO_EQUIPMENT[item.key])){u.roEquipment[slot]=null;force=true;}}
 if(!u||u.roBagVersion===1&&!force)return;u.roInventory??=[];u.roUnclaimed??=[];const worn=new Set(Object.values(u.roEquipment||{}));let available=RO_BAG_CAPACITY;const kept=[],ids=new Set([...u.roInventory,...u.roUnclaimed].map(i=>i.id));
 for(const item of [...u.roInventory].sort((a,b)=>Number(worn.has(b.id))-Number(worn.has(a.id)))){const quantity=roEquipmentQuantity(item),equipped=Number(worn.has(item.id)),take=Math.min(quantity,equipped+available);available-=take-equipped;if(take){const keptItem={...item};if(take>1)keptItem.quantity=take;else delete keptItem.quantity;kept.push(keptItem);}if(quantity>take){let id=item.id;if(take){let n=1;do{id=String(item.id).slice(0,78)+':saved:'+n++;}while(ids.has(id));ids.add(id);}u.roUnclaimed.push({...item,id,quantity:quantity-take});}}
 u.roInventory=kept;u.roBagVersion=1;
}
export function roReceiveEquipment(u,item,{stack=false}={}){
 if(!u||!item||!validId(item.id)||!own(RO_EQUIPMENT,item.key)||item.quantity!==undefined&&(!Number.isSafeInteger(item.quantity)||item.quantity<1))return null;
 u.roInventory??=[];const same=u.roInventory.find(existing=>existing.id===item.id);if(same)return same;
 if(roBagUsage(u)+roEquipmentQuantity(item)>RO_BAG_CAPACITY)return null;
 const target=stack&&!item.refine&&!(item.cards||[]).length&&!Object.keys(item.enchants||{}).length?u.roInventory.find(existing=>existing.key===item.key&&!existing.refine&&!(existing.cards||[]).length&&!Object.keys(existing.enchants||{}).length):null;
 if(target){const quantity=roEquipmentQuantity(target)+roEquipmentQuantity(item);if(!Number.isSafeInteger(quantity))return null;target.quantity=quantity;return target;}
 u.roInventory.push(item);return item;
}
export function roCompactInventory(u){
 const equipped=new Set(Object.values(u.roEquipment||{})),targets=new Map(),kept=[];
 for(const item of inventory(u))if(!item.refine&&!(item.cards||[]).length&&!Object.keys(item.enchants||{}).length&&(!targets.has(item.key)||equipped.has(item.id)))targets.set(item.key,item);
 for(const item of inventory(u)){const target=targets.get(item.key);if(!target||item===target||equipped.has(item.id)||item.refine||(item.cards||[]).length||Object.keys(item.enchants||{}).length){kept.push(item);continue;}const quantity=roEquipmentQuantity(target)+roEquipmentQuantity(item);if(!Number.isSafeInteger(quantity)){kept.push(item);continue;}target.quantity=quantity;}
 u.roInventory=kept;return kept;
}
const findItem=(u,id)=>validId(id)?inventory(u).find(item=>item&&item.id===id&&own(RO_EQUIPMENT,item.key)):null;
export const roCanDualWield=u=>u?.roLineage==='shadowcross'&&(u.roTier||0)>=1;
export function roItemFitsSlot(u,item,slot){const definition=RO_EQUIPMENT[item?.key];return !!definition&&(definition.slot===slot||definition.slot==='accessory'&&slot==='accessory2'||slot==='offhand'&&definition.slot==='weapon'&&definition.hands===1&&roCanDualWield(u)&&['dagger','sword','axe'].includes(definition.weaponType));}
const fits=roItemFitsSlot;
export const roCompatibleSlots=(u,item)=>RO_EQUIPMENT_SLOTS.filter(slot=>fits(u,item,slot));

// A successful swap preserves both items in the bag. A two-handed weapon
// unequips the offhand; equipping an offhand cannot silently remove the weapon.
export function roEquip(u,itemId,slot){
 let item=findItem(u,itemId);if(!item||!RO_EQUIPMENT_SLOTS.includes(slot)||!fits(u,item,slot)||!roEquipmentLevelAllowed(u,RO_EQUIPMENT[item.key])||!u.roEquipment)return false;
 const definition=RO_EQUIPMENT[item.key],main=findItem(u,u.roEquipment.weapon);
 if(slot==='offhand'&&main&&RO_EQUIPMENT[main.key].hands===2)return false;
 // A stack contains physical copies, not bonuses that multiply when equipped.
 const wornElsewhere=Object.entries(u.roEquipment).some(([position,id])=>position!==slot&&id===item.id),current=findItem(u,u.roEquipment[slot]);
 if(wornElsewhere&&current?.key===item.key&&!(current.cards||[]).length&&!(item.cards||[]).length&&JSON.stringify(current.enchants||{})===JSON.stringify(item.enchants||{}))return true;
 const proposed={...u.roEquipment},splitting=roEquipmentQuantity(item)>1&&wornElsewhere,proposedId=splitting?'@split-copy':itemId;for(const position of RO_EQUIPMENT_SLOTS)if(proposed[position]===proposedId)proposed[position]=null;if(slot==='weapon'&&definition.hands===2)proposed.offhand=null;proposed[slot]=proposedId;if(roInventoryItemCount(u)-new Set(Object.values(proposed).filter(Boolean)).size>RO_BAG_CAPACITY)return false;
 if(roEquipmentQuantity(item)>1&&wornElsewhere){
  let n=1,id;do{id=String(item.id).slice(0,80)+':copy:'+n++;}while(findItem(u,id));item.quantity--;const copy={...item,id,quantity:1,cards:[],...(item.enchants?{enchants:structuredClone(item.enchants)}:{})};u.roInventory.push(copy);item=copy;itemId=copy.id;
 }
 for(const position of RO_EQUIPMENT_SLOTS)if(u.roEquipment[position]===itemId)u.roEquipment[position]=null;
 if(slot==='weapon'&&definition.hands===2)u.roEquipment.offhand=null;
 u.roEquipment[slot]=itemId;return true;
}
export function roUnequip(u,slot){if(!u.roEquipment?.[slot]||roBagUsage(u)>=RO_BAG_CAPACITY)return false;u.roEquipment[slot]=null;return true;}
export function roSocket(u,cardId,itemId){
 const item=findItem(u,itemId),cards=Array.isArray(u?.roCards)?u.roCards:[],index=cards.findIndex(card=>card&&card.id===cardId&&own(RO_CARDS,card.key));
 if(!item||index<0||!Array.isArray(item.cards))return false;
 const definition=RO_EQUIPMENT[item.key],card=cards[index],cardSpec=RO_CARDS[card.key];
 if(cardSpec.slot!==roSlotType(definition.slot)||item.cards.length>=definition.sockets||inventory(u).some(gear=>Array.isArray(gear.cards)&&gear.cards.some(existing=>existing?.id===cardId)))return false;
 item.cards.push({id:card.id,key:card.key});cards.splice(index,1);return true;
}
export function roDrop(u,itemId){
 const items=inventory(u),index=items.findIndex(item=>item?.id===itemId);
 if(index>=0){for(const slot of RO_EQUIPMENT_SLOTS)if(u.roEquipment?.[slot]===itemId)u.roEquipment[slot]=null;items.splice(index,1);return true;}
 const cards=Array.isArray(u?.roCards)?u.roCards:[],cardIndex=cards.findIndex(card=>card?.id===itemId);if(cardIndex<0)return false;cards.splice(cardIndex,1);return true;
}
export function roEquipmentBonuses(u){
 const bonuses={str:0,agi:0,vit:0,int:0,dex:0,luk:0,maxHp:0,attack:0,armor:0,matk:0,moveSpeed:0,crit:0,haste:0,flee:0,perfectEvasion:0,variableCastReduction:0,fixedCastReduction:0,fixedCastSeconds:0,afterCastReduction:0,doubleAttackLevel:0,hit:0,magicDefense:0,maxMana:0,attackRate:0,magicAttackRate:0,maxHpRate:0,maxManaRate:0,critDamage:0,healPower:0,rangedDamage:0,meleeDamage:0,spCostReduction:0,flatAspd:0,hpOnKill:0,spOnHit:0,rangedResistance:0,armorRate:0,softDefenseRate:0,reflectPhysical:0,reflectMagic:0,hpRecoveryRate:0,spRecoveryRate:0,receivedHealPower:0,perfectHit:0,bossDamage:0,normalDamage:0},seenItems=new Set(),seenCards=new Set();
 const add=stats=>{for(const[key,value]of Object.entries(stats||{}))if(Number.isFinite(value)&&typeof bonuses[key]==='number')bonuses[key]=key==='fixedCastReduction'?Math.max(bonuses[key],value):bonuses[key]+value;};
 const main=findItem(u,u?.roEquipment?.weapon),twoHanded=main&&RO_EQUIPMENT[main.key].hands===2;
 for(const slot of RO_EQUIPMENT_SLOTS){const item=findItem(u,u?.roEquipment?.[slot]);if(!item||seenItems.has(item.id)||!fits(u,item,slot)||!roEquipmentLevelAllowed(u,RO_EQUIPMENT[item.key])||slot==='offhand'&&twoHanded)continue;seenItems.add(item.id);
  const base=RO_EQUIPMENT[item.key],context={...u,roSourceSkillLevels:Object.fromEntries(Object.entries(u.bonkBuild?.weapons||{}).map(([key,level])=>[roSkillSource({key}),level])),roEquippedSourceIds:Object.values(u.roEquipment||{}).map(id=>RO_EQUIPMENT[findItem(u,id)?.key]?.sourceId).filter(Boolean)},native=roNativeEquipment(base.sourceId,context,item),definition=native?{...base,...native}:base;add(definition.stats);if(definition.onHit?.length)(bonuses.onHit||=[]).push(...definition.onHit);for(const flag of ['ignoreSize','noCastCancel','noGemStone'])if(definition[flag])bonuses[flag]=true;for(const field of ['ignoreBossDefense','ignoreNormalDefense','ignoreBossMagicDefense','ignoreNormalMagicDefense'])bonuses[field]=Math.max(bonuses[field]||0,definition[field]||0);for(const field of ['monsterDamage','ignoreDefense','statusResistance'])for(const [key,n]of Object.entries(definition[field]||{})){const target=bonuses[field]||={};target[key]=(target[key]||0)+n;}bonuses.doubleAttackLevel=Math.max(bonuses.doubleAttackLevel,definition.doubleAttackLevel||0);if(definition.armorElement)bonuses.armorElement=definition.armorElement;if(slot==='weapon'&&definition.weaponElement)bonuses.weaponElement=definition.weaponElement;const refinement=Math.max(0,Math.min(10,item.refine||0));if(refinement){if(definition.slot==='weapon'){bonuses.attack+=(definition.stats.attack||0)*refinement*.05;bonuses.matk+=(definition.stats.matk||0)*refinement*.05;}else bonuses.armor+=refinement*.3;}
  for(const [key,values]of Object.entries(definition.skillBonuses||{})){const target=(bonuses.skillBonuses||={})[key]||={};for(const [stat,value]of Object.entries(values))target[stat]=(target[stat]||0)+value;}
  for(const family of ['elementalPower','elementalResistance',...RO_TARGET_BONUS_FAMILIES])for(const [key,value]of Object.entries(definition[family]||{})){const target=bonuses[family]||={};target[key]=(target[key]||0)+value;}
  for(const entry of (Array.isArray(item.cards)?item.cards:[]).slice(0,definition.sockets)){if(!entry||seenCards.has(entry.id)||!own(RO_CARDS,entry.key)||RO_CARDS[entry.key].slot!==roSlotType(definition.slot))continue;seenCards.add(entry.id);add(RO_CARDS[entry.key].stats);}
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
