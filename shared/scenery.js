import {ARENA_BOUNDS} from './arena-size.js';
import {mapTileAt} from './voxel-map.js';
import {SHOPS} from './shops.js';

// Original voxel parts, shared by renderers and their authoritative footprint.
// Parts are [x,y,z,width,height,depth,color]. Trees collide at their trunks;
// their raised canopies deliberately leave the surrounding floor walkable.
const freezeAsset=value=>Object.freeze({...value,collider:Object.freeze(value.collider),parts:Object.freeze(value.parts.map(part=>Object.freeze(part)))});
export const SCENERY_ASSETS=Object.freeze({
 pine:freezeAsset({collider:{w:.7,d:.7,h:6.25},parts:[[0,2.35,0,.56,4.7,.56,0x74553e],[0,4.1,0,2.15,.8,2.15,0x3d6650],[0,4.75,0,1.7,.75,1.7,0x4f7c5e],[0,5.35,0,1.2,.7,1.2,0x638c68],[0,5.88,0,.6,.55,.6,0x8aaa7d]]}),
 birch:freezeAsset({collider:{w:.65,d:.65,h:5.35},parts:[[0,2.225,0,.5,4.45,.5,0xd7d5b7],[.255,.8,0,.02,.13,.35,0x736e58],[-.255,1.7,0,.02,.15,.3,0x736e58],[0,1.3,.255,.32,.1,.02,0x736e58],[0,4.15,0,2,.95,1.8,0x95ad6b],[-.55,4.65,.25,1.25,.65,1.25,0xaac480],[.45,4.8,-.25,1.2,.8,1.2,0xc0cf8c]]}),
 boulder:freezeAsset({collider:{w:1.45,d:1.3,h:1.25},parts:[[0,.4,0,1.45,.8,1.2,0x858e8b],[-.15,.94,-.08,1.05,.45,.95,0xa7aea4],[.39,.18,.35,.6,.36,.6,0x728478],[-.3,1.19,-.1,.55,.13,.6,0xb9bdac]]}),
 runestone:freezeAsset({collider:{w:1.1,d:.9,h:1.85},parts:[[0,.2,0,1.1,.4,.9,0x7a8580],[0,1,0,.85,1.4,.7,0x959e92],[0,1.75,0,.62,.2,.62,0xb4b8a2],[0,1,.36,.07,.75,.035,0xd1bc79],[.12,1.18,.36,.3,.07,.035,0xd1bc79],[-.1,.85,.36,.23,.065,.035,0xd1bc79]]})
});
const segmentDistance=(p,a,b)=>{const dx=b.x-a.x,dz=b.z-a.z,d=dx*dx+dz*dz,t=d?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/d)):0;return Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t);};
const protectedBy=(p,zone,padding)=>Number.isFinite(zone.w)?Math.abs(p.x-zone.x)<zone.w/2+padding&&Math.abs(p.z-zone.z)<(zone.d||zone.w)/2+padding:Math.hypot(p.x-zone.x,p.z-zone.z)<(zone.r??zone.radius??2)+padding;
export function generateScenery({seed=7381,mode='survival',bounds=ARENA_BOUNDS,map=null,keepClear=[],count=mode==='linewars'?26:16}={}){
 let value=seed>>>0;const random=()=>((value=(Math.imul(value,1664525)+1013904223)>>>0)/4294967296),result=[],kinds=Object.keys(SCENERY_ASSETS),line=mode==='linewars'&&map;
 const clear=[...keepClear];if(line){const m=map.markers;clear.push(...(m.buildings||[]).map(p=>({...p,r:1.8})),...(m.shops||[]).map(p=>({...p,r:3.4})));for(const [key,r]of [['fountain',6],['portal',3],['heroSpawn',3],['spawn',3]])if(m[key])clear.push({...m[key],r});for(const route of m.routes||[])clear.push({...route.spawn,r:3});}
 else clear.push({x:0,z:0,r:4.2},{x:0,z:2,w:12,d:3},...Object.values(SHOPS).filter(shop=>!shop.lineWarsOnly).map(shop=>({x:shop.x,z:shop.z,w:3.4,d:3.2})),{x:0,z:-8.8,w:31,d:1.2});
 for(let attempt=0;attempt<2400&&result.length<Math.min(96,Math.max(0,count));attempt++){
  const kind=kinds[Math.floor(random()*kinds.length)],scale=.82+random()*.35,rotation=Math.floor(random()*4)*Math.PI/2,asset=SCENERY_ASSETS[kind],padding=Math.max(asset.collider.w,asset.collider.d)*scale/2;
  let x,z;if(line){x=map.origin.x+random()*map.width*map.tileSize;z=map.origin.z+random()*map.height*map.tileSize;}else{x=(random()*2-1)*bounds;z=(random()*2-1)*bounds;}
  // Uniform area sampling, clipped to the same rounded square as movement.
  // Keep enough room between props and the border to walk around their bodies.
  if(!line&&(Math.max(Math.abs(x),Math.abs(z))+padding+1>bounds||Math.hypot(x,z)+padding*Math.SQRT2+1>bounds+2.5))continue;
  const p={x,z};if(clear.some(zone=>protectedBy(p,zone,padding+.6)))continue;if(result.some(other=>Math.hypot(other.x-x,other.z-z)<(line?2.35:3.25)))continue;
  if(line){const samples=[[0,0],[padding+.25,0],[-padding-.25,0],[0,padding+.25],[0,-padding-.25]],tiles=samples.map(([dx,dz])=>mapTileAt(map,x+dx,z+dz));if(tiles.some(t=>!t?.walkable)||tiles[0].palette.id==='road')continue;const roads=(map.markers.routes?.length?map.markers.routes:[{path:map.markers.path||[]}]);if(roads.some(route=>route.path.some((a,i)=>i&&segmentDistance(p,route.path[i-1],a)<3.2+padding)))continue;}
  result.push({id:`scenery-${seed}-${result.length}`,kind,x:Number(x.toFixed(4)),z:Number(z.toFixed(4)),scale:Number(scale.toFixed(4)),rotation});
 }
 return result;
}
export function sceneryObstacles(descriptors,origin={x:0,z:0}){
 return descriptors.flatMap(entry=>{const asset=SCENERY_ASSETS[entry.kind];if(!asset||!Number.isFinite(entry.x)||!Number.isFinite(entry.z))return[];const scale=Number.isFinite(entry.scale)?entry.scale:1,quarter=Math.round((entry.rotation||0)/(Math.PI/2))%2,w=(quarter?asset.collider.d:asset.collider.w)*scale,d=(quarter?asset.collider.w:asset.collider.d)*scale;return[{...entry,id:entry.id+'@'+(origin.x||0)+','+(origin.z||0),x:entry.x+(origin.x||0),z:entry.z+(origin.z||0),w,d,h:asset.collider.h*scale,type:'scenery',map:true,scenery:true}];});
}
