export const CASTLE_MAP=Object.freeze({width:48,depth:32,minX:-24,maxX:24,minZ:-16,maxZ:16,grid:.5,castleHp:5000,castleArmor:8,castleArmorType:'fortified',tower:{x:0,z:0,radius:4},buildZones:[{team:1,minX:-22,maxX:-6,minZ:-8,maxZ:8},{team:2,minX:6,maxX:22,minZ:-8,maxZ:8}],castles:[{team:1,x:-19,z:0,w:3,d:5},{team:2,x:19,z:0,w:3,d:5}]});
export function castleMap(laneCount=2){const map=structuredClone(CASTLE_MAP),lanes=laneCount===1?[0]:[-4.1875,4.1875];map.lanes=lanes.map((z,id)=>({id,z,left:{x:-5.5,z},right:{x:5.5,z}}));map.laneCount=lanes.length;return map;}
export function castlePoint(map,point){return Number.isFinite(point?.x)&&Number.isFinite(point?.z)?{x:Math.max(map.minX+.6,Math.min(map.maxX-.6,point.x)),z:Math.max(map.minZ+.6,Math.min(map.maxZ-.6,point.z))}:null;}
export const castleFootprint=(point,footprint={w:3,d:3})=>({x:point.x,z:point.z,w:footprint.w,d:footprint.d});
export function castleOverlap(a,b,margin=0){return Math.abs(a.x-b.x)<(a.w+b.w)/2+margin&&Math.abs(a.z-b.z)<(a.d+b.d)/2+margin;}
export function castleBuildPosition(map,team,point,footprint,buildings=[]){
 if(!Number.isFinite(point?.x)||!Number.isFinite(point?.z)||!Number.isFinite(footprint?.w)||!Number.isFinite(footprint?.d)||footprint.w<=0||footprint.d<=0)return null;
 const grid=map.grid,p={x:Math.round(point.x/grid)*grid,z:Math.round(point.z/grid)*grid},zone=map.buildZones.find(area=>area.team===team),box=castleFootprint(p,footprint);
 if(!zone||p.x-box.w/2<zone.minX||p.x+box.w/2>zone.maxX||p.z-box.d/2<zone.minZ||p.z+box.d/2>zone.maxZ||map.lanes.some(lane=>Math.abs(p.z-lane.z)<box.d/2+.8)||map.castles.some(castle=>castleOverlap(box,castle,.25))||buildings.some(building=>building.alive!==false&&castleOverlap(box,building,.25)))return null;
 return p;
}
