import {roSkillIsCurated} from '../shared/ro-skill-policy.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {RO_LINEAGES,RO_SKILLS,advanceRoJob} from '../shared/ragnarok-jobs.js';
import {roSurvivorEnemyBudget} from '../shared/ro-survivor-balance.js';
import {roSkillOfferPool,drawRoSkillOffers} from '../shared/ro-skill-offers.js';
import {roActiveSkillKeys} from '../shared/ro-skill-loadout.js';
import {createRoCheckpoint,validateRoCheckpoint} from '../shared/ragnarok-save.js';

function arena(lineage='dragonknight'){
 const p=RO_LINEAGES[lineage],g=new Game(12,{mode:'bonk',bonkLineage:lineage});g.addPlayer('p',p.hero);g.command('p',{type:'bkReady'});const u=g.player('p');g.bonk.map.obstacles=[];g.bonk.objectives.forEach(o=>o.started=true);g.bonk.spawnAt=1e9;g.random=()=>.5;return {g,u};
}
test('fresh normal characters need sustained combat instead of one initial volley, across all twelve lineages',()=>{
 for(const p of Object.values(RO_LINEAGES)){const{g,u}=arena(p.key),e=g.units.find(e=>e.bonkEnemy),budget=roSurvivorEnemyBudget({key:'poring'});Object.assign(e,{...budget,x:u.x+2,z:u.z,maxHp:budget.hp,speed:2,damage:0,bonkNextAttack:1e9,bonkNextSpecial:1e9});g.units=[u,e];g.tick(.05);assert.ok(e.alive,p.key+' survives the first basic+skill volley');let seconds=.05;while(e.alive&&seconds<9){g.tick(.05);seconds+=.05;}assert.equal(e.alive,false,p.key+' can still kill a common monster');assert.ok(seconds>=.6&&seconds<=8,p.key+' TTK '+seconds);}
});
test('durability distinguishes ordinary monsters, heavies, elites and MVPs without reading gear or current DPS',()=>{
 const common=roSurvivorEnemyBudget({key:'poring'}),heavy=roSurvivorEnemyBudget({key:'golem'}),elite=roSurvivorEnemyBudget({key:'poring',elite:true}),boss=roSurvivorEnemyBudget({key:'poring',boss:true});assert.ok(common.hp>=112);assert.ok(heavy.hp>common.hp);assert.ok(elite.hp>common.hp);assert.ok(boss.hp>elite.hp*5);assert.ok(common.damage>=34&&common.damage<boss.damage,'common contact hurts, while MVP damage remains larger');
 assert.ok(roSurvivorEnemyBudget({key:'poring',level:70,progress:4}).hp>common.hp*4);assert.ok(roSurvivorEnemyBudget({activity:'tower',level:150,progress:99}).speedScale<=1.35);assert.deepEqual(common,roSurvivorEnemyBudget({key:'poring',damage:999999,equipment:{attack:999999}}));
});
test('four offers always include class skills, and only an actual offered choice consumes an improvement',()=>{
 const{g,u}=arena();assert.ok(roSkillOfferPool(u).some(c=>c.key==='basic'),'native basic upgrades are available from first class');for(let i=0;i<30;i++){let seed=i;const choices=drawRoSkillOffers(u,()=>((seed=seed*1664525+1013904223)>>>0)/4294967296);assert.equal(choices.length,4);assert.ok(choices.filter(c=>c.kind==='weapon').length>=2);assert.equal(new Set(choices.map(c=>c.kind+':'+c.key)).size,4);}
 g.bonk.pickups.push({id:g.id(),x:u.x,z:u.z,type:'xp',value:30,age:0});g.tick(.05);assert.ok(g.bonk.offer);const current=g.bonk.offer,choice=current.choices.find(c=>c.kind==='weapon'),key=choice.key,rank=u.bonkBuild.weapons[key]||0,pending=u.bonkPendingLevels,notDrawn=roSkillOfferPool(u).find(c=>c.kind==='weapon'&&!current.choices.some(o=>o.kind==='weapon'&&o.key===c.key));assert.equal(current.choices.length,4);assert.ok(notDrawn);assert.equal(g.command('p',{type:'bkChooseSkill',key:notDrawn.key}),false);assert.equal(u.bonkPendingLevels,pending);assert.equal(g.bonk.offer,current);assert.ok(g.command('p',{type:'bkChooseSkill',key}));assert.equal(u.bonkBuild.weapons[key],rank+1);assert.equal(u.bonkPendingLevels,pending-1);assert.equal(g.command('p',{type:'bkChooseSkill',key}),false,'no free learning after the offered improvement was consumed');
});
test('skills stay learned outside twelve skill slots, swap without cooldown resets and save all learning',()=>{
 const{g,u}=arena('shadowcross');advanceRoJob(u,3);const active=Object.keys(RO_SKILLS).filter(key=>RO_SKILLS[key].kind!=='passive').slice(0,15);for(const key of active)u.bonkBuild.weapons[key]=2;u.bonkWeaponAt[active[5]]=g.bonk.elapsed+10;assert.ok(g.command('p',{type:'bkEquipSkill',key:active[5],slot:2}));assert.equal(roActiveSkillKeys(u).length,13);assert.equal(g.snapshotBonk().weapons[2].key,active[5]);assert.equal(u.bonkWeaponAt[active[5]],g.bonk.elapsed+10);assert.ok(active.every(key=>u.bonkBuild.weapons[key]===2));assert.equal(g.command('p',{type:'bkEquipSkill',key:active[14],slot:0}),false);assert.equal(g.command('p',{type:'bkCast',key:active[14]}),false,'learned reserve skills cannot bypass the active-slot budget');
 const cp=createRoCheckpoint(g);assert.ok(cp);assert.deepEqual(validateRoCheckpoint(cp).hero.bonkBuild.weapons,u.bonkBuild.weapons);assert.deepEqual(cp.hero.bonkSkillSlots,u.bonkSkillSlots);const corrupt=structuredClone(cp);corrupt.hero.bonkSkillSlots[2]='not-learned';assert.equal(validateRoCheckpoint(corrupt),null);
});
test('cross-branch skills are offered before class evolution',()=>{
 const{u}=arena('imperialguard'),heal=RO_LINEAGES.imperialguard.skills.find(key=>RO_SKILLS[key].sourceAegis==='AL_HEAL');assert.ok(heal);assert.equal(roSkillOfferPool(u).some(c=>c.key===heal),true);advanceRoJob(u,1);assert.equal(roSkillOfferPool(u).some(c=>c.key===heal),true);
});
