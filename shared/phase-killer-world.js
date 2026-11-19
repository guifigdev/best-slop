import {PHASE_KILLER_MAP as MAP} from './phase-killer-catalog.js';
import {PHASE_TERRAIN_DATA as DATA} from './phase-killer-terrain-data.js';
const dimensions=['normal','aether','omni'],clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const within=(p,b,margin=0)=>p.x>=b.minX+margin&&p.x<=b.maxX-margin&&p.z>=b.minZ+margin&&p.z<=b.maxZ-margin;
export const PHASE_WORLD_PROVENANCE=DATA.provenance;
export function phaseKillerTile(x,z){const ix=clamp(Math.floor(x-DATA.origin[0]),0,DATA.width-1),iz=clamp(Math.floor(DATA.origin[1]-z),0,DATA.height-1),index=iz*DATA.width+ix;return{texture:DATA.textures[Number.parseInt(DATA.tiles[index],16)],relief:Number.parseInt(DATA.relief[index],16)};}
const placements=DATA.placements.map(([kind,x,z,scale,angle,variation],i)=>Object.freeze({id:'native-'+i,rawId:DATA.identifiers[kind],x,z,scale,angle,variation}));
export function phaseKillerScenery(dimension='normal'){const bounds=MAP[dimension]||MAP.normal;return placements.filter(p=>within(p,bounds));}
export function phaseKillerPaths(dimension='normal'){const shift=dimensions.indexOf(dimension)*64;return[
 [[-31,-28],[-18,-22],[-4,-19],[8,-14],[15.875,-7.75],[24,-8],[34,-8],[45,-16],[60,-21],[65,-30]],
 [[-28,1],[-17,-4],[-3,-7],[15.875,-7.75]],
 [[15.875,-7.75],[21,-19],[29,-29],[33,-33]],
 [[34,-8],[43,-1],[61,1]],
 ].map(path=>path.map(([x,z])=>({x,z:z+shift})));}
const segmentDistance=(p,a,b)=>{const dx=b.x-a.x,dz=b.z-a.z,t=clamp(((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1),0,1);return Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t);};
export function phaseKillerPathDistance(point,dimension='normal'){let nearest=Infinity;for(const path of phaseKillerPaths(dimension))for(let i=1;i<path.length;i++)nearest=Math.min(nearest,segmentDistance(point,path[i-1],path[i]));return nearest;}
export function phaseKillerReserved(point,dimension='normal',radius=0){const shift=dimensions.indexOf(dimension)*64,spawn={x:MAP.spawn.x,z:MAP.spawn.z+shift},gate={x:33,z:-33+shift};return Math.hypot(point.x-spawn.x,point.z-spawn.z)<4+radius||Math.hypot(point.x-gate.x,point.z-gate.z)<2.5+radius||dimension==='omni'&&Math.hypot(point.x+28.8008,point.z-124.3078)<2+radius||phaseKillerPathDistance(point,dimension)<.85+radius;}
const structures=[];for(const dimension of dimensions)for(const p of phaseKillerScenery(dimension)){if(!['VSvb','YSaw'].includes(p.rawId))continue;const house=p.rawId==='VSvb',rotated=Math.abs(Math.sin(p.angle))>.7,w=(house?rotated?2.05:2.7:rotated?.35:3.4)*p.scale,d=(house?rotated?2.7:2.05:rotated?3.4:.35)*p.scale;if(phaseKillerReserved(p,dimension,Math.max(w,d)*.2))continue;structures.push(Object.freeze({...p,w,d,alive:true,dimension,phaseBuilding:true,phaseProp:house?'house':'wall',style:p.variation%4}));}
export function phaseKillerWorldObstacles(){return structures.map(s=>({...s}));}
const forest=new Map();for(const dimension of dimensions){const found=[],seen=new Set();for(const p of phaseKillerScenery(dimension)){if(!['JTtw','JTct','LRrk','YTpc','YOks','YSca','YOfn'].includes(p.rawId))continue;const landmark=['YTpc','YOks','YSca','YOfn'].includes(p.rawId),rock=p.rawId==='LRrk',w=landmark?p.rawId==='YOfn'?1.65:.5:clamp((rock?.75:.42)*p.scale,rock?.45:.3,rock?1.2:.65),key=Math.round(p.x*2)+':'+Math.round(p.z*2);if(seen.has(key)||phaseKillerReserved(p,dimension,w*.5)||structures.some(s=>s.dimension===dimension&&Math.abs(s.x-p.x)<s.w/2+w&&Math.abs(s.z-p.z)<s.d/2+w))continue;seen.add(key);found.push(Object.freeze({...p,w,d:w,alive:true,dimension,phaseForest:true,phaseProp:landmark?'landmark':rock?'rock':'tree'}));}forest.set(dimension,Object.freeze(found));}
export function phaseKillerForestObstacles(dimension='normal'){return forest.get(dimension)||forest.get('normal');}
