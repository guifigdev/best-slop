import {PHASE_KILLER_MAP as MAP} from './phase-killer-catalog.js';
import {phaseKillerWorldObstacles,phaseKillerForestObstacles} from './phase-killer-world.js';
import {invalidatePhaseKillerNavigation} from './phase-killer-navigation.js';
const realms=['normal','aether','omni'];
const pointChildren=['destination','position','point','goal','origin','from','to','start','end','targetPoint','lastKnown','cell','route','routes','path','paths','points','waypoints','center','centre','anchor','location','pkPending','pkBotGoal','pkEscapeGoal','pkTargetPoint','pkGoal','pkRoute','pkWaypoints','pkLastPosition','pkAiGoal','pkAiDestination'];
const coordinatePairs=[['x','z'],['tx','tz'],['tX','tZ'],['ex','ez'],['startX','startZ'],['endX','endZ']];
const values=value=>Array.isArray(value)?value:value instanceof Map?[...value.values()]:value&&typeof value==='object'?Object.values(value):[];
const isDestroyed=object=>object?.alive===false||object?.destroyed===true||object?.hp===0;

// Coordinate-only migration: never traverse inventories, native ability data or
// numeric stats. Aliased destinations are visited once, even across collections.
export function migratePhaseKillerScale(game){
 if(game?.options?.mode!=='phasekiller')return false;
 const state=game.phaseKiller,target=MAP.worldScale,stored=state?state.worldScale:game.phaseWorldScale,source=Number.isFinite(stored)&&stored>0?stored:1;
 if(source===target){game.phaseWorldScale=target;return false;}
 const factor=target/source,seen=new WeakSet();
 function walk(value,convert){
  if(!value||typeof value!=='object'||seen.has(value))return;seen.add(value);
  if(value instanceof Map){for(const point of value.values())walk(point,convert);return;}
  if(Array.isArray(value)){
   if((value.length===2||value.length===3)&&value.every(Number.isFinite)){const second=value.length===3?2:1,next=convert(value[0],value[second]);value[0]=next.x;value[second]=next.z;return;}
   for(const point of value)walk(point,convert);return;
  }
  for(const [x,z]of coordinatePairs)if(Number.isFinite(value[x])&&Number.isFinite(value[z])){const next=convert(value[x],value[z]);value[x]=next.x;value[z]=next.z;}
  for(const key of pointChildren)walk(value[key],convert);
 }
 const scaled=(x,z)=>({x:x*factor,z:z*factor}),native=MAP.nativeReference;
 const lobbyTranslation=dimension=>{const layer=realms.indexOf(dimension),dx=MAP.spawn.x-native.spawn.x*source,dz=MAP.spawn.z+Math.max(0,layer)*MAP.layerOffset-(native.spawn.z+Math.max(0,layer)*native.layerOffset)*source;return(x,z)=>({x:x+dx,z:z+dz});};
 for(const unit of game.units||[])walk(unit,state?scaled:lobbyTranslation(unit.pkDimension));
 for(const key of ['effects','projectiles','specials','drops','bossWarnings','obstacles','cells','routes','paths'])walk(game[key],state?scaled:lobbyTranslation('normal'));
 if(state){
  for(const key of ['loot','corpses','fields','markers','routes','paths','spawnPoints','ambientTargets'])walk(state[key],scaled);
  const oldBuildings=values(state.buildings).filter(o=>o&&typeof o==='object'),byId=new Map(oldBuildings.map(b=>[b.id,b])),destroyed=new Set([...(state.destroyedSceneryIds||[]),...(state.destroyedForestIds||[])]);
  for(const collection of [oldBuildings,values(state.forest),values(state.trees),values(state.obstacles),values(state.scenery),game.obstacles||[]])for(const object of collection)if(isDestroyed(object)&&object.id!=null)destroyed.add(object.id);
  state.buildings=phaseKillerWorldObstacles().map(building=>{const old=byId.get(building.id);for(const key of ['hp','maxHp','damagedAt'])if(old&&Object.hasOwn(old,key))building[key]=old[key];if(destroyed.has(building.id)){building.alive=false;building.destroyed=true;}return building;});
  // Keep compact destruction records, rather than persisting thousands of
  // generated forest footprints in every multiplayer room document.
  state.destroyedSceneryIds=[...destroyed];
  if(Array.isArray(state.forest)){const fresh=new Map(realms.flatMap(dimension=>phaseKillerForestObstacles(dimension)).map(o=>[o.id,o]));walk(state.forest,scaled);state.forest=state.forest.map(old=>({...old,...fresh.get(old.id),...(destroyed.has(old.id)?{alive:false,destroyed:true}:{})}));}
  for(const key of ['trees','obstacles','scenery'])walk(state[key],scaled);
  state.worldScale=target;state.sceneryRevision=(state.sceneryRevision||0)+1;
 }
 game.phaseWorldScale=target;game.bounds=MAP.bounds;game.obstacleRevision=(game.obstacleRevision||0)+1;invalidatePhaseKillerNavigation(game);return true;
}
