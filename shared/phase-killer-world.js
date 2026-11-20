import {PHASE_KILLER_MAP as MAP} from './phase-killer-catalog.js';
import {PHASE_TERRAIN_DATA as DATA} from './phase-killer-terrain-data.js';
import {PHASE_TOWN,PHASE_LEVEL_REVISION,PHASE_CAMPFIRES,PHASE_CEMETERY,PHASE_TOWN_HOUSE_RELOCATIONS} from './phase-killer-level.js';
export {PHASE_TOWN,PHASE_LEVEL_REVISION,PHASE_CAMPFIRES,PHASE_CEMETERY,phaseKillerHeightAt} from './phase-killer-level.js';
const dimensions=['normal','aether','omni'],clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const inChurchyard=(p,r=0)=>Math.abs(p.x-PHASE_CEMETERY.x)<PHASE_CEMETERY.w/2+1.3+r&&Math.abs(p.z-PHASE_CEMETERY.z)<PHASE_CEMETERY.d/2+1.3+r;
const within=(p,b,margin=0)=>p.x>=b.minX+margin&&p.x<=b.maxX-margin&&p.z>=b.minZ+margin&&p.z<=b.maxZ-margin;
export const PHASE_WORLD_PROVENANCE=Object.freeze({...DATA.provenance,worldScale:MAP.worldScale,nativeCoordinatesRetained:true,levelRevision:PHASE_LEVEL_REVISION,adaptation:'Source forest and terrain anchors at 2x spacing; expanded original town, plaza, church and west mountain are browser level design. Skills retain native units.'});
export const phaseKillerWorldPoint=p=>({...p,x:p.x*MAP.worldScale,z:p.z*MAP.worldScale});
export const phaseKillerNativePoint=p=>({...p,x:p.x/MAP.worldScale,z:p.z/MAP.worldScale});
export function phaseKillerTile(x,z){const native=phaseKillerNativePoint({x,z}),ix=clamp(Math.floor(native.x-DATA.origin[0]),0,DATA.width-1),iz=clamp(Math.floor(DATA.origin[1]-native.z),0,DATA.height-1),index=iz*DATA.width+ix;return{texture:DATA.textures[Number.parseInt(DATA.tiles[index],16)],relief:Number.parseInt(DATA.relief[index],16)};}
const placements=DATA.placements.map(([kind,x,z,scale,angle,variation],i)=>Object.freeze({id:'native-'+i,rawId:DATA.identifiers[kind],x:x*MAP.worldScale,z:z*MAP.worldScale,nativeX:x,nativeZ:z,scale,angle,variation}));
export function phaseKillerScenery(dimension='normal'){const bounds=MAP[dimension]||MAP.normal;return placements.filter(p=>within(p,bounds));}
const pathCache=new Map();
export function phaseKillerPaths(dimension='normal'){if(pathCache.has(dimension))return pathCache.get(dimension);const shift=dimensions.indexOf(dimension)*MAP.layerOffset,paths=[
 [[-31,-28],[-18,-22],[-4,-19],[8,-14],[15.875,-7.75],[24,-8],[34,-8],[45,-16],[60,-21],[65,-30]],
 [[-28,1],[-17,-4],[-3,-7],[15.875,-7.75]],
 [[15.875,-7.75],[21,-19],[29,-29],[33,-33]],
 [[34,-8],[43,-1],[61,1]],
 ].map(path=>path.map(([x,z])=>({x:x*MAP.worldScale,z:z*MAP.worldScale+shift}))).concat(dimension==='normal'?[
 [{x:34,z:-72},{x:137,z:-72}], [{x:34,z:13.5},{x:137,z:13.5}],
 [{x:41,z:-70},{x:41,z:8}],[{x:92,z:-70},{x:92,z:8}],
 [{x:113,z:-70},{x:113,z:8}],[{x:34,z:-45},{x:137,z:-45}],
 [{x:113,z:8},{x:120.8,z:8}],
 [{x:PHASE_CEMETERY.gate.x,z:PHASE_CEMETERY.gate.z},{x:92,z:PHASE_CEMETERY.gate.z}],
 ]:[]);pathCache.set(dimension,paths);return paths;}
const segmentDistance=(p,a,b)=>{const dx=b.x-a.x,dz=b.z-a.z,t=clamp(((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1),0,1);return Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t);};
export function phaseKillerPathDistance(point,dimension='normal'){let nearest=Infinity;for(const path of phaseKillerPaths(dimension))for(let i=1;i<path.length;i++)nearest=Math.min(nearest,segmentDistance(point,path[i-1],path[i]));return nearest;}
export function phaseKillerReserved(point,dimension='normal',radius=0){const shift=dimensions.indexOf(dimension)*MAP.layerOffset,spawn={x:MAP.spawn.x,z:MAP.spawn.z+shift},gate={x:MAP.gateway.x,z:MAP.gateway.z-MAP.layerOffset+shift},boss=phaseKillerWorldPoint({x:-28.8008,z:124.3078});return dimension==='normal'&&inChurchyard(point,radius)||Math.hypot(point.x-spawn.x,point.z-spawn.z)<4+radius||Math.hypot(point.x-gate.x,point.z-gate.z)<2.5+radius||dimension==='omni'&&Math.hypot(point.x-boss.x,point.z-boss.z)<2+radius||dimension==='normal'&&(Math.hypot(point.x-PHASE_TOWN.plaza.x,point.z-PHASE_TOWN.plaza.z)<PHASE_TOWN.plaza.radius+radius||PHASE_CAMPFIRES.some(c=>Math.hypot(point.x-c.x,point.z-c.z)<c.radius+1+radius))||phaseKillerPathDistance(point,dimension)<.85+radius;}
const structures=[];for(const dimension of dimensions)for(const p of phaseKillerScenery(dimension)){if(!['VSvb','YSaw'].includes(p.rawId))continue;const house=p.rawId==='VSvb',rotated=Math.abs(Math.sin(p.angle))>.7,long=house?Math.max(5.4,2.7*p.scale*1.8):3.4*p.scale,short=house?Math.max(3.6,2.05*p.scale*1.8):.35*p.scale,w=rotated?short:long,d=rotated?long:short;if(phaseKillerReserved(p,dimension,house?Math.hypot(w,d)/2:Math.max(w,d)*.2))continue;structures.push(Object.freeze({...p,w,d,alive:true,dimension,phaseBuilding:true,phaseProp:house?'house':'wall',style:p.variation%4}));}
structures.push(Object.freeze({...PHASE_TOWN.fountain,dimension:'normal',alive:true,phaseBuilding:true,phaseProp:'fountain',browserAdaptation:true}),Object.freeze({...PHASE_TOWN.church,dimension:'normal',alive:true,phaseBuilding:true,phaseProp:'church',browserAdaptation:true}));
const overlaps=(a,b,space=0)=>Math.abs(a.x-b.x)<(a.w+b.w)/2+space&&Math.abs(a.z-b.z)<(a.d+b.d)/2+space;
// Stable ids per surveyed plot; jitter avoids marching rows of identical huts.
for(const row of [0,7,3,5,1,6,2,4])for(let col=0;col<10&&structures.filter(s=>s.phaseProp==='house').length<34;col++){
 const p={id:`town-house-${row}-${col}`,x:34+col*11.2+((row*7+col*3)%5-2)*.6,z:-66+row*10+((col*5+row)%4-1.5)*.55,w:(row+col)%3?5.4:4.2,d:(row+col)%3?4.2:5.4,dimension:'normal',alive:true,phaseBuilding:true,phaseProp:'house',style:(row+col)%4,browserAdaptation:true};
 Object.assign(p,PHASE_TOWN_HOUSE_RELOCATIONS[p.id]);
 if(p.x+p.w/2>139||p.z+p.d/2>12||p.z-p.d/2<-75||phaseKillerReserved(p,'normal',Math.hypot(p.w,p.d)/2)||Math.hypot(p.x-PHASE_TOWN.plaza.x,p.z-PHASE_TOWN.plaza.z)<PHASE_TOWN.plaza.radius+4||structures.some(s=>s.dimension==='normal'&&overlaps(p,s,2.1)))continue;structures.push(Object.freeze(p));
}
// A southern churchyard, with an open east gate and clear aisles between graves.
for(let row=0;row<3;row++)for(let col=0;col<4;col++)structures.push(Object.freeze({id:`churchyard-grave-${row}-${col}`,x:PHASE_CEMETERY.x-5.8+col*3.8,z:PHASE_CEMETERY.z-3+row*3,w:1.15,d:1.6,dimension:'normal',alive:true,phaseBuilding:true,phaseProp:'grave',style:(row+col)%4,browserAdaptation:true}));
for(const [side,offset]of [['3',-4],['11',4]])structures.push(Object.freeze({id:'churchyard-fence-'+side,x:PHASE_CEMETERY.x,z:PHASE_CEMETERY.z+offset,w:16,d:.35,dimension:'normal',alive:true,phaseBuilding:true,phaseProp:'churchyardFence',browserAdaptation:true}));
structures.push(Object.freeze({id:'churchyard-fence-west',x:PHASE_CEMETERY.x-8,z:PHASE_CEMETERY.z,w:.35,d:8,dimension:'normal',alive:true,phaseBuilding:true,phaseProp:'churchyardFence',browserAdaptation:true}));
for(const [side,offset]of [['4.2',-2.8],['9.8',2.8]])structures.push(Object.freeze({id:'churchyard-fence-east-'+side,x:PHASE_CEMETERY.gate.x,z:PHASE_CEMETERY.z+offset,w:.35,d:2.4,dimension:'normal',alive:true,phaseBuilding:true,phaseProp:'churchyardFence',browserAdaptation:true}));
structures.push(Object.freeze({...PHASE_CEMETERY.cross,dimension:'normal',alive:true,phaseBuilding:true,phaseProp:'cross',browserAdaptation:true}));
export function phaseKillerWorldObstacles(){return structures.map(s=>({...s}));}
export function phaseKillerBuildingApproach(b){return b.phaseProp==='church'?{x:b.x-b.w/2-1.2,z:b.z}:b.w<b.d?{x:b.x+b.w/2+.8,z:b.z}:{x:b.x,z:b.z+b.d/2+.8};}
const forest=new Map();for(const dimension of dimensions){const found=[],seen=new Set();for(const p of phaseKillerScenery(dimension)){if(!['JTtw','JTct','LRrk','YTpc','YOks','YSca','YOfn'].includes(p.rawId))continue;const landmark=['YTpc','YOks','YSca','YOfn'].includes(p.rawId),rock=p.rawId==='LRrk',w=landmark?p.rawId==='YOfn'?1.65:.5:clamp((rock?.75:.42)*p.scale,rock?.45:.3,rock?1.2:.65),key=Math.round(p.x*2)+':'+Math.round(p.z*2);if(seen.has(key)||phaseKillerReserved(p,dimension,w*.5)||structures.some(s=>{if(s.dimension!==dimension)return false;const entry=phaseKillerBuildingApproach(s);return Math.abs(s.x-p.x)<s.w/2+w&&Math.abs(s.z-p.z)<s.d/2+w||['house','church'].includes(s.phaseProp)&&Math.hypot(p.x-entry.x,p.z-entry.z)<1.3+w;}))continue;seen.add(key);found.push(Object.freeze({...p,w,d:w,alive:true,dimension,phaseForest:true,phaseProp:landmark?'landmark':rock?'rock':'tree'}));}if(dimension==='normal')for(let row=0;row<13;row++)for(let col=0;col<8;col++){const tree={id:`mountain-tree-${row}-${col}`,rawId:'authored-pine',x:-68+col*6.1+Math.sin(row*7+col*3)*1.3,z:-72+row*6.3+Math.cos(col*5+row)*1.2,w:.42,d:.42,scale:1.1,variation:(row+col)%4,alive:true,dimension,phaseForest:true,phaseProp:'tree',browserAdaptation:true};if(phaseKillerReserved(tree,dimension,.3)||found.some(o=>Math.hypot(o.x-tree.x,o.z-tree.z)<1.2))continue;found.push(Object.freeze(tree));}forest.set(dimension,Object.freeze(found));}
export function phaseKillerForestObstacles(dimension='normal'){return forest.get(dimension)||forest.get('normal');}
