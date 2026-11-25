import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {bonkStats} from '../shared/bonk.js';
import {roBuildEquipmentPool,roBuildEquipmentUnlockLevel} from '../shared/ro-build-loot.js';
import {RO_BUILD_EQUIPMENT} from '../shared/ro-build-equipment.js';
import {roSurvivorEnemyBudget} from '../shared/ro-survivor-balance.js';

test('eight earned enchant ranks cannot grant endgame attack speed or forty percent free critical chance',()=>{
 const g=new Game(12,{mode:'bonk'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p'),initial=bonkStats(u),item=u.roInventory.find(i=>i.id===u.roEquipment.weapon);
 for(let rank=1;rank<=8;rank++){
  item.enchants={haste:rank,crit:rank};const stats=bonkStats(u);
  assert.ok(Math.abs(stats.attackDelay-initial.attackDelay*(1-rank*.03))<1e-9);
  assert.ok(Math.abs(stats.crit-rank*.015)<1e-9);assert.ok(stats.aspd<170);
 }
 const equipped=bonkStats(u);u.roEquipment.weapon=null;assert.equal(bonkStats(u).crit,0);
 u.roEquipment.weapon=item.id;u.level=50;u.attributes.agi=70;u.attributes.dex=30;
 assert.ok(bonkStats(u).aspd>equipped.aspd,'invested attributes still improve the real interval');
});

test('opening rewards exclude advanced database equipment, which becomes available after progression',()=>{
 const fresh=roBuildEquipmentPool({level:1}),late=roBuildEquipmentPool({level:100},15);
 assert.ok(fresh.length>0);assert.ok(fresh.every(p=>roBuildEquipmentUnlockLevel(RO_BUILD_EQUIPMENT[p.key])===1));
 assert.ok(late.some(p=>roBuildEquipmentUnlockLevel(RO_BUILD_EQUIPMENT[p.key])>=60));
});

test('fewer enemies have more individual threat without scaling against the current hero',()=>{
 const common=roSurvivorEnemyBudget({key:'poring'}),boss=roSurvivorEnemyBudget({key:'poring',boss:true});
 assert.ok(common.damage>50);assert.ok(common.hp>=150);assert.ok(boss.damage>140);assert.ok(boss.hp>10000);
 assert.deepEqual(common,roSurvivorEnemyBudget({key:'poring',level:150,damage:1e9,equipment:{haste:100}}));
 const g=new Game(12,{mode:'bonk'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p'),e=g.units.find(v=>v.bonkEnemy);
 Object.assign(e,{x:u.x+.3,z:u.z,damage:common.damage,speed:0,bonkNextAttack:Infinity,bonkNextSpecial:Infinity});u.bonkInvulnerableUntil=0;u.bonkBuild.weapons={};g.units=[u,e];g.bonk.spawnAt=Infinity;g.bonk.objectives=[];const before=u.hp;g.tick(.05);
 assert.ok(before-u.hp>25,'one unprotected contact makes a visible dent in starting HP');
});
