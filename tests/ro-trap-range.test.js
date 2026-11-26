import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {RO_SKILLS} from '../shared/ragnarok-jobs.js';
import {bonkStats} from '../shared/bonk.js';
import {isRoTrapSkill,roSkillTargetRange,roTrapEffectRadius,RO_TRAP_MAX_RADIUS} from '../shared/ro-skill-range.js';
import {roUtilitySkillReadiness,castRoUtilitySkill,tickRoSkillEffects} from '../shared/ro-skill-mechanics.js';
import {roGroundAreas} from '../src/ro-ground-area-art.js';
import {roFireImpacts} from '../src/ro-fire-impact-art.js';
import {roSkillStatus,roSkillManaCost} from '../shared/ro-skill-controls.js';
import {equippedSkillDetails} from '../src/skill-hover-card.js';
function actual(key='ht_landmine',distance=4){
 const g=new Game(152,{mode:'bonk',bonkLineage:'windhawk'});g.addPlayer('p','ranger');g.command('p',{type:'bkReady'});const u=g.player('p');u.x=u.z=0;u.roTier=3;u.bonkBuild.weapons={basic:1,[key]:1};u.bonkSkillSlots=['basic',key];u.bonkSkillAuto={basic:false,[key]:false};u.mana=1000;u.maxMana=1000;u.roInventory[0].enchants={area:8};u.roSkillBuffs=[{key:'large-area',until:100,modifiers:{area:.5}}];
 const enemy={id:g.id(),bonkEnemy:true,alive:true,x:distance,z:0,hp:1e6,maxHp:1e6,damage:0,speed:0,size:.8,collisionRadius:.3,bonkNextAttack:1e9,bonkNextSpecial:1e9};g.units=[u,enemy];g.bonk.map.obstacles=[];g.bonk.map.walls=[];g.bonk.spawnAt=1e9;g.bonk.objectives=[];u.mana=u.maxMana=bonkStats(u).maxMana;return{g,u,enemy};
}
test('all trap zones cap placement at four metres regardless of area, while spells and arrows retain their existing reach',()=>{
 const traps=Object.values(RO_SKILLS).filter(s=>s.kind==='zone'&&s.role?.startsWith('trap_'));assert.ok(traps.length>=15);
 for(const trap of traps)for(const area of [1,3,100]){assert.equal(isRoTrapSkill(trap),true);assert.equal(roSkillTargetRange(trap,{area}),4,trap.key);}
 for(const key of ['arrowstorm','ac_shower','severerainstorm','mg_firewall','wz_meteor']){assert.equal(isRoTrapSkill(RO_SKILLS[key]),false);assert.equal(roSkillTargetRange(RO_SKILLS[key],{area:3}),RO_SKILLS[key].range*3);}
 assert.equal(isRoTrapSkill({kind:'passive',role:'trap_damage'}),false);assert.equal(isRoTrapSkill(null),false);
});
test('readiness and actual acquisition use the same four metre boundary with compact trap effects',()=>{
 const unit={id:1,x:0,z:0,alive:true},enemy={id:2,x:4.01,z:0,alive:true,bonkEnemy:true},g={units:[unit,enemy],bonk:{stage:'playing',elapsed:0},id:()=>10},stats={area:3},queried=[],api={nearby:(p,r)=>{queried.push(r);return g.units.filter(e=>e.bonkEnemy&&e.alive&&Math.hypot(e.x-p.x,e.z-p.z)<=r);}};
 const trap=RO_SKILLS.ht_landmine;assert.equal(roUtilitySkillReadiness(g,unit,trap,stats).ready,false);assert.equal(castRoUtilitySkill(g,unit,trap,1,stats,api),false);enemy.x=4;assert.equal(roUtilitySkillReadiness(g,unit,trap,stats).ready,true);assert.equal(castRoUtilitySkill(g,unit,trap,1,stats,api),true);assert.deepEqual(queried,[4]);assert.equal(g.bonk.roSkillZones[0].x,4);assert.equal(g.bonk.roSkillZones[0].radius,roTrapEffectRadius(trap,stats));
});

test('every trap stays compact even with extreme area stacking and fire art matches actual damage reach',()=>{
 for(const trap of Object.values(RO_SKILLS).filter(isRoTrapSkill))for(const area of [1,3,100,NaN,Infinity]){
  const radius=roTrapEffectRadius(trap,{area});assert.ok(Number.isFinite(radius)&&radius>=1&&radius<=RO_TRAP_MAX_RADIUS,trap.key);
 }
 const {g,u}=actual('ra_firingtrap'),trap=RO_SKILLS.ra_firingtrap,stats={area:100},hits=[];
 assert.ok(castRoUtilitySkill(g,u,trap,1,stats,{aim:{x:2,z:0}}));
 const zone=g.bonk.roSkillZones[0],inside={id:1001,alive:true,bonkEnemy:true,x:zone.x+zone.radius-.01,z:zone.z},outside={id:1002,alive:true,bonkEnemy:true,x:zone.x+zone.radius+.01,z:zone.z};
 g.units=[u,inside,outside];tickRoSkillEffects(g,u,.05,{damage:e=>hits.push(e.id)});
 assert.deepEqual(hits,[inside.id]);
 const state={options:{mode:'bonk'},time:g.time,bonk:g.bonk,effects:[],units:g.units};
 assert.equal(roGroundAreas(state).find(z=>z.id==='zone:'+zone.id).radius,zone.radius);
 assert.equal(roFireImpacts(state).find(z=>z.key==='zone:'+zone.id).radius,zone.radius);
});
test('real manual and automatic readiness reject a distant trap without spending SP and accept exact four metre placement',()=>{
 const{g,u,enemy}=actual('ht_anklesnare',4.01),stats=bonkStats(u),before=u.mana;assert.ok(stats.area>2);assert.equal(roSkillStatus(g,u,'ht_anklesnare',stats).reasonCode,'target');assert.equal(roSkillStatus(g,u,'ht_anklesnare',stats,{manual:false}).reasonCode,'target');assert.equal(g.command('p',{type:'bkCast',key:'ht_anklesnare'}),false);assert.equal(u.mana,before);assert.equal(u.roCasting,undefined);assert.equal(g.bonk.roSkillZones?.length||0,0);
 enemy.x=4;assert.equal(roSkillStatus(g,u,'ht_anklesnare',stats).ready,true);assert.equal(g.command('p',{type:'bkCast',key:'ht_anklesnare'}),true);const zone=g.bonk.roSkillZones.find(z=>z.key==='ht_anklesnare');assert.equal(zone.x,4);assert.equal(zone.z,0);assert.equal(zone.radius,roTrapEffectRadius(RO_SKILLS.ht_anklesnare,stats));assert.equal(u.mana,before-roSkillManaCost(RO_SKILLS.ht_anklesnare,1));
 const state=g.snapshotFor('p'),card=equippedSkillDetails(state,u,'ro:ht_anklesnare');assert.equal(card.rows.find(r=>r.label==='Alcance').current,'4 m');assert.equal(card.rows.find(r=>r.label==='Alcance').next,'4 m');assert.equal(card.rows.find(r=>r.label==='Raio da área').current,Number(zone.radius.toFixed(2)).toLocaleString('pt-BR')+' m');
});
test('a started trap cast rechecks nearby placement when the target leaves range without charging SP',()=>{
 const{g,u,enemy}=actual('ht_landmine',4),stats=bonkStats(u),before=u.mana;assert.equal(g.command('p',{type:'bkCast',key:'ht_landmine'}),true);if(!u.roCasting)return assert.fail('Land Mine fixture must have a real conjuration');enemy.x=20;const finish=u.roCasting.finishAt;for(let i=0;i<100&&g.bonk.elapsed<=finish+.1;i++)g.tick(.05);assert.equal(g.bonk.roSkillZones?.length||0,0);assert.ok(u.mana>=before,'failed completion spends no SP; passive regeneration may restore some');assert.equal(u.bonkWeaponAt.ht_landmine,undefined);assert.equal(roSkillStatus(g,u,'ht_landmine',stats).reasonCode,'target');
});
test('Arrow Storm remains placeable at long distance and its card does not inherit the trap cap',()=>{
 const{g,u}=actual('arrowstorm',24),stats=bonkStats(u);assert.equal(roSkillStatus(g,u,'arrowstorm',stats).ready,true);const card=equippedSkillDetails(g.snapshotFor('p'),u,'ro:arrowstorm');assert.equal(card.rows.find(r=>r.label==='Alcance').current,Number(roSkillTargetRange(RO_SKILLS.arrowstorm,stats).toFixed(2)).toLocaleString('pt-BR')+' m');assert.ok(g.command('p',{type:'bkCast',key:'arrowstorm'}));for(let i=0;i<100&&!g.bonk.roSkillZones?.some(z=>z.key==='arrowstorm');i++)g.tick(.05);assert.ok(g.bonk.roSkillZones.some(z=>z.key==='arrowstorm'&&Math.hypot(z.x-u.x,z.z-u.z)>20));
});
