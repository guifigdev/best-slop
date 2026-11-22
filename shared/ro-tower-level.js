// Original Endless Tower room identity: stone nave, side columns and the exit
// at the far end. Geometry is authored for the survivor camera, not a client-map
// asset import. Encounter source: rAthena/npc/instances/EndlessTower.txt.
import {bonkBlocked,bonkFreePoint} from './bonk-level.js';
import {RO_TOWER_LAYOUT,RO_TOWER_REFERENCES} from './ro-tower-layout.js';
export {RO_TOWER_LAYOUT,RO_TOWER_REFERENCES,roTowerHeightAt} from './ro-tower-layout.js';
export function generateRoTowerLevel(seed=1,floor=1){
 const n=Math.max(1,Math.min(101,Math.floor(floor)||1)),obstacles=[],decorations=[],objects=[],wall=(id,x,z,w,d,h)=>obstacles.push({id,type:'tower-wall',x,z,w,d,h,alive:true});
 wall('tower-west',-31,0,2,82,5);wall('tower-east',31,0,2,82,5);wall('tower-north',0,-40,64,2,7);wall('tower-south',0,40,64,2,1.2);
 for(const x of [-19,19])for(const z of [-23,-8,8,23]){const id='tower-column-'+x+'-'+z;decorations.push({id,type:'tower-column',x,z,w:3.4,d:3.4,h:7.6});obstacles.push({id,type:'tower-column',x,z,w:3.4,d:3.4,h:7.6,alive:true});}
 // An open entrance hall and a clear center aisle preserve projectile and
 // knockback movement. Nothing is placed on a stair tread or spawn pad.
 const spawn={x:0,z:31},exit={id:'tower-stair',x:0,z:-35,width:12,radius:4.8};
 if(n===101){decorations.push({id:'tower-tyrant-throne',type:'tower-throne',x:0,z:-38,w:5,d:3,h:7});obstacles.push({id:'tower-tyrant-throne',type:'tower-throne',x:0,z:-38,w:5,d:3,h:7,alive:true});}
 for(const [i,p]of [{x:-26,z:25},{x:26,z:-22}].entries())objects.push({id:'tower-chest-'+i,type:'chest',name:'Baú da Torre',...p,cost:25+Math.min(100,n*2),used:false});
 objects.push({id:'tower-altar',type:'shrine',x:25,z:10,cost:0,used:false});
 for(const [i,p]of [{x:-26,z:-8},{x:25,z:25},{x:-26,z:-28},{x:26,z:-3}].entries())objects.push({id:'tower-pot-'+i,type:'pot',...p,hp:1,used:false});
 const spawnPoints=[];for(let row=0;row<9;row++)for(let column=0;column<9;column++){const p={x:-25+column*6.25,z:-23+row*5.25};if(obstacles.some(o=>Math.abs(o.x-p.x)<o.w/2+1.5&&Math.abs(o.z-p.z)<o.d/2+1.5))continue;spawnPoints.push(p);}
 return{...RO_TOWER_LAYOUT,terrainVersion:4,seed,stageKey:'crypt',biome:'ruins',theme:'ruins',habitat:'ruins',tower:{floor:n,layoutVersion:RO_TOWER_LAYOUT.version,source:RO_TOWER_REFERENCES,spawnPoints,exit},spawn,center:{x:0,z:0},route:null,landmarks:[],obstacles,decorations,objects,paths:[{from:spawn,to:{x:0,z:-26},width:14}],scaleUnit:'metres',revision:1};
}
export function roTowerSpawnPoint(map,serial=0,random=()=>.5,heroes=[],radius=.8){
 const points=map?.tower?.spawnPoints;if(!points?.length)return bonkFreePoint(map,map.spawn,radius);
 const offset=Math.floor(Math.max(0,Math.min(.99999,Number(random())||0))*points.length),alive=heroes.filter(h=>h.alive!==false);
 let fallback=null,best=-1;
 for(let i=0;i<points.length;i++){
  const base=points[((serial*17+offset+i)%points.length+points.length)%points.length],p={x:base.x+(Math.max(0,Math.min(1,Number(random())||0))-.5)*1.5,z:base.z+(Math.max(0,Math.min(1,Number(random())||0))-.5)*1.5};
  if(bonkBlocked(map,p,radius))continue;const distance=alive.length?Math.min(...alive.map(h=>Math.hypot(p.x-h.x,p.z-h.z))):20;
  if(distance>best){best=distance;fallback=p;}if(distance>=13)return p;
 }
 return fallback||bonkFreePoint(map,map.spawn,radius);
}
export function roTowerSpawnBatch(queue=[],live=[],capacity=280){
 if(!queue.length||capacity<=0)return 0;const phase=queue[0].phase;
 if(phase!==undefined&&live.some(e=>e.alive!==false&&e.roTowerPhase!==phase))return 0;
 let same=0;while(same<queue.length&&queue[same].phase===phase)same++;
 return Math.min(8,same,Math.max(0,Math.floor(capacity)));
}
