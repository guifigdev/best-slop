import {SKILLS,skillAt,levelOf} from './catalog.js';
import {MONSTERS} from './monsters.js';
import {blocked,limitPoint,moveUnit} from './field.js';

const BATTLE=new Set(['wave','bonus','final']);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const sourceData=u=>({id:u.id,owner:u.owner,team:u.team,x:u.x,z:u.z,altitude:u.flying?u.altitude||0:0,challenge:u.challenge,cell:u.cell,magicPower:u.magicPower||1});
function direction(u,p){const x=p.x-u.x,z=p.z-u.z,d=Math.hypot(x,z);return d>.001?{x:x/d,z:z/d}:{x:Math.sin(u.facing||0),z:Math.cos(u.facing||0)};}
function lineClear(game,from,to){const d=distance(from,to),steps=Math.max(1,Math.ceil(d/.25));for(let i=1;i<=steps;i++)if(blocked({x:from.x+(to.x-from.x)*i/steps,z:from.z+(to.z-from.z)*i/steps},game.obstacles||[],.1))return false;return true;}
function sameTrial(game,h,t){if(t.team===h.team)return false;if(t.challenge){if(game.phase==='bonus')return t.challenge===h.owner;if(['best','war'].includes(game.options.mode))return game.groupKey(h)===t.challenge;}return true;}

export const monsterMethods={
 monsterThink(u,dt){
  const species=MONSTERS[u.kind];if(!species||u.hero||u.summon||!u.alive||!BATTLE.has(this.phase))return;
  // Monster buffs use their immutable spawn damage; hero buffs use recompute.
  u.monsterBaseDamage??=u.damage;const rage=(u.rageUntil||0)>this.time?u.rageData:null;u.damage=u.monsterBaseDamage*(1+(rage?.damage||0));u.attackSpeed=1+(rage?.attackSpeed||0);
  if(species.skill==='stonehide')return;
  if(u.nextMonsterSkill===undefined){u.nextMonsterSkill=this.time+2+(u.id%5)*.35;return;}
  if(u.stun>0||this.time<u.nextMonsterSkill||u.pendingSpecial)return;
  const target=this.enemies(u,9).find(t=>t.hero||t.summon);if(!target)return;
  const rank=clamp(1+Math.floor(this.wave/12),1,5),base=skillAt(species.skill,rank);if(!base)return;
  const multiplier=u.boss==='boss'?1:u.boss==='miniboss'?.8:.55,s={...base,...(base.damage!==undefined?{damage:base.damage*multiplier}:{}),...(base.burn!==undefined?{burn:base.burn*multiplier}:{})};
  const point=limitPoint(this,u,target),warning=species.skill==='battlecry'?.45:.9;
  u.nextMonsterSkill=this.time+Math.max(8,base.cooldown||12);u.pendingSpecial=true;u.castAt=this.time;u.castSkill=species.skill;u.facing=Math.atan2(point.x-u.x,point.z-u.z);
  this.specials||=[];this.specials.push({id:this.id(),type:'warning',source:u.id,key:species.skill,s,point,phase:this.phase,wave:this.wave,fireAt:this.time+warning});
  this.fx('monsterWarning',point.x,point.z,{source:u.id,skill:species.skill,radius:s.radius||2.2,tx:u.x,tz:u.z,duration:warning});
 },

 monsterLoot(t,source=null){
  if(t.lootRolled||t.alive||t.hero||t.summon||!MONSTERS[t.kind]||!BATTLE.has(this.phase))return null;t.lootRolled=true;
  let owner=source?.owner?this.player(source.owner):null;
  if(source){if(!owner||!sameTrial(this,owner,t))return null;}
  else owner=this.heroes().filter(h=>h.alive&&sameTrial(this,h,t)).sort((a,b)=>distance(a,t)-distance(b,t)||a.owner.localeCompare(b.owner))[0];
  if(!owner)return null;const chance=t.boss==='boss'?1:t.boss==='miniboss'?.5:.15;if(chance<1&&this.random()>=chance)return null;
  const drop={id:this.id(),skill:MONSTERS[t.kind].skill,owner:owner.owner,x:t.x,z:t.z,expires:this.time+90,kind:t.kind};
  this.drops||=[];this.drops.push(drop);this.fx('lootDrop',t.x,t.z,{source:owner.id,skill:drop.skill,dropId:drop.id});return drop;
 },

 claimLoot(u,c){
  const drop=(this.drops||[]).find(d=>d.id===c.dropId&&d.owner===u.owner&&d.expires>this.time);
  if(!drop||!u.alive||!SKILLS[drop.skill]||['victory','defeat'].includes(this.phase))return false;
  const rank=levelOf(u,drop.skill);let replaced=null;
  if(rank){if(rank>=5)return false;u.skillLevels[drop.skill]=rank+1;}
  else{let slot=c.slot;if(slot===undefined&&u.skills.length<7)slot=u.skills.length;
   if(!Number.isInteger(slot)||slot<0||slot>=7||slot>u.skills.length)return false;
   if(slot<u.skills.length){replaced=u.skills[slot];delete u.skillLevels[replaced];u.skills[slot]=drop.skill;}else u.skills.push(drop.skill);
   u.skillLevels[drop.skill]=1;
  }
  this.cancelChannel(u);this.refresh(u);this.drops=this.drops.filter(d=>d.id!==drop.id);this.fx('lootClaim',u.x,u.z,{source:u.id,skill:drop.skill,level:u.skillLevels[drop.skill],replaced});return true;
 },

 castSpecial(u,key,s,c,target){
  const point={x:c.x??target?.x??u.x,z:c.z??target?.z??u.z},dir=direction(u,point),origin={x:u.x,z:u.z};
  if(key==='rage'||key==='battlecry'){
   const old=(u.rageUntil||0)>this.time?u.rageData:null,next={damage:s.rageDamage||0,attackSpeed:s.rageSpeed||0},power=data=>(1+(data?.damage||0))*(1+(data?.attackSpeed||0));u.rageData=old&&power(old)>power(next)?old:next;u.rageUntil=Math.max(u.rageUntil||0,this.time+s.duration);if(u.hero)this.refresh(u);this.fx(key,u.x,u.z,{source:u.id,duration:s.duration,radius:2});return true;
  }
  if(key==='warlockfire'||key==='warlockfrost'){
   this.projectiles||=[];const projectile={id:this.id(),skill:key,element:key==='warlockfire'?'fire':'ice',x:u.x+dir.x*.55,z:u.z+dir.z*.55,dx:dir.x,dz:dir.z,speed:s.projectileSpeed||12,remaining:s.distance||14,radius:s.radius||.5,damage:this.spellDamage(u,s.damage,key==='warlockfire'?'fire':'ice'),push:s.push||0,slow:s.slow||0,slowDuration:s.duration||0,source:sourceData(u),phase:this.phase,wave:this.wave,created:this.time};
   this.projectiles.push(projectile);this.fx('projectileCast',u.x,u.z,{source:u.id,skill:key,tx:point.x,tz:point.z});return true;
  }
  if(key==='flamebreath'){
   for(const enemy of this.enemies(u,s.radius)){const d=distance(u,enemy)||1,dot=((enemy.x-u.x)*dir.x+(enemy.z-u.z)*dir.z)/d;if(dot<Math.cos(s.cone||.7)||!lineClear(this,u,enemy))continue;this.hit(enemy,this.spellDamage(u,s.damage,'fire')*(1-(enemy.fireResist||0)),u,true,false,false,false,'fire');if((enemy.avatar||0)<=this.time)this.applyDot(enemy,'burn',s.burn||0,s.duration||4,u);}
   this.fx('flamebreath',u.x,u.z,{source:u.id,tx:u.x+dir.x*s.radius,tz:u.z+dir.z*s.radius,radius:s.radius});return true;
  }
  if(key==='venomcloud'){
   this.specials||=[];this.specials.push({id:this.id(),type:'cloud',source:sourceData(u),x:point.x,z:point.z,radius:s.radius,damage:this.spellDamage(u,s.damage),expires:this.time+s.duration,next:this.time+.25,phase:this.phase,wave:this.wave});this.fx('venomcloud',point.x,point.z,{source:u.id,radius:s.radius,duration:s.duration});return true;
  }
  if(key==='stormdive'){
   const d=distance(u,point)||1,length=Math.min(d,s.distance);moveUnit(this,u,limitPoint(this,u,{x:u.x+dir.x*length,z:u.z+dir.z*length}));u.destination=null;u.target=null;u.order='auto';u.vx=u.vz=0;
   for(const enemy of this.enemies(u,s.radius)){this.hit(enemy,this.spellDamage(u,s.damage,'lightning'),u,true,false,false,false,'lightning');if((enemy.avatar||0)<=this.time){enemy.stun=Math.max(enemy.stun||0,enemy.hero?s.heroStun||s.stun:s.stun);this.cancelChannel(enemy);}}
   this.fx('stormdive',u.x,u.z,{source:u.id,tx:origin.x,tz:origin.z,radius:s.radius});return true;
  }
  if(key==='hornrush'){
   const length=Math.min(distance(u,point),s.distance);moveUnit(this,u,limitPoint(this,u,{x:u.x+dir.x*length,z:u.z+dir.z*length}));const actual=distance(origin,u);u.destination=null;u.target=null;u.order='auto';u.vx=u.vz=0;
   for(const enemy of this.enemies(u)){const dx=enemy.x-origin.x,dz=enemy.z-origin.z,proj=dx*dir.x+dz*dir.z,perp=Math.abs(dx*dir.z-dz*dir.x);if(proj<-.5||proj>actual+.8||perp>s.radius||!lineClear(this,origin,enemy))continue;this.hit(enemy,s.damage,u);if((enemy.avatar||0)<=this.time){this.displace(enemy,dir.x*s.push,dir.z*s.push);enemy.stun=Math.max(enemy.stun||0,enemy.hero?s.heroStun||s.stun:s.stun);this.cancelChannel(enemy);}}
   this.fx('hornrush',origin.x,origin.z,{source:u.id,tx:u.x,tz:u.z,radius:s.radius});return true;
  }
  return false;
 },

 tickSpecials(dt){
  this.drops=(this.drops||[]).filter(d=>d.expires>this.time);this.specials||=[];this.projectiles||=[];
  if(!BATTLE.has(this.phase)){this.specials=[];this.projectiles=[];for(const u of this.units)u.pendingSpecial=false;return;}
  const pending=[];for(const special of this.specials){if(special.phase!==this.phase||special.wave!==this.wave)continue;
   if(special.type==='warning'){const owner=this.units.find(u=>u.id===special.source);if(!owner?.alive)continue;if(this.time<special.fireAt){pending.push(special);continue;}owner.pendingSpecial=false;if(owner.stun>0)continue;this.castSpecial(owner,special.key,special.s,special.point);}
   else if(special.type==='cloud'&&special.expires>this.time){if(this.time>=special.next){special.next=this.time+1;for(const enemy of this.units.filter(t=>this.canTarget(special.source,t)&&distance(t,special)<special.radius&&(t.avatar||0)<=this.time))this.applyDot(enemy,'poison',special.damage,2,special.source);}pending.push(special);}
  }this.specials=pending;
  const active=[];for(const p of this.projectiles){if(p.phase!==this.phase||p.wave!==this.wave)continue;let alive=true;const travel=Math.min(p.remaining,Math.max(0,dt)*p.speed),steps=Math.max(1,Math.ceil(travel/.18));for(let i=0;i<steps;i++){
    const next={x:p.x+p.dx*travel/steps,z:p.z+p.dz*travel/steps},limit=limitPoint(this,p.source,next);if(distance(next,limit)>.001||blocked(next,this.obstacles||[],p.radius*.7)){alive=false;this.fx('projectileImpact',p.x,p.z,{skill:p.skill,radius:.8});break;}p.x=next.x;p.z=next.z;
    const target=this.units.find(t=>this.canTarget(p.source,t)&&!(t.stageDone&&this.phase==='wave')&&distance(t,p)<=p.radius+.45);if(!target)continue;
    const resist=p.skill==='warlockfire'?target.fireResist||0:target.coldResist||0;this.hit(target,p.damage*(1-resist),p.source,true,false,false,false,p.element||(p.skill==='warlockfire'?'fire':'ice'));if((target.avatar||0)<=this.time){if(p.push)this.displace(target,p.dx*p.push,p.dz*p.push);if(p.slow)target.frostUntil=Math.max(target.frostUntil||0,this.time+p.slowDuration);}
    this.fx('projectileImpact',p.x,p.z,{source:p.source.id,target:target.id,skill:p.skill,radius:1.4});alive=false;break;
   }p.remaining-=travel;if(alive&&p.remaining>0)active.push(p);
  }this.projectiles=active;
 }
};

