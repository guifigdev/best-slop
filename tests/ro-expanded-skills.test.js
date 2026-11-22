import test from 'node:test';
import assert from 'node:assert/strict';
import {RO_SKILLS,RO_LINEAGES,roSkillTier,roBasicAttack} from '../shared/ragnarok-jobs.js';
import {RO_EXPANDED_SKILLS,RO_LINEAGE_SKILL_KEYS,RO_LINEAGE_SKILL_TIERS,RO_SKILL_SOURCE_JOBS,RO_SKILL_EXCLUSIONS} from '../shared/ro-expanded-skills.js';
import {Game} from '../shared/simulation.js';
import {bonkStats} from '../shared/bonk.js';

const allowedKinds=new Set(['slash','pulse','projectile','chain','orbit','heal','buff','passive','zone','summon','dash']);
const modifierKeys=new Set(['damage','haste','area','crit','armor','magicDefense','evasion','regen','speed','manaRegen','damageReduction','lifeSteal','accuracy','critDamage','xp','magnet','amount','maxHp']);
const statusKeys=new Set(['slow','stun','root','poison','burn','armorBreak','blind']);
const mechanicKeys=new Set(['allyRadius','modifiers','status','duration','statusDuration','healPercent','healFlat','manaPercent','interval','radius','ticks','summonCount','knockback','dashDistance','retreat','follow','centered','cleanse','shieldPercent','hits','proc','chance']);

test('every source skill has an executable combat role, coherent numeric profile and a primary source identity',()=>{
 assert.equal(Object.keys(RO_EXPANDED_SKILLS).length,681);
 const ids=new Set();
 for(const [key,s] of Object.entries(RO_SKILLS).filter(([,s])=>s.sourceId)){
  assert.equal(key,s.key);assert.ok(allowedKinds.has(s.kind),key);assert.ok(Number.isInteger(s.sourceId)&&s.sourceId>0,key);assert.ok(!ids.has(s.sourceId),key);ids.add(s.sourceId);
  assert.match(s.source,/rathena\/rathena/);assert.ok(s.sourceAegis&&s.sourceJobs.length&&s.sourceJob);assert.ok(s.name&&s.description.length>25,key);assert.ok(Number.isInteger(s.tier)&&s.tier>=0&&s.tier<=3,key);
  for(const field of ['damage','cooldown','range','manaCost'])assert.ok(Number.isFinite(s[field])&&s[field]>=0,`${key}.${field}`);
  if(s.kind==='projectile')assert.ok(s.speed>0,key);
  const m=s.mechanics||{};for(const field of Object.keys(m))assert.ok(mechanicKeys.has(field),`${key}.${field}`);
  for(const [field,value] of Object.entries(m.modifiers||{})){assert.ok(modifierKeys.has(field),`${key}.${field}`);assert.ok(Number.isFinite(value)&&value>=0,`${key}.${field}`);}
  for(const [field,value] of Object.entries(m.status||{})){assert.ok(statusKeys.has(field),`${key}.${field}`);assert.ok(Number.isFinite(value)&&value>=0,`${key}.${field}`);}
  if(s.kind==='passive')assert.ok(Object.keys(m.modifiers||{}).length||m.proc||m.status,key);
  if(s.kind==='buff')assert.ok(m.duration>0&&(Object.keys(m.modifiers||{}).length||m.shieldPercent||m.healPercent||m.manaPercent),key);
  if(s.kind==='heal')assert.ok(m.healPercent||m.healFlat||m.manaPercent||m.cleanse,key);
  if(['zone','summon'].includes(s.kind))assert.ok(s.damage>0&&m.interval>0&&m.duration>0,key);
  if(s.kind==='dash')assert.ok(m.dashDistance>0,key);
  assert.ok((m.modifiers?.maxHp||0)<=.45,key);assert.ok((m.modifiers?.damageReduction||0)<=.2,key);assert.ok((m.shieldPercent||0)<=.4,key);
 }
 assert.equal(ids.size,681);
 const profiles=new Set(Object.values(RO_SKILLS).map(s=>JSON.stringify([s.kind,s.element,s.damage,s.cooldown,s.range,s.mechanics])));
 assert.ok(profiles.size>250,'different combat effects and budgets, not one attack copied for every name');
});

test('all twelve lineages expose the complete curated skills of their own 54 first, transcendent, third and fourth jobs',()=>{
 assert.equal(Object.keys(RO_SKILL_SOURCE_JOBS).length,54);
 for(const p of Object.values(RO_LINEAGES)){
  assert.ok(p.skills.length>=50&&p.skills.length<=96,p.key);assert.equal(new Set(p.skills).size,p.skills.length);
  assert.deepEqual(new Set(p.skills),new Set(RO_LINEAGE_SKILL_KEYS[p.key]));
  assert.ok(Object.isFrozen(p.skills)&&Object.isFrozen(p.skillTiers));
  for(const key of p.skills){assert.ok(RO_SKILLS[key],`${p.key}.${key}`);assert.equal(roSkillTier(p.key,key),RO_LINEAGE_SKILL_TIERS[p.key][key]);}
  for(const tier of [0,1,2,3])assert.ok(p.skills.some(key=>roSkillTier(p.key,key)===tier),`${p.key} tier${tier}`);
 }
 assert.equal(roSkillTier('imperialguard','al_heal'),1,'Crusaders learn Heal at their second job');
 assert.equal(roSkillTier('cardinal','al_heal'),0,'Acolytes can Heal in their first job');
 assert.equal(roSkillTier('abysschaser','doublestrafe'),1,'Rogues inherit bow skills in the correct job');
 assert.equal(roSkillTier('windhawk','doublestrafe'),0);
 assert.ok(RO_LINEAGES.shadowcross.skills.includes('asc_breaker'),'transcendent Assassin Cross techniques included');
 assert.ok(RO_LINEAGES.archmage.skills.includes('hw_napalmvulcan'),'transcendent Wizard techniques included');
 assert.ok(RO_LINEAGES.cardinal.skills.includes('hp_assumptio'));
});

test('both mage paths start with a clean, slower basic fireball while bolt alternatives remain in the learnable tree',()=>{
 for(const key of ['archmage','elementalmaster']){
  const p=RO_LINEAGES[key],basic=roBasicAttack({roLineage:key,roTier:0});
  assert.equal(p.skills[0],'fireball');assert.equal(basic.element,'fire');assert.equal(basic.kind,'projectile');assert.equal(basic.radius,undefined);assert.ok(basic.cooldown>=1.6&&basic.speed<=15);assert.equal(basic.skill,'fireball');assert.match(basic.name,/Bola de Fogo/);
  for(const alternative of ['firebolt','coldbolt'])assert.ok(p.skills.includes(alternative));
 }
 assert.equal(RO_SKILLS.fireball.sourceAegis,'MG_FIREBALL');assert.equal(RO_SKILLS.fireball.element,'fire');assert.ok(RO_SKILLS.fireball.mechanics.radius>=2);
});

test('noncombat utility is explicitly excluded and never silently offered as a placeholder',()=>{
 assert.equal(Object.keys(RO_SKILL_EXCLUSIONS).length,108);
 for(const [aegis,why]of Object.entries(RO_SKILL_EXCLUSIONS)){
  assert.ok(why.name&&why.reason&&why.sourceId);assert.ok(!Object.values(RO_SKILLS).some(s=>s.sourceAegis===aegis),aegis);
 }
 for(const excluded of ['MC_VENDING','MC_DISCOUNT','AC_MAKINGARROW','AM_PHARMACY','AL_WARP','RG_GRAFFITI'])assert.ok(RO_SKILL_EXCLUSIONS[excluded]);
 for(const useful of ['TF_HIDING','MG_SAFETYWALL','AL_HEAL','AS_GRIMTOOTH','WL_TETRAVORTEX','RA_WUGSTRIKE','EM_SUMMON_ELEMENTAL_ARDOR'])assert.ok(Object.values(RO_SKILLS).some(s=>s.sourceAegis===useful),useful);
});

test('every included active can execute through the real command dispatcher and every passive changes a real stat or proc',()=>{
 const g=new Game(381,{mode:'bonk',bonkLineage:'dragonknight'});g.addPlayer('p','knight');assert.ok(g.command('p',{type:'bkReady'}));const u=g.player('p');
 g.bonk.map.obstacles=[];g.bonk.map.walls=[];
 for(const s of Object.values(RO_SKILLS).filter(s=>s.sourceId)){
  const lineage=Object.values(RO_LINEAGES).find(p=>p.skills.includes(s.key));delete u.roCasting;u.level=150;u.attributes.int=99;u.roLineage=lineage.key;u.roTier=3;u.bonkJob=lineage.jobs[3];u.roSkillBuffs=[];u.roSkillShield=null;u.roSkillProcAt={};u.bonkBuild={weapons:{basic:1,[s.key]:1},tomes:{},relics:{}};u.bonkSkillSlots=['basic',s.key,null,null];u.bonkWeaponAt={};u.hp=100;u.maxHp=500;u.mana=5000;u.maxMana=5000;u.alive=true;u.x=0;u.z=0;g.bonk.elapsed=10;g.bonk.stage='playing';g.bonk.offer=null;g.bonk.roSkillZones=[];g.bonk.roSkillSummons=[];g.bonk.spawnAt=1e9;g.effects=[];u.bonkSkillAuto={basic:false,[s.key]:false};
  const enemy={id:999,name:'Alvo',bonkEnemy:true,alive:true,x:1,z:0,hp:1e7,maxHp:1e7,collisionRadius:.4,damage:0,armor:0,bonkNextAttack:100};g.units=[u,enemy];
  if(s.kind==='passive'){
   const stats=bonkStats(u);assert.ok(Object.values(stats).filter(v=>typeof v==='number').every(Number.isFinite),s.key);assert.ok(s.mechanics.proc||s.mechanics.status||Object.keys(s.mechanics.modifiers||{}).length,s.key);continue;
  }
  assert.equal(g.command('p',{type:'bkCast',key:s.key}),true,`${s.sourceAegis} (${s.kind}) failed: ${g.commandFailureReason}`);
  if(u.roCasting){const finish=u.roCasting.finishAt;for(let i=0;i<310&&g.bonk.elapsed<finish+.1;i++)g.tick(.1);}
  assert.ok(u.bonkWeaponAt[s.key]>10,`${s.key} starts a real cooldown`);
  assert.ok(u.mana<5000||s.mechanics?.manaPercent,`${s.key} pays real SP`);
  assert.ok([u.x,u.z,u.hp,u.mana,enemy.hp].every(Number.isFinite),s.key);
 }
});
