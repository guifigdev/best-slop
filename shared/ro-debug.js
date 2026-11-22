import {RO_LINEAGES,roLineage,advanceRoJob} from './ragnarok-jobs.js';
import {roRouteStage} from './ro-world-route.js';

export const RO_DEBUG_SAVE_KEY='customhero.ro.debug.v1';
export const RO_DEBUG_MAX_LEVEL=150;
const debugGame=game=>game?.options?.mode==='bonk'&&game.options.bonkDebug===true;

// This preset is intentionally regenerated rather than merged with an account
// character. Its saved format contains no inventory, cards, identity or rewards.
export function initializeRoDebugHero(game,unit){
 if(!debugGame(game)||!unit?.bonkHero)return false;
 const lineage=roLineage(unit.roLineage||game.options.bonkLineage);unit.roLineage=lineage.key;
 Object.assign(unit,{roDebug:true,level:RO_DEBUG_MAX_LEVEL,xp:0,attributePoints:0,skillPoints:0,bonkPendingLevels:0,attributes:{str:99,agi:99,vit:99,int:99,dex:99,luk:99},gold:999999,alive:true,maxHp:1e6,hp:1e6,maxMana:1e6,mana:1e6});
 advanceRoJob(unit,3);
 const signature={dragonknight:['bash','bowlingbash','dragonbreath'],imperialguard:['shieldboomerang','overbrand','crossrain'],archmage:['fireball','stormgust','chainlightning'],elementalmaster:['fireball','heavensdrive','psychicwave'],windhawk:['doublestrafe','blitzbeat','arrowstorm'],troubadour:['musicalstrike','severerainstorm','rhythmshooting'],cardinal:['holylight','judex','adoramus'],inquisitor:['fingeroffensive','tigercannon','explosionblaster'],meister:['hammerfall','axetornado','mightySmash'],biolo:['demonstration','cartcannon','mayhemicthorns'],shadowcross:['sonicblow','rollingcutter','eternalslash'],abysschaser:['backstab','triangleShot','abysssquare']};
 unit.bonkSkillSlots=['basic',...signature[lineage.key]];unit.bonkBuild={weapons:Object.fromEntries(['basic',...lineage.skills].map(key=>[key,8])),tomes:{damage:8,haste:8,area:8,speed:8},relics:{ironacorn:3,giantbone:2,travelersboots:2,silvermirror:2}};
 unit.bonkWeaponAt={};return true;
}

export function validateRoDebugSave(value){
 if(!value||value.version!==1||value.debug!==true||typeof value.lineage!=='string'||!Object.hasOwn(RO_LINEAGES,value.lineage))return null;
 const region=typeof value.regionKey==='string'?roRouteStage(value.regionKey):Number.isInteger(value.routeIndex)?roRouteStage(value.routeIndex):null;
 if(!region||value.routeIndex!==undefined&&(!Number.isInteger(value.routeIndex)||value.routeIndex!==region.index)||value.regionKey!==undefined&&value.regionKey!==region.key)return null;
 const clock=value.clock===undefined?0:value.clock;if(!Number.isFinite(clock)||clock<0||clock>1e9)return null;
 return{version:1,debug:true,lineage:value.lineage,regionKey:region.key,clock};
}

export function createRoDebugSave(game){
 if(!debugGame(game))return null;const unit=game.units?.find(u=>u.bonkHero),region=roRouteStage(game.bonk?.routeIndex);if(!unit||!region)return null;
 return validateRoDebugSave({version:1,debug:true,lineage:unit.roLineage,regionKey:region.key,clock:game.bonk.totalElapsed??0});
}
