import {canUseSkill} from './archetypes.js';
import {SKILLS,levelOf,skillAt} from './catalog.js';
const BATTLE=new Set(['wave','bonus','final']);
const MOBILITY=new Set(['blink','dash','hornrush','stormdive']);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const number=(value,fallback=0)=>Number.isFinite(value)?Math.max(0,value):fallback;
export function physicalSkillDamage(u,base,coefficient=0){return number(base)+(u?.hero?number(u.damage)*number(coefficient):0);}
export function magicSkillDamage(u,base,coefficient=0){const power=number(u?.magicPower,1),raw=number(base)*power;if(!u?.hero)return raw;const matk=number(u.magicAttack,(18+number(u.level,1)*1.5+number(u.totalAttributes?.int)*2)*power);return raw+matk*number(coefficient);}
export function abilityScaling(key,rank=1){const s=skillAt(key,rank);return{damageType:s?.damageType||null,atkCoefficient:s?.atkCoefficient||0,matkCoefficient:s?.matkCoefficient||0};}
const sourceData=u=>({id:u.id,owner:u.owner,hero:u.hero,team:u.team,x:u.x,z:u.z,cell:u.cell,challenge:u.challenge,lineLane:u.lineLane});

export const AbilityMethods={
 toggleAutocast(u,c){
  if(!u?.hero||u.summon||['victory','defeat'].includes(this.phase)||c.slot!==undefined&&(!Number.isInteger(c.slot)||c.slot<0||c.slot>=u.skills.length)||c.skill!==undefined&&typeof c.skill!=='string')return false;const key=c.skill??(Number.isInteger(c.slot)?u.skills[c.slot]:null);if(typeof key!=='string'||!u.skills.includes(key)||!canUseSkill(u,key)||SKILLS[key]?.kind!=='active'||c.skill!==undefined&&c.slot!==undefined&&u.skills[c.slot]!==key)return false;
  u.autoSkills||={};u.autoSkills[key]=typeof c.enabled==='boolean'?c.enabled:!u.autoSkills[key];this.fx('autocast',u.x,u.z,{source:u.id,skill:key,enabled:u.autoSkills[key]});return true;
 },

 tickAutocast(u){
  if(!u?.hero||!u.alive||!BATTLE.has(this.phase)||u.stun>0||u.channel||u.manualCastPending||u.stageDone&&this.phase==='wave'||['move','attackMove'].includes(u.order)||this.time<(u.nextAutoCastAt||0))return false;
  const reserved=this.units.find(t=>t.id===u.target&&this.canTarget(u,t)),target=reserved||this.enemies(u,12)[0];
  for(const [slot,key]of u.skills.entries()){
   const s=skillAt(key,levelOf(u,key));if(!canUseSkill(u,key)||!u.autoSkills?.[key]||!s||s.kind!=='active'||(u.cooldowns[key]||0)>0||u.mana<s.mana)continue;
   if(s.heal){const injured=key==='freyjasgrace'?this.units.some(v=>v.alive&&v.team===u.team&&v.challenge===u.challenge&&distance(u,v)<=s.radius&&v.hp<v.maxHp*.65):u.hp<u.maxHp*.65&&u.maxHp-u.hp>=s.heal*(u.magicPower||1)*.3;if(!injured)continue;}
   else if(!target)continue;
   if(key==='shield'&&(u.shieldUntil||0)>this.time+.5&&u.shield>0||key==='avatar'&&(u.avatar||0)>this.time||['rage','battlecry'].includes(key)&&(u.rageUntil||0)>this.time)continue;
   if((key==='summon'||s.summonKind)&&this.units.filter(v=>v.alive&&v.summon&&v.summoner===u.id&&(v.summonSkill||'summon')===key&&v.expires>this.time+8).length>=(s.summonCount||2))continue;
   if(['firesteps','froststeps'].includes(key)&&u.abilityTrail?.until>this.time)continue;
   if(s.target==='self'&&!s.heal){const range=['stomp','frostnova','thorsjudgment'].includes(key)?s.radius:key==='multishot'?10:8;if(distance(u,target)>range)continue;}
   if(MOBILITY.has(key)&&(['hold','stop'].includes(u.order)||distance(u,target)<2.2))continue;
   let point=target?{x:target.x,z:target.z}:{x:u.x,z:u.z};
   if(MOBILITY.has(key)&&target){const d=distance(u,target)||1,stand=key==='blink'?Math.max(1.5,(u.range||1.5)*.8):1.25;point={x:target.x-(target.x-u.x)/d*stand,z:target.z-(target.z-u.z)/d*stand};}
   if(key==='icewall'&&target){const dx=target.x-u.x,dz=target.z-u.z,d=Math.hypot(dx,dz)||1;point={x:(u.x+target.x)/2-dz/d*2.3,z:(u.z+target.z)/2+dx/d*2.3};}
   if(this.cast(u,{slot,target:target?.id,...point})){u.nextAutoCastAt=this.time+.3;this.fx('autoCast',u.x,u.z,{source:u.id,skill:key});return true;}
  }
  return false;
 },

 castAbility(u,key,s){
  if(!['firesteps','froststeps'].includes(key))return false;const element=key==='firesteps'?'fire':'ice';u.abilityTrail={key,until:this.time+s.duration,nextAt:this.time,lastX:u.x,lastZ:u.z,damage:this.spellDamage(u,s.damage,element,key),radius:s.radius,groundDuration:s.groundDuration,trailInterval:s.trailInterval,slow:s.slow||0,slowDuration:s.slowDuration||0,rank:s.level};this.fx('abilityTrail',u.x,u.z,{source:u.id,skill:key,duration:s.duration,element});return true;
 },

 tickAbilityEffects(dt){
  if(!Number.isFinite(dt)||dt<=0)return;this.abilityFields||=[];if(!BATTLE.has(this.phase)){this.abilityFields=[];for(const unit of this.units)unit.abilityTrail=null;return;}
  this.abilityFields=this.abilityFields.filter(field=>field.until>this.time&&field.phase===this.phase&&field.wave===this.wave);
  for(const u of this.units.filter(unit=>unit.alive)){const trail=u.abilityTrail;if(!trail||trail.until<=this.time||this.time<trail.nextAt||!u.moving&&Math.hypot(u.x-trail.lastX,u.z-trail.lastZ)<.3)continue;trail.nextAt=this.time+trail.trailInterval;trail.lastX=u.x;trail.lastZ=u.z;const element=trail.key==='firesteps'?'fire':'ice',source=sourceData(u),field={id:this.id(),key:trail.key,source,x:u.x,z:u.z,radius:trail.radius,damage:trail.damage,element,slow:trail.slow,slowDuration:trail.slowDuration,until:this.time+trail.groundDuration,phase:this.phase,wave:this.wave};this.abilityFields.push(field);this.fx('abilityField',field.x,field.z,{source:u.id,skill:trail.key,element,radius:field.radius,duration:trail.groundDuration});}
  if(this.time<(this.nextAbilityPulse||0))return;const interval=.5;this.nextAbilityPulse=this.time+interval;const areas=[...this.abilityFields];
  for(const u of this.units.filter(unit=>unit.alive))for(const key of ['auraflame','icepulse']){const rank=levelOf(u,key);if(!rank||!canUseSkill(u,key))continue;const s=skillAt(key,rank),element=key==='auraflame'?'fire':'ice';areas.push({key,source:sourceData(u),x:u.x,z:u.z,radius:s.radius,damage:this.spellDamage(u,s.damage,element,key),element,slow:s.slow||0,slowDuration:s.slowDuration||0});if(this.time>=(u.nextAbilityAuraFx?.[key]||0)){u.nextAbilityAuraFx||={};u.nextAbilityAuraFx[key]=this.time+s.pulseInterval;this.fx('abilityPulse',u.x,u.z,{source:u.id,skill:key,element,radius:s.radius});}}
  for(const target of this.units.filter(unit=>unit.alive)){const strongest=new Map();for(const area of areas){if(!this.canTarget(area.source,target)||distance(area,target)>area.radius)continue;const key=`${area.source.team}:${area.key}`,old=strongest.get(key);if(!old||old.damage<area.damage)strongest.set(key,area);}for(const area of strongest.values()){const resist=area.element==='fire'?target.fireResist||0:target.coldResist||0;this.hit(target,area.damage*interval*(1-resist),area.source,true,false,false,false,area.element,'dot');if(area.slow&&(target.avatar||0)<=this.time){target.abilitySlowAmount=(target.abilitySlowUntil||0)>this.time?Math.max(target.abilitySlowAmount||0,area.slow):area.slow;target.abilitySlowUntil=Math.max(target.abilitySlowUntil||0,this.time+area.slowDuration);}}}
 }
};
