import {canLearnSkill} from './skill-access.js';
import {physicalSkillDamage} from './ability-rules.js';
import {unitRadius} from './unit-collision.js';
import {ITEMS,SKILLS,skillAt,levelOf} from './catalog.js';
import {LOOT_RARITIES,rarityRoll,lootDropChance} from './rarity.js';
import {skillFor} from './skill-quality.js';
import {MONSTERS} from './monsters.js';
import {blocked,limitPoint,moveUnit} from './field.js';

const BATTLE=new Set(['wave','bonus','final']);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const sourceData=u=>({id:u.id,owner:u.owner,hero:u.hero,lineLane:u.lineLane,team:u.team,x:u.x,z:u.z,altitude:u.flying?u.altitude||0:0,challenge:u.challenge,cell:u.cell,magicPower:u.magicPower||1});
function direction(u,p){const x=p.x-u.x,z=p.z-u.z,d=Math.hypot(x,z);return d>.001?{x:x/d,z:z/d}:{x:Math.sin(u.facing||0),z:Math.cos(u.facing||0)};}
function lineClear(game,from,to){const d=distance(from,to),steps=Math.max(1,Math.ceil(d/.25));for(let i=1;i<=steps;i++)if(blocked({x:from.x+(to.x-from.x)*i/steps,z:from.z+(to.z-from.z)*i/steps},game.obstacles||[],.1))return false;return true;}
function sameTrial(game,h,t){if(t.team===h.team)return false;if(t.challenge){if(game.phase==='bonus')return t.challenge===h.owner;if(['campaign','best','war'].includes(game.options.mode))return game.groupKey(h)===t.challenge;}return true;}

export const monsterMethods={
 refreshMonsterStats(u){
  const base=u.monsterBase;if(!base)return;const passive=key=>levelOf(u,key)?skillFor(u,key):{};
  const aura=key=>this.auraFor(u,key)||passive(key),fervor=aura('endurance'),devotion=aura('devotion'),brilliance=aura('brilliance'),avatar=(u.avatar||0)>this.time?u.avatarData||{}:{},rage=(u.rageUntil||0)>this.time?u.rageData||{}:{};
  const oldHp=u.maxHp||base.hp;u.maxHp=base.hp+(avatar.hp||0);u.hp=clamp(u.hp+u.maxHp-oldHp,u.alive?1:0,u.maxHp);
  u.maxMana=base.mana;u.mana=clamp(u.mana??u.maxMana,0,u.maxMana);u.manaRegen=base.manaRegen+(brilliance.manaRegen||0);u.hpRegen=base.hpRegen||0;
  u.damage=(base.damage+(avatar.damage||0))*(1+(rage.damage||0));u.armor=base.armor+(passive('stonehide').armor||0)+(devotion.armor||0)+(avatar.armor||0);
  u.speed=base.speed*(1+(fervor.moveSpeed||0));u.interval=base.interval;u.attackSpeed=Math.min(3,1+(fervor.attackSpeed||0)+(rage.attackSpeed||0));u.accuracy=base.accuracy;
  u.evasion=Math.min(.45,base.evasion+(passive('evasion').evasion||0));u.critChance=Math.min(.8,base.critChance+(passive('critical').chance||0));u.critMultiplier=Math.max(base.critMultiplier,passive('critical').multiplier||0);
  u.lifesteal=passive('vampiric').lifesteal||0;u.magicDefense=base.magicDefense||0;u.attackType=u.element?'magic':'physical';u.basicDamage=u.damage;u.reflect=passive('thorns').reflect||0;u.magicPower=base.magicPower;
 },

 monsterThink(u,dt){
  if(u.hero||u.summon||!u.alive||!BATTLE.has(this.phase)||!u.skills?.length)return;
  if(u.nextMonsterDecision===undefined){u.nextMonsterDecision=this.time+2+(u.id%5)*.35;return;}
  if(u.stun>0||u.channel||this.time<u.nextMonsterDecision||u.pendingSpecial)return;u.nextMonsterDecision=this.time+1.2;
  const target=this.enemies(u,14).find(t=>t.hero||t.summon);if(!target)return;
  for(let offset=0;offset<u.skills.length;offset++){
   const slot=((u.monsterSkillCursor||0)+offset)%u.skills.length,key=u.skills[slot],s=skillFor(u,key);
   if(!s||s.kind!=='active'||(u.cooldowns[key]||0)>0||u.mana<s.mana)continue;
   if(s.heal&&u.hp>u.maxHp*.7||key==='shield'&&(u.shieldUntil||0)>this.time&&u.shield>0||key==='avatar'&&(u.avatar||0)>this.time||['rage','battlecry'].includes(key)&&(u.rageUntil||0)>this.time+.7||key==='violentforce'&&(u.violentForce?.until||0)>this.time||key==='hurricane'&&(u.hurricane?.until||0)>this.time)continue;
   if(s.target==='enemy'&&distance(u,target)>12||s.target==='self'&&['stomp','frostnova','hurricane'].includes(key)&&!this.enemies(u,s.radius).length)continue;
   if(key==='summon'&&this.units.filter(v=>v.alive&&v.summon&&v.summoner===u.id&&v.expires>this.time+10).length>=2)continue;
   let point=limitPoint(this,u,target);if(['blink','dash'].includes(key)){const dir=direction(u,target),stand=unitRadius(u)+unitRadius(target)+.15;point=limitPoint(this,u,{x:target.x-dir.x*stand,z:target.z-dir.z*stand});}
   if(key==='icewall'){
    const dir=direction(u,target),mid={x:(u.x+target.x)/2,z:(u.z+target.z)/2},candidates=[{x:mid.x-dir.z*2.3,z:mid.z+dir.x*2.3},{x:mid.x+dir.z*2.3,z:mid.z-dir.x*2.3}];
    point=candidates.map(p=>limitPoint(this,u,p)).find(p=>distance(p,u)<=14&&!blocked(p,this.obstacles||[],1)&&(!u.cell||Math.abs(p.x-u.cell.x)+s.width/2<=u.cell.r&&Math.abs(p.z-u.cell.z)+.4<=u.cell.r)&&!this.units.some(v=>v.alive&&blocked(v,[{...p,w:s.width,d:.8}],.65)));if(!point)continue;
   }
   const warning=.6+(u.boss==='boss'?.35:u.boss==='miniboss'?.2:.1);u.monsterSkillCursor=(slot+1)%u.skills.length;u.pendingSpecial=true;u.castAt=this.time;u.castSkill=key;u.facing=Math.atan2(point.x-u.x,point.z-u.z);
   this.specials||=[];this.specials.push({id:this.id(),type:'warning',source:u.id,slot,key,target:target.id,point,phase:this.phase,wave:this.wave,fireAt:this.time+warning});
   this.fx('monsterWarning',point.x,point.z,{source:u.id,skill:key,radius:s.radius||2.2,tx:u.x,tz:u.z,duration:warning});break;
  }
 },

 monsterLoot(t,source=null){
  if(t.lootRolled||t.alive||t.hero||t.summon||!BATTLE.has(this.phase))return null;t.lootRolled=true;
  let owner=source?.owner?this.player(source.owner):null;
  if(source){if(!owner||!sameTrial(this,owner,t))return null;}
  else owner=this.heroes().filter(h=>h.alive&&sameTrial(this,h,t)).sort((a,b)=>distance(a,t)-distance(b,t)||a.owner.localeCompare(b.owner))[0];
  if(!owner)return null;this.dropBossEquipment(t,owner);if(!t.skills?.some(key=>SKILLS[key]))return null;const chance=lootDropChance({wave:this.wave,boss:t.boss});if(chance<1&&this.random()>=chance)return null;
  const skills=t.skills.filter(key=>SKILLS[key]),drop={id:this.id(),skill:skills[Math.min(skills.length-1,Math.floor(this.random()*skills.length))],owner:owner.owner,x:t.x,z:t.z,expires:this.time+90,kind:t.kind};
  drop.rarity=rarityRoll(()=>this.random(),{wave:this.wave,boss:t.boss});const rarity=LOOT_RARITIES[drop.rarity];drop.quality=rarity.quality;drop.essence=rarity.essence;drop.xp=rarity.xp;this.drops||=[];this.drops.push(drop);this.fx('lootDrop',t.x,t.z,{source:owner.id,skill:drop.skill,dropId:drop.id});return drop;
 },

 dropBossEquipment(t,owner){
  if(t.boss!=='boss'||this.wave<10||this.wave%10!==0||this.phase!=='wave'||t.lineCreep)return null;
  const chance=this.wave>=30?.65:.4;if(this.random()>=chance)return null;
  const pool=['runesword','thunderaxe','ravenspear','seidrwand','moonbow','helblade'],item=pool[Math.min(pool.length-1,Math.floor(this.random()*pool.length))],level=Math.min(3,1+Math.floor((this.wave-10)/20));
  const drop={id:this.id(),item,level,rarity:level>=3?'legendary':level===2?'epic':'rare',owner:owner.owner,x:t.x+.7,z:t.z,expires:this.time+180,kind:t.kind};
  this.drops||=[];this.drops.push(drop);this.fx('lootDrop',t.x,t.z,{source:owner.id,item,dropId:drop.id});return drop;
 },

 claimLoot(u,c){
  const drop=(this.drops||[]).find(d=>d.id===c.dropId&&d.owner===u.owner&&d.expires>this.time);
  if(drop?.item){
   if(!u.alive||!ITEMS[drop.item]||ITEMS[drop.item].slotType!=='weapon'||['victory','defeat'].includes(this.phase))return false;
   const empty=u.inventory.findIndex(slot=>!slot);if(empty<0&&u.inventory.length>=6)return false;
   const slot={key:drop.item,level:drop.level||1,charges:1,invested:ITEMS[drop.item].cost,rarity:drop.rarity};if(empty>=0)u.inventory[empty]=slot;else u.inventory.push(slot);
   this.refresh(u);this.drops=this.drops.filter(d=>d.id!==drop.id);this.fx('lootClaim',u.x,u.z,{source:u.id,item:drop.item,level:slot.level});return true;
  }
  if(!drop||!u.alive||!SKILLS[drop.skill]||['victory','defeat'].includes(this.phase))return false;
  const rank=levelOf(u,drop.skill);if(!canLearnSkill(u,drop.skill,Math.min(5,rank+1)))return false;let replaced=null;
  const oldQuality=LOOT_RARITIES[u.skillRarities?.[drop.skill]]?.quality||1,newQuality=LOOT_RARITIES[drop.rarity]?.quality||1;if(rank){if(rank>=5&&newQuality<=oldQuality)return false;u.skillLevels[drop.skill]=Math.min(5,rank+1);}
  else{let slot=c.slot;if(slot===undefined&&u.skills.length<7)slot=u.skills.length;
   if(!Number.isInteger(slot)||slot<0||slot>=7||slot>u.skills.length)return false;
   replaced=this.swapTechniqueSlot(u,drop.skill,slot,1);if(replaced===false)return false;u.skillOrigins||={};u.skillOrigins[drop.skill]='loot';
  }
  u.skillRarities||={};if(!rank||newQuality>oldQuality)u.skillRarities[drop.skill]=drop.rarity||'common';this.cancelChannel(u);this.refresh(u);this.drops=this.drops.filter(d=>d.id!==drop.id);this.fx('lootClaim',u.x,u.z,{source:u.id,skill:drop.skill,level:u.skillLevels[drop.skill],replaced});return true;
 },

 castSpecial(u,key,s,c,target){
  const point={x:c.x??target?.x??u.x,z:c.z??target?.z??u.z},dir=direction(u,point),origin={x:u.x,z:u.z};
  if(key==='rage'||key==='battlecry'){
   const old=(u.rageUntil||0)>this.time?u.rageData:null,next={damage:s.rageDamage||0,attackSpeed:s.rageSpeed||0},power=data=>(1+(data?.damage||0))*(1+(data?.attackSpeed||0));if(!old||power(old)<=power(next)){u.rageData=next;u.rageSkill=key;}else u.rageData=old;u.rageUntil=Math.max(u.rageUntil||0,this.time+s.duration);this.refresh(u);this.fx(key,u.x,u.z,{source:u.id,duration:s.duration,radius:2});return true;
  }
  if(key==='warlockfire'||key==='warlockfrost'){
   this.projectiles||=[];const projectile={id:this.id(),skill:key,element:key==='warlockfire'?'fire':'ice',x:u.x+dir.x*.55,z:u.z+dir.z*.55,dx:dir.x,dz:dir.z,speed:s.projectileSpeed||12,remaining:s.distance||14,radius:s.radius||.5,damage:this.spellDamage(u,s.damage,key==='warlockfire'?'fire':'ice',key),push:s.push||0,slow:s.slow||0,slowDuration:s.duration||0,source:sourceData(u),phase:this.phase,wave:this.wave,created:this.time};
   this.projectiles.push(projectile);this.fx('projectileCast',u.x,u.z,{source:u.id,skill:key,tx:point.x,tz:point.z});return true;
  }
  if(key==='flamebreath'){
   for(const enemy of this.enemies(u,s.radius)){const d=distance(u,enemy)||1,dot=((enemy.x-u.x)*dir.x+(enemy.z-u.z)*dir.z)/d;if(dot<Math.cos(s.cone||.7)||!lineClear(this,u,enemy))continue;this.hit(enemy,this.spellDamage(u,s.damage,'fire',key)*(1-(enemy.fireResist||0)),u,true,false,false,false,'fire');if((enemy.avatar||0)<=this.time)this.applyDot(enemy,'burn',s.burn||0,s.duration||4,u);}
   this.fx('flamebreath',u.x,u.z,{source:u.id,tx:u.x+dir.x*s.radius,tz:u.z+dir.z*s.radius,radius:s.radius});return true;
  }
  if(key==='venomcloud'){
   this.specials||=[];this.specials.push({id:this.id(),type:'cloud',source:sourceData(u),x:point.x,z:point.z,radius:s.radius,damage:this.spellDamage(u,s.damage,'poison',key),expires:this.time+s.duration,next:this.time+.25,phase:this.phase,wave:this.wave});this.fx('venomcloud',point.x,point.z,{source:u.id,radius:s.radius,duration:s.duration});return true;
  }
  if(key==='stormdive'){
   const d=distance(u,point)||1,length=Math.min(d,s.distance);moveUnit(this,u,limitPoint(this,u,{x:u.x+dir.x*length,z:u.z+dir.z*length}));u.destination=null;u.target=null;u.order='auto';u.vx=u.vz=0;
   for(const enemy of this.enemies(u,s.radius)){this.hit(enemy,this.spellDamage(u,s.damage,'lightning',key),u,true,false,false,false,'lightning');if((enemy.avatar||0)<=this.time){enemy.stun=Math.max(enemy.stun||0,enemy.hero?s.heroStun||s.stun:s.stun);this.cancelChannel(enemy);}}
   this.fx('stormdive',u.x,u.z,{source:u.id,tx:origin.x,tz:origin.z,radius:s.radius});return true;
  }
  if(key==='hornrush'){
   const length=Math.min(distance(u,point),s.distance);moveUnit(this,u,limitPoint(this,u,{x:u.x+dir.x*length,z:u.z+dir.z*length}));const actual=distance(origin,u);u.destination=null;u.target=null;u.order='auto';u.vx=u.vz=0;
   for(const enemy of this.enemies(u)){const dx=enemy.x-origin.x,dz=enemy.z-origin.z,proj=dx*dir.x+dz*dir.z,perp=Math.abs(dx*dir.z-dz*dir.x);if(proj<-.5||proj>actual+.8||perp>s.radius||!lineClear(this,origin,enemy))continue;this.hit(enemy,physicalSkillDamage(u,s.damage,s.atkCoefficient),u);if((enemy.avatar||0)<=this.time){this.displace(enemy,dir.x*s.push,dir.z*s.push);enemy.stun=Math.max(enemy.stun||0,enemy.hero?s.heroStun||s.stun:s.stun);this.cancelChannel(enemy);}}
   this.fx('hornrush',origin.x,origin.z,{source:u.id,tx:u.x,tz:u.z,radius:s.radius});return true;
  }
  return false;
 },

 tickSpecials(dt){
  this.drops=(this.drops||[]).filter(d=>d.expires>this.time);this.specials||=[];this.projectiles||=[];
  if(!BATTLE.has(this.phase)){this.specials=[];this.projectiles=[];for(const u of this.units)u.pendingSpecial=false;return;}
  const pending=[];for(const special of this.specials){if(special.phase!==this.phase||special.wave!==this.wave)continue;
   if(special.type==='warning'){const owner=this.units.find(u=>u.id===special.source);if(!owner?.alive)continue;if(owner.stun>0){owner.pendingSpecial=false;continue;}if(this.time<special.fireAt){pending.push(special);continue;}owner.pendingSpecial=false;if(owner.skills[special.slot]===special.key)this.cast(owner,{slot:special.slot,target:special.target,...special.point});}
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

