// One continuous, deterministic height field for simulation, props and renderer.
import {roTowerHeightAt} from './ro-tower-layout.js';
// The playable landscape is a patch of a larger relief, not a flat square island.
export const RO_TERRAIN_VERSION=4;
export const RO_TERRAIN_GRID=3.6;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t,smooth=v=>{const t=clamp(v,0,1);return t*t*(3-2*t);};
const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
const cache=new WeakMap();
const PROFILES=Object.freeze({grove:{base:7,amplitude:10,wave:3.2,ridge:2.8},payon:{base:8,amplitude:11,wave:3.8,ridge:3.5},sands:{base:7,amplitude:11,wave:3.9,ridge:2.2},coast:{base:6,amplitude:9,wave:3,ridge:2},crypt:{base:8,amplitude:10,wave:3.2,ridge:3.4},forge:{base:9,amplitude:13,wave:4,ridge:4},glacier:{base:10,amplitude:12,wave:3.5,ridge:4.2},geffen:{base:9,amplitude:11,wave:3.6,ridge:3.4}});
function context(map){
 let c=cache.get(map);if(c&&c.town===map.town)return c;const seed=map.seed||1,p=PROFILES[map.stageKey]||PROFILES.grove,phase=(seed%127)*.041,angle=(hash(seed*2.3)-.5)*1.2;
 const landmarks=[{x:-64+hash(seed+5)*14,z:-47+hash(seed+7)*16,radius:43,height:p.amplitude*(1+hash(seed+31)*.6)},{x:55+hash(seed+11)*15,z:43+hash(seed+13)*11,radius:46,height:p.amplitude*.95},{x:35+hash(seed+17)*13,z:-73+hash(seed+19)*12,radius:36,height:p.amplitude*.70},{x:-31+hash(seed+23)*14,z:56+hash(seed+29)*12,radius:39,height:-p.amplitude*(.55+hash(seed+37)*.4)}];
 const raw=(x,z)=>{const xx=x*Math.cos(angle)-z*Math.sin(angle),zz=x*Math.sin(angle)+z*Math.cos(angle);let h=p.base+p.wave*(Math.sin(xx*.020+phase)*.65+Math.cos(zz*.023-phase*.6)*.5)+p.wave*.25*Math.sin((xx+zz)*.038+phase);for(const f of landmarks){const d=((x-f.x)**2+(z-f.z)**2)/(f.radius*f.radius);h+=f.height*Math.exp(-d*1.8);}const ridge=Math.sin(xx*.018+Math.sin(zz*.012+phase)*.55);h+=p.ridge*(1-Math.abs(ridge))**2;const outer=smooth((Math.max(Math.abs(x),Math.abs(z))-105)/75);h+=outer*(6+7*(.5+.5*Math.sin(xx*.012+phase)*Math.cos(zz*.014-phase)));return Math.max(.4,h);};
 if(hash(seed+41)>.4)landmarks.push({x:-82+hash(seed+43)*164,z:-82+hash(seed+47)*164,radius:24+hash(seed+53)*15,height:p.amplitude*(hash(seed+59)>.5?1.1:-.55)});
 const pathList=map.paths?.length?map.paths:map.route?.spokes||[],arena=map.route?.bossArena||{x:0,z:0,radius:11},arenaHeight=raw(arena.x,arena.z),pads=[];
 const centerHeight=(x,z)=>Math.hypot(x-arena.x,z-arena.z)<arena.radius?arenaHeight:raw(x,z);
 const paths=pathList.map(path=>{const from=path.from||{x:0,z:0},to=path.to,dx=to.x-from.x,dz=to.z-from.z,length=Math.hypot(dx,dz)||1;return{...path,from,to,dx,dz,length,fromHeight:centerHeight(from.x,from.z),toHeight:centerHeight(to.x,to.z)};});
 const grade=(x,z)=>{let h=raw(x,z),weight=0,road=0;for(const path of paths){const projection=((x-path.from.x)*path.dx+(z-path.from.z)*path.dz)/(path.length*path.length),t=clamp(projection,0,1),cx=path.from.x+path.dx*t,cz=path.from.z+path.dz*t,d=Math.hypot(x-cx,z-cz),half=(path.width||12)*.5,w=1-smooth((d-half)/7);if(!w)continue;const elevation=mix(path.fromHeight,path.toHeight,t)+Math.sin(t*Math.PI)*Math.sin(t*Math.PI*2+phase)*.7;road+=elevation*w;weight+=w;}if(weight)h=mix(h,road/weight,Math.min(1,weight));const d=Math.hypot(x-arena.x,z-arena.z),inner=Math.max(7,arena.radius-3),w=1-smooth((d-inner)/10);return mix(h,arenaHeight,w);};
 const addPad=(x,z,w,d,shoulder=4)=>{if(!Number.isFinite(x)||!Number.isFinite(z))return;pads.push({x,z,w,d,shoulder,height:grade(x,z)});};
 const spawn=map.spawn||map.route?.entry||{x:0,z:23};addPad(spawn.x,spawn.z,6,6,5);
 for(const site of map.decorations||[])if(site.type==='scenery'||site.type==='regional-prop')addPad(site.x,site.z,(site.w||6)+1,(site.d||5)+1,5);
 for(const o of map.objects||[])if(['chest','shrine','campfire'].includes(o.type))addPad(o.x,o.z,o.type==='shrine'?3:1.8,o.type==='shrine'?3:1.8,2.5);
 // A single graded foundation supports the whole authored village, including
 // lattice vertices beyond the houses. Blend its shoulders back into the hills.
 const town=map.town,townHeight=town?grade(town.x,town.z):0;
 const final=(x,z)=>{let h=grade(x,z),sum=0,weighted=0;for(const pad of pads){const d=Math.hypot(Math.max(0,Math.abs(x-pad.x)-pad.w*.5),Math.max(0,Math.abs(z-pad.z)-pad.d*.5)),w=1-smooth(d/pad.shoulder);if(w>0){sum+=w;weighted+=pad.height*w;}}h=sum?mix(h,weighted/sum,Math.min(1,sum)):h;if(town){const distance=Math.hypot(Math.max(0,Math.abs(x-town.x)-20),Math.max(0,Math.abs(z-town.z)-18));h=mix(h,townHeight,1-smooth(distance/12));}return h;};
 c={town,raw,grade,final,vertices:new Map(),landmarks,paths,pads};cache.set(map,c);return c;
}

export function roTerrainHeightAt(map,x,z){
 if(!map||!Number.isFinite(x)||!Number.isFinite(z))return 0;if(map.tower)return roTowerHeightAt(map,x,z);const c=context(map),step=RO_TERRAIN_GRID,ix=Math.floor(x/step+1e-9),iz=Math.floor(z/step+1e-9),tx=clamp(x/step-ix,0,1),tz=clamp(z/step-iz,0,1),vertex=(a,b)=>{const key=a+','+b;let value=c.vertices.get(key);if(value===undefined){value=c.final(a*step,b*step);c.vertices.set(key,value);}return value;},a=vertex(ix,iz),b=vertex(ix+1,iz),d=vertex(ix,iz+1);
 // Same diagonal and barycentric interpolation as the detailed ground mesh.
 return tx+tz<=1?a+(b-a)*tx+(d-a)*tz:vertex(ix+1,iz+1)+(d-vertex(ix+1,iz+1))*(1-tx)+(b-vertex(ix+1,iz+1))*(1-tz);
}
export function roTerrainLandforms(map){return context(map).landmarks.map((p,i)=>({...p,type:p.height>0?'ridge':'valley',id:'ro-landform-'+i}));}
export function roTerrainSlope(map,x,z,step=1){return Math.hypot((roTerrainHeightAt(map,x+step,z)-roTerrainHeightAt(map,x-step,z))/(2*step),(roTerrainHeightAt(map,x,z+step)-roTerrainHeightAt(map,x,z-step))/(2*step));}
export function roTerrainReviewPoints(map){const points=[];for(let x=-88;x<=88;x+=8)for(let z=-88;z<=88;z+=8)points.push({x,z,height:roTerrainHeightAt(map,x,z)});points.sort((a,b)=>a.height-b.height);return{valley:points[0],ridge:points.at(-1),spawn:{...map.spawn,height:roTerrainHeightAt(map,map.spawn.x,map.spawn.z)}};}
