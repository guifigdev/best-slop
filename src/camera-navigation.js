export function cameraBounds(state){const m=state?.options?.mode==='linewars'&&state.voxelMap;return m?{minX:m.origin.x-3,maxX:m.origin.x+m.width*m.tileSize+3,minZ:m.origin.z-3,maxZ:m.origin.z+m.height*m.tileSize+3}:{minX:-35,maxX:35,minZ:-35,maxZ:35};}
export const cameraDragIsPan=event=>event.button===1&&!event.ctrlKey;
// Coordinates are already local to the displayed player's arena.
export function cameraDestination(state,owner,zone='battle'){
 const map=state?.voxelMap,m=map?.markers||{},hero=state?.units?.find(u=>u.id===state.players?.[owner]),fountain=m.fountain||hero||{x:0,z:0};
 if(zone==='base')return{...fountain,distance:44};
 if(zone==='recruitment'){const houses=state?.lineWars?.buildings?.filter(b=>b.owner===owner)||[],points=houses.length?houses:m.buildings||[];return points.length?{x:points.reduce((s,p)=>s+p.x,0)/points.length,z:points.reduce((s,p)=>s+p.z,0)/points.length,distance:45}:{...fountain,distance:45};}
 if(zone==='overview'&&map)return{x:map.origin.x+map.width*map.tileSize/2,z:map.origin.z+map.height*map.tileSize/2,distance:Math.min(230,Math.max(map.width,map.height)*map.tileSize*1.65)};
 return{x:hero?.x??m.heroSpawn?.x??0,z:hero?.z??m.heroSpawn?.z??0,distance:49};
}
