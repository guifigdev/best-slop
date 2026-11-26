import test from 'node:test';
import assert from 'node:assert/strict';
import {roDoubleAttack} from '../shared/ro-double-attack.js';
import {RO_SKILLS} from '../shared/ragnarok-jobs.js';
import {roSkillOfferPool} from '../shared/ro-skill-offers.js';
import {roActiveSkillKeys} from '../shared/ro-skill-loadout.js';
import {roSkillModifiers} from '../shared/ro-skill-mechanics.js';
import {roDamageFeedback} from '../src/ro-damage-feedback.js';
import {Game} from '../shared/simulation.js';
import {createRoEquipment} from '../shared/ragnarok-equipment.js';
import {bonkStats} from '../shared/bonk.js';

test('Double Attack is offered to first-job Thieves and remains a passive with no fake critical or haste bonus',()=>{
 const u={roLineage:'shadowcross',roSkillMode:'class',roTier:0,bonkBuild:{weapons:{basic:1},tomes:{},relics:{}}};assert.ok(roSkillOfferPool(u).some(s=>s.key==='tf_double'&&s.passive));u.bonkBuild.weapons.tf_double=8;assert.ok(!roActiveSkillKeys(u).includes('tf_double'));assert.deepEqual(roSkillModifiers(u),{});assert.equal(RO_SKILLS.tf_double.manaCost,0);
});
test('Double Attack follows LATAM chance and weapon rules and native Katar offhand damage',()=>{
 const u={bonkBuild:{weapons:{tf_double:8}}};assert.equal(roDoubleAttack(u,{weaponType:'dagger'},()=>.559).multiplier,2);assert.equal(roDoubleAttack(u,{weaponType:'dagger'},()=>.56).multiplier,1);assert.equal(roDoubleAttack(u,{weaponType:'sword'},()=>0).hits,1);assert.equal(roDoubleAttack(u,{weaponType:'katar'},()=>.99).multiplier,1.17);assert.equal(roDoubleAttack(u,{weaponType:'bow',itemDoubleAttackLevel:5},()=>0).multiplier,2);delete u.bonkBuild.weapons.tf_double;assert.equal(roDoubleAttack(u,{weaponType:'dagger'},()=>0).multiplier,1);
});
function hit(rank,roll=0){const g=new Game(17,{mode:'bonk',bonkLineage:'shadowcross',bonkSkillMode:'class'});g.addPlayer('p','raccoon');g.command('p',{type:'bkReady'});const u=g.player('p'),e=g.units.find(e=>e.bonkEnemy);u.bonkBuild.weapons={basic:1,...(rank?{tf_double:rank}:{})};Object.assign(e,{hp:1e6,maxHp:1e6,armor:0,roSourceId:999999,x:u.x+.5,z:u.z});g.units=[u,e];g.effects=[];g.random=()=>roll;g.command('p',{type:'bkCast',key:'basic'});return{damage:1e6-e.hp,event:g.effects.find(f=>f.type==='damage'),effects:g.effects};}
test('authoritative dagger proc deals exactly two hits in one physical bundle, without recursion or free crits',()=>{
 const normal=hit(0),double=hit(8);assert.ok(Math.abs(double.damage-normal.damage*2)<1e-8);assert.equal(double.event.hits,2);assert.equal(double.event.proc,'TF_DOUBLE');assert.equal(double.event.critical,false);assert.equal(double.effects.filter(e=>e.type==='damage').length,1);assert.equal(roDamageFeedback(double.event).className,'ro-multihit');
});

function seededCombat({learned=0,hat=false,weapon='knife'}={}){
 const g=new Game(617,{mode:'bonk',bonkLineage:'shadowcross',bonkSkillMode:'class'});g.addPlayer('p','raccoon');g.command('p',{type:'bkReady'});
 const u=g.player('p'),enemy=g.units.find(e=>e.bonkEnemy);
 u.bonkBuild.weapons={basic:1,...(learned?{tf_double:learned}:{})};u.bonkSkillSlots=['basic'];u.bonkSkillAuto={basic:true};u.bonkInvulnerableUntil=1e6;
 u.roInventory=[createRoEquipment(weapon,'rng-weapon'),...(hat?[createRoEquipment('build_5388','rng-hat')]:[])];u.roEquipment={weapon:'rng-weapon',...(hat?{head:'rng-hat'}:{})};
 Object.assign(enemy,{hp:1e9,maxHp:1e9,x:u.x+.7,z:u.z,speed:0,damage:0,roSourceId:999999,bonkNextAttack:Infinity,bonkNextSpecial:Infinity});
 g.units=[u,enemy];g.effects=[];g.bonk.map.obstacles=[];g.bonk.map.walls=[];g.bonk.spawnAt=Infinity;g.bonk.objectives=[];
 return {g,u,enemy};
}
for(const [name,setup]of [['learned dagger passive',{learned:8}],['Snake Head dagger proc',{hat:true}],['Snake Head proc with a two-handed Katar',{hat:true,weapon:'build_1287'}]]){
 test(`${name} preserves the real Game RNG receiver during manual and automatic attacks`,()=>{
  const run=()=>{const {g,u,enemy}=seededCombat(setup),seed=g.seed;
   assert.equal(g.random,Game.prototype.random,'exercise the production seeded method, not an arrow stub');
   assert.equal(bonkStats(u).weaponType,setup.weapon?'katar':'dagger');if(setup.hat)assert.ok(bonkStats(u).itemDoubleAttackLevel>0);
   assert.doesNotThrow(()=>assert.equal(g.command('p',{type:'bkCast',key:'basic'}),true));assert.notEqual(g.seed,seed);
   const hits=[];for(let i=0;i<360;i++){g.tick(1/30);for(const e of g.effects)if(e.type==='damage'&&e.target===enemy.id&&!hits.some(h=>h.id===e.id))hits.push({id:e.id,amount:e.amount,hits:e.hits,proc:e.proc});}
   assert.ok(enemy.hp<enemy.maxHp);assert.ok(hits.some(e=>e.proc==='TF_DOUBLE'&&e.hits===2));assert.ok(g.bonk.elapsed>11.9);
   return {seed:g.seed,hp:enemy.hp,hits};
  };
  assert.deepEqual(run(),run(),'the fix must retain deterministic replays');
 });
}
test('damage presentation separates white, yellow multi-hit totals and the same warm presentation for all criticals, and never recolors incoming magic as critical',()=>{
 const e={type:'damage',bonk:true,amount:321,source:1,target:2,hits:2,hitGroup:99};assert.deepEqual(roDamageFeedback(e),{className:'ro-multihit',text:'321',group:'1:2:99'});assert.equal(roDamageFeedback({...e,critical:true}).className,'critical');assert.equal(roDamageFeedback({...e,hits:1,critical:true}).className,'critical');assert.equal(roDamageFeedback({...e,hits:1}).className,'physical');assert.equal(roDamageFeedback(e,true),null);assert.equal(roDamageFeedback({...e,bonk:false}),null);assert.equal(roDamageFeedback({...e,miss:true}),null);
});
test('Double Strafe projectiles carry one cast group and report native multi-hit presentation when they hit',()=>{
 const g=new Game(17,{mode:'bonk',bonkLineage:'windhawk'});g.addPlayer('p','ranger');g.command('p',{type:'bkReady'});const u=g.player('p'),e=g.units.find(e=>e.bonkEnemy);u.bonkBuild.weapons={basic:1,doublestrafe:1};u.bonkSkillSlots=['basic','doublestrafe'];u.bonkSkillAuto={basic:false,doublestrafe:false};u.mana=500;Object.assign(e,{hp:1e6,maxHp:1e6,x:u.x+3,z:u.z,speed:0,damage:0,roSourceId:999999});g.units=[u,e];g.effects=[];g.bonk.map.obstacles=[];g.bonk.map.walls=[];g.bonk.spawnAt=Infinity;g.bonk.objectives=[];g.random=()=>.1;assert.ok(g.command('p',{type:'bkCast',key:'doublestrafe'}));const projectiles=g.bonk.projectiles;assert.equal(projectiles.length,2);assert.equal(new Set(projectiles.map(p=>p.hitGroup)).size,1);assert.ok(projectiles.every(p=>p.hits===2));g.tick(.12);const damage=g.effects.filter(e=>e.type==='damage'&&e.skillKey==='doublestrafe');assert.equal(damage.length,2);assert.ok(damage.every(e=>e.hits===2&&e.hitGroup===projectiles[0].hitGroup));
});
