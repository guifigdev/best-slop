import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';import {RO_LINEAGES} from '../shared/ragnarok-jobs.js';
import {roSurvivorEnemyBudget} from '../shared/ro-survivor-balance.js';import {roHordeSpawnPlan} from '../shared/ro-horde-spawns.js';import {RO_BEGINNER_MONSTERS} from '../shared/ro-beginner-field.js';
function setup(lineage='dragonknight'){const g=new Game(12,{mode:'bonk',bonkWorld:'dominion',bonkLineage:lineage});g.addPlayer('p',RO_LINEAGES[lineage].hero);g.command('p',{type:'bkReady'});return{g,u:g.player('p')};}
test('Prontera uses native entry HP and attack, slower pursuit and fixed requirements independent of hero level',()=>{
 for(const [key,native]of Object.entries(RO_BEGINNER_MONSTERS)){const budget=roSurvivorEnemyBudget({key,regionKey:'prontera'});assert.equal(budget.hp,native.hp);assert.equal(budget.damage,native.damage);assert.equal(budget.level,native.level);assert.ok(budget.speed<=3);assert.deepEqual(budget,roSurvivorEnemyBudget({key,regionKey:'prontera',progress:20,elapsed:900,level:150}));assert.ok(roSurvivorEnemyBudget({key,regionKey:'prontera',difficulty:'easy'}).hp<budget.hp);}
});
test('the entry rule does not weaken MVPs, guardians, elites, later regions or the Endless Tower',()=>{
 for(const extra of [{boss:true},{guardian:true},{elite:true},{activity:'tower'},{regionKey:'payon-forest'}]){const options={key:'poring',regionKey:'prontera',...extra},budget=roSurvivorEnemyBudget(options),normal=roSurvivorEnemyBudget({...options,regionKey:'payon-forest'});assert.deepEqual(budget,normal);assert.equal(budget.beginner,undefined);}
 assert.equal(roHordeSpawnPlan({regionKey:'prontera'}).elite,false);assert.equal(roHordeSpawnPlan({regionKey:'payon-forest'}).elite,true);
});
test('a real new adventure keeps its populated field but every initial and subsequent ordinary spawn is a beginner creature',()=>{
 const {g,u}=setup();assert.equal(g.units.filter(e=>e.bonkEnemy).length,24);assert.deepEqual(g.bonk.encounter.species,['poring','lunatic','fabre']);u.bonkBuild.weapons={};u.bonkSkillSlots=[];u.bonkInvulnerableUntil=1e9;g.bonk.bossUnlocked=false;g.bonk.objectives=[];for(let i=0;i<600;i++)g.tick(.05);const enemies=g.units.filter(e=>e.bonkEnemy&&e.alive);assert.ok(enemies.length>=36);assert.ok(enemies.every(e=>RO_BEGINNER_MONSTERS[e.dungeonSpecies]&&e.maxHp===RO_BEGINNER_MONSTERS[e.dungeonSpecies].hp&&!e.bonkElite&&e.damage===RO_BEGINNER_MONSTERS[e.dungeonSpecies].damage&&e.speed<=3));
});
test('fresh melee, bow and mage builds defeat a native Poring in a few basic attacks instead of needing a farmed build',()=>{
 for(const lineage of ['dragonknight','imperialguard','archmage','windhawk','shadowcross','cardinal']){const {g,u}=setup(lineage),e=g.units.find(e=>e.dungeonSpecies==='poring');u.bonkBuild.weapons={basic:1};u.bonkSkillSlots=['basic'];Object.assign(e,{x:u.x+1.5,z:u.z,speed:0,damage:0,bonkNextAttack:1e9});g.units=[u,e];g.bonk.map.obstacles=[];g.bonk.spawnAt=Infinity;g.bonk.bossUnlocked=false;g.bonk.objectives=[];g.random=()=>.5;g.tick(.05);assert.ok(e.alive,lineage+' needs more than one starting hit');let time=.05;while(e.alive&&time<6){g.tick(.05);time+=.05;}assert.equal(e.alive,false,lineage);assert.ok(time>=.5&&time<=5,lineage+' TTK '+time);}
});
