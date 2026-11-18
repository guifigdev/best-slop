import {normalizeVoxelMap,DEFAULT_MAP_PALETTE} from '../voxel-map.js';
import {LINE_UNIT_ORDER} from '../line-units.js';

// Original northern reinterpretation: the extracted CHLW terrain is preserved
// separately. This larger battlefield deliberately has its own proportions.
export function fjordPortalsMap(){
 const width=36,height=64,tileSize=1.75,origin={x:-31.5,z:-56},biomes=[],heights=[],walkable=[];
 const portal={x:-10,z:35},west=[{x:-18,z:-49},{x:-18,z:26},{x:-10,z:35}],east=[{x:-3,z:-49},{x:-3,z:26},{x:-10,z:35}];
 const segmentDistance=(p,a,b)=>{const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz)));return Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t);};
 const onRoad=p=>[west,east,[{x:-10,z:35},{x:0,z:46}],[{x:0,z:36},{x:24,z:36},{x:24,z:-16}]].some(path=>path.some((a,i)=>i&&segmentDistance(p,path[i-1],a)<4));
 for(let row=0;row<height;row++)for(let col=0;col<width;col++){
  const p={x:origin.x+(col+.5)*tileSize,z:origin.z+(row+.5)*tileSize},border=col===0||row===0||col===width-1||row===height-1;
  const divider=p.x>-12&&p.x< -10&&p.z> -44&&p.z<23,districtWall=p.x>6&&p.x<10&&p.z> -47&&p.z<24;
  const westBank=p.x< -25&&p.z<29,blocked=border||divider||districtWall||westBank;
  const base=p.z>33,district=p.x>11&&p.z> -18&&p.z<28;
  const biome=blocked?(border||westBank?0:5):onRoad(p)||base||district?3:(p.z< -20?7:1);
  biomes.push(biome);walkable.push(blocked?0:1);heights.push(blocked?(biome===0?-.3:1.7):0);
 }
 const ids=['equipment','consumables','books','smith','enchanter','runemaster'],positions=[[-10,44],[-6,49],[-2,51],[2,51],[6,49],[10,44]];
 const routes=[{id:'west',name:'Passagem do Poente',spawn:west[0],path:west},{id:'east',name:'Passagem da Aurora',spawn:east[0],path:east}];
 return normalizeVoxelMap({version:1,id:'fjord-portals',name:'Portais dos Fiordes',seed:1602,width,height,tileSize,origin,palette:DEFAULT_MAP_PALETTE,biomes,heights,walkable,heightSource:'authored',markers:{spawn:west[0],portal,path:west,routes,heroSpawn:{x:-10,z:31},fountain:{x:0,z:46},shops:ids.map((id,i)=>({id,x:positions[i][0],z:positions[i][1]})),buildings:LINE_UNIT_ORDER.map((unitKey,i)=>({id:`recruit-${unitKey}`,unitKey,x:13+(i%4)*5,z:-12+Math.floor(i/4)*8,routeId:Math.floor(i/4)%2?'east':'west'}))},source:{kind:'authored-adaptation',exactHeights:false,note:'Dois corredores de invasão e distrito de recrutamento lateral; interpretação nórdica de Dalaran, não reconstrução do terreno original.',historicalReference:'https://www.epicwar.com/maps/116369/'}});
}
