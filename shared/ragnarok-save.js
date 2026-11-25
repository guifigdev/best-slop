import {RO_CHARACTER_LIMIT} from './ro-account-limits.js';
import {validateRoWarehouse} from './ro-kafra.js';
import {roIsMount} from './ro-mounts.js';
import {validateRoMerchantPurchases} from './ro-secret-merchants.js';
import {validateRoEnchants,validateRoLegacyEnchants} from './ro-equipment-enchants.js';
import {RO_TOWER_FLOORS} from './ragnarok-tower.js';
import {validateConsumables} from './consumables.js';
import {roJobLevelCap} from './ro-job-progression.js';
import {RO_LEARNED_SKILL_LIMIT,RO_ACTIVE_SLOT_COUNT,roIsPassive} from './ro-skill-loadout.js';
import {RO_LINEAGES} from './ragnarok-jobs.js';
import {RO_EQUIPMENT,RO_EQUIPMENT_SLOTS,RO_BAG_CAPACITY,roBagUsage,roItemFitsSlot} from './ragnarok-equipment.js';
import {BONK_WEAPONS,BONK_TOMES,BONK_RELICS,BONK_STAGES} from './bonk-catalog.js';
import {RO_WORLD_ROUTE,roRouteStage} from './ro-world-route.js';
const own=(o,k)=>typeof k==='string'&&Object.hasOwn(o,k),num=(v,min,max)=>Number.isFinite(v)&&v>=min&&v<=max;
const attrs=['str','agi','vit','int','dex','luk'];
const ranked=(value,catalog,max,limit)=>{if(!value||Array.isArray(value)||typeof value!=='object')return null;const entries=Object.entries(value);if(entries.length>limit||entries.some(([k,v])=>!own(catalog,k)||!Number.isInteger(v)||v<1||v>max))return null;return Object.fromEntries(entries);};
export function validateRoCheckpoint(value){
 const graph=value?.routeVersion===2,connected=value?.routeVersion===1||graph;const merchantPurchases=validateRoMerchantPurchases(value?.merchantPurchases);if(!merchantPurchases)return null;
 if(!value||value.version!==1||value.routeVersion!==undefined&&value.routeVersion!==0&&value.routeVersion!==1&&value.routeVersion!==2||!own(RO_LINEAGES,value.lineage)||!['adventure','tower'].includes(value.activity)||connected&&value.activity!=='adventure'||!num(value.seed,0,4294967295)||!Number.isInteger(value.floor)||!num(value.floor,1,value.activity==='tower'?RO_TOWER_FLOORS:connected?RO_WORLD_ROUTE.length:4))return null;
 let cleared,route={},stageKey;
 if(graph){
  const region=roRouteStage(value.routeIndex),validKeys=keys=>Array.isArray(keys)&&keys.length<=RO_WORLD_ROUTE.length&&new Set(keys).size===keys.length&&keys.every(key=>typeof key==='string'&&roRouteStage(key));
  if(!Number.isInteger(value.routeIndex)||!region||typeof value.routeBossDefeated!=='boolean'||!num(value.totalElapsed,0,1e9)||value.floor!==region.index+1||value.stageKey!==region.scene||!validKeys(value.clearedStages)||!validKeys(value.visitedStages))return null;
  const visited=new Set(value.visitedStages);if(!visited.has(region.key)||value.clearedStages.some(key=>!visited.has(key))||value.routeBossDefeated!==value.clearedStages.includes(region.key))return null;
  cleared=[...value.clearedStages];stageKey=region.scene;route={routeVersion:2,routeIndex:region.index,routeBossDefeated:value.routeBossDefeated,visitedStages:[...value.visitedStages],totalElapsed:value.totalElapsed};
 }else if(connected){
  const region=roRouteStage(value.routeIndex);if(!Number.isInteger(value.routeIndex)||!region||typeof value.routeBossDefeated!=='boolean'||!num(value.totalElapsed,0,1e9)||value.floor!==region.index+1||value.stageKey!==region.scene||!Array.isArray(value.clearedStages))return null;
  const prefix=RO_WORLD_ROUTE.slice(0,region.index+Number(value.routeBossDefeated)).map(r=>r.key);if(value.clearedStages.length!==prefix.length||prefix.some((key,i)=>value.clearedStages[i]!==key))return null;
  cleared=[...prefix];stageKey=region.scene;route={routeVersion:1,routeIndex:region.index,routeBossDefeated:value.routeBossDefeated,totalElapsed:value.totalElapsed};
 }else{
  if(value.routeIndex!==undefined||value.routeBossDefeated!==undefined)return null;
  cleared=Array.isArray(value.clearedStages)?value.clearedStages.slice(0,value.activity==='tower'?RO_TOWER_FLOORS-1:3).filter(k=>own(BONK_STAGES,k)):[];if(cleared.length!==value.floor-1)return null;stageKey=own(BONK_STAGES,value.stageKey)?value.stageKey:'grove';
 }
 const u=value.hero;if(!u||!num(u.level,1,150)||!Number.isInteger(u.level)||!num(u.xp,0,20000)||!num(u.gold,0,1e7)||!num(u.roTier,0,3)||!Number.isInteger(u.roTier)||!num(u.attributePoints,0,10000)||!num(u.hp,0,1e6)||!u.attributes||attrs.some(k=>!Number.isInteger(u.attributes[k])||!num(u.attributes[k],1,u.roTier>=2?130:99)))return null;
 if(u.roJobLevel!==undefined&&(!Number.isInteger(u.roJobLevel)||!num(u.roJobLevel,1,roJobLevelCap(u.roTier)))||u.roJobXp!==undefined&&!num(u.roJobXp,0,20000))return null;
 if(u.bonkPendingLevels!==undefined&&(!Number.isInteger(u.bonkPendingLevels)||!num(u.bonkPendingLevels,0,300)))return null;
 const weapons=ranked(u.bonkBuild?.weapons,{basic:{},...BONK_WEAPONS},8,RO_LEARNED_SKILL_LIMIT),tomes=ranked(u.bonkBuild?.tomes,BONK_TOMES,8,4),relics=ranked(u.bonkBuild?.relics,BONK_RELICS,999,32);if(!weapons||!tomes||!relics)return null;
 let consumables=null;if(u.consumables!==undefined){consumables=validateConsumables(u.consumables);if(!consumables)return null;}
 let skillAuto=null;if(u.bonkSkillAuto!==undefined){if(!u.bonkSkillAuto||Array.isArray(u.bonkSkillAuto)||typeof u.bonkSkillAuto!=='object')return null;const entries=Object.entries(u.bonkSkillAuto);if(entries.length>RO_LEARNED_SKILL_LIMIT||entries.some(([key,enabled])=>!Object.hasOwn(weapons,key)||typeof enabled!=='boolean'))return null;skillAuto=Object.fromEntries(entries);}
 let skillSlots=null;if(u.bonkSkillSlots!==undefined){const v=u.bonkSkillSlots;if(!Array.isArray(v)||![4,8,RO_ACTIVE_SLOT_COUNT].includes(v.length)||v.some(k=>k!==null&&(typeof k!=='string'||!Object.hasOwn(weapons,k)||roIsPassive(k)))||new Set(v.filter(Boolean)).size!==v.filter(Boolean).length||weapons.basic&&v[0]!=='basic')return null;skillSlots=Array.from({length:RO_ACTIVE_SLOT_COUNT},(_,i)=>v[i]??null);}
 // Copies are stacked: this is a malformed-payload guard, not bag slots.
 if(!Array.isArray(u.roInventory)||u.roInventory.length>4096)return null;const ids=new Set(),inventory=[];
 for(const item of u.roInventory){if(!item||typeof item.id!=='string'||item.id.length>100||ids.has(item.id)||!own(RO_EQUIPMENT,item.key)||item.refine!==undefined&&(!Number.isInteger(item.refine)||item.refine<0||item.refine>10)||item.quantity!==undefined&&(!Number.isSafeInteger(item.quantity)||item.quantity<1))return null;const enchants=validateRoEnchants(item.enchants);if(!enchants)return null;ids.add(item.id);inventory.push({id:item.id,key:item.key,cards:[],...(item.refine?{refine:item.refine}:{}),...(Object.keys(enchants).length?{enchants}:{}),...(item.quantity>1?{quantity:item.quantity}:{})});}
 const equipment={};for(const slot of RO_EQUIPMENT_SLOTS){const id=u.roEquipment?.[slot];equipment[slot]=ids.has(id)&&roItemFitsSlot({...u,roLineage:value.lineage},inventory.find(i=>i.id===id),slot)?id:null;}
 if(u.roBagVersion===1&&roBagUsage({roInventory:inventory,roEquipment:equipment})>RO_BAG_CAPACITY)return null;
 const pending=[];if(u.roUnclaimed!==undefined&&!Array.isArray(u.roUnclaimed))return null;if((u.roUnclaimed||[]).length>4096)return null;for(const item of u.roUnclaimed||[]){if(!item||typeof item.id!=='string'||item.id.length>100||ids.has(item.id)||!own(RO_EQUIPMENT,item.key)||item.refine!==undefined&&(!Number.isInteger(item.refine)||item.refine<0||item.refine>10)||item.quantity!==undefined&&(!Number.isSafeInteger(item.quantity)||item.quantity<1))return null;const enchants=validateRoEnchants(item.enchants);if(!enchants)return null;ids.add(item.id);pending.push({id:item.id,key:item.key,cards:[],...(item.refine?{refine:item.refine}:{}),...(Object.keys(enchants).length?{enchants}:{}),...(item.quantity>1?{quantity:item.quantity}:{})});}
 if(u.roMountSkill!==undefined&&u.roMountSkill!==null&&(!roIsMount(u.roMountSkill)||!weapons[u.roMountSkill]))return null;
 if(u.roBlacksmithBlessings!==undefined&&(!Number.isSafeInteger(u.roBlacksmithBlessings)||u.roBlacksmithBlessings<0||u.roBlacksmithBlessings>999999))return null;
 const legacyEnchants=validateRoLegacyEnchants(u.roLegacyEnchants);if(!legacyEnchants)return null;
 return {version:1,lineage:value.lineage,activity:value.activity,seed:Math.floor(value.seed),floor:value.floor,stageKey,clearedStages:cleared,...route,...(merchantPurchases.length?{merchantPurchases}:{}),hero:{roBlacksmithBlessings:u.roBlacksmithBlessings||0,...(u.roMountSkill!==undefined?{roMountSkill:u.roMountSkill}:{}),...(Object.keys(legacyEnchants).length?{roLegacyEnchants:legacyEnchants}:{}),...(u.roBagVersion===1?{roBagVersion:1}:{}),roProgressionVersion:u.roProgressionVersion===2?2:1,...(consumables?{consumables}:{}),level:u.level,bonkPendingLevels:u.bonkPendingLevels||0,mana:num(u.mana,0,1e6)?u.mana:50+u.attributes.int*8,xp:u.xp,gold:u.gold,roTier:u.roTier,roJobLevel:u.roJobLevel??Math.min(roJobLevelCap(u.roTier),1+Math.floor((u.level-1)*1.5)),roJobXp:u.roJobXp||0,attributePoints:Math.floor(u.attributePoints),attributes:Object.fromEntries(attrs.map(k=>[k,u.attributes[k]])),hp:u.hp,...(skillAuto?{bonkSkillAuto:skillAuto}:{}),...(skillSlots?{bonkSkillSlots:skillSlots}:{}),bonkBuild:{weapons,tomes,relics},roInventory:inventory,roEquipment:equipment,roUnclaimed:pending}};
}
export function createRoCheckpoint(game){
 if(game?.options?.bonkDebug===true)return null;
 const u=game?.units?.find(u=>u.bonkHero),b=game?.bonk;if(!u||!b)return null;
 // Checkpoints resume at the floor entrance. Enemy positions and transient
 // missiles are intentionally not persisted; character development is.
 if((b.routeVersion===1||b.routeVersion===2)&&b.activity==='adventure')return validateRoCheckpoint({version:1,lineage:u.roLineage,activity:'adventure',seed:game.worldSeed>>>0,floor:b.routeIndex+1,stageKey:b.map.stageKey,clearedStages:b.clearedStages,routeVersion:b.routeVersion,routeIndex:b.routeIndex,routeBossDefeated:b.routeBossDefeated,...(b.routeVersion===2?{visitedStages:b.visitedStages}:{}),totalElapsed:b.totalElapsed??0,merchantPurchases:b.merchantPurchases,hero:u});
 const activity=b.activity||'adventure',limit=activity==='tower'?RO_TOWER_FLOORS:4,cleared=b.clearedStages.slice(0,limit-1),floor=cleared.length+1,next=b.stage==='cleared'&&activity==='adventure'?Object.keys(BONK_STAGES).find(k=>!cleared.includes(k)):b.map.stageKey;
 return validateRoCheckpoint({version:1,lineage:u.roLineage,activity,seed:game.worldSeed>>>0,floor,stageKey:next||b.map.stageKey,clearedStages:cleared,merchantPurchases:b.merchantPurchases,hero:u});
}
export function validateRoProgress(value){
 const warehouse=validateRoWarehouse(value?.warehouse);if(!warehouse)return null;
 if(!value||value.version!==1||!Array.isArray(value.characters)||value.characters.length>RO_CHARACTER_LIMIT)return null;const characters=[],ids=new Set();
 for(const c of value.characters){if(!c||typeof c.id!=='string'||!/^[a-zA-Z0-9_-]{1,64}$/.test(c.id)||ids.has(c.id)||!own(RO_LINEAGES,c.lineage))return null;const checkpoint=validateRoCheckpoint(c.checkpoint);if(!checkpoint||checkpoint.lineage!==c.lineage)return null;const checkpoints={};for(const activity of ['adventure','tower'])if(c.checkpoints?.[activity]){const saved=validateRoCheckpoint(c.checkpoints[activity]);if(!saved||saved.lineage!==c.lineage||saved.activity!==activity)return null;checkpoints[activity]=saved;}checkpoints[checkpoint.activity]=checkpoint;ids.add(c.id);characters.push({checkpoints,id:c.id,name:String(c.name||RO_LINEAGES[c.lineage].names[0]).replace(/[\u0000-\u001f\u007f]/g,'').slice(0,30),lineage:c.lineage,checkpoint,updatedAt:num(c.updatedAt,0,1e14)?c.updatedAt:0});}
 const deleted=value.deletedCharacters??[];if(!Array.isArray(deleted)||deleted.length>4096||deleted.some(id=>typeof id!=='string'||!/^[a-zA-Z0-9_-]{1,64}$/.test(id)))return null;
 const deletedCharacters=[...new Set(deleted)].sort(),removed=new Set(deletedCharacters),kept=characters.filter(c=>!removed.has(c.id));
 return {version:1,warehouse,...(deletedCharacters.length?{deletedCharacters}:{}),characters:kept,selectedCharacter:kept.some(c=>c.id===value.selectedCharacter)?value.selectedCharacter:kept[0]?.id||null};
}
