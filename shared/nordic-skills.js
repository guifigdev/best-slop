import {limitPoint} from './field.js';
import {physicalSkillDamage} from './ability-rules.js';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const barrierAllies=(game,u,s)=>game.units.filter(v=>v.alive&&v.team===u.team&&v.challenge===u.challenge&&distance(u,v)<=s.radius);
const barrierPool=(u,ally,s)=>s.shield*(u.magicPower||1)+ally.maxHp*s.shieldHpPercent;
// A fresh cast may restore an exhausted barrier, but must not replace a
// stronger, longer-lasting protection with a weaker version from an ally.
const improvesBarrier=(game,u,ally,s)=>!(ally.shieldUntil>game.time+.5&&ally.shield>0&&ally.shield>=barrierPool(u,ally,s)&&(!ally.shieldPhysicalOnly||ally.shieldHits>=s.shieldHits));
export const nordicMethods={
 canCastNordic(u,key,s,t){
  if(key==='fenrirfang')return !!t&&distance(u,t)<=s.castRange;
  if(key==='weakeninghowl')return this.enemies(u,s.radius).length>0;
  if(key==='spiritward')return Math.max(u.avatar||0,u.magicWardUntil||0)<this.time+s.duration;
  if(key==='runicbarrier')return barrierAllies(this,u,s).some(ally=>improvesBarrier(this,u,ally,s));
  return true;
 },
 castNordic(u,key,s,c,t){
  if(key==='fenrirfang'){this.hit(t,physicalSkillDamage(u,s.damage,s.atkCoefficient),u);if(t.alive&&(t.avatar||0)<=this.time)t.frostUntil=Math.max(t.frostUntil||0,this.time+s.duration);this.fx('slash',t.x,t.z,{source:u.id,target:t.id,skill:key});return true;}
  if(key==='runicbarrier'){for(const ally of barrierAllies(this,u,s).filter(v=>improvesBarrier(this,u,v,s))){ally.shield=barrierPool(u,ally,s);ally.shieldUntil=this.time+s.duration;ally.shieldPhysicalOnly=true;ally.shieldHits=s.shieldHits;this.fx('shield',ally.x,ally.z,{source:ally.id,skill:key});}return true;}
  if(key==='spiritward'){u.magicWardUntil=this.time+s.duration;this.fx('shield',u.x,u.z,{source:u.id,skill:key});return true;}
  if(key==='weakeninghowl'){for(const enemy of this.enemies(u,s.radius)){enemy.damageReduction=Math.max((enemy.weakenedUntil||0)>this.time?enemy.damageReduction||0:0,s.damageReduction);enemy.weakenedUntil=Math.max(enemy.weakenedUntil||0,this.time+s.duration);this.fx('curse',enemy.x,enemy.z,{source:u.id,target:enemy.id,duration:s.duration,skill:key});}return true;}

  if(s.summonKind){const owner=u.owner||'npc-'+u.id;this.units=this.units.filter(v=>!(v.summon&&v.summoner===u.id&&v.summonSkill===key));for(let i=0;i<s.summonCount;i++){const point=limitPoint(this,u,{x:u.x+(i-(s.summonCount-1)/2)*1.8,z:u.z+1.5});this.spawnEnemy(s.summonKind,point.x,point.z,{name:s.summonName,owner,summon:true,summoner:u.id,summonSkill:key,lineLane:u.lineLane,challenge:u.challenge,cell:u.cell,team:u.team,hp:s.summonHp,damage:s.summonDamage,armor:key==='helguard'?5:1,range:s.summonRange,speed:s.summonSpeed,interval:key==='freyjascat'?.7:1.1,accuracy:1,critChance:0,level:u.level,skills:[],skillLevels:{},flying:s.summonFlying,altitude:s.summonFlying?2:0,size:key==='helguard'?1.3:key==='odinsravens'?.65:key==='scarabs'?.65:1,expires:this.time+s.summonDuration});}this.fx('summon',u.x,u.z,{source:u.id,skill:key});return true;}
  if(key==='gungnir'){const dx=c.x-u.x,dz=c.z-u.z,d=Math.hypot(dx,dz)||1;for(const target of this.enemies(u,s.distance)){const along=((target.x-u.x)*dx+(target.z-u.z)*dz)/d,side=Math.abs((target.x-u.x)*dz-(target.z-u.z)*dx)/d;if(along>=0&&side<s.radius)this.hit(target,this.spellDamage(u,s.damage,'arcane',key),u,true);}this.fx('shockwave',u.x,u.z,{source:u.id,tx:c.x,tz:c.z,radius:s.radius});return true;}
  if(key==='thorsjudgment'){for(const target of this.enemies(u,s.radius)){this.hit(target,this.spellDamage(u,s.damage,'lightning',key),u,true,false,false,false,'lightning');if((target.avatar||0)<=this.time){target.stun=Math.max(target.stun,target.hero?s.heroStun:s.stun);this.cancelChannel(target);}this.fx('bolt',u.x,u.z,{source:u.id,tx:target.x,tz:target.z});}this.fx('stomp',u.x,u.z,{source:u.id,radius:s.radius});return true;}
  if(key==='freyjasgrace'){for(const ally of this.units.filter(v=>v.alive&&v.team===u.team&&v.challenge===u.challenge&&distance(u,v)<=s.radius))this.heal(ally,s.heal*(u.magicPower||1),u);return true;}
  if(key==='helsfrost'){for(const target of this.enemies(u).filter(v=>distance(v,c)<=s.radius)){this.hit(target,this.spellDamage(u,s.damage,'ice',key),u,true,false,false,false,'ice');if((target.avatar||0)<=this.time)target.frostUntil=Math.max(target.frostUntil||0,this.time+s.duration);}this.fx('frostnova',c.x,c.z,{source:u.id,radius:s.radius});return true;}
  return false;
 }
};
