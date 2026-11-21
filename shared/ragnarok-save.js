import {RO_LINEAGES} from './ragnarok-jobs.js';
import {RO_EQUIPMENT} from './ragnarok-equipment.js';
import {BONK_WEAPONS,BONK_TOMES,BONK_RELICS,BONK_STAGES} from './bonk-catalog.js';
const own=(o,k)=>typeof k==='string'&&Object.hasOwn(o,k),num=(v,min,max)=>Number.isFinite(v)&&v>=min&&v<=max;
const attrs=['str','agi','vit','int','dex','luk'];
const ranked=(value,catalog,max,limit)=>{if(!value||Array.isArray(value)||typeof value!=='object')return null;const entries=Object.entries(value);if(entries.length>limit||entries.some(([k,v])=>!own(catalog,k)||!Number.isInteger(v)||v<1||v>max))return null;return Object.fromEntries(entries);};
export function validateRoCheckpoint(value){
 if(!value||value.version!==1||!own(RO_LINEAGES,value.lineage)||!['adventure','tower'].includes(value.activity)||!num(value.seed,0,4294967295)||!Number.isInteger(value.floor)||!num(value.floor,1,value.activity==='tower'?100:4))return null;
 const u=value.hero;if(!u||!num(u.level,1,150)||!Number.isInteger(u.level)||!num(u.xp,0,20000)||!num(u.gold,0,1e7)||!num(u.roTier,0,3)||!Number.isInteger(u.roTier)||!num(u.attributePoints,0,10000)||!num(u.hp,0,1e6)||!u.attributes||attrs.some(k=>!Number.isInteger(u.attributes[k])||!num(u.attributes[k],1,99)))return null;
 if(u.bonkPendingLevels!==undefined&&(!Number.isInteger(u.bonkPendingLevels)||!num(u.bonkPendingLevels,0,300)))return null;
 const weapons=ranked(u.bonkBuild?.weapons,{basic:{},...BONK_WEAPONS},8,4),tomes=ranked(u.bonkBuild?.tomes,BONK_TOMES,8,4),relics=ranked(u.bonkBuild?.relics,BONK_RELICS,999,32);if(!weapons||!tomes||!relics)return null;
 if(!Array.isArray(u.roInventory)||u.roInventory.length>48)return null;const ids=new Set(),inventory=[];
 for(const item of u.roInventory){if(!item||typeof item.id!=='string'||item.id.length>100||ids.has(item.id)||!own(RO_EQUIPMENT,item.key))return null;ids.add(item.id);inventory.push({id:item.id,key:item.key,cards:[]});}
 const equipment={};for(const slot of ['weapon','offhand','armor','garment','shoes','accessory','head']){const id=u.roEquipment?.[slot];equipment[slot]=ids.has(id)?id:null;}
 const pending=[];if(u.roUnclaimed!==undefined&&!Array.isArray(u.roUnclaimed))return null;if((u.roUnclaimed||[]).length>128)return null;for(const item of u.roUnclaimed||[]){if(!item||typeof item.id!=='string'||item.id.length>100||ids.has(item.id)||!own(RO_EQUIPMENT,item.key))return null;ids.add(item.id);pending.push({id:item.id,key:item.key,cards:[]});}
 const cleared=Array.isArray(value.clearedStages)?value.clearedStages.slice(0,value.activity==='tower'?99:3).filter(k=>own(BONK_STAGES,k)):[];
 if(cleared.length!==value.floor-1)return null;
 return {version:1,lineage:value.lineage,activity:value.activity,seed:Math.floor(value.seed),floor:value.floor,stageKey:own(BONK_STAGES,value.stageKey)?value.stageKey:'grove',clearedStages:cleared,hero:{level:u.level,bonkPendingLevels:u.bonkPendingLevels||0,mana:num(u.mana,0,1e6)?u.mana:50+u.attributes.int*8,xp:u.xp,gold:u.gold,roTier:u.roTier,attributePoints:Math.floor(u.attributePoints),attributes:Object.fromEntries(attrs.map(k=>[k,u.attributes[k]])),hp:u.hp,bonkBuild:{weapons,tomes,relics},roInventory:inventory,roEquipment:equipment,roUnclaimed:pending}};
}
export function createRoCheckpoint(game){
 const u=game?.units?.find(u=>u.bonkHero),b=game?.bonk;if(!u||!b)return null;
 // Checkpoints resume at the floor entrance. Enemy positions and transient
 // missiles are intentionally not persisted; character development is.
 const activity=b.activity||'adventure',limit=activity==='tower'?100:4,cleared=b.clearedStages.slice(0,limit-1),floor=cleared.length+1,next=b.stage==='cleared'&&activity==='adventure'?Object.keys(BONK_STAGES).find(k=>!cleared.includes(k)):b.map.stageKey;
 return validateRoCheckpoint({version:1,lineage:u.roLineage,activity,seed:game.worldSeed>>>0,floor,stageKey:next||b.map.stageKey,clearedStages:cleared,hero:u});
}
export function validateRoProgress(value){
 if(!value||value.version!==1||!Array.isArray(value.characters)||value.characters.length>12)return null;const characters=[],ids=new Set();
 for(const c of value.characters){if(!c||typeof c.id!=='string'||!/^[a-zA-Z0-9_-]{1,64}$/.test(c.id)||ids.has(c.id)||!own(RO_LINEAGES,c.lineage))return null;const checkpoint=validateRoCheckpoint(c.checkpoint);if(!checkpoint||checkpoint.lineage!==c.lineage)return null;const checkpoints={};for(const activity of ['adventure','tower'])if(c.checkpoints?.[activity]){const saved=validateRoCheckpoint(c.checkpoints[activity]);if(!saved||saved.lineage!==c.lineage||saved.activity!==activity)return null;checkpoints[activity]=saved;}checkpoints[checkpoint.activity]=checkpoint;ids.add(c.id);characters.push({checkpoints,id:c.id,name:String(c.name||RO_LINEAGES[c.lineage].names[0]).replace(/[\u0000-\u001f\u007f]/g,'').slice(0,30),lineage:c.lineage,checkpoint,updatedAt:num(c.updatedAt,0,1e14)?c.updatedAt:0});}
 return {version:1,characters,selectedCharacter:ids.has(value.selectedCharacter)?value.selectedCharacter:characters[0]?.id||null};
}
