import {mvpWarning,mvpDefinition} from './ragnarok-expansion.js';
const BATTLE=new Set(['wave','final']);
export function insideBossPattern(p,z){const dx=p.x-z.x,dz=p.z-z.z,d=Math.hypot(dx,dz);if(z.shape==='ring')return d<=z.radius&&d>=z.inner;if(z.shape==='line'){const along=dx*z.dx+dz*z.dz,side=Math.abs(dx*z.dz-dz*z.dx);return Math.abs(along)<=z.length/2&&side<=z.width/2;}if(z.shape==='cone')return d<=z.radius&&(d<.01||(dx*z.dx+dz*z.dz)/d>=Math.cos(z.angle/2));return d<=z.radius;}
export const bossMethods={
 tickBossPatterns(){
  this.bossWarnings||=[];if(!BATTLE.has(this.phase)){this.bossWarnings=[];return;}
  const remaining=[];for(const warning of this.bossWarnings){const boss=this.units.find(u=>u.id===warning.source);if(!boss?.alive||boss.stun>0||warning.wave!==this.wave)continue;if(this.time<warning.fireAt){remaining.push(warning);continue;}for(const target of this.units.filter(t=>this.canTarget(boss,t)&&insideBossPattern(t,warning))){if((target.avatar||0)>this.time)continue;this.hit(target,this.spellDamage(boss,warning.damage,warning.element),boss,true,false,false,false,warning.element);if(warning.element==='ice')target.frostUntil=Math.max(target.frostUntil||0,this.time+3);if(warning.element==='fire')this.applyDot(target,'burn',8+this.wave*.2,3,boss);}this.fx('bossImpact',warning.x,warning.z,{...warning,duration:.7,id:this.id(),time:this.time});}this.bossWarnings=remaining;
  for(const boss of this.units.filter(u=>u.alive&&!u.hero&&!u.summon&&u.boss)){
   if(boss.nextPattern===undefined){boss.nextPattern=this.time+5;continue;}if(this.time<boss.nextPattern||boss.stun>0||boss.channel||boss.pendingSpecial)continue;
   const target=this.enemies(boss,24).find(u=>u.hero);if(!target)continue;boss.nextPattern=this.time+(mvpDefinition(boss.ragnarokMvp)&&boss.hp<boss.maxHp*.5?8:boss.boss==='boss'?11:15);const pattern=(boss.patternIndex??boss.level%4)%4;boss.patternIndex=pattern+1;const d=Math.hypot(target.x-boss.x,target.z-boss.z)||1,dx=(target.x-boss.x)/d,dz=(target.z-boss.z)/d,shape=['circle','ring','cone','line'][pattern],origin=shape==='cone'?boss:shape==='line'?{x:(boss.x+target.x)/2,z:(boss.z+target.z)/2}:target;
   const warning={id:this.id(),source:boss.id,shape,x:origin.x,z:origin.z,dx,dz,radius:boss.boss==='boss'?7:5,inner:3,angle:Math.PI*.7,width:3.5,length:20,element:['fire','ice','lightning','arcane'][pattern],damage:45+this.wave*2.5,wave:this.wave,start:this.time,fireAt:this.time+2.2};const themed=mvpWarning(boss,target,pattern,this.time,45+this.wave*2.5);if(themed)Object.assign(warning,themed);this.bossWarnings.push(warning);this.fx('bossDanger',warning.x,warning.z,{...warning,id:this.id(),warningId:warning.id,time:this.time,duration:warning.fireAt-this.time});
  }
 }
};
