import {roRegionPropPool,RO_REGION_PROP_BUDGET} from './ro-regional-props.js';
import {roTerrainHeightAt,RO_TERRAIN_VERSION} from './ro-terrain-relief.js';
import {BONK_STAGES} from './bonk-catalog.js';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const nearSpoke=(p,spoke,r=14)=>{const {from,to}=spoke,dx=to.x-from.x,dz=to.z-from.z,n=dx*dx+dz*dz,t=Math.max(0,Math.min(1,((p.x-from.x)*dx+(p.z-from.z)*dz)/(n||1)));return Math.hypot(p.x-from.x-dx*t,p.z-from.z-dz*t)<r;};
const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
export const bonkHeightAt=roTerrainHeightAt;
export function generateBonkLevel(seed=1,stageKey='grove',habitat=null,route=null){
 if(!BONK_STAGES[stageKey])stageKey='grove';const theme=BONK_STAGES[stageKey],half=115,landmarks=[{id:'north-rune',x:0,z:-76,name:'Santuário do norte'},{id:'east-rune',x:72,z:38,name:'Santuário da aurora'},{id:'west-rune',x:-72,z:38,name:'Santuário das raízes'}],spawn={x:0,z:23},obstacles=[],decorations=[],objects=[],routes=[{x:0,z:0},...landmarks,spawn];
 const regionalModels={sands:['sand-pyramid','sand-gate','desert-well','sand-pyramid'],coast:['coastal-wreck','coastal-arch','coral-garden','coastal-wreck'],grove:['prontera-fountain','prontera-house','prontera-gate','prontera-house'],payon:['payon-gate','payon-pavilion','payon-cavemouth','payon-lanterns'],crypt:['ruined-chapel','tomb-garden','gothic-gate','tomb-garden'],forge:['magma-furnace','lava-arch','basalt-throne','magma-furnace'],glacier:['ice-crown','ice-spires','ice-cavemouth','ice-spires'],geffen:['mage-tower','arcane-library','runic-gate','crystal-orbit']};
 const scenicSites=[[-48,-62],[46,-60],[-83,-17],[83,-17]].map(([x,z],i)=>({x,z,model:regionalModels[stageKey][i],w:11,d:10}));
 const clear=p=>route&&((route.graph?[...(route.spokes||[]),{from:route.entry,to:route.bossArena,width:12}].some(s=>nearSpoke(p,s))||distance(p,route.entry)<17:Math.abs(p.x)<14)||distance(p,route.bossArena)<route.bossArena.radius+4)||scenicSites.some(o=>Math.abs(p.x-o.x)<o.w/2+4&&Math.abs(p.z-o.z)<o.d/2+4)||routes.some(r=>distance(p,r)<15)||landmarks.some(r=>{const l=Math.hypot(r.x,r.z),along=(p.x*r.x+p.z*r.z)/l,side=Math.abs(p.x*r.z-p.z*r.x)/l;return along>0&&along<l&&side<6;});
 for(let i=0;i<470;i++){
  const x=(hash(seed+i*4.13)-.5)*220,z=(hash(seed+i*8.71)-.5)*220;if(clear({x,z})||habitat==='meadow'&&i%2===0)continue;
  const solid=i%3!==0,type=stageKey==='sands'?(i%4?'sandstone':'cactus'):stageKey==='coast'?(i%5===0?'palm':i%3?'coastal-rock':'coral'):stageKey==='grove'?(i%4?'tree':'boulder'):stageKey==='forge'?(i%3?'basalt':'vent'):stageKey==='glacier'?(i%3?'crystal':'snowbank'):stageKey==='payon'?(i%5?'boulder':'stalagmite'):stageKey==='crypt'?(i%4?'weathered-rock':'grave-marker'):(i%3?'arcane-crystal':'runic-obelisk'),scale=.7+hash(i+seed)*1.7,w=['tree','cactus','palm'].includes(type)?.75*scale:1.1+scale*1.1,d=['tree','cactus','palm'].includes(type)?.75*scale:1+scale;
  const o={id:'bonk-prop-'+i,x,z,w,d,h:['tree','palm'].includes(type)?4.5+scale*2:1.4+scale*2.1,type,scale,solid};decorations.push(o);if(solid)obstacles.push({...o,alive:true});
 }
 // Four monumental ruins frame avenues rather than filling the play space.
 for(const [cx,cz]of [[-37,-37],[39,-35],[-39,64],[36,65]])for(let i=0;i<6;i++){const p={x:cx+(i%3-1)*4,z:cz+(Math.floor(i/3)-.5)*7};if(clear(p))continue;const o={id:'bonk-ruin-'+cx+'-'+cz+'-'+i,...p,w:1.8,d:1.8,h:4+(i%3),type:i%2?'pillar':'statue',solid:true};decorations.push(o);obstacles.push({...o,alive:true});}
 // Regional scenery occupies lateral pockets, leaving the 12m objective avenues
 // and every gameplay landmark unchanged. Open gates have only post colliders.
 for(const [i,o]of scenicSites.entries()){
  decorations.push({id:'bonk-regional-'+i,type:'scenery',...o,h:o.model==='mage-tower'?14:9,scale:1,solid:false});
  const add=(id,x,z,w,d,h=8)=>obstacles.push({id:'bonk-regional-'+i+'-'+id,x,z,w,d,h,alive:true,type:'regional-architecture'});
  if(/gate|cavemouth|lava-arch|ice-crown/.test(o.model)){for(const side of [-1,1])add(side,o.x+side*3,o.z,1.8,2.8);}
  else if(o.model==='arcane-library'){for(const side of [-1,1])add(side,o.x+side*2.3,o.z,3,5);}
  else if(o.model==='ruined-chapel'){for(const side of [-1,1])add(side,o.x+side*4,o.z,.9,7);add('rear',o.x,o.z-2.5,5,1);}
  else add('body',o.x,o.z,o.model==='mage-tower'?5.8:7,o.model==='mage-tower'?5.8:6,o.model==='prontera-fountain'?4.8:9);
 }
 // Small recognizable scenes occupy seeded lateral pockets. They have real
 // colliders but leave generous shoulders along every objective/spawn/gate road.
 const pool=roRegionPropPool(stageKey,route?.style),propPaths=route?.graph?[...route.spokes,{from:route.entry,to:route.bossArena,width:12}]:route?[{from:route.entry,to:route.bossArena,width:18}]:landmarks.map(l=>({from:{x:0,z:0},to:l,width:12}));
 let regionalCount=0;for(let attempt=0;attempt<360&&regionalCount<RO_REGION_PROP_BUDGET.perMap;attempt++){
  const x=(hash(seed+attempt*17.31+812)-.5)*196,z=(hash(seed+attempt*31.77+433)-.5)*196,model=pool.models[regionalCount%pool.models.length],p={x,z},radius=Math.hypot(pool.w,pool.d)*.5;
  if(clear(p)||propPaths.some(path=>nearSpoke(p,path,(path.width||12)*.5+radius+4))||obstacles.some(o=>Math.abs(x-o.x)<o.w*.5+pool.w*.5+2&&Math.abs(z-o.z)<o.d*.5+pool.d*.5+2)||decorations.some(o=>o.type==='regional-prop'&&distance(o,p)<17))continue;
  const yaw=(Math.floor(hash(seed+attempt*3.1)*4)*Math.PI/2),o={id:'bonk-region-prop-'+regionalCount,type:'regional-prop',model,x,z,w:Math.max(pool.w,pool.d),d:Math.max(pool.w,pool.d),h:pool.h,yaw,variant:regionalCount%3,solid:false};decorations.push(o);
  const add=(label,dx,dz,w,d,h)=>{const cos=Math.cos(yaw),sin=Math.sin(yaw);obstacles.push({id:o.id+'-'+label,type:'regional-architecture',x:x+dx*cos+dz*sin,z:z-dx*sin+dz*cos,w,d,h,alive:true});};
  if(/bridge|arch|bellgate|burial-bell/.test(model)){for(const side of [-1,1])add('post-'+side,side*2.2,0,.9,.9,5);}
  else add('body',0,0,/caravan|wagon|sled/.test(model)?3.6:2.8,/caravan|wagon|sled/.test(model)?2.4:2.8,Math.min(7,pool.h));
  regionalCount++;
 }
 const place=(type,i,extra={})=>{for(let attempt=0;attempt<80;attempt++){const p={x:(hash(seed+i*13.5+attempt*2)-.5)*196,z:(hash(seed+i*27.1+attempt*3)-.5)*196};if(obstacles.some(o=>Math.abs(p.x-o.x)<o.w/2+2.5&&Math.abs(p.z-o.z)<o.d/2+2.5)||objects.some(o=>distance(o,p)<12)||routes.some(r=>distance(p,r)<9))continue;objects.push({id:'bonk-'+type+'-'+i,type,...p,...extra,used:false});return;}};
 for(let i=0;i<26;i++)place('chest',i,{cost:25+i%4*8});for(let i=0;i<10;i++)place('shrine',i,{cost:0});for(let i=0;i<32;i++)place('pot',i,{hp:1});for(let i=0;i<3;i++)place('campfire',i,{fuel:35,radius:3.5});
 for(const [i,l]of landmarks.entries())objects.push({...l,type:'rune',index:i,used:false});
 if(!route)for(const l of landmarks){for(const side of [-1,1])obstacles.push({id:l.id+'-pillar-'+side,x:l.x+side*5.5,z:l.z-2,w:2.1,d:2.1,h:4.6,alive:true,type:'landmark-pillar'});obstacles.push({id:l.id+'-colossus',x:l.x,z:l.z-8,w:2.65,d:2.65,h:6,alive:true,type:'landmark-statue'});}
 if(!route)for(let i=0;i<4;i++){const angle=i*Math.PI/2+Math.PI/4;obstacles.push({id:'temple-pillar-'+i,x:Math.sin(angle)*11,z:Math.cos(angle)*11,w:3,d:3,h:5.7,alive:true,type:'temple-pillar'});}
 if(route){for(let i=objects.length-1;i>=0;i--)if(objects[i].type==='rune')objects.splice(i,1);if(route.graph){for(const gate of route.gates){const {x,z}=gate.direction;obstacles.push({id:gate.id,type:'route-ward',x:gate.x,z:gate.z,w:x?2:18,d:x?18:2,h:20,alive:true});for(const side of [-1,1])obstacles.push({id:gate.id+'-wall-'+side,type:'route-corridor',x:gate.x+x*4+z*side*12,z:gate.z+z*4-x*side*12,w:x?18:5,d:x?5:18,h:8,alive:true});}}else{obstacles.push({id:'route-ward',type:'route-ward',x:route.exit.x,z:route.exit.z,w:route.corridor.width,d:2,h:20,alive:true});for(const side of [-1,1])obstacles.push({id:'route-corridor-'+side,type:'route-corridor',x:side*12,z:-105,w:5,d:18,h:8,alive:true});}}
 return{terrainVersion:RO_TERRAIN_VERSION,seed,stageKey,biome:theme.biome,habitat,route,theme:theme.biome,minX:-half,maxX:half,minZ:-half,maxZ:half,width:230,depth:230,spawn:route?{...route.entry}:spawn,center:{x:0,z:0},landmarks:route?[]:landmarks,obstacles,decorations,objects,paths:route?.graph?[...route.spokes,{from:route.entry,to:route.bossArena,width:12}]:route?[{from:{x:0,z:0},to:{x:0,z:-114},width:18},{from:{x:0,z:0},to:{x:0,z:114},width:18}]:landmarks.map(l=>({from:{x:0,z:0},to:{x:l.x,z:l.z},width:12})),scaleUnit:'metres',revision:1};
}
const solidCache=new WeakMap();
function nearbySolids(map,p,r){let cached=solidCache.get(map),hash=cached?.hash;if(!cached||cached.source!==map.obstacles||cached.length!==map.obstacles.length||cached.revision!==map.revision){hash=new Map();for(const o of map.obstacles){for(let x=Math.floor((o.x-o.w/2)/12);x<=Math.floor((o.x+o.w/2)/12);x++)for(let z=Math.floor((o.z-o.d/2)/12);z<=Math.floor((o.z+o.d/2)/12);z++){const key=x+','+z,list=hash.get(key)||[];list.push(o);hash.set(key,list);}}solidCache.set(map,{hash,source:map.obstacles,length:map.obstacles.length,revision:map.revision});}const out=new Set();for(let x=Math.floor((p.x-r)/12);x<=Math.floor((p.x+r)/12);x++)for(let z=Math.floor((p.z-r)/12);z<=Math.floor((p.z+r)/12);z++)for(const o of hash.get(x+','+z)||[])out.add(o);return out;}
export function bonkBlocked(map,p,r=.45,bottom=0){if(!Number.isFinite(p?.x)||!Number.isFinite(p?.z)||p.x<(map.tower?map.minX:-114)+r||p.x>(map.tower?map.maxX:114)-r||p.z<(map.tower?map.minZ:-114)+r||p.z>(map.tower?map.maxZ:114)-r)return true;for(const o of nearbySolids(map,p,r))if(o.alive!==false&&(o.h||10)>bottom&&Math.abs(p.x-o.x)<o.w/2+r&&Math.abs(p.z-o.z)<o.d/2+r)return true;return false;}
export function bonkFreePoint(map,p,r=.45){if(!bonkBlocked(map,p,r))return{x:p.x,z:p.z};for(let radius=1;radius<15;radius+=1)for(let i=0;i<16;i++){const a=i*Math.PI/8,q={x:p.x+Math.sin(a)*radius,z:p.z+Math.cos(a)*radius};if(!bonkBlocked(map,q,r))return q;}return{...map.spawn};}
