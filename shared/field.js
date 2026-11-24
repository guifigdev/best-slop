import {unitRadius,unitMovementBounds,limitUnitPoint,unitSolidBlocked,unitSegmentClear,unitBlocked,beginUnitMotion} from './unit-collision.js';
import {ARENA_BOUNDS,WAR_BOUNDS} from './arena-size.js';
import {unitContactFraction} from './unit-footprint.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function generateField(seed=1){let s=seed>>>0;const random=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};const obstacles=[],zones=[];
 // Keep the central crossing and outer spawn ring open; obstacle pairs leave gaps.
 for(let i=0;i<16;i++){const angle=i/16*Math.PI*2,r=9+random()*9,x=Math.sin(angle)*r,z=Math.cos(angle)*r;if(Math.abs(x)<3||Math.abs(z)<3)continue;obstacles.push({id:`pillar-${i}`,x,z,w:1.5+random(),d:1.5+random(),h:2+random()*2,type:'pillar'});}
 for(let i=0;i<15;i++){const a=(i+.5)/15*Math.PI*2,r=8+random()*12;zones.push({id:`terrain-${i}`,type:['lava','ice','frost','water','trap'][i%5],x:Math.sin(a)*r,z:Math.cos(a)*r,r:1.4+random()*.7,period:6,offset:random()*6});}
 return{seed,bounds:WAR_BOUNDS,obstacles,zones};
}
export function blocked(point,obstacles,padding=.4){return obstacles.some(o=>Math.abs(point.x-o.x)<o.w/2+padding&&Math.abs(point.z-o.z)<o.d/2+padding);}
export function limitPoint(game,u,p){const b=game.bounds||ARENA_BOUNDS,cell=u.cell;const point={x:clamp(p.x,cell?Math.max(-b,cell.x+(cell.minX??-cell.r)):-b,cell?Math.min(b,cell.x+(cell.maxX??cell.r)):b),z:clamp(p.z,cell?Math.max(-b,cell.z+(cell.minZ??-cell.r)):-b,cell?Math.min(b,cell.z+(cell.maxZ??cell.r)):b)};const center=cell||{x:0,z:0},radius=(cell?.r||b)+2.5,dx=point.x-center.x,dz=point.z-center.z,d=Math.hypot(dx,dz);if(game.options?.mode!=='linewars'&&(cell||b===ARENA_BOUNDS)&&d>radius){point.x=center.x+dx*radius/d;point.z=center.z+dz*radius/d;}return point;}
export function moveUnit(game,u,p,{ignoreUnits=false}={}){
 if(!Number.isFinite(p?.x)||!Number.isFinite(p?.z))return false;const start={x:u.x,z:u.z};p=limitUnitPoint(game,u,p);const dx=p.x-u.x,dz=p.z-u.z;beginUnitMotion(game,u,Math.hypot(dx,dz)>.002);const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.2));
 for(let i=0;i<steps;i++){const next=limitUnitPoint(game,u,{x:u.x+dx/steps,z:u.z+dz/steps}),contact=ignoreUnits?1:unitContactFraction(u,u,next,game.units);if(contact<1){next.x=u.x+(next.x-u.x)*contact;next.z=u.z+(next.z-u.z)*contact;}if(unitSegmentClear(game,u,u,next)){u.x=next.x;u.z=next.z;if(contact<1)break;continue;}const x={x:next.x,z:u.z},z={x:u.x,z:next.z};if(Math.abs(dx)>1e-9&&unitSegmentClear(game,u,u,x)&&(ignoreUnits||unitContactFraction(u,u,x,game.units)===1))u.x=x.x;else if(Math.abs(dz)>1e-9&&unitSegmentClear(game,u,u,z)&&(ignoreUnits||unitContactFraction(u,u,z,game.units)===1))u.z=z.z;else break;}
 u.moving=Math.hypot(u.x-start.x,u.z-start.z)>.002;return u.moving;
}

const routes=new WeakMap(),diagnostics=new WeakMap(),directPaths=new WeakMap(),CELL=.75;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
class MinHeap{constructor(){this.data=[];}push(n){const a=this.data;let i=a.push(n)-1;while(i){const p=(i-1)>>1;if(a[p].f<n.f||a[p].f===n.f&&a[p].id<=n.id)break;a[i]=a[p];i=p;}a[i]=n;}pop(){const a=this.data,top=a[0],last=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&(a[c+1].f<a[c].f||a[c+1].f===a[c].f&&a[c+1].id<a[c].id))c++;if(a[c].f>last.f||a[c].f===last.f&&a[c].id>=last.id)break;a[i]=a[c];i=c;}a[i]=last;}return top;}}
function freeGoal(game,u,dest){
 const limited=limitUnitPoint(game,u,dest),actor=dest.alive&&dest.id!==undefined&&game.units?.includes(dest),r=unitRadius(u);
 if(actor){const sum=r+unitRadius(dest),reach=Math.max(sum+.03,game.attackReach?.(u,dest)||u.range||sum),stand=Math.max(sum+.025,reach*.9),angle=Math.atan2(u.x-dest.x,u.z-dest.z),candidates=[];for(let i=0;i<20;i++){const offset=i===0?0:Math.ceil(i/2)*(i%2?1:-1)*Math.PI/10,p={x:dest.x+Math.sin(angle+offset)*stand,z:dest.z+Math.cos(angle+offset)*stand};if(!unitSolidBlocked(game,u,p))candidates.push(p);}return candidates.find(p=>!unitBlocked(game,u,p))||null;}
 if(!unitSolidBlocked(game,u,limited))return limited;
 // A click on a trunk/rock means approach its free edge, never its center.
 for(let radius=.2;radius<=6;radius+=.2){const candidates=[],count=Math.max(16,Math.ceil(Math.PI*2*radius/.25));for(let i=0;i<count;i++){const a=i/count*Math.PI*2,p={x:limited.x+Math.sin(a)*radius,z:limited.z+Math.cos(a)*radius};if(!unitSolidBlocked(game,u,p))candidates.push(p);}if(candidates.length)return candidates.sort((a,b)=>distance(a,u)-distance(b,u)||a.x-b.x||a.z-b.z)[0];}return null;
}
function findPath(game,u,goal){
 const b=unitMovementBounds(game,u),nx=Math.floor((b.maxX-b.minX)/CELL)+1,nz=Math.floor((b.maxZ-b.minZ)/CELL)+1,total=nx*nz;if(total<=0||total>100000)return null;const point=id=>({x:b.minX+(id%nx)*CELL,z:b.minZ+Math.floor(id/nx)*CELL}),walk=new Int8Array(total),valid=id=>{if(!walk[id])walk[id]=unitSolidBlocked(game,u,point(id))?-1:1;return walk[id]===1;};
 const anchor=p=>{const x=Math.round((p.x-b.minX)/CELL),z=Math.round((p.z-b.minZ)/CELL),candidates=[];for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){const xx=x+dx,zz=z+dz;if(xx<0||xx>=nx||zz<0||zz>=nz)continue;const id=zz*nx+xx,q=point(id);if(valid(id)&&unitSegmentClear(game,u,p,q))candidates.push({id,d:distance(p,q)});}return candidates.sort((a,b)=>a.d-b.d||a.id-b.id)[0]?.id;};
 const start=anchor(u),end=anchor(goal);if(start===undefined||end===undefined)return null;const costs=new Float64Array(total);costs.fill(Infinity);const previous=new Int32Array(total);previous.fill(-1);const closed=new Uint8Array(total),open=new MinHeap();costs[start]=0;open.push({id:start,f:distance(point(start),goal)});let expanded=0,found=false;
 while(open.data.length&&expanded<Math.min(40000,total)){const{id}=open.pop();if(closed[id])continue;closed[id]=1;expanded++;if(id===end){found=true;break;}const x=id%nx,z=Math.floor(id/nx),from=point(id);for(const[dx,dz]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const xx=x+dx,zz=z+dz;if(xx<0||xx>=nx||zz<0||zz>=nz)continue;const next=zz*nx+xx;if(closed[next]||!valid(next))continue;const p=point(next);if(!unitSegmentClear(game,u,from,p))continue;const cost=costs[id]+CELL*(dx&&dz?Math.SQRT2:1);if(cost>=costs[next])continue;costs[next]=cost;previous[next]=id;open.push({id:next,f:cost+distance(p,goal)});}}
 const info=diagnostics.get(u)||{};info.expanded=expanded;info.searches=(info.searches||0)+1;diagnostics.set(u,info);if(!found)return null;const path=[];for(let id=end;id!==-1;id=previous[id])path.push(point(id));path.reverse();path.push({...goal});return path;
}
function avoidCrowd(game,u,waypoint){const d=distance(u,waypoint);if(d<.02)return waypoint;const step=Math.min(d,.5),dx=(waypoint.x-u.x)/d,dz=(waypoint.z-u.z)/d,next={x:u.x+dx*step,z:u.z+dz*step};if(!unitBlocked(game,u,next))return waypoint;const angle=Math.atan2(dx,dz);for(const offset of [Math.PI/4,-Math.PI/4,Math.PI/2,-Math.PI/2]){const p={x:u.x+Math.sin(angle+offset)*.65,z:u.z+Math.cos(angle+offset)*.65};if(!unitBlocked(game,u,p)&&unitSegmentClear(game,u,u,p)&&unitContactFraction(u,u,p,game.units)===1)return p;}return{x:u.x,z:u.z};}
// Fixed-radius sweeps, A* edges and actual movement share the same clearance.
// Paths live in WeakMaps, not replicated unit snapshots.
export function navigation(game,u,dest){
 const now=game.time||0;let info=diagnostics.get(u);if(!info){info={status:'idle',searches:0,expanded:0,last:{x:u.x,z:u.z},progressAt:now};diagnostics.set(u,info);}if(distance(u,info.last)>.035){info.last={x:u.x,z:u.z};info.progressAt=now;}const stagnant=now-info.progressAt>.65;
 const goal=freeGoal(game,u,dest);if(!goal){info.status='blocked';info.reason='occupied-goal';return{x:u.x,z:u.z};}info.goal={...goal};if(distance(u,goal)<.14){info.status='arrived';info.reason=null;return{x:u.x,z:u.z};}
 const cached=directPaths.get(u),r=unitRadius(u),dx=cached?cached.goal.x-cached.from.x:0,dz=cached?cached.goal.z-cached.from.z:0,length=dx*dx+dz*dz,t=length?((u.x-cached.from.x)*dx+(u.z-cached.from.z)*dz)/length:0,onLine=cached&&Math.hypot(u.x-cached.from.x-dx*t,u.z-cached.from.z-dz*t)<.025,cachedClear=!stagnant&&cached&&cached.revision===(game.obstacleRevision||0)&&cached.count===(game.obstacles?.length||0)&&cached.radius===r&&cached.flying===!!u.flying&&cached.map===game.voxelMap&&distance(goal,cached.goal)<.005&&t>=0&&t<=1&&onLine;
 if(cachedClear||unitSegmentClear(game,u,u,goal)){if(!cachedClear)directPaths.set(u,{from:{x:u.x,z:u.z},goal:{...goal},revision:game.obstacleRevision||0,count:game.obstacles?.length||0,radius:r,flying:!!u.flying,map:game.voxelMap});routes.delete(u);info.status='direct';info.reason=null;const p=avoidCrowd(game,u,goal);if(distance(p,u)<.002){info.status='blocked';info.reason='crowd';}return p;}
 const bounds=unitMovementBounds(game,u),key=`${Math.round(goal.x*2)},${Math.round(goal.z*2)}:${game.obstacleRevision||0}:${unitRadius(u)}:${!!u.flying}:${bounds.minX}:${bounds.minZ}`,old=routes.get(u);let route=old;
 if(!route||route.key!==key||u.pathKey!==key||now>=route.retryAt||stagnant&&now>=(route.stuckRetry||0)){
  route={key,path:findPath(game,u,goal),index:0,retryAt:now+1.5,stuckRetry:now+.8};routes.set(u,route);u.pathKey=key;
 }
 if(!route.path){info.status='blocked';info.reason='no-route';return{x:u.x,z:u.z};}while(route.index<route.path.length-1&&distance(u,route.path[route.index])<.17&&unitSegmentClear(game,u,u,route.path[route.index+1]))route.index++;
 for(let i=Math.min(route.path.length-1,route.index+12);i>route.index;i--)if(unitSegmentClear(game,u,u,route.path[i])){route.index=i;break;}let waypoint=route.path[route.index];if(!unitSegmentClear(game,u,u,waypoint)){routes.delete(u);info.status='blocked';info.reason='route-invalidated';return{x:u.x,z:u.z};}
 waypoint=avoidCrowd(game,u,waypoint);info.status=distance(waypoint,u)>.002?'detour':'blocked';info.reason=info.status==='blocked'?'crowd':null;return waypoint;
}
export function navigationInfo(u){const info=diagnostics.get(u);return info?{status:info.status,reason:info.reason||null,goal:info.goal?{...info.goal}:null,searches:info.searches,expanded:info.expanded}:null;}
