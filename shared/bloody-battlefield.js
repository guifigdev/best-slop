import {BLOODY_TERRAIN_DATA as DATA} from './bloody-terrain-data.js';

// Original browser layout following the requested outer-duel -> corridor ->
// central-clash flow. The extracted native terrain remains untouched reference.
export const BLOODY_WORLD_SCALE=2;
const HALF=112,STEP=1,N=224;
const rect=(x,z,w,d)=>({x,z,w,d,minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2});
const definitions=[[-85,0,'fire','Fornalha de Muspelheim'],[0,-85,'stone','Pátio dos Titãs'],[85,0,'forest','Bosque de Yggdrasil'],[0,85,'frost','Fortaleza de Niflheim']];
export const BLOODY_DUEL_ARENAS=Object.freeze(definitions.map(([x,z,theme,name],index)=>{const radial={x:x/85,z:z/85},side={x:-radial.z,z:radial.x},exit={x:radial.x*62,z:radial.z*62};return Object.freeze({...rect(x,z,46,46),id:'duel-'+index,index,name,theme,biome:theme,radial,side,center:{x,z},bounds:rect(x,z,46,46),exit,entrance:exit,waypoints:[exit,{x:radial.x*45,z:radial.z*45},{x:radial.x*20,z:radial.z*20},{x:0,z:0}]});}));
const center=Object.freeze({...rect(0,0,56,56),id:'central-clash',name:'Ágora dos Campeões',theme:'stone'});
const corridors=Object.freeze(BLOODY_DUEL_ARENAS.map(a=>({...rect(a.radial.x*45,a.radial.z*45,a.radial.x?34:14,a.radial.z?34:14),id:'bridge-'+a.index,arenaId:a.id,theme:a.theme,from:a.exit,to:{x:a.radial.x*28,z:a.radial.z*28}})));
const plots=[];for(const a of BLOODY_DUEL_ARENAS)for(const sign of [-1,1]){const seat=a.index*2+(sign===1?1:0),x=a.radial.x*136+a.side.x*sign*17,z=a.radial.z*136+a.side.z*sign*17;plots.push({...rect(x,z,30,26),seat,name:'Jardim '+(seat+1),native:false,center:{x,z},arenaId:a.id,theme:a.theme});}
plots.push({...rect(-85,-80,30,26),seat:8,name:'Jardim 9',native:false,center:{x:-85,z:-80},arenaId:'duel-0',theme:'fire'},{...rect(85,80,30,26),seat:9,name:'Jardim 10',native:false,center:{x:85,z:80},arenaId:'duel-0',theme:'fire'});
const preparationPlots=Object.freeze(plots);
const inside=(p,r)=>p.x>=r.minX&&p.x<=r.maxX&&p.z>=r.minZ&&p.z<=r.maxZ;
const regions=[center,...BLOODY_DUEL_ARENAS,...corridors];
const baseOpen=p=>regions.some(r=>inside(p,r));
const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
export function bloodyHeightAt(x,z){if(typeof x==='object'){z=x.z;x=x.x;}if(!Number.isFinite(x)||!Number.isFinite(z))return 0;if(preparationPlots.some(p=>inside({x,z},p)))return 0;const r=Math.hypot(x,z),t=Math.max(0,1-r/65),hill=t*t*(3-2*t)*4.4;const a=BLOODY_DUEL_ARENAS.find(a=>inside({x,z},a));return hill+(a?.theme==='fire'?.35*Math.sin(x*.12)*Math.sin(z*.1):a?.theme==='forest'?.25*Math.cos(x*.1)*Math.sin(z*.13):a?.theme==='frost'?.18*Math.sin(x*.16):0);}
// Deterministic physical scenery never occupies deployment bands or the
// corridor axes. Statues have explicit pedestals matching their colliders.
const scenery=[];
for(const a of BLOODY_DUEL_ARENAS){for(let i=0;i<14;i++){const u=(hash(i+a.index*93)-.5)*35,v=(i%2?1:-1)*(6+hash(i+211+a.index)*4),x=a.x+a.radial.x*u+a.side.x*v,z=a.z+a.radial.z*u+a.side.z*v,w=1.1+hash(i+817)*1.5;scenery.push({id:`realm-prop-${a.index}-${i}`,x,z,w,d:w,h:1.3+hash(i+711)*3.1,theme:a.theme,kind:a.theme==='forest'?(i%3?'tree':'boulder'):a.theme==='frost'?(i%3?'ice':'snowrock'):a.theme==='fire'?(i%3?'basalt':'vent'):'boulder',scenery:true,alive:true});}for(const sx of [-1,1])for(const sz of [-1,1])scenery.push({id:`statue-${a.index}-${sx}-${sz}`,x:a.x+sx*20.5,z:a.z+sz*20.5,w:2.3,d:2.3,h:6.8,kind:'statue',variant:(a.index+(sx===1?1:0)+(sz===1?2:0))%4,theme:a.theme,scenery:true,alive:true});}
for(let i=0;i<12;i++){const signX=i%2?-1:1,signZ=i%4<2?-1:1,x=signX*(15+hash(i+81)*8),z=signZ*(15+hash(i+45)*8);scenery.push({id:'agora-rock-'+i,x,z,w:1.3,d:1.3,h:.8+hash(i+2)*1.7,kind:i%4===0?'column':'boulder',theme:'stone',scenery:true,alive:true});}
for(const sx of [-1,1])for(const sz of [-1,1])scenery.push({id:`agora-statue-${sx}-${sz}`,x:sx*24,z:sz*24,w:2.3,d:2.3,h:6.8,kind:'statue',variant:(sx===1?1:0)+(sz===1?2:0),theme:'stone',scenery:true,alive:true});
export const BLOODY_SCENERY=Object.freeze(scenery.map(Object.freeze));
const water=[];let previous=new Map();for(let row=0;row<N;row++){const current=new Map();for(let col=0;col<N;){if(baseOpen({x:-HALF+col+.5,z:-HALF+row+.5})){col++;continue;}const start=col;while(col<N&&!baseOpen({x:-HALF+col+.5,z:-HALF+row+.5}))col++;const key=start+':'+col,old=previous.get(key);if(old){old.d++;old.z+=.5;current.set(key,old);}else{const box={id:`water-${row}-${start}`,x:-HALF+(start+col)/2,z:-HALF+row+.5,w:col-start,d:1,waterBoundary:true};water.push(box);current.set(key,box);}}previous=current;}
const obstacles=Object.freeze([...water,...BLOODY_SCENERY]);
const fronts=Object.freeze(BLOODY_DUEL_ARENAS.flatMap(a=>[-1,1].map((sign,i)=>{const x=a.x+a.side.x*sign*15,z=a.z+a.side.z*sign*15;return{...rect(x,z,28,7),index:a.index*2+i,key:(a.index+1)+(i?'b':'a'),arenaId:a.id,arenaIndex:a.index,side:sign,x,z,reinforcement:{x,z},exit:a.exit,waypoints:a.waypoints};})));
const map=Object.freeze({minX:-160,maxX:160,minZ:-160,maxZ:160,width:320,depth:320,battleBounds:{minX:-HALF,maxX:HALF,minZ:-HALF,maxZ:HALF,width:224,depth:224},nativeExtent:{minX:-HALF,maxX:HALF,minZ:-HALF,maxZ:HALF},center:{x:0,z:0},scale:2,battlefieldKey:'outer-duels-four-realms-v2',obstacles,duelArenas:BLOODY_DUEL_ARENAS,corridors,centralArena:center});
export const BLOODY_BATTLEFIELD=Object.freeze({map,scale:2,heightAt:bloodyHeightAt,source:DATA.provenance,preparationPlots,fronts,obstacles,duelArenas:BLOODY_DUEL_ARENAS,pairArenas:BLOODY_DUEL_ARENAS,centralArena:center,corridors,bridges:corridors,scenery:BLOODY_SCENERY,adaptation:'Four original themed square duel arenas and protected corridors leading to a central agora, inspired by the requested Blood Tournament flow. Native source records are reference only.'});
export const bloodyPreparationPlot=seat=>preparationPlots[Math.max(0,Math.min(9,Math.floor(Number(seat)||0)))];
export function bloodyPreparationValid(seat,p,radius=.2){const a=bloodyPreparationPlot(seat);return Number.isFinite(p?.x)&&Number.isFinite(p?.z)&&p.x>=a.minX+.8+radius&&p.x<=a.maxX-.8-radius&&p.z>=a.minZ+.8+radius&&p.z<=a.maxZ-.8-radius;}
export function bloodyPreparationPoint(seat,preferred,occupied=[]){const a=bloodyPreparationPlot(seat),candidates=[];for(let z=a.minZ+1.1;z<=a.maxZ-1;z+=1.1)for(let x=a.minX+1.1;x<=a.maxX-1;x+=1.1)if(occupied.every(o=>Math.hypot(o.x-x,o.z-z)>=1.05))candidates.push({x,z});candidates.sort((a,b)=>Math.hypot(a.x-preferred.x,a.z-preferred.z)-Math.hypot(b.x-preferred.x,b.z-preferred.z)||a.x-b.x||a.z-b.z);return candidates[0]||null;}
export function bloodyTerrainBlocked(p,radius=0){if(!Number.isFinite(p?.x)||!Number.isFinite(p?.z)||!Number.isFinite(radius)||radius<0||p.x-radius< -HALF||p.x+radius>HALF||p.z-radius< -HALF||p.z+radius>HALF)return true;return obstacles.some(o=>Math.abs(p.x-o.x)<o.w/2+radius-1e-5&&Math.abs(p.z-o.z)<o.d/2+radius-1e-5);}
export function bloodyBattleFront({seat=0,team=1,teams=false,teamIndex=0}={}){const index=seat<8?seat:seat===8?0:1;return{...fronts[index],extraOffset:seat>=8?3.6:0};}
export function bloodyBattleSpawn({seat=0,team=1,teams=false,teamIndex=0,entry,index:troopIndex=0,count=1}){const plot=bloodyPreparationPlot(seat),front=bloodyBattleFront({seat,team,teams,teamIndex}),a=BLOODY_DUEL_ARENAS[front.arenaIndex],u=Math.max(-1,Math.min(1,(entry.x-plot.x)/(plot.w/2)))*16+(troopIndex-(count-1)/2)*1.3,v=front.side*(15+(entry.z-plot.z)/(plot.d/2)*3);return{x:a.x+a.radial.x*(u+front.extraOffset)+a.side.x*v,z:a.z+a.radial.z*(u+front.extraOffset)+a.side.z*v};}
// Deploy every purchased body into its own side of the outer arena. A saturated
// formation may initially overlap allies, but never vanishes or crosses sides.
export function bloodyDeploymentPoint(game,player,entry,index=0,count=1,radius=.6){
 const seat=player.btPadSeat??player.seat??0,front=bloodyBattleFront({seat,team:player.btTeam,teams:game.options?.bloodyTeams}),arena=BLOODY_DUEL_ARENAS[front.arenaIndex],preferred=bloodyBattleSpawn({seat,entry,index,count}),flying=!!player.flying,allies=(game.units||[]).filter(u=>u.bloodyUnit&&u.alive&&!!u.flying===flying),candidates=[];
 const safe=p=>!bloodyTerrainBlocked(p,radius)&&front.side*((p.x-arena.x)*arena.side.x+(p.z-arena.z)*arena.side.z)>=radius+1&&Math.abs(p.x-arena.x)<=23-radius&&Math.abs(p.z-arena.z)<=23-radius,clear=p=>allies.every(u=>Math.hypot(u.x-p.x,u.z-p.z)>=(u.collisionRadius||.5)+radius-.01);
 if(safe(preferred)&&clear(preferred))return preferred;
 const spacing=Math.max(1.05,radius*2.04);for(let v=radius+1.1;v<22-radius;v+=spacing)for(let u=-21+radius;u<21-radius;u+=spacing){const p={x:arena.x+arena.radial.x*u+arena.side.x*front.side*v,z:arena.z+arena.radial.z*u+arena.side.z*front.side*v};if(safe(p))candidates.push(p);}
 candidates.sort((a,b)=>Math.hypot(a.x-preferred.x,a.z-preferred.z)-Math.hypot(b.x-preferred.x,b.z-preferred.z));return candidates.find(clear)||candidates[0]||{x:arena.x+arena.side.x*front.side*15,z:arena.z+arena.side.z*front.side*15};
}
const contexts=new WeakMap();export function bloodyBattleContext(game){let c=contexts.get(game);if(!c){c={map:{...map,...map.battleBounds},buildings:[],obstacles,navigationRevision:4};contexts.set(game,c);}c.units=game.units.filter(u=>u.bloodyUnit&&u.alive);c.elapsed=game.time;return c;}
