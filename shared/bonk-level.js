import {BONK_STAGES} from './bonk-catalog.js';
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
export function bonkHeightAt(map,x,z){
 const phase=(map?.seed||1)%97*.07,key=map?.stageKey||'grove';let h=1.1+Math.sin(x*.025+phase)*.65+Math.cos(z*.031-phase)*.55;
 if(key==='grove')h+=4.4*(1-smooth((Math.hypot(x+58,z-24)-13)/22))+2.7*(1-smooth((Math.hypot(x-56,z+55)-15)/24));
 else if(key==='forge')h+=5.1*(1-smooth((Math.hypot(x,z)-20)/45))+1.6*Math.sin(x*.048)*Math.sin(z*.03);
 else if(key==='sands')h+=3.1*(1-smooth((Math.hypot(x+50,z-20)-15)/30))+1.25*Math.sin(x*.035+Math.sin(z*.03));
 else if(key==='coast')h+=2.3*(1-smooth((Math.hypot(x-45,z+48)-17)/30))+.5*Math.sin(x*.03+z*.05);
 else if(key==='payon')h+=2.4*(1-smooth((Math.hypot(x+60,z+28)-17)/31))+1.1*Math.sin(x*.05)*Math.cos(z*.035);
 else if(key==='crypt')h+=2.8*(1-smooth((Math.hypot(x-55,z+46)-20)/30))+.65*Math.sin(x*.04+z*.025);
 else if(key==='geffen')h+=3.2*(1-smooth((Math.hypot(x+48,z+55)-18)/38))+1.2*(1-smooth((Math.hypot(x-54,z-50)-20)/28));
 else h+=3.7*(1-smooth((Math.hypot(x-62,z-24)-16)/25))+3.4*(1-smooth((Math.hypot(x+52,z+54)-15)/26));
 return Math.max(.05,h);
}
export function generateBonkLevel(seed=1,stageKey='grove',habitat=null){
 if(!BONK_STAGES[stageKey])stageKey='grove';const theme=BONK_STAGES[stageKey],half=115,landmarks=[{id:'north-rune',x:0,z:-76,name:'Santuário do norte'},{id:'east-rune',x:72,z:38,name:'Santuário da aurora'},{id:'west-rune',x:-72,z:38,name:'Santuário das raízes'}],spawn={x:0,z:23},obstacles=[],decorations=[],objects=[],routes=[{x:0,z:0},...landmarks,spawn];
 const regionalModels={sands:['sand-pyramid','sand-gate','desert-well','sand-pyramid'],coast:['coastal-wreck','coastal-arch','coral-garden','coastal-wreck'],grove:['prontera-fountain','prontera-house','prontera-gate','prontera-house'],payon:['payon-gate','payon-pavilion','payon-cavemouth','payon-lanterns'],crypt:['ruined-chapel','tomb-garden','gothic-gate','tomb-garden'],forge:['magma-furnace','lava-arch','basalt-throne','magma-furnace'],glacier:['ice-crown','ice-spires','ice-cavemouth','ice-spires'],geffen:['mage-tower','arcane-library','runic-gate','crystal-orbit']};
 const scenicSites=[[-48,-62],[46,-60],[-83,-17],[83,-17]].map(([x,z],i)=>({x,z,model:regionalModels[stageKey][i],w:11,d:10}));
 const clear=p=>scenicSites.some(o=>Math.abs(p.x-o.x)<o.w/2+4&&Math.abs(p.z-o.z)<o.d/2+4)||routes.some(r=>distance(p,r)<15)||landmarks.some(r=>{const l=Math.hypot(r.x,r.z),along=(p.x*r.x+p.z*r.z)/l,side=Math.abs(p.x*r.z-p.z*r.x)/l;return along>0&&along<l&&side<6;});
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
 const place=(type,i,extra={})=>{for(let attempt=0;attempt<80;attempt++){const p={x:(hash(seed+i*13.5+attempt*2)-.5)*196,z:(hash(seed+i*27.1+attempt*3)-.5)*196};if(obstacles.some(o=>Math.abs(p.x-o.x)<o.w/2+2.5&&Math.abs(p.z-o.z)<o.d/2+2.5)||objects.some(o=>distance(o,p)<12)||routes.some(r=>distance(p,r)<9))continue;objects.push({id:'bonk-'+type+'-'+i,type,...p,...extra,used:false});return;}};
 for(let i=0;i<26;i++)place('chest',i,{cost:25+i%4*8});for(let i=0;i<10;i++)place('shrine',i,{cost:40+i%3*15});for(let i=0;i<32;i++)place('pot',i,{hp:1});for(let i=0;i<3;i++)place('campfire',i,{fuel:35,radius:3.5});
 for(const [i,l]of landmarks.entries())objects.push({...l,type:'rune',index:i,used:false});
 for(const l of landmarks){for(const side of [-1,1])obstacles.push({id:l.id+'-pillar-'+side,x:l.x+side*5.5,z:l.z-2,w:2.1,d:2.1,h:4.6,alive:true,type:'landmark-pillar'});obstacles.push({id:l.id+'-colossus',x:l.x,z:l.z-8,w:2.65,d:2.65,h:6,alive:true,type:'landmark-statue'});}
 for(let i=0;i<4;i++){const angle=i*Math.PI/2+Math.PI/4;obstacles.push({id:'temple-pillar-'+i,x:Math.sin(angle)*11,z:Math.cos(angle)*11,w:3,d:3,h:5.7,alive:true,type:'temple-pillar'});}
 return{seed,stageKey,biome:theme.biome,habitat,theme:theme.biome,minX:-half,maxX:half,minZ:-half,maxZ:half,width:230,depth:230,spawn,center:{x:0,z:0},landmarks,obstacles,decorations,objects,paths:landmarks.map(l=>({from:{x:0,z:0},to:{x:l.x,z:l.z},width:12})),scaleUnit:'metres',revision:1};
}
const solidCache=new WeakMap();
function nearbySolids(map,p,r){let cached=solidCache.get(map),hash=cached?.hash;if(!cached||cached.source!==map.obstacles||cached.length!==map.obstacles.length||cached.revision!==map.revision){hash=new Map();for(const o of map.obstacles){for(let x=Math.floor((o.x-o.w/2)/12);x<=Math.floor((o.x+o.w/2)/12);x++)for(let z=Math.floor((o.z-o.d/2)/12);z<=Math.floor((o.z+o.d/2)/12);z++){const key=x+','+z,list=hash.get(key)||[];list.push(o);hash.set(key,list);}}solidCache.set(map,{hash,source:map.obstacles,length:map.obstacles.length,revision:map.revision});}const out=new Set();for(let x=Math.floor((p.x-r)/12);x<=Math.floor((p.x+r)/12);x++)for(let z=Math.floor((p.z-r)/12);z<=Math.floor((p.z+r)/12);z++)for(const o of hash.get(x+','+z)||[])out.add(o);return out;}
export function bonkBlocked(map,p,r=.45,bottom=0){if(!Number.isFinite(p?.x)||!Number.isFinite(p?.z)||Math.abs(p.x)>114-r||Math.abs(p.z)>114-r)return true;for(const o of nearbySolids(map,p,r))if(o.alive!==false&&(o.h||10)>bottom&&Math.abs(p.x-o.x)<o.w/2+r&&Math.abs(p.z-o.z)<o.d/2+r)return true;return false;}
export function bonkFreePoint(map,p,r=.45){if(!bonkBlocked(map,p,r))return{x:p.x,z:p.z};for(let radius=1;radius<15;radius+=1)for(let i=0;i<16;i++){const a=i*Math.PI/8,q={x:p.x+Math.sin(a)*radius,z:p.z+Math.cos(a)*radius};if(!bonkBlocked(map,q,r))return q;}return{...map.spawn};}
