import {normalizeVoxelMap,DEFAULT_MAP_PALETTE} from '../voxel-map.js';
import {LINE_UNIT_ORDER} from '../line-units.js';

// Original northern reinterpretation with exactly two invasion corridors.
// Compact recruitment terraces sit behind their own entrance, never beside
// the battlefield as a third long, parallel district.
export function fjordPortalsMap(){
 const width=36,height=64,tileSize=1.75,origin={x:-31.5,z:-56},biomes=[],heights=[],walkable=[];
 const portal={x:0,z:35},west=[{x:-10,z:-43.5},{x:-10,z:26},{x:0,z:35}],east=[{x:10,z:-43.5},{x:10,z:26},{x:0,z:35}];
 const segmentDistance=(p,a,b)=>{const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz)));return Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t);};
 const nearPath=(p,path,r)=>path.some((a,i)=>i&&segmentDistance(p,path[i-1],a)<r),routes=[{id:'west',name:'Passagem do Poente',spawn:west[0],path:west},{id:'east',name:'Passagem da Aurora',spawn:east[0],path:east}];
 for(let row=0;row<height;row++)for(let col=0;col<width;col++){
  const p={x:origin.x+(col+.5)*tileSize,z:origin.z+(row+.5)*tileSize},border=col===0||row===0||col===width-1||row===height-1;
  const terrace=p.z>=-54.3&&p.z<=-44&&Math.abs(Math.abs(p.x)-10)<7.4,base=p.z>=33&&p.z<=53.5&&Math.abs(p.x)<18.5,corridor=nearPath(p,west,6.2)||nearPath(p,east,6.2),land=!border&&(terrace||base||corridor);
  const divider=!land&&Math.abs(p.x)<3&&p.z> -44&&p.z<24,road=nearPath(p,west,3.6)||nearPath(p,east,3.6)||terrace||base;
  const biome=land?(road?3:p.z< -20?7:1):divider?5:0;
  biomes.push(biome);walkable.push(land?1:0);heights.push(land?0:divider?1.7:-.3);
 }
 const ids=['equipment','consumables','books','smith','enchanter','runemaster'],positions=[[-10,44],[-6,49],[-2,51],[2,51],[6,49],[10,44]];
 const buildings=LINE_UNIT_ORDER.map((unitKey,i)=>{const entrance=i<8?routes[0]:routes[1],slot=i%8;return{id:`recruit-${unitKey}`,unitKey,x:entrance.spawn.x+[-4.8,-1.6,1.6,4.8][slot%4],z:-48.5-Math.floor(slot/4)*3.5,routeId:entrance.id};});
 return normalizeVoxelMap({version:1,id:'fjord-portals',name:'Portais dos Fiordes',seed:1603,width,height,tileSize,origin,palette:DEFAULT_MAP_PALETTE,biomes,heights,walkable,heightSource:'authored',markers:{spawn:west[0],portal,path:west,routes,heroSpawn:{x:0,z:31},fountain:{x:0,z:46},shops:ids.map((id,i)=>({id,x:positions[i][0],z:positions[i][1]})),buildings},source:{kind:'authored-adaptation',exactHeights:false,note:'Somente duas faixas de invasão, com oito casas em cada terraço compacto atrás das entradas. Não há distrito ou corredor lateral. Interpretação nórdica original, não reconstrução do terreno histórico.',historicalReference:'https://www.epicwar.com/maps/116369/'}});
}
