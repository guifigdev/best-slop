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
 const common=roSurvivorEnemyBudget({key:'poring'}),heavy=roSurvivorEnemyBudget({key:'golem'}),elite=roSurvivorEnemyBudget({key:'poring',elite:true}),boss=roSurvivorEnemyBudget({key:'poring',boss:true});assert.ok(common.hp>=112);assert.ok(heavy.hp>common.hp);assert.ok(elite.hp>heavy.hp);assert.ok(boss.hp>elite.hp*5);assert.equal(common.damage,10,'ordinary contact damage remains much smaller than MVP damage');
 assert.ok(roSurvivorEnemyBudget({key:'poring',level:70,progress:4}).hp>common.hp*5);assert.ok(roSurvivorEnemyBudget({activity:'tower',level:150,progress:99}).speedScale<=1.35);assert.deepEqual(common,roSurvivorEnemyBudget({key:'poring',damage:999999,equipment:{attack:999999}}));
});
test('four offers always include class skills, and the alternative catalogue consumes one real improvement',()=>{
 const{g,u}=arena();assert.ok(roSkillOfferPool(u).some(c=>c.key==='basic'),'native basic upgrades are available from first class');for(let i=0;i<30;i++){let seed=i;const choices=drawRoSkillOffers(u,()=>((seed=seed*1664525+1013904223)>>>0)/4294967296);assert.equal(choices.length,4);assert.ok(choices.filter(c=>c.kind==='weapon').length>=2);assert.equal(new Set(choices.map(c=>c.kind+':'+c.key)).size,4);}
 g.bonk.pickups.push({id:g.id(),x:u.x,z:u.z,type:'xp',value:30,age:0});g.tick(.05);assert.ok(g.bonk.offer);const key=RO_LINEAGES[u.roLineage].skills.find(key=>!u.bonkBuild.weapons[key]&&RO_SKILLS[key].kind==='passive'&&roSkillIsCurated(RO_SKILLS[key])),pending=u.bonkPendingLevels;assert.ok(key);assert.ok(g.command('p',{type:'bkChooseSkill',key}));assert.equal(u.bonkBuild.weapons[key],1);assert.equal(u.bonkPendingLevels,pending-1);assert.equal(g.command('p',{type:'bkChooseSkill',key}),false,'no free learning outside an offered improvement');assert.ok(!roActiveSkillKeys(u).includes(key),'passives occupy no active slot');
});
test('skills stay learned outside four active slots, swap without cooldown resets and save all learning',()=>{
 const{g,u}=arena('shadowcross');advanceRoJob(u,3);const active=RO_LINEAGES.shadowcross.skills.filter(key=>RO_SKILLS[key].kind!=='passive').slice(0,7);for(const key of active)u.bonkBuild.weapons[key]=2;u.bonkWeaponAt[active[5]]=g.bonk.elapsed+10;assert.ok(g.command('p',{type:'bkEquipSkill',key:active[5],slot:2}));assert.equal(roActiveSkillKeys(u).length,4);assert.equal(g.snapshotBonk().weapons[2].key,active[5]);assert.equal(u.bonkWeaponAt[active[5]],g.bonk.elapsed+10);assert.ok(active.every(key=>u.bonkBuild.weapons[key]===2));assert.equal(g.command('p',{type:'bkEquipSkill',key:active[6],slot:0}),false);assert.equal(g.command('p',{type:'bkCast',key:active[6]}),false,'learned reserve skills cannot bypass the active-slot budget');
 const cp=createRoCheckpoint(g);assert.ok(cp);assert.deepEqual(validateRoCheckpoint(cp).hero.bonkBuild.weapons,u.bonkBuild.weapons);assert.deepEqual(cp.hero.bonkSkillSlots,u.bonkSkillSlots);const corrupt=structuredClone(cp);corrupt.hero.bonkSkillSlots[2]='not-learned';assert.equal(validateRoCheckpoint(corrupt),null);
});
test('cross-branch skills are offered before class evolution',()=>{
 const{u}=arena('imperialguard'),heal=RO_LINEAGES.imperialguard.skills.find(key=>RO_SKILLS[key].sourceAegis==='AL_HEAL');assert.ok(heal);assert.equal(roSkillOfferPool(u).some(c=>c.key===heal),true);advanceRoJob(u,1);assert.equal(roSkillOfferPool(u).some(c=>c.key===heal),true);
});
