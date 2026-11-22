import {RO_SKILLS} from './ragnarok-jobs.js';
import {isRoMeteorSkill,RO_METEOR_TIMING} from './ro-meteor.js';

// Effect budgets are per hero, independent of how many skills have been learned.
// Long-lived attacks store their total damage budget, not damage for every tick.
export const RO_SKILL_EFFECT_LIMITS=Object.freeze({buffs:12,zones:12,summons:6,targetsPerPulse:48});
const finite=(value,fallback=0)=>Number.isFinite(value)?value:fallback;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,finite(value)));
const now=game=>finite(game?.bonk?.elapsed);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const factor=level=>1+clamp(level-1,0,7)*.08;
const live=game=>(game.units||[]).filter(e=>e.bonkEnemy&&e.alive);
const nearby=(game,point,radius,api)=>(api.nearby?.(point,radius)||live(game).filter(e=>distance(e,point)<=radius)).filter(e=>e.alive).slice(0,RO_SKILL_EFFECT_LIMITS.targetsPerPulse);
const clear=(api,a,b)=>!api.segment||api.segment(a,b);
const emit=(api,type,point,extra={})=>api.effect?.(type,point,extra);
const safeDuration=w=>clamp(w.mechanics?.duration||6,1,45);
const scaledDamage=(w,level)=>Math.max(0,finite(w.damage))*(1+clamp(level-1,0,7)*.28);
const modifierCaps=Object.freeze({damage:1.25,haste:.85,area:.65,crit:.25,armor:45,magicDefense:45,evasion:.22,regen:12,speed:.35,manaRegen:12,damageReduction:.4,lifeSteal:.12,accuracy:.15,critDamage:.7,xp:.3,magnet:.6,amount:3,maxHp:.45});

export function roSkillModifiers(unit,elapsed=unit?.roSkillElapsed||0,catalog=RO_SKILLS){
 const result={};
 const add=(values,multiplier)=>{for(const [key,value]of Object.entries(values||{}))if(Object.hasOwn(modifierCaps,key)&&Number.isFinite(value))result[key]=(result[key]||0)+value*multiplier;};
 for(const [key,level]of Object.entries(unit?.bonkBuild?.weapons||{})){const skill=catalog[key];if(skill?.kind==='passive'&&level>0)add(skill.mechanics?.modifiers,factor(level));}
 for(const buff of unit?.roSkillBuffs||[])if(buff.until>elapsed)add(buff.modifiers,1);
 for(const key of Object.keys(result))result[key]=clamp(result[key],0,modifierCaps[key]);
 return result;
}

export function applyRoSkillModifiers(base,modifiers={}){
 const s={...base},m=modifiers;
 for(const key of ['damage','haste','area','speed','maxHp','xp','magnet'])if(Number.isFinite(s[key]))s[key]*=1+(m[key]||0);
 for(const key of ['crit','armor','magicDefense','evasion','regen','manaRegen','accuracy','critDamage','amount'])if(Number.isFinite(s[key]))s[key]+=m[key]||0;
 s.damageReduction=clamp(m.damageReduction,0,.4);s.lifeSteal=clamp(m.lifeSteal,0,.12);
 if(Number.isFinite(s.haste))s.haste=Math.min(5,s.haste);
 if(Number.isFinite(s.crit))s.crit=Math.min(.9,s.crit);
 if(Number.isFinite(s.evasion))s.evasion=Math.min(.55,s.evasion);
 if(Number.isFinite(s.accuracy))s.accuracy=Math.min(.99,s.accuracy);
 return s;
}

/** Utility readiness is shared by the HUD and automatic casting. */
export function roUtilitySkillReadiness(game,unit,weapon,stats={}){
 const kind=weapon?.kind,m=weapon?.mechanics||{},time=now(game);
 if(kind==='passive')return{ready:false,reasonCode:'passive',readyReason:'Passiva permanente'};
 if(kind==='heal'){
  const health=unit.hp<unit.maxHp-.5,mana=m.manaPercent>0&&unit.mana<unit.maxMana-.5,ailment=m.cleanse&&((unit.bonkPoisonTicks||0)>0||unit.bonkWebUntil>time);
  return health||mana||ailment?{ready:true,reasonCode:'ready',readyReason:'Pronta'}:{ready:false,reasonCode:'healthy',readyReason:'Vida e SP completos'};
 }
 if(kind==='buff'){
  if((unit.roSkillBuffs||[]).some(b=>b.key===weapon.key&&b.until>time))return{ready:false,reasonCode:'active',readyReason:'Efeito ativo'};
  return{ready:true,reasonCode:'ready',readyReason:'Pronta'};
 }
 if(kind==='summon'&&(game.bonk?.roSkillSummons||[]).some(s=>s.source===unit.id&&s.key===weapon.key&&s.until>time))return{ready:false,reasonCode:'active',readyReason:'Invocação ativa'};
 // Offensive utility still needs a nearby monster; heals and defensive buffs do not.
 if(['zone','summon','dash'].includes(kind)){
  const range=Math.max(3,finite(weapon.range,15)*(stats.area||1));
  if(!live(game).some(e=>distance(e,unit)<=range))return{ready:false,reasonCode:'target',readyReason:'Sem inimigo no alcance'};
  return{ready:true,reasonCode:'ready',readyReason:'Pronta'};
 }
 return null;
}

function cleanse(unit,time){unit.bonkPoisonTicks=0;unit.bonkPoisonUntil=time;unit.bonkWebUntil=time;unit.webbedUntil=0;}

/** Returns null for ordinary attacks. SP and cooldown are owned by the caller. */
export function castRoUtilitySkill(game,unit,weapon,level,stats={},api={}){
 const kind=weapon?.kind;if(!['heal','buff','passive','zone','summon','dash'].includes(kind))return null;
 if(!roUtilitySkillReadiness(game,unit,weapon,stats)?.ready)return false;
 const b=game.bonk,time=now(game),m=weapon.mechanics||{},scale=factor(level),duration=safeDuration(weapon),radius=clamp((m.radius||weapon.radius||weapon.range||4)*(stats.area||1),1,24);
 if(kind==='heal'){
  unit.hp=Math.min(unit.maxHp,unit.hp+Math.max(0,finite(m.healFlat))*scale+unit.maxHp*clamp(m.healPercent,0,.5)*scale);
  if(m.manaPercent)unit.mana=Math.min(unit.maxMana,unit.mana+unit.maxMana*clamp(m.manaPercent,0,.35)*scale);
  if(m.cleanse)cleanse(unit,time);
  emit(api,'heal',unit,{source:unit.id,target:unit.id,radius:2,duration:.65,skillKey:weapon.key});return true;
 }
 if(kind==='buff'){
  const modifiers={};for(const [key,value]of Object.entries(m.modifiers||{}))if(Object.hasOwn(modifierCaps,key))modifiers[key]=finite(value)*scale;
  unit.roSkillBuffs=(unit.roSkillBuffs||[]).filter(v=>v.until>time&&v.key!==weapon.key);
  if(unit.roSkillBuffs.length>=RO_SKILL_EFFECT_LIMITS.buffs)unit.roSkillBuffs.shift();
  unit.roSkillBuffs.push({key:weapon.key,until:time+duration,level,modifiers,...(m.status||m.proc?{weapon,level}: {})});
  if(m.shieldPercent){const amount=unit.maxHp*clamp(m.shieldPercent*scale,0,.45);unit.roSkillShield={value:Math.max(unit.roSkillShield?.until>time?unit.roSkillShield.value:0,amount),until:time+duration};}
  if(m.cleanse)cleanse(unit,time);
  if(m.healPercent||m.healFlat)unit.hp=Math.min(unit.maxHp,unit.hp+unit.maxHp*clamp(m.healPercent,0,.25)+Math.max(0,finite(m.healFlat)));
  if(m.manaPercent)unit.mana=Math.min(unit.maxMana,unit.mana+unit.maxMana*clamp(m.manaPercent,0,.35));
  if(m.allyRadius)for(const ally of game.units||[])if(ally!==unit&&ally.bonkHero&&ally.alive&&ally.team===unit.team&&distance(unit,ally)<=m.allyRadius){
   const old=(ally.roSkillBuffs||[]).find(b=>b.key===weapon.key&&b.until>time);if(old&&(old.level||1)>level)continue;
   ally.roSkillBuffs=(ally.roSkillBuffs||[]).filter(b=>b.until>time&&b.key!==weapon.key).slice(-(RO_SKILL_EFFECT_LIMITS.buffs-1));ally.roSkillBuffs.push({key:weapon.key,level,until:time+duration,modifiers:{...modifiers}});emit(api,'battlecry',ally,{source:unit.id,target:ally.id,radius:1.5,duration:.55,skillKey:weapon.key});
  }
  emit(api,m.shieldPercent?'devotion':'battlecry',unit,{source:unit.id,target:unit.id,radius:2.5,duration:.7,skillKey:weapon.key});return true;
 }
 const targets=nearby(game,unit,Math.max(3,weapon.range*(stats.area||1)),api).sort((a,c)=>distance(a,unit)-distance(c,unit)),target=targets.find(e=>clear(api,unit,e));
 if(!target)return false;
 if(kind==='dash'){
  const away=m.retreat===true? -1:1,dx=(target.x-unit.x)*away,dz=(target.z-unit.z)*away,length=Math.hypot(dx,dz)||1,dashDistance=clamp(m.dashDistance||5,1,10);
  // Movement is sampled, so a dodge cannot teleport through a wall.
  for(let remaining=dashDistance;remaining>0;remaining-=.25){const step=Math.min(.25,remaining),p={x:unit.x+dx/length*step,z:unit.z+dz/length*step};if(!clear(api,unit,p)||api.blocked?.(p))break;if(api.move)api.move(unit,dx,dz,.05,step/.05);else Object.assign(unit,p);}
  unit.bonkInvulnerableUntil=Math.max(unit.bonkInvulnerableUntil||0,time+.18);
  for(const enemy of nearby(game,unit,clamp(m.radius||weapon.radius||4,1,10),api))if(clear(api,unit,enemy)){api.damage?.(enemy,scaledDamage(weapon,level),weapon.element||'physical',false);applyRoSkillHit(game,unit,enemy,weapon,level,api);}
  emit(api,'sprint',unit,{source:unit.id,duration:.3,skillKey:weapon.key});return true;
 }
 const interval=clamp(m.interval||.8,.35,4),ticks=clamp(Math.ceil(duration/interval),1,40),damage=scaledDamage(weapon,level)/ticks;
 if(kind==='zone'){
  b.roSkillZones=(b.roSkillZones||[]).filter(z=>z.until>time);
  if(b.roSkillZones.filter(z=>z.source===unit.id).length>=RO_SKILL_EFFECT_LIMITS.zones){const oldest=b.roSkillZones.findIndex(z=>z.source===unit.id);b.roSkillZones.splice(oldest,1);}
  const origin=m.follow?unit:m.centered?unit:target;
  const meteor=isRoMeteorSkill(weapon.key),id=game.id?.()||'zone-'+weapon.key;
  b.roSkillZones.push({id,key:weapon.key,source:unit.id,x:origin.x,z:origin.z,follow:!!m.follow,radius,interval,at:time+(meteor?RO_METEOR_TIMING.fall:0),until:time+duration+(meteor?RO_METEOR_TIMING.fall:0),ticks,damage,weapon,level});
  emit(api,meteor?'roMeteorFall':weapon.skill||'abilityPulse',origin,{source:unit.id,radius,duration:meteor?RO_METEOR_TIMING.fall:Math.min(1.4,duration),skillKey:weapon.key,...(meteor?{showerId:id+':'+ticks,element:'fire'}:{})});return true;
 }
 b.roSkillSummons=(b.roSkillSummons||[]).filter(s=>s.until>time);
 const count=Math.min(clamp(m.summonCount||1,1,3),RO_SKILL_EFFECT_LIMITS.summons-b.roSkillSummons.filter(s=>s.source===unit.id).length);if(!count)return false;
 for(let i=0;i<count;i++)b.roSkillSummons.push({id:game.id?.()||'summon-'+weapon.key+'-'+i,key:weapon.key,source:unit.id,x:unit.x+Math.cos(i*2.1)*2,z:unit.z+Math.sin(i*2.1)*2,range:clamp(weapon.range||18,4,32),radius:clamp(m.radius||2,1,8),interval,at:time,until:time+duration,damage:damage/count,weapon,level});
 emit(api,'summon',unit,{source:unit.id,radius:3,duration:.8,skillKey:weapon.key});return true;
}

/** Status durations use encounter time, which freezes during offers and menus. */
export function applyRoSkillHit(game,unit,enemy,weapon,level,api={}){
 if(!enemy?.alive)return false;
 const m=weapon.mechanics||{},status=m.status||{},time=now(game),boss=!!enemy.bonkBoss,scale=factor(level),duration=clamp(m.statusDuration||m.duration||2.5,.25,8);
 let applied=false;
 if(status.slow){enemy.roSkillSlowUntil=Math.max(enemy.roSkillSlowUntil||0,time+duration);enemy.roSkillSlow=clamp(Math.max(enemy.roSkillSlow||0,finite(status.slow)),0,boss?.25:.75);enemy.frostUntil=Math.max(enemy.frostUntil||0,finite(game.time)+duration);applied=true;}
 if((status.stun||status.root)&&time>=(enemy.roSkillControlReadyAt||0)){
  const stun=clamp(status.stun,0,boss?.2:2),root=clamp(status.root,0,boss?.3:3);
  if(stun)enemy.roSkillStunUntil=time+stun;
  if(root)enemy.roSkillRootUntil=time+root;
  enemy.roSkillControlReadyAt=time+Math.max(stun,root)+(boss?2.5:.6);applied=true;
 }
 if(status.armorBreak){enemy.roSkillArmorBreakUntil=Math.max(enemy.roSkillArmorBreakUntil||0,time+duration);enemy.roSkillArmorBreak=clamp(finite(status.armorBreak)*scale,0,boss?.15:.35);applied=true;}
 if(status.blind){enemy.roSkillBlindUntil=Math.max(enemy.roSkillBlindUntil||0,time+duration);enemy.roSkillBlind=clamp(finite(status.blind)*scale,0,.4);applied=true;}
 for(const element of ['poison','burn'])if(status[element]){
  const until=time+clamp(status[element],.5,8),name=element==='poison'?'Poison':'Burn',damage=scaledDamage(weapon,level)*.10;
  enemy['bonk'+name+'Until']=Math.max(enemy['bonk'+name+'Until']||0,until);enemy['bonk'+name+'Damage']=Math.max(enemy['bonk'+name+'Damage']||0,damage);
  enemy.dots={...enemy.dots,[element]:{until:finite(game.time)+(until-time)}};applied=true;
 }
 if(m.knockback&&!boss&&api.move){const dx=enemy.x-unit.x,dz=enemy.z-unit.z;api.move(enemy,dx,dz,.05,clamp(m.knockback,0,5)/.05);}
 if(applied)emit(api,status.poison?'poison':status.burn?'fireball':status.slow||status.root?'frostnova':'abilityPulse',enemy,{source:unit.id,target:enemy.id,radius:Math.min(1.5,enemy.size||1),duration:.3,skillKey:weapon.key});
 if(weapon.key==='basic'){
  for(const buff of (unit.roSkillBuffs||[]).slice(0,RO_SKILL_EFFECT_LIMITS.buffs)){
   const enchant=buff.weapon,m=enchant?.mechanics;if(buff.until<=time||!m||!m.status&&!m.proc)continue;
   const ready=(unit.roPassiveProcAt||={}),key='buff:'+buff.key;if((ready[key]||0)>time)continue;
   if((game.random?.()??.5)>=clamp(m.proc?.chance??m.chance??.35,0,.45))continue;
   ready[key]=time+clamp(m.proc?.cooldown||1,1,8);
   if(m.status)applyRoSkillHit(game,unit,enemy,enchant,buff.level,api);
   if(m.proc){const element=m.proc.element||'arcane';api.damage?.(enemy,Math.max(0,finite(m.proc.damage))*factor(buff.level),element,true);emit(api,element==='fire'?'fireball':element==='ice'?'frostnova':'bolt',enemy,{source:unit.id,target:enemy.id,radius:1.5,duration:.35,skillKey:buff.key});}
  }
  let count=0;for(const [key,learned]of Object.entries(unit.bonkBuild?.weapons||{})){
   const passive=RO_SKILLS[key],p=passive?.mechanics;if(passive?.kind!=='passive'||!p||!p.status&&!p.proc||count++>=8)continue;
   const ready=(unit.roPassiveProcAt||={});if((ready[key]||0)>time)continue;
   const chance=clamp(p.proc?.chance??p.chance??.15,0,.45);if((game.random?.()??.5)>=chance)continue;
   ready[key]=time+clamp(p.proc?.cooldown||p.procCooldown||1.5,1,8);
   if(p.status)applyRoSkillHit(game,unit,enemy,passive,learned,api);
   if(p.proc){const element=p.proc.element||'arcane';api.damage?.(enemy,Math.max(0,finite(p.proc.damage))*factor(learned),element,true);emit(api,element==='fire'?'fireball':element==='ice'?'frostnova':'bolt',enemy,{source:unit.id,target:enemy.id,radius:1.5,duration:.35,skillKey:key});}
  }
 }
 return applied;
}

export function roEnemySkillState(enemy,elapsed){
 const stunned=(enemy.roSkillStunUntil||0)>elapsed,rooted=(enemy.roSkillRootUntil||0)>elapsed,slow=enemy.roSkillSlowUntil>elapsed?clamp(enemy.roSkillSlow,0,.75):0,blind=enemy.roSkillBlindUntil>elapsed?clamp(enemy.roSkillBlind,0,.4):0;
 return{stunned,rooted,speedMultiplier:stunned||rooted?0:1-slow,damageMultiplier:1-blind,damageTakenMultiplier:1+(enemy.roSkillArmorBreakUntil>elapsed?clamp(enemy.roSkillArmorBreak,0,.35):0)};
}

export function roAbsorbSkillDamage(unit,amount,elapsed,stats={}){
 let damage=Math.max(0,finite(amount))*(1-clamp(stats.damageReduction,0,.4));const shield=unit.roSkillShield;
 if(shield?.until>elapsed&&shield.value>0){const blocked=Math.min(shield.value,damage);shield.value-=blocked;damage-=blocked;}
 return damage;
}

export function applyRoSkillLifeSteal(unit,damage,stats={}){const amount=Math.max(0,finite(damage))*clamp(stats.lifeSteal,0,.12);if(unit.alive&&amount>0)unit.hp=Math.min(unit.maxHp,unit.hp+Math.min(amount,unit.maxHp*.025));}

/** No catch-up loops: a suspended game or large dt never releases a damage burst. */
export function tickRoSkillEffects(game,unit,dt,api={}){
 const b=game.bonk,time=now(game);unit.roSkillElapsed=time;
 unit.roSkillBuffs=(unit.roSkillBuffs||[]).filter(v=>v.until>time);
 if(unit.roSkillShield?.until<=time)delete unit.roSkillShield;
 if(!unit.alive||b.stage!=='playing')return;
 b.roSkillZones=(b.roSkillZones||[]).filter(z=>z.until>time);
 for(const zone of b.roSkillZones.filter(z=>z.source===unit.id).slice(-RO_SKILL_EFFECT_LIMITS.zones)){if(zone.follow){zone.x=unit.x;zone.z=unit.z;}if(zone.at>time||zone.ticks<=0)continue;zone.at=time+zone.interval;const meteor=isRoMeteorSkill(zone.key),showerId=zone.id+':'+zone.ticks;zone.ticks--;for(const enemy of nearby(game,zone,zone.radius,api))if(clear(api,zone,enemy)){api.damage?.(enemy,zone.damage,zone.weapon.element||'physical',false);applyRoSkillHit(game,unit,enemy,zone.weapon,zone.level,api);}emit(api,meteor?'roMeteorImpact':zone.weapon.skill||'abilityPulse',zone,{source:unit.id,radius:zone.radius,duration:meteor?.85:.4,skillKey:zone.key,...(meteor?{showerId,element:'fire'}:{})});if(meteor&&zone.ticks>0)emit(api,'roMeteorFall',zone,{source:unit.id,radius:zone.radius,duration:zone.interval,skillKey:zone.key,showerId:zone.id+':'+zone.ticks,element:'fire'});}
 b.roSkillSummons=(b.roSkillSummons||[]).filter(s=>s.until>time);
 for(const summon of b.roSkillSummons.filter(s=>s.source===unit.id).slice(-RO_SKILL_EFFECT_LIMITS.summons)){
  const target=nearby(game,unit,summon.range,api).filter(e=>clear(api,summon,e)).sort((a,c)=>distance(a,summon)-distance(c,summon))[0];
  if(!target)continue;
  const d=distance(summon,target),travel=Math.min(Math.max(0,finite(dt))*(summon.weapon.mechanics?.ranged?3:9),Math.max(0,d-1.5));
  if(d>.01){const p={x:summon.x+(target.x-summon.x)/d*travel,z:summon.z+(target.z-summon.z)/d*travel};if(clear(api,summon,p)&&!api.blocked?.(p))Object.assign(summon,p);}
  if(summon.at>time)continue;summon.at=time+summon.interval;
  const ranged=!!summon.weapon.mechanics?.ranged;if(!ranged&&distance(summon,target)>summon.radius+1)continue;
  for(const enemy of nearby(game,target,summon.radius,api))if(clear(api,summon,enemy)){api.damage?.(enemy,summon.damage,summon.weapon.element||'physical',false);applyRoSkillHit(game,unit,enemy,summon.weapon,summon.level,api);}
  emit(api,ranged?'bolt':'summon',summon,{source:unit.id,target:target.id,tx:target.x,tz:target.z,radius:summon.radius,duration:.35,skillKey:summon.key});
 }
}

export function resetRoSkillEffects(game,unit){delete unit.roCasting;unit.roSkillElapsed=0;unit.roSkillBuffs=[];unit.roPassiveProcAt={};delete unit.roSkillShield;if(game.bonk){game.bonk.roSkillZones=[];game.bonk.roSkillSummons=[];}}
