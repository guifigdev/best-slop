import test from 'node:test';
import assert from 'node:assert/strict';
import {RO_BASE_MOVE_SPEED,roMonsterMoveSpeed} from '../shared/ro-movement-scale.js';
import {MONSTER_HABITATS} from '../shared/ragnarok-habitats.js';
import {RO_MONSTER_WALK_MS} from '../shared/ro-monster-walk-data.js';
import {roSurvivorEnemyBudget} from '../shared/ro-survivor-balance.js';
import {Game} from '../shared/simulation.js';
import {bonkStats} from '../shared/bonk.js';
import {roDefenseDamage} from '../shared/ro-monster-properties.js';
import {RO_CONTACT_DAMAGE,RO_CONTACT_KNOCKBACK,roContactKnockback} from '../shared/ro-contact-combat.js';
import {stepRoMotion} from '../shared/ro-locomotion.js';
import {stepPredictedMotion} from '../src/movement-rollback.js';

test('native pursuit preserves Poring, Lunatic, Willow and MVP ratios to an unbuffed player',()=>{
 for(const [key,ratio] of [['poring',.375],['lunatic',.75],['willow',.75],['mistress',1.5],['ifrit',150/130]]){
  const budget=roSurvivorEnemyBudget({key,boss:['mistress','ifrit'].includes(key)});
  assert.equal(budget.speed/RO_BASE_MOVE_SPEED,ratio,key);
  assert.equal(budget.speed,roSurvivorEnemyBudget({key,boss:['mistress','ifrit'].includes(key),progress:20,level:150}).speed,'levelling does not accelerate pursuit');
 }
 assert.equal(roSurvivorEnemyBudget({key:'mandragora'}).speed,0);
 assert.equal(roMonsterMoveSpeed(-1,{fallback:3.4}),3.4);
 assert.equal(roSurvivorEnemyBudget({key:'poring',sourceId:1059}).speed,7.5,'explicit native phase identity overrides the visual species');
});

test('every native habitat has a finite positive movement delay and presets rescale existing and new enemies equally',()=>{
 for(const entry of Object.values(MONSTER_HABITATS))if(entry.sourceId)assert.ok(RO_MONSTER_WALK_MS[entry.sourceId]>0,entry.sourceId);
 const g=new Game(12,{mode:'bonk',bonkWorld:'dominion'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});
 for(const difficulty of ['easy','hard','normal']){
  assert.ok(g.command('p',{type:'bkDifficulty',difficulty}));
  for(const e of g.units.filter(e=>e.bonkEnemy))assert.ok(Math.abs(e.speed-roSurvivorEnemyBudget({key:e.dungeonSpecies,regionKey:'prontera',difficulty}).speed)<1e-10);
 }
});

test('entry hits reach the hero after real defence, remain survivable, and later enemies hit harder',()=>{
 const hits=[];
 for(const key of ['poring','lunatic','fabre']){
  const g=new Game(617,{mode:'bonk',bonkWorld:'dominion'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p'),budget=roSurvivorEnemyBudget({key,regionKey:'prontera'});
  Object.assign(g.bonk,{spawnAt:Infinity,bossSpawned:true,objectives:[],pickups:[],bossUnlocked:false});g.bonk.map.obstacles=[];u.bonkBuild.weapons={};u.bonkInvulnerableUntil=0;
  const e={id:g.id(),bonkEnemy:true,alive:true,team:100,x:u.x+.3,z:u.z,hp:1e6,maxHp:1e6,damage:budget.damage,speed:0,interval:1.3,bonkNextAttack:Infinity,bonkNextSpecial:Infinity,dungeonSpecies:key};g.units=[u,e];g.random=()=>.99;
  const hp=u.hp,stats=bonkStats(u),expected=roDefenseDamage(budget.damage*RO_CONTACT_DAMAGE*.8,stats.armor-stats.nativeGrowth.softDefense,stats.nativeGrowth.softDefense);
  g.tick(.05);const dealt=hp-u.hp;assert.ok(Math.abs(dealt-expected)<1e-8);assert.ok(dealt>2&&dealt<u.maxHp*.05,key+' remains a gentle entry hit');assert.equal(u.roContactPush.remaining,.55);hits.push(dealt);
  assert.ok(roSurvivorEnemyBudget({key,regionKey:'payon-forest',progress:1}).damage>budget.damage*3);
 }
 assert.ok(hits[0]<hits[1]&&hits[1]<hits[2]);
});

test('the slightly longer recoil is smooth, bounded, collision-aware and independent of tick size',()=>{
 const map={obstacles:[]};
 for(const dt of [1/60,.05,.1]){
  const u={x:0,z:0,facing:1.2,speed:5,collisionRadius:.45};roContactKnockback(u,{x:1,z:0});let time=0,previous=0;
  while(u.roContactPush){time+=dt;stepRoMotion(map,u,time,dt);assert.ok(Math.abs(u.x-previous)<=RO_CONTACT_KNOCKBACK.distance/RO_CONTACT_KNOCKBACK.duration*dt+1e-8);previous=u.x;}
  assert.ok(Math.abs(u.x+.55)<1e-8);assert.equal(u.z,0);assert.equal(u.facing,1.2);
 }
 const u={x:0,z:0,facing:0,speed:5,collisionRadius:.45};roContactKnockback(u,{x:1,z:0});
 for(let i=0;i<5;i++)stepRoMotion({obstacles:[{x:-.6,z:0,w:.5,d:4}]},u,i*.05,.05);
 assert.ok(u.x>-.55,'recoil cannot pass through a wall');
});

test('client movement replay and the server apply the same longer recoil without a position correction',()=>{
 const g=new Game(617,{mode:'bonk'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p');g.units=[u];u.bonkBuild.weapons={};g.bonk.map.obstacles=[];Object.assign(g.bonk,{spawnAt:Infinity,bossSpawned:true,objectives:[],pickups:[]});
 roContactKnockback(u,{x:u.x+1,z:u.z});const state=g.snapshotFor('p'),predicted=structuredClone(state.units.find(v=>v.id===u.id));
 for(let i=1;i<=5;i++){g.tick(.05);stepPredictedMotion(state,predicted,state.time+i*.05,.05);assert.ok(Math.abs(u.x-predicted.x)<1e-8);assert.ok(Math.abs(u.z-predicted.z)<1e-8);}
 assert.equal(predicted.roContactPush,undefined);
});
