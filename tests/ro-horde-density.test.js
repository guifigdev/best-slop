import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {BONK_RULES} from '../shared/bonk-catalog.js';
import {RO_HORDE_SPAWN_RULES as R,roHordeSpawnPlan} from '../shared/ro-horde-spawns.js';
import {createRoCheckpoint} from '../shared/ragnarok-save.js';
const alive=g=>g.units.filter(e=>e.bonkEnemy&&e.alive);
function setup(seed=52,activity='adventure'){const g=new Game(seed,{mode:'bonk',bonkWorld:'dominion',bonkLineage:'dragonknight',bonkActivity:activity});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p');u.bonkBuild.weapons={};u.bonkSkillSlots=[];return{g,u};}
function synthetic(template,g,count){return Array.from({length:count},(_,i)=>({...template,id:g.id(),x:g.player('p').x+Math.sin(i*2.399)*20,z:g.player('p').z+Math.cos(i*2.399)*20,hp:1e9,maxHp:1e9,speed:0,damage:0,bonkNextAttack:Infinity,bonkNextSpecial:Infinity}));}

test('normal regions open with twenty-four real biome monsters in distinct safe pairs',()=>{
 for(const seed of [52,381,913]){const{g,u}=setup(seed),monsters=alive(g);assert.equal(monsters.length,R.opening);assert.ok(monsters.every(e=>g.bonk.encounter.species.includes(e.dungeonSpecies)));assert.ok(monsters.every(e=>Math.hypot(e.x-u.x,e.z-u.z)>=R.minimumSafeDistance));assert.equal(new Set(monsters.map(e=>e.x.toFixed(2)+','+e.z.toFixed(2))).size,monsters.length);assert.ok(monsters.every(e=>Math.abs(e.x)<110&&Math.abs(e.z)<110));assert.equal(g.bonk.spawnSerial,0);}
});

test('region encounters have a denser bounded population while cadence and cap rise with progression',()=>{
 for(const progress of [0,1,3,7,11])for(const elapsed of [0,30,120,600]){const p=roHordeSpawnPlan({elapsed,progress,aliveBudget:BONK_RULES.aliveBudget});assert.ok(p.cap>=72&&p.cap<=120);assert.equal(p.pack,6);assert.ok(p.interval>=1.3);}
 const{g,u}=setup();for(let i=0;i<200;i++){u.hp=u.maxHp;g.tick(.05);}assert.ok(alive(g).length>=36&&alive(g).length<=72);
});

test('one tick spawns no more than one six-monster pack and never catches up multiple missed waves',()=>{
 const{g,u}=setup();g.units=[u];g.bonk.spawnAt=0;g.tick(9);assert.equal(alive(g).length,R.maxPerTick);g.bonk.spawnAt=-100;const before=alive(g).length;g.tick(.1);assert.equal(alive(g).length-before,R.maxPerTick);assert.ok(g.bonk.spawnAt>g.bonk.elapsed);
});

test('both a full active horde and the smaller post-MVP population respect their remaining room exactly',()=>{
 for(const cleared of [false,true]){const{g,u}=setup(),template=alive(g)[0],cap=cleared?R.ambientCap:roHordeSpawnPlan().cap;g.units=[u,...synthetic(template,g,cap-1)];g.bonk.routeBossDefeated=cleared;g.bonk.ambientSeeded=cleared;g.bonk.spawnAt=0;g.tick(.05);assert.equal(alive(g).length,cap);g.bonk.spawnAt=0;g.tick(.05);assert.equal(alive(g).length,cap);assert.ok(alive(g).every(e=>!e.bonkBoss&&e.bonkGuardian===undefined));}
});

test('defeating the actual MVP repopulates a cleared region, preserves ordinary drops and never repeats bosses or guardians',()=>{
 const{g,u}=setup(),arena=g.bonk.route.bossArena;Object.assign(u,arena);g.tick(.05);const boss=alive(g).find(e=>e.bonkBoss);assert.ok(boss);boss.x=u.x+2;boss.z=u.z;boss.hp=1;g.random=()=>0;u.bonkBuild.weapons={basic:1};u.bonkSkillSlots=['basic',null,null,null];u.bonkSkillAuto={basic:false};assert.ok(g.command('p',{type:'bkCast',key:'basic'}));
 for(let i=0;i<20&&g.bonk.offer;i++)assert.ok(g.command('p',{type:'bkChoose',choiceId:g.bonk.offer.choices[0].id}));g.tick(.05);assert.equal(g.bonk.routeBossDefeated,true);assert.equal(g.bonk.clearedStages.length,1);assert.equal(alive(g).length,R.ambientOpening);assert.ok(alive(g).every(e=>!e.bonkBoss&&!e.bonkElite&&e.bonkGuardian===undefined));
 const enemy=alive(g)[0],rewards=g.bonk.rewardKills.length;Object.assign(u,{x:enemy.x-2,z:enemy.z});enemy.hp=1;u.bonkWeaponAt.basic=0;u.roSkillActionUntil=0;u.roAfterCastUntil=0;assert.ok(g.command('p',{type:'bkCast',key:'basic'}));assert.ok(g.bonk.pickups.some(p=>p.type==='xp'&&p.value===3));assert.ok(g.bonk.pickups.some(p=>p.type==='gold'&&p.value===1));assert.equal(g.bonk.rewardKills.length,rewards+1,'ordinary ambient kills remain eligible for permanent card drops');
 for(const landmark of g.bonk.objectives){Object.assign(u,{x:landmark.x,z:landmark.z});u.bonkBuild.weapons={};u.bonkSkillSlots=[];g.tick(.05);}assert.ok(alive(g).every(e=>!e.bonkBoss&&e.bonkGuardian===undefined));assert.equal(g.bonk.clearedStages.length,1);
 u.bonkBuild.weapons={basic:1};u.bonkSkillSlots=['basic',null,null,null];u.bonkSkillAuto={basic:false};const cp=createRoCheckpoint(g);assert.ok(cp);const resumed={g:new Game(7,{mode:'bonk',bonkWorld:'dominion',bonkLineage:'dragonknight'})};resumed.g.addPlayer('p','knight');assert.ok(resumed.g.command('p',{type:'bkRestore',checkpoint:cp}));assert.equal(resumed.g.bonk.routeBossDefeated,true);assert.equal(alive(resumed.g).length,R.ambientOpening);assert.ok(alive(resumed.g).every(e=>!e.bonkBoss&&e.bonkGuardian===undefined));
});

test('post-MVP cadence is calmer and the original Endless Tower queue and eight-unit entry batch stay intact',()=>{
 const calm=roHordeSpawnPlan({cleared:true});assert.equal(calm.interval,3);assert.equal(calm.cap,48);assert.equal(calm.elite,false);const{g}=setup(52,'tower'),total=g.bonk.floorTotal;assert.equal(alive(g).length,0);g.tick(.05);assert.equal(alive(g).length,8);assert.equal(g.bonk.towerQueue.length+alive(g).length,total);assert.ok(g.bonk.towerQueue.every(e=>Number.isInteger(e.sourceId)));
});
