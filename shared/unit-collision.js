import {unitBodyContact} from './unit-body-shape.js';
import {ARENA_BOUNDS} from './arena-size.js';
import {unitFootprintRadius,unitsPhysicallyCollide,unitHasPhysicalBody} from './unit-footprint.js';

const EPS=.0001;
const geometryCache=new WeakMap(),motions=new WeakMap();
const BUCKET=4;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export const unitRadius=unitFootprintRadius;
const space=u=>u.cell?`cell:${u.cell.x}:${u.cell.z}:${u.cell.r}`:u.lineLane!==undefined?`line:${u.lineLane}`:u.challenge?`trial:${u.challenge}`:'world';
const layer=u=>u.flying?'air':'ground';
const compatible=(a,b)=>space(a)===space(b)&&layer(a)===layer(b);
const live=u=>u.alive&&unitHasPhysicalBody(u)&&Number.isFinite(u.x)&&Number.isFinite(u.z);
const order=(a,b)=>typeof a.id==='number'&&typeof b.id==='number'?a.id-b.id:String(a.id).localeCompare(String(b.id));

function bounded(game,u,p){const r=unitRadius(u),b=game.bounds||ARENA_BOUNDS,c=u.cell,half=c?.r||b,cx=c?.x||0,cz=c?.z||0;
 const point={x:clamp(p.x,Math.max(-b,c?cx+(c.minX??-half):-b)+r,Math.min(b,c?cx+(c.maxX??half):b)-r),z:clamp(p.z,Math.max(-b,c?cz+(c.minZ??-half):-b)+r,Math.min(b,c?cz+(c.maxZ??half):b)-r)},radius=half+2.5-r,dx=point.x-cx,dz=point.z-cz,d=Math.hypot(dx,dz);if(game.options?.mode!=='linewars'&&(c||b===ARENA_BOUNDS)&&d>radius){point.x=cx+dx*radius/d;point.z=cz+dz*radius/d;}return point;}
export function unitMovementBounds(game,u){const r=unitRadius(u),b=game.bounds||ARENA_BOUNDS,c=u.cell,half=c?.r||b;return{minX:Math.max(-b,c?c.x+(c.minX??-half):-b)+r,maxX:Math.min(b,c?c.x+(c.maxX??half):b)-r,minZ:Math.max(-b,c?c.z+(c.minZ??-half):-b)+r,maxZ:Math.min(b,c?c.z+(c.maxZ??half):b)-r};}
export const limitUnitPoint=(game,u,p)=>bounded(game,u,p);
function geometry(game){const obs=game.obstacles||[],revision=game.obstacleRevision||0;let c=geometryCache.get(game);if(c&&c.source===obs&&c.length===obs.length&&c.revision===revision)return c;const hash=new Map();for(let i=0;i<obs.length;i++){const o=obs[i];if(o.alive===false||![o.x,o.z,o.w,o.d].every(Number.isFinite))continue;for(let x=Math.floor((o.x-o.w/2)/BUCKET);x<=Math.floor((o.x+o.w/2)/BUCKET);x++)for(let z=Math.floor((o.z-o.d/2)/BUCKET);z<=Math.floor((o.z+o.d/2)/BUCKET);z++){const key=`${x},${z}`,list=hash.get(key)||[];list.push(o);hash.set(key,list);}}c={source:obs,length:obs.length,revision,hash};geometryCache.set(game,c);return c;}
function collisionBoxes(game,u,from,to=from){const hash=geometry(game).hash,r=unitRadius(u),found=new Set();for(let x=Math.floor((Math.min(from.x,to.x)-r)/BUCKET);x<=Math.floor((Math.max(from.x,to.x)+r)/BUCKET);x++)for(let z=Math.floor((Math.min(from.z,to.z)-r)/BUCKET);z<=Math.floor((Math.max(from.z,to.z)+r)/BUCKET);z++)for(const o of hash.get(`${x},${z}`)||[])if(!(u.flying&&o.map))found.add(o);return found;}
function wallBlocked(game,u,p,from=u){const r=unitRadius(u);for(const o of collisionBoxes(game,u,p))if(Math.abs(p.x-o.x)<o.w/2+r-EPS&&Math.abs(p.z-o.z)<o.d/2+r-EPS)return true;return !!game.unitTerrainBlocked?.(u,p,r,from);}
function solidBlocked(game,u,p,from=u){if(!Number.isFinite(p?.x)||!Number.isFinite(p?.z))return true;const limit=bounded(game,u,p);return Math.hypot(limit.x-p.x,limit.z-p.z)>EPS||wallBlocked(game,u,p,from);}
export const unitSolidBlocked=(game,u,p,from=p)=>solidBlocked(game,u,p,from);
function segmentBox(a,b,o,r){let lo=0,hi=1;for(const axis of ['x','z']){const half=(axis==='x'?o.w:o.d)/2+r-EPS,min=o[axis]-half,max=o[axis]+half,d=b[axis]-a[axis];if(Math.abs(d)<EPS){if(a[axis]<=min||a[axis]>=max)return false;continue;}let enter=(min-a[axis])/d,exit=(max-a[axis])/d;if(enter>exit)[enter,exit]=[exit,enter];lo=Math.max(lo,enter);hi=Math.min(hi,exit);if(lo>hi)return false;}return hi>=0&&lo<=1;}
export function unitSegmentClear(game,u,from,to){if(![from?.x,from?.z,to?.x,to?.z].every(Number.isFinite))return false;for(const p of [from,to])if(Math.hypot(p.x-bounded(game,u,p).x,p.z-bounded(game,u,p).z)>EPS)return false;const r=unitRadius(u);for(const o of collisionBoxes(game,u,from,to))if(segmentBox(from,to,o,r))return false;if(game.unitTerrainBlocked){const steps=Math.max(1,Math.ceil(Math.hypot(to.x-from.x,to.z-from.z)/.2));let previous=from;for(let i=1;i<=steps;i++){const p={x:from.x+(to.x-from.x)*i/steps,z:from.z+(to.z-from.z)*i/steps};if(game.unitTerrainBlocked(u,p,r,previous))return false;previous=p;}}return true;}
export function beginUnitMotion(game,u,intended=false){let m=motions.get(u);if(!m||m.time!==game.time){m={time:game.time,x:u.x,z:u.z,intended:false};motions.set(u,m);}m.intended||=intended;return m;}
function finalizeMotion(game,u){const m=motions.get(u);if(m?.time===game.time)u.moving=m.intended&&Math.hypot(u.x-m.x,u.z-m.z)>.002;}
const ignored=(id,ignore)=>Array.isArray(ignore)?ignore.includes(id):ignore instanceof Set?ignore.has(id):ignore!==undefined&&id===ignore;

export function unitBlocked(game,u,point,ignoreId){
 if(solidBlocked(game,u,point))return true;const radius=unitRadius(u);
 return (game.units||[]).some(other=>!ignored(other.id,ignoreId)&&live(other)&&compatible(u,other)&&unitsPhysicallyCollide(u,other)&&unitBodyContact({...u,...point},other,radius,unitRadius(other)).depth>EPS);
}

function bucketKey(u,x=u.x,z=u.z){return`${space(u)}|${layer(u)}|${Math.floor(x/BUCKET)},${Math.floor(z/BUCKET)}`;}
function spatial(units){const result=new Map();result.maxRadius=units.reduce((r,u)=>Math.max(r,unitRadius(u)),0);for(const unit of units){const key=bucketKey(unit),list=result.get(key)||[];list.push(unit);result.set(key,list);}return result;}
function nearby(hash,u){const result=[],x=Math.floor(u.x/BUCKET),z=Math.floor(u.z/BUCKET),prefix=`${space(u)}|${layer(u)}|`,reach=Math.max(1,Math.ceil((unitRadius(u)+(hash.maxRadius||0))/BUCKET));for(let dx=-reach;dx<=reach;dx++)for(let dz=-reach;dz<=reach;dz++){const bucket=hash.get(`${prefix}${x+dx},${z+dz}`);if(bucket)result.push(...bucket);}return result;}
function idAngle(a,b){let hash=2166136261;for(const char of `${a.id}:${b.id}`)hash=Math.imul(hash^char.charCodeAt(0),16777619);return(hash>>>0)/4294967296*Math.PI*2;}

function slide(game,u,destination){const p=bounded(game,u,destination),dx=p.x-u.x,dz=p.z-u.z,steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.15));for(let i=0;i<steps;i++){const next=bounded(game,u,{x:u.x+dx/steps,z:u.z+dz/steps});if(unitSegmentClear(game,u,u,next)){u.x=next.x;u.z=next.z;continue;}const x={x:next.x,z:u.z},z={x:u.x,z:next.z};if(Math.abs(dx)>EPS&&!solidBlocked(game,u,x)&&unitSegmentClear(game,u,u,x))u.x=x.x;else if(Math.abs(dz)>EPS&&!solidBlocked(game,u,z)&&unitSegmentClear(game,u,u,z))u.z=z.z;else break;}}
function clearPath(game,u,p){return unitSegmentClear(game,u,u,p);}
function recoverSolid(game,u){const limit=bounded(game,u,u);u.x=limit.x;u.z=limit.z;if(!wallBlocked(game,u,u))return;const r=unitRadius(u),choices=[];for(const o of game.obstacles||[])if(Math.abs(u.x-o.x)<o.w/2+r&&Math.abs(u.z-o.z)<o.d/2+r){choices.push({x:o.x-o.w/2-r-EPS,z:u.z},{x:o.x+o.w/2+r+EPS,z:u.z},{x:u.x,z:o.z-o.d/2-r-EPS},{x:u.x,z:o.z+o.d/2+r+EPS});}choices.sort((a,b)=>Math.hypot(a.x-u.x,a.z-u.z)-Math.hypot(b.x-u.x,b.z-u.z));const free=choices.find(p=>!solidBlocked(game,u,p));if(free){u.x=free.x;u.z=free.z;}}

export function resolveUnitCollisions(game,dt){
 if(!Number.isFinite(dt)||dt<=0)return{pairs:0,passes:0,unresolved:0};const units=(game.units||[]).filter(live).sort(order);for(const unit of units)recoverSolid(game,unit);let pairs=0,passes=0;
 for(let pass=0;pass<12;pass++){const hash=spatial(units);let penetration=0;passes++;for(const a of units)for(const b of nearby(hash,a)){if(order(a,b)>=0||!unitsPhysicallyCollide(a,b))continue;const ra=unitRadius(a),rb=unitRadius(b),dx=a.x-b.x,dz=a.z-b.z,d=Math.hypot(dx,dz),contact=unitBodyContact(a,b,ra,rb),required=contact.depth;if(required<=EPS)continue;pairs++;penetration=Math.max(penetration,required);const angle=d>EPS?0:idAngle(a,b),nx=d>EPS?contact.nx:Math.cos(angle),nz=d>EPS?contact.nz:Math.sin(angle),massA=ra*ra*(a.hero?2:1),massB=rb*rb*(b.hero?2:1),weightA=massB/(massA+massB),oldA={x:a.x,z:a.z},oldB={x:b.x,z:b.z},push=required+EPS;
    slide(game,a,{x:a.x+nx*push*weightA,z:a.z+nz*push*weightA});slide(game,b,{x:b.x-nx*push*(1-weightA),z:b.z-nz*push*(1-weightA)});
    const moved=(a.x-oldA.x)*nx+(a.z-oldA.z)*nz-(b.x-oldB.x)*nx-(b.z-oldB.z)*nz,left=Math.max(0,push-moved);if(left>EPS){slide(game,b,{x:b.x-nx*left,z:b.z-nz*left});const again=Math.max(0,unitBodyContact(a,b,ra,rb).depth+EPS);if(again>EPS)slide(game,a,{x:a.x+nx*again,z:a.z+nz*again});}a.collisionAt=b.collisionAt=game.time;
   }if(penetration<=EPS)break;}
 // Recover coincident/legacy spawns that were already invalid. Candidates stay
 // in the same cell and require a solid-free path; walls are never tunneled.
 const maxRadius=units.reduce((r,u)=>Math.max(r,unitRadius(u)),.4),recoveryScale=game.options?.mode==='bonk'?.8:Math.max(.8,maxRadius*2),maxDistance=Math.min(12,Math.max(3,Math.sqrt(units.length)*recoveryScale));let recoveryHash=spatial(units);for(const unit of units){const overlaps=nearby(recoveryHash,unit).some(other=>unitsPhysicallyCollide(unit,other)&&unitBodyContact(unit,other,unitRadius(unit),unitRadius(other)).depth>EPS);if(!wallBlocked(game,unit,unit)&&!overlaps)continue;if(!unitBlocked(game,unit,unit))continue;const origin={x:unit.x,z:unit.z},step=Math.max(.25,unitRadius(unit)*.6);let found=null;for(let radius=step;radius<=maxDistance&&!found;radius+=step){const count=Math.max(12,Math.ceil(Math.PI*2*radius/step));for(let i=0;i<count;i++){const angle=i/count*Math.PI*2,p=bounded(game,unit,{x:origin.x+Math.cos(angle)*radius,z:origin.z+Math.sin(angle)*radius});if(!unitBlocked(game,unit,p)&&clearPath(game,unit,p)){found=p;break;}}}if(found){unit.x=found.x;unit.z=found.z;recoveryHash=spatial(units);}}
 for(const unit of units)finalizeMotion(game,unit);
 const hash=spatial(units);let unresolved=0;for(const a of units)for(const b of nearby(hash,a))if(order(a,b)<0&&unitsPhysicallyCollide(a,b)&&unitBodyContact(a,b,unitRadius(a),unitRadius(b)).depth>EPS)unresolved++;return{pairs,passes,unresolved};
}
