import {ARENA_BOUNDS} from './arena-size.js';

const EPS=.0001;
const BUCKET=4;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export function unitRadius(u){return clamp(Number.isFinite(u?.collisionRadius)?u.collisionRadius:.48*(Number.isFinite(u?.size)?u.size:1),.2,1.6);}
const space=u=>u.lineLane!==undefined?`line:${u.lineLane}`:u.cell?`cell:${u.cell.x}:${u.cell.z}:${u.cell.r}`:u.challenge?`trial:${u.challenge}`:'world';
const layer=u=>u.flying?'air':'ground';
const compatible=(a,b)=>space(a)===space(b)&&layer(a)===layer(b);
const live=u=>u.alive&&!u.noCollision&&Number.isFinite(u.x)&&Number.isFinite(u.z);
const order=(a,b)=>typeof a.id==='number'&&typeof b.id==='number'?a.id-b.id:String(a.id).localeCompare(String(b.id));

function bounded(game,u,p){const r=unitRadius(u),b=game.bounds||ARENA_BOUNDS,c=u.cell,half=c?.r||b,cx=c?.x||0,cz=c?.z||0;
 const point={x:clamp(p.x,Math.max(-b,c?cx-half:-b)+r,Math.min(b,c?cx+half:b)-r),z:clamp(p.z,Math.max(-b,c?cz-half:-b)+r,Math.min(b,c?cz+half:b)-r)},radius=half+2.5-r,dx=point.x-cx,dz=point.z-cz,d=Math.hypot(dx,dz);if(game.options?.mode!=='linewars'&&(c||b===ARENA_BOUNDS)&&d>radius){point.x=cx+dx*radius/d;point.z=cz+dz*radius/d;}return point;}
function wallBlocked(game,u,p){const r=unitRadius(u);return (game.obstacles||[]).some(o=>!(u.flying&&o.map)&&Math.abs(p.x-o.x)<o.w/2+r-EPS&&Math.abs(p.z-o.z)<o.d/2+r-EPS)||!!game.unitTerrainBlocked?.(u,p,r);}
function solidBlocked(game,u,p){if(!Number.isFinite(p?.x)||!Number.isFinite(p?.z))return true;const limit=bounded(game,u,p);return Math.hypot(limit.x-p.x,limit.z-p.z)>EPS||wallBlocked(game,u,p);}
const ignored=(id,ignore)=>Array.isArray(ignore)?ignore.includes(id):ignore instanceof Set?ignore.has(id):ignore!==undefined&&id===ignore;

export function unitBlocked(game,u,point,ignoreId){
 if(solidBlocked(game,u,point))return true;const radius=unitRadius(u);
 return (game.units||[]).some(other=>other!==u&&!(u.id!==undefined&&other.id===u.id)&&!ignored(other.id,ignoreId)&&live(other)&&compatible(u,other)&&Math.hypot(point.x-other.x,point.z-other.z)<radius+unitRadius(other)-EPS);
}

function bucketKey(u,x=u.x,z=u.z){return`${space(u)}|${layer(u)}|${Math.floor(x/BUCKET)},${Math.floor(z/BUCKET)}`;}
function spatial(units){const result=new Map();for(const unit of units){const key=bucketKey(unit),list=result.get(key)||[];list.push(unit);result.set(key,list);}return result;}
function nearby(hash,u){const result=[],x=Math.floor(u.x/BUCKET),z=Math.floor(u.z/BUCKET),prefix=`${space(u)}|${layer(u)}|`;for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){const bucket=hash.get(`${prefix}${x+dx},${z+dz}`);if(bucket)result.push(...bucket);}return result;}
function idAngle(a,b){let hash=2166136261;for(const char of `${a.id}:${b.id}`)hash=Math.imul(hash^char.charCodeAt(0),16777619);return(hash>>>0)/4294967296*Math.PI*2;}

function slide(game,u,destination){const p=bounded(game,u,destination),dx=p.x-u.x,dz=p.z-u.z,steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.15));for(let i=0;i<steps;i++){const next=bounded(game,u,{x:u.x+dx/steps,z:u.z+dz/steps});if(!wallBlocked(game,u,next)){u.x=next.x;u.z=next.z;continue;}const x={x:next.x,z:u.z},z={x:u.x,z:next.z};if(Math.abs(dx)>EPS&&!solidBlocked(game,u,x))u.x=x.x;else if(Math.abs(dz)>EPS&&!solidBlocked(game,u,z))u.z=z.z;else break;}}
function clearPath(game,u,p){const d=Math.hypot(p.x-u.x,p.z-u.z),steps=Math.max(1,Math.ceil(d/.15));for(let i=1;i<=steps;i++)if(solidBlocked(game,u,{x:u.x+(p.x-u.x)*i/steps,z:u.z+(p.z-u.z)*i/steps}))return false;return true;}
function recoverSolid(game,u){const limit=bounded(game,u,u);u.x=limit.x;u.z=limit.z;if(!wallBlocked(game,u,u))return;const r=unitRadius(u),choices=[];for(const o of game.obstacles||[])if(Math.abs(u.x-o.x)<o.w/2+r&&Math.abs(u.z-o.z)<o.d/2+r){choices.push({x:o.x-o.w/2-r-EPS,z:u.z},{x:o.x+o.w/2+r+EPS,z:u.z},{x:u.x,z:o.z-o.d/2-r-EPS},{x:u.x,z:o.z+o.d/2+r+EPS});}choices.sort((a,b)=>Math.hypot(a.x-u.x,a.z-u.z)-Math.hypot(b.x-u.x,b.z-u.z));const free=choices.find(p=>!solidBlocked(game,u,p));if(free){u.x=free.x;u.z=free.z;}}

export function resolveUnitCollisions(game,dt){
 if(!Number.isFinite(dt)||dt<=0)return{pairs:0,passes:0,unresolved:0};const units=(game.units||[]).filter(live).sort(order);for(const unit of units)recoverSolid(game,unit);let pairs=0,passes=0;
 for(let pass=0;pass<12;pass++){const hash=spatial(units);let penetration=0;passes++;for(const a of units)for(const b of nearby(hash,a)){if(order(a,b)>=0)continue;const ra=unitRadius(a),rb=unitRadius(b),dx=a.x-b.x,dz=a.z-b.z,d=Math.hypot(dx,dz),required=ra+rb-d;if(required<=EPS)continue;pairs++;penetration=Math.max(penetration,required);const angle=d>EPS?0:idAngle(a,b),nx=d>EPS?dx/d:Math.cos(angle),nz=d>EPS?dz/d:Math.sin(angle),massA=ra*ra*(a.hero?2:1),massB=rb*rb*(b.hero?2:1),weightA=massB/(massA+massB),oldA={x:a.x,z:a.z},oldB={x:b.x,z:b.z},push=required+EPS;
    slide(game,a,{x:a.x+nx*push*weightA,z:a.z+nz*push*weightA});slide(game,b,{x:b.x-nx*push*(1-weightA),z:b.z-nz*push*(1-weightA)});
    const moved=(a.x-oldA.x)*nx+(a.z-oldA.z)*nz-(b.x-oldB.x)*nx-(b.z-oldB.z)*nz,left=Math.max(0,push-moved);if(left>EPS){slide(game,b,{x:b.x-nx*left,z:b.z-nz*left});const again=Math.max(0,ra+rb-Math.hypot(a.x-b.x,a.z-b.z)+EPS);if(again>EPS)slide(game,a,{x:a.x+nx*again,z:a.z+nz*again});}a.collisionAt=b.collisionAt=game.time;
   }if(penetration<=EPS)break;}
 // Recover coincident/legacy spawns that were already invalid. Candidates stay
 // in the same cell and require a solid-free path; walls are never tunneled.
 const maxDistance=Math.min(12,Math.max(3,Math.sqrt(units.length)*.8));let recoveryHash=spatial(units);for(const unit of units){const overlaps=nearby(recoveryHash,unit).some(other=>other!==unit&&Math.hypot(other.x-unit.x,other.z-unit.z)<unitRadius(other)+unitRadius(unit)-EPS);if(!wallBlocked(game,unit,unit)&&!overlaps)continue;if(!unitBlocked(game,unit,unit))continue;const origin={x:unit.x,z:unit.z},step=Math.max(.25,unitRadius(unit)*.6);let found=null;for(let radius=step;radius<=maxDistance&&!found;radius+=step){const count=Math.max(12,Math.ceil(Math.PI*2*radius/step));for(let i=0;i<count;i++){const angle=i/count*Math.PI*2,p=bounded(game,unit,{x:origin.x+Math.cos(angle)*radius,z:origin.z+Math.sin(angle)*radius});if(!unitBlocked(game,unit,p)&&clearPath(game,unit,p)){found=p;break;}}}if(found){unit.x=found.x;unit.z=found.z;recoveryHash=spatial(units);}}
 const hash=spatial(units);let unresolved=0;for(const a of units)for(const b of nearby(hash,a))if(order(a,b)<0&&Math.hypot(a.x-b.x,a.z-b.z)<unitRadius(a)+unitRadius(b)-EPS)unresolved++;return{pairs,passes,unresolved};
}
