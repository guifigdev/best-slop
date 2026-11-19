import {WARLOCK_REFERENCE} from './warlock-catalog.js';
const S=WARLOCK_REFERENCE.worldScale;
export const WARLOCK_BEHAVIOR=Object.freeze({
 // Warlock1.02 JASS: fF, BF, native movement loop; QF/pF/DG; Rg/Og; Vg/ng.
 link:Object.freeze({speed:950*S,flightDuration:.86,range:817*S,radius:35*S,returnSpeed:40/.03*S,pullAcceleration:1.4/(.03*.03)*S,collisionPadding:30*S,damageInterval:.18}),
 control:Object.freeze({speed:800*S,hitSpeed:400*S,duration:3.3,radius:52*S}),
 dome:Object.freeze({radius:180*S,duration:4,speedMultiplier:.5,lifetimeMultiplier:.9}),
 vector:Object.freeze({radius:225*S,duration:6,healThreshold:16,healCoefficient:.016}),
 gravity:Object.freeze({speed:400*S,duration:2.25,pullRadius:450*S,damageRadius:250*S,projectileRadius:600*S,damageInterval:.18}),
 drain:Object.freeze({speed:675*S,retargetSpeed:600*S,duration:1,retargetDuration:7/6,radius:24.5*S,speedBonus:50*S,returnSpeed:20/.03*S,returnContact:64*S})
});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),caster=(g,id)=>g.units.find(u=>u.id===id&&u.alive&&!u.wlGhost),pillar=(g,id)=>g.warlock.pillars.find(p=>p.id===id&&p.alive);

export function warlockLinkAction(state,unit){
 if(!unit)return null;const w=state?.warlock;if(w?.links?.some(l=>l.source===unit.id))return 'release';const p=w?.projectiles?.find(p=>p.family==='link'&&p.source===unit.id);return p?(p.returning?'cancel':'recall'):null;
}
export function breakWarlockLinks(game,{sourceId,targetId,enemyOnly=false}={}){
 const w=game.warlock;if(!w)return;
 w.links=(w.links||[]).filter(l=>{if(sourceId!=null&&l.source===sourceId)return false;if(targetId!=null&&l.targetKind==='caster'&&l.target===targetId){const from=caster(game,l.source),to=caster(game,targetId);if(!enemyOnly||from?.team!==to?.team)return false;}return true;});
 if(sourceId!=null)w.projectiles=w.projectiles.filter(p=>p.family!=='link'||p.source!==sourceId);
}
export function recallWarlockLink(game,unit){
 const action=warlockLinkAction(game,unit);if(!action)return false;
 if(action==='recall'){const p=game.warlock.projectiles.find(p=>p.family==='link'&&p.source===unit.id);p.returning=true;p.speed=WARLOCK_BEHAVIOR.link.returnSpeed;p.life=10;}else breakWarlockLinks(game,{sourceId:unit.id});return true;
}
export function bindWarlockLink(game,source,target,targetKind='caster',damage=.2,level=1){
 const w=game.warlock;w.links=(w.links||[]).filter(l=>l.source!==source.id);const link={id:game.id(),key:'S019',family:'link',mode:'hook',source:source.id,target:target.id,targetKind,damage,level,elapsed:0,damageClock:0,damageTicks:0};w.links.push(link);return link;
}
export function tickWarlockLinks(game,dt,hurt){
 const w=game.warlock,keep=[];
 for(const l of w.links||[]){const source=caster(game,l.source),target=l.targetKind==='pillar'?pillar(game,l.target):caster(game,l.target);if(!source||!target)continue;
  const gap=distance(source,target),contact=WARLOCK_BEHAVIOR.link.collisionPadding+30*S+(l.targetKind==='pillar'?target.radius:30*S);if(gap<=contact)continue;
  l.elapsed+=dt;const pulled=l.targetKind==='pillar'?source:target,dx=(source.x-target.x)/gap,dz=(source.z-target.z)/gap,sign=l.targetKind==='pillar'?-1:1;
  pulled.wlVx=(pulled.wlVx||0)+dx*sign*WARLOCK_BEHAVIOR.link.pullAcceleration*dt;pulled.wlVz=(pulled.wlVz||0)+dz*sign*WARLOCK_BEHAVIOR.link.pullAcceleration*dt;
  if(l.targetKind==='caster'&&source.team!==target.team){l.damageClock+=dt;while(l.damageClock+1e-9>=WARLOCK_BEHAVIOR.link.damageInterval&&target.alive){l.damageClock-=WARLOCK_BEHAVIOR.link.damageInterval;l.damageTicks++;const nativeFrame=Math.floor(l.damageTicks*WARLOCK_BEHAVIOR.link.damageInterval/.03),warmup=Math.max(0,1-Math.max(0,Math.floor((nativeFrame-2)/5))/5);hurt(game,source,target,l.damage+warmup,0,0,0);}}
  if(target.alive&&source.alive)keep.push(l);
 }w.links=keep;
}
export function warlockControlledAim(game,unit,point){
 const status=unit.wlControl,orb=status&&status.until>game.time&&game.warlock.projectiles.find(p=>p.id===status.orb&&p.family==='control'&&p.life>.15);
 if(!orb){unit.wlControl=null;return point;}return{x:orb.x,z:orb.z};
}
export function triggerWarlockVector(game,u){
 const v=u.wlVector;if(!v||v.until<=game.time){if(v)u.wlVector=null;return false;}if(distance(u,v)<=v.radius)return false;
 const speed=Math.hypot(u.wlVx||0,u.wlVz||0),gap=distance(u,v),nativeSpeed=speed*.03/S;u.wlVx=(v.x-u.x)/gap*speed;u.wlVz=(v.z-u.z)/gap*speed;
 if(nativeSpeed>WARLOCK_BEHAVIOR.vector.healThreshold)u.hp=Math.min(u.maxHp,u.hp+WARLOCK_BEHAVIOR.vector.healCoefficient*u.maxHp*Math.sqrt(nativeSpeed-WARLOCK_BEHAVIOR.vector.healThreshold));
 breakWarlockLinks(game,{targetId:u.id,enemyOnly:true});u.wlVector=null;game.fx('blink',u.x,u.z,{source:u.id,tx:v.x,tz:v.z,warlock:true});return true;
}
// First entering intersection; walking out of a dome never triggers reflection.
export function warlockDomeEntry(from,to,center,radius){
 const dx=to.x-from.x,dz=to.z-from.z,fx=from.x-center.x,fz=from.z-center.z,a=dx*dx+dz*dz,b=2*(fx*dx+fz*dz),c=fx*fx+fz*fz-radius*radius;
 if(a<1e-12||c<-.000001)return null;const disc=b*b-4*a*c;if(disc<0)return null;const t=(-b-Math.sqrt(disc))/(2*a);if(t<0||t>1)return null;const x=from.x+t*dx,z=from.z+t*dz,nx=(x-center.x)/radius,nz=(z-center.z)/radius;if(dx*nx+dz*nz>=0)return null;return{x,z,nx,nz,t};
}
export function reflectWarlockDomeProjectile(game,p,from){
 if(p.family==='gravity')return false;
 const options=game.warlock.fields.filter(f=>f.family==='dome'&&f.until>game.time&&f.team!==p.team&&p.family!=='swap').map(f=>({f,contact:warlockDomeEntry(from,p,f,f.radius+p.radius)})).filter(x=>x.contact).sort((a,b)=>a.contact.t-b.contact.t),first=options[0];if(!first)return false;
 const {f,contact:n}=first,dot=p.dx*n.nx+p.dz*n.nz;p.dx-=2*dot*n.nx;p.dz-=2*dot*n.nz;p.speed*=WARLOCK_BEHAVIOR.dome.speedMultiplier;p.life*=WARLOCK_BEHAVIOR.dome.lifetimeMultiplier;p.x=n.x+n.nx*.06;p.z=n.z+n.nz*.06;p.hitIds=[];
 if(!['link','splitter'].includes(p.family)){p.source=f.source;p.owner=f.owner;p.team=f.team;}game.fx('bolt',n.x,n.z,{source:f.source,tx:n.x+n.nx*.5,tz:n.z+n.nz*.5,warlock:true});return true;
}
export function reflectWarlockDomeDash(game,u,from,dash){
 const options=game.warlock.fields.filter(f=>f.family==='dome'&&f.until>game.time&&f.team!==u.team).map(f=>({f,contact:warlockDomeEntry(from,u,f,f.radius+30*S)})).filter(x=>x.contact).sort((a,b)=>a.contact.t-b.contact.t),first=options[0];if(!first)return false;
 const n=first.contact,dot=dash.dx*n.nx+dash.dz*n.nz;dash.dx-=2*dot*n.nx;dash.dz-=2*dot*n.nz;dash.speed*=.5;u.x=n.x+n.nx*.03;u.z=n.z+n.nz*.03;return true;
}
export function tickWarlockGravity(game,p,dt,hurt){
 const n=WARLOCK_BEHAVIOR.gravity,source=caster(game,p.source);if(!source)return;const level=p.level||1;
 for(const u of game.units.filter(u=>u.warlockCharacter&&!u.wlGhost&&u.alive&&u.team!==p.team)){const d=distance(u,p);if(d<=.001||d>=n.pullRadius)continue;const item=key=>u.inventory?.find(i=>i.key===key)?.level||0,mass=1-(item('boots')?.05:0)+.1*item('helmet')+(item('aegis')?.2:0),force=(1.35+.09*level)*(1-d*d/(n.pullRadius*n.pullRadius))/(mass+1)*S/(.03*.03)*dt;u.wlVx=(u.wlVx||0)+(p.x-u.x)/d*force;u.wlVz=(u.wlVz||0)+(p.z-u.z)/d*force;}
 for(const other of game.warlock.projectiles){if(other===p||other.family==='drain_return'||other.life<=0)continue;const d=distance(other,p);if(d<=.001||d>=n.projectileRadius)continue;const force=1.5*(1-d*d/(n.projectileRadius*n.projectileRadius))*S/(.03*.03)*dt,vx=other.dx*other.speed+(p.x-other.x)/d*force,vz=other.dz*other.speed+(p.z-other.z)/d*force,speed=Math.hypot(vx,vz);if(speed>1e-6){other.dx=vx/speed;other.dz=vz/speed;other.speed=speed;}}
 p.damageClock=(p.damageClock||0)+dt;while(p.damageClock+1e-9>=n.damageInterval){p.damageClock-=n.damageInterval;for(const target of game.units.filter(u=>u.warlockCharacter&&!u.wlGhost&&u.alive&&u.team!==p.team&&distance(u,p)<=n.damageRadius))hurt(game,source,target,p.damage,0,0,0);}
}
