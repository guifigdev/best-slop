import {RO_MONSTER_BODY_HULLS} from './ro-monster-body-hulls.js';

export function unitBodyHull(unit){
 const points=unit?.bonkEnemy&&RO_MONSTER_BODY_HULLS[unit.ragnarokVisual];if(!points)return null;
 const scale=unit.size||1,c=Math.cos(unit.facing||0),s=Math.sin(unit.facing||0);
 return points.map(([x,z])=>({x:unit.x+(x*c+z*s)*scale,z:unit.z+(-x*s+z*c)*scale}));
}
const segmentGap=(p,a,b)=>{const x=b.x-a.x,z=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*x+(p.z-a.z)*z)/(x*x+z*z||1)));return Math.hypot(p.x-a.x-x*t,p.z-a.z-z*t);};
export function unitBodyStrikePoint(unit,point){
 const hull=unitBodyHull(unit);if(!hull){const dx=point.x-unit.x,dz=point.z-unit.z,d=Math.hypot(dx,dz)||1,r=unit.collisionRadius||.45;return{x:unit.x+dx/d*r,z:unit.z+dz/d*r};}
 let nearest={x:unit.x,z:unit.z},distance=Infinity;for(let i=0;i<hull.length;i++){const a=hull[i],b=hull[(i+1)%hull.length],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.z-a.z)*dz)/(dx*dx+dz*dz||1))),p={x:a.x+dx*t,z:a.z+dz*t},d=Math.hypot(p.x-point.x,p.z-point.z);if(d<distance){distance=d;nearest=p;}}return nearest;
}
// Distance from a point to the measured body, rather than its enclosing circle.
export function unitBodyGap(unit,point,radius=unit.collisionRadius||.45){
 const hull=unitBodyHull(unit);if(!hull)return Math.hypot(unit.x-point.x,unit.z-point.z)-radius;
 let inside=true,distance=Infinity;for(let i=0;i<hull.length;i++){const a=hull[i],b=hull[(i+1)%hull.length];if((b.x-a.x)*(point.z-a.z)-(b.z-a.z)*(point.x-a.x)<0)inside=false;distance=Math.min(distance,segmentGap(point,a,b));}return inside?-distance:distance;
}
// SAT for convex lower bodies and circles. The broad-phase radius remains
// conservative; narrow-phase contact follows the actual model and facing.
export function unitBodyContact(a,b,ra=a.collisionRadius||.45,rb=b.collisionRadius||.45){
 const dx=a.x-b.x,dz=a.z-b.z,d=Math.hypot(dx,dz);if(d>ra+rb+.1)return{depth:ra+rb-d,nx:dx/d,nz:dz/d};const ha=unitBodyHull(a),hb=unitBodyHull(b);
 if(!ha&&!hb)return{depth:ra+rb-d,nx:d?dx/d:1,nz:d?dz/d:0};
 const axes=[];for(const h of [ha,hb])if(h)for(let i=0;i<h.length;i++){const p=h[i],q=h[(i+1)%h.length],x=q.z-p.z,z=p.x-q.x,n=Math.hypot(x,z);if(n)axes.push([x/n,z/n]);}
 if(!ha||!hb){const circle=ha?b:a,h=ha||hb;let nearest=h[0];for(const p of h)if(Math.hypot(p.x-circle.x,p.z-circle.z)<Math.hypot(nearest.x-circle.x,nearest.z-circle.z))nearest=p;const x=circle.x-nearest.x,z=circle.z-nearest.z,n=Math.hypot(x,z);if(n)axes.push([x/n,z/n]);}
 const project=(u,h,r,x,z)=>{if(!h){const center=u.x*x+u.z*z;return[center-r,center+r];}let min=Infinity,max=-Infinity;for(const p of h){const value=p.x*x+p.z*z;min=Math.min(min,value);max=Math.max(max,value);}return[min,max];};
 let result={depth:Infinity,nx:1,nz:0};for(let [x,z]of axes){const aa=project(a,ha,ra,x,z),bb=project(b,hb,rb,x,z),depth=Math.min(aa[1]-bb[0],bb[1]-aa[0]);if(depth<result.depth){if(x*dx+z*dz<0){x=-x;z=-z;}result={depth,nx:x,nz:z};}}return result;
}
