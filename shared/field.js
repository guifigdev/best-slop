import {ARENA_BOUNDS,WAR_BOUNDS} from './arena-size.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function generateField(seed=1){let s=seed>>>0;const random=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};const obstacles=[],zones=[];
 // Keep the central crossing and outer spawn ring open; obstacle pairs leave gaps.
 for(let i=0;i<16;i++){const angle=i/16*Math.PI*2,r=9+random()*9,x=Math.sin(angle)*r,z=Math.cos(angle)*r;if(Math.abs(x)<3||Math.abs(z)<3)continue;obstacles.push({id:`pillar-${i}`,x,z,w:1.5+random(),d:1.5+random(),h:2+random()*2,type:'pillar'});}
 for(let i=0;i<15;i++){const a=(i+.5)/15*Math.PI*2,r=8+random()*12;zones.push({id:`terrain-${i}`,type:['lava','ice','frost','water','trap'][i%5],x:Math.sin(a)*r,z:Math.cos(a)*r,r:1.4+random()*.7,period:6,offset:random()*6});}
 return{seed,bounds:WAR_BOUNDS,obstacles,zones};
}
export function blocked(point,obstacles,padding=.4){return obstacles.some(o=>Math.abs(point.x-o.x)<o.w/2+padding&&Math.abs(point.z-o.z)<o.d/2+padding);}
export function limitPoint(game,u,p){const b=game.bounds||ARENA_BOUNDS,cell=u.cell;const point={x:clamp(p.x,cell?Math.max(-b,cell.x-cell.r):-b,cell?Math.min(b,cell.x+cell.r):b),z:clamp(p.z,cell?Math.max(-b,cell.z-cell.r):-b,cell?Math.min(b,cell.z+cell.r):b)};const center=cell||{x:0,z:0},radius=(cell?.r||b)+2.5,dx=point.x-center.x,dz=point.z-center.z,d=Math.hypot(dx,dz);if((cell||b===ARENA_BOUNDS)&&d>radius){point.x=center.x+dx*radius/d;point.z=center.z+dz*radius/d;}return point;}
export function moveUnit(game,u,p){if(!Number.isFinite(p?.x)||!Number.isFinite(p?.z))return;p=limitPoint(game,u,p);const obstacles=game.obstacles||[],dx=p.x-u.x,dz=p.z-u.z,steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.25));
 // Sweep in small increments so dashes or larger simulation steps cannot tunnel
 // through a thin ice wall. Blink intentionally uses validated teleportation.
 for(let i=0;i<steps;i++){const next={x:u.x+dx/steps,z:u.z+dz/steps};if(!blocked(next,obstacles)){u.x=next.x;u.z=next.z;continue;}const x={x:next.x,z:u.z},z={x:u.x,z:next.z};if(Math.abs(dx)>1e-9&&!blocked(x,obstacles))u.x=x.x;else if(Math.abs(dz)>1e-9&&!blocked(z,obstacles))u.z=z.z;else break;}}
// Grid A* is only used when a direct path meets a wall. Cached per unit/target.
export function navigation(game,u,dest){const obs=game.obstacles||[];if(!obs.length)return dest;const d=Math.hypot(dest.x-u.x,dest.z-u.z),steps=Math.ceil(d*2);let obstructed=false;for(let i=1;i<=steps;i++)if(blocked({x:u.x+(dest.x-u.x)*i/steps,z:u.z+(dest.z-u.z)*i/steps},obs)){obstructed=true;break;}if(!obstructed)return dest;
 const key=`${Math.round(dest.x)},${Math.round(dest.z)}:${game.obstacleRevision||0}`;if(u.pathKey!==key||game.time>u.pathUntil){u.pathKey=key;u.pathUntil=game.time+1.5;u.path=[];const b=game.bounds||ARENA_BOUNDS,start={x:Math.round(u.x),z:Math.round(u.z)},goal={x:Math.round(dest.x),z:Math.round(dest.z)},id=p=>`${p.x},${p.z}`,open=[{...start,g:0,f:0}],seen=new Map([[id(start),0]]),parents=new Map();let end=null;
 for(let n=0;open.length&&n<3200;n++){open.sort((a,b)=>a.f-b.f);const p=open.shift();if(Math.hypot(p.x-goal.x,p.z-goal.z)<1.5){end=p;break;}for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const q={x:p.x+dx,z:p.z+dz},g=p.g+1,k=id(q),limited=limitPoint(game,u,q);if(q.x!==limited.x||q.z!==limited.z||Math.abs(q.x)>b||Math.abs(q.z)>b||blocked(q,obs,.6)||g>=(seen.get(k)??Infinity))continue;seen.set(k,g);parents.set(k,p);open.push({...q,g,f:g+Math.abs(q.x-goal.x)+Math.abs(q.z-goal.z)});}}
 if(end){while(id(end)!==id(start)){u.path.unshift({x:end.x,z:end.z});end=parents.get(id(end));}}}
 while(u.path?.length&&Math.hypot(u.x-u.path[0].x,u.z-u.path[0].z)<.5)u.path.shift();return u.path?.[0]||{x:u.x,z:u.z};
}
