import {PHASE_KILLER_MAP} from '../shared/phase-killer-catalog.js';
import {KODO_TAG_MAP} from '../shared/kodo-tag-catalog.js';
import {TREE_TAG_RULES} from '../shared/tree-tag-catalog.js';
export function cameraBounds(state){if(state?.options?.mode==='phasekiller')return PHASE_KILLER_MAP[state.phaseKiller?.dimension||'normal'];if(state?.options?.mode==='kodotag'){const m=state.kodoTag?.map||KODO_TAG_MAP;return{minX:m.minX,maxX:m.maxX,minZ:m.minZ,maxZ:m.maxZ};}if(state?.options?.mode==='treetag'){const m=state.treeTag?.map||TREE_TAG_RULES.map;return{minX:m.minX,maxX:m.maxX,minZ:m.minZ,maxZ:m.maxZ};}if(state?.options?.mode==='warlock'){const r=state.warlock?.mapRadius||32;return{minX:-r,maxX:r,minZ:-r,maxZ:r};}if(state?.options?.mode==='castlefight'){const m=state.castleFight?.map;return {minX:m?.minX??-52,maxX:m?.maxX??52,minZ:m?.minZ??-28,maxZ:m?.maxZ??28};}const m=state?.options?.mode==='linewars'&&state.voxelMap;return m?{minX:m.origin.x-3,maxX:m.origin.x+m.width*m.tileSize+3,minZ:m.origin.z-3,maxZ:m.origin.z+m.height*m.tileSize+3}:{minX:-35,maxX:35,minZ:-35,maxZ:35};}
export const cameraDragIsPan=(event,mode='pan')=>(event.pointerType==='touch'||event.button===0)&&mode==='pan';
// Coordinates are already local to the displayed player's arena.
export function cameraDestination(state,owner,zone='battle'){
 const map=state?.voxelMap,m=map?.markers||{},hero=state?.units?.find(u=>u.id===state.players?.[owner]),fountain=m.fountain||hero||{x:0,z:0};
 if(state?.options?.mode==='phasekiller')return{x:hero?.x??15.875,z:hero?.z??-7.75,distance:zone==='overview'?110:47};
 if(state?.options?.mode==='kodotag')return zone==='overview'?{x:0,z:-2,distance:110}:{x:hero?.x||0,z:hero?.z||0,distance:45};
 if(state?.options?.mode==='warlock')return{x:0,z:0,distance:zone==='overview'?112:84};if(state?.options?.mode==='treetag'&&zone==='overview')return{x:0,z:0,distance:Math.min(230,(state.treeTag?.map?.width||TREE_TAG_RULES.map.width)*1.55)};
 if(zone==='base')return{...fountain,distance:44};
 if(zone==='recruitment'){const houses=state?.lineWars?.buildings?.filter(b=>b.owner===owner)||[],points=houses.length?houses:m.buildings||[];return points.length?{x:points.reduce((s,p)=>s+p.x,0)/points.length,z:points.reduce((s,p)=>s+p.z,0)/points.length,distance:45}:{...fountain,distance:45};}
 if(zone==='overview'&&map)return{x:map.origin.x+map.width*map.tileSize/2,z:map.origin.z+map.height*map.tileSize/2,distance:Math.min(230,Math.max(map.width,map.height)*map.tileSize*1.65)};
 return{x:hero?.x??m.heroSpawn?.x??0,z:hero?.z??m.heroSpawn?.z??0,distance:49};
}
