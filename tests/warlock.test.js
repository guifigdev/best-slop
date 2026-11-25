import {WARLOCK_POLISH} from '../shared/warlock-polish.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {WARLOCK_REFERENCE,WARLOCK_CHARACTERS,WARLOCK_SKILLS,wlSkillAt,wlSkillPrice,WARLOCK_MASTERIES,wlMasteryLevel,wlMasteryPrice} from '../shared/warlock-catalog.js';

const near=(a,b,e=1e-6)=>assert.ok(Math.abs(a-b)<e,`${a} ≠ ${b}`);
function setup(){const g=new Game(102,{mode:'warlock'});assert.equal(g.addPlayer('p','warlock'),true);assert.equal(g.addPlayer('q','heretic'),true);g.initWarlock();return{g,p:g.player('p'),q:g.player('q')};}
function battle(g){assert.equal(g.command('p',{type:'wlReady'}),true);assert.equal(g.command('q',{type:'wlReady'}),true);assert.equal(g.phase,'wave');const p=g.player('p'),q=g.player('q');Object.assign(p,{x:0,z:0,wlRegen:0});Object.assign(q,{x:5,z:0,wlRegen:0});return{p,q};}
function advance(g,seconds){for(let t=0;t<seconds-1e-8;t+=.025)g.tick(Math.min(.025,seconds-t));}

test('official Warlock1.02 identity and all four original caster stats are pinned independently from Custom Hero attributes',()=>{
 assert.equal(WARLOCK_REFERENCE.sha256,'04fa1696fbb988af2fd77f05178b601f7fe0b8bd15d57206ca3aa12ce3bf9cb8');assert.equal(WARLOCK_REFERENCE.bytes,4179116);assert.equal(Object.keys(WARLOCK_CHARACTERS).length,4);
 for(const [key,c]of Object.entries(WARLOCK_CHARACTERS)){const g=new Game(102,{mode:'warlock'});assert.equal(g.addPlayer('p',key),true);const u=g.player('p');assert.equal(u.maxHp,100);assert.equal(u.speed,210/64);assert.equal(u.damage,0);assert.equal(u.attributePoints,0);assert.deepEqual(u.skills,['S000',c.skill]);assert.equal(u.gold,20);}
});

test('native primary spell ranks, costs and column exclusivity are available to authoritative purchases',()=>{
 assert.equal(Object.values(WARLOCK_SKILLS).filter(s=>!s.browserExtension).length,30);assert.equal(Object.keys(WARLOCK_SKILLS).length,33);assert.equal(wlSkillAt('S000',1).damage,7);assert.equal(wlSkillAt('S000',1).cooldown,4.8);assert.equal(wlSkillAt('S000',1).missiles,1);assert.equal(wlSkillAt('S000',10).damage,11.5);assert.equal(wlSkillAt('S011',3).range,910/64);assert.equal(wlSkillAt('S002',1).damage,7);assert.equal(wlSkillAt('S002',1).cooldown,16.5);
 const {g,p}=setup();p.gold=100;assert.equal(g.command('p',{type:'wlBuy',skill:'S002'}),true);const gold=p.gold;assert.equal(g.command('p',{type:'wlBuy',skill:'S004'}),false);assert.equal(p.gold,gold);const price=wlSkillPrice(p,'S002');assert.equal(g.command('p',{type:'wlBuy',skill:'S002'}),true);assert.equal(p.gold,gold-price);assert.equal(p.skillLevels.S002,2);assert.equal(g.command('p',{type:'wlBuy',skill:'__proto__'}),false);
});

test('Fireball is one physical dodgeable projectile: damage happens on impact and contributes knockback',()=>{
 const {g}=setup(),{p,q}=battle(g);assert.equal(g.command('p',{type:'wlCast',skill:'S000',x:12,z:0}),true);assert.equal(g.warlock.projectiles.length,1);assert.equal(q.hp,100);advance(g,.1);assert.equal(q.hp,100);advance(g,.35);assert.equal(q.hp,93);assert.ok(q.wlVx>0);assert.ok(q.x>5);assert.equal(p.cooldowns.S000<4.8,true);assert.equal(g.command('p',{type:'wlCast',skill:'S000',x:10,z:0}),false);
 const other=setup();battle(other.g);other.g.player('q').z=3;other.g.command('p',{type:'wlCast',skill:'S000',x:12,z:0});advance(other.g,1.2);assert.equal(other.g.player('q').hp,100);assert.equal(other.g.warlock.projectiles.length,0);
});

test('Shield reflects a real missile back at its original caster instead of merely hiding damage',()=>{
 const {g,q}=setup();q.gold=100;assert.equal(g.command('q',{type:'wlBuy',skill:'S005'}),true);const {p}=battle(g);assert.equal(g.command('q',{type:'wlCast',skill:'S005'}),true);g.command('p',{type:'wlCast',skill:'S000',x:12,z:0});advance(g,.85);assert.equal(q.hp,100);assert.ok(p.hp<100);assert.ok(p.wlVx<0);
});

test('Meteor announces its area before impact, while Teleport uses its exact 770-native range and reduces momentum by twenty percent',()=>{
 const {g,p}=setup();p.gold=100;g.command('p',{type:'wlBuy',skill:'S008'});g.command('p',{type:'wlBuy',skill:'S011'});const {q}=battle(g);g.command('p',{type:'wlCast',skill:'S008',x:5,z:0});assert.equal(g.warlock.fields[0].warning,true);advance(g,.8);assert.equal(q.hp,100);q.z=6;advance(g,.21);assert.equal(q.hp,100);assert.equal(g.warlock.fields.filter(f=>f.family==='meteor').length,0);assert.equal(g.warlock.fields.filter(f=>f.family==='meteorFire').length,1);
 Object.assign(p,{x:0,z:0,wlVx:10,wlVz:0});assert.equal(g.command('p',{type:'wlCast',skill:'S011',x:29,z:0}),true);near(p.x,770/64);near(p.wlVx,8);
});

test('Scourge has its native seven-tenths windup and can be cancelled before self-damage and cooldown are consumed',()=>{
 const {g}=setup(),{p,q}=battle(g);q.x=2;assert.equal(g.command('p',{type:'wlCast',skill:'S001'}),true);advance(g,.3);assert.equal(p.hp,100);assert.equal(g.command('p',{type:'wlStop'}),true);advance(g,.5);assert.equal(p.hp,100);assert.equal(p.cooldowns.S001||0,0);g.command('p',{type:'wlCast',skill:'S001'});advance(g,.71);assert.equal(p.hp,90);assert.equal(q.hp,90);assert.ok(p.cooldowns.S001>0);
});

test('native passive item families share an inventory, upgrades and original incompatibilities; extra slots are research',()=>{
 const {g,p}=setup();p.gold=100;for(const item of ['boots','pendant','cape','helmet'])assert.equal(g.command('p',{type:'wlBuy',item}),true);assert.equal(p.inventory.length,4);assert.equal(p.speed,(210+18)/64);assert.equal(p.maxHp,105);assert.equal(g.command('p',{type:'wlBuy',item:'mask'}),false);assert.equal(g.command('p',{type:'wlBuy',upgrade:'inventory'}),true);assert.equal(p.inventorySlots,6);assert.equal(g.command('p',{type:'wlBuy',item:'blood_sword'}),true);const gold=p.gold;assert.equal(g.command('p',{type:'wlBuy',item:'aegis'}),false);assert.equal(p.gold,gold);assert.equal(p.skillLevels.S001,2);
});

test('lava inflicts nine HP per second, stone regenerates, and round purchases are forbidden during battle',()=>{
 const {g}=setup(),{p}=battle(g);Object.assign(p,{x:25,z:0});advance(g,1);near(p.hp,91);Object.assign(p,{x:0,z:0,wlRegen:.5});advance(g,1);near(p.hp,91.5);const gold=p.gold;assert.equal(g.command('p',{type:'wlBuy',item:'pendant'}),false);assert.equal(p.gold,gold);assert.match(g.commandFailureReason,/entre rodadas/);
});

test('round results hold for three seconds, retain purchases, reward everyone and permit a ready start afterwards',()=>{
 const {g,p,q}=setup();p.gold=100;g.command('p',{type:'wlBuy',skill:'S011'});const gold=p.gold;battle(g);q.alive=false;advance(g,.025);assert.equal(g.warlock.phase,'shop');assert.equal(g.phase,'preparation');assert.equal(p.score,1);assert.equal(p.gold,gold+10);assert.equal(q.gold,30);assert.ok(p.skills.includes('S011'));assert.equal(g.warlock.results.length,2);assert.equal(g.snapshot().warlock.round,1);
 assert.deepEqual(g.snapshot().warlock.lastResult,{round:1,at:g.time,winner:{owner:'p',name:p.name,character:'warlock'}});near(g.warlock.resultUntil-g.time,3);near(g.warlock.remaining,33);
 g.command('p',{type:'wlReady'});g.command('q',{type:'wlReady'});assert.equal(g.startWarlockRound(),false);advance(g,2.9);assert.equal(g.warlock.phase,'shop');assert.equal(g.warlock.round,1);advance(g,.11);assert.equal(g.warlock.phase,'battle');assert.equal(g.warlock.round,2);assert.equal(q.alive,true);assert.equal(p.skillLevels.S011,1);
});

test('the first shop lasts thirty seconds and later shops retain thirty seconds after the result reveal',()=>{
 const {g,p,q}=setup();assert.equal(g.warlock.round,0);near(g.warlock.remaining,30);assert.equal(p.ready,false);assert.equal(q.ready,false);advance(g,29.9);assert.equal(g.warlock.phase,'shop');advance(g,.11);assert.equal(g.warlock.phase,'battle');assert.equal(g.warlock.round,1);
 q.alive=false;advance(g,.025);const resultAt=g.time;advance(g,3);near(g.time-resultAt,3);near(g.warlock.remaining,30);assert.equal(g.warlock.phase,'shop');const price=wlSkillPrice(p,'S011'),gold=p.gold;assert.equal(g.command('p',{type:'wlBuy',skill:'S011'}),true);assert.equal(p.gold,gold-price);advance(g,29.9);assert.equal(g.warlock.phase,'shop');advance(g,.11);assert.equal(g.warlock.phase,'battle');assert.equal(g.warlock.round,2);assert.equal(p.skillLevels.S011,1);
});

test('eleven rounds produce final standings, ties and no additional market or round',()=>{
 for(const tied of [false,true]){const {g,p,q}=setup();for(let round=1;round<=11;round++){g.command('p',{type:'wlReady'});g.command('q',{type:'wlReady'});if(round>1)advance(g,3.01);assert.equal(g.warlock.phase,'battle');assert.equal(g.warlock.round,round);q.alive=false;if(tied)p.alive=false;g.finishWarlockRound();assert.equal(p.gold,20+10*round);assert.equal(q.gold,20+10*round);}
 assert.equal(g.phase,'victory');assert.equal(g.warlock.phase,'finished');assert.equal(g.warlock.lastResult.round,11);assert.equal(p.score,tied?0:11);assert.deepEqual(g.winningOwners,tied?['p','q']:['p']);assert.equal(g.snapshot().winner,'p');const before=g.warlock.round;advance(g,40);assert.equal(g.warlock.round,before);assert.equal(g.command('p',{type:'wlReady'}),false);assert.equal(g.command('p',{type:'wlBuy',skill:'S011'}),false);}
});

test('every purchasable native spell executes its family without nonfinite simulation state',()=>{
 for(const s of Object.values(WARLOCK_SKILLS).filter(s=>s.column!=='F')){
  const {g,p}=setup();p.gold=100;if(s.key!=='S000')assert.equal(g.command('p',{type:'wlBuy',skill:s.key}),true,s.key);battle(g);assert.equal(g.command('p',{type:'wlCast',skill:s.key,x:5,z:0}),true,s.key);advance(g,4);
  for(const u of g.units)for(const key of ['x','z','hp','wlVx','wlVz'])assert.ok(Number.isFinite(u[key]),`${s.key}/${key}`);
  assert.doesNotMatch(JSON.stringify(g.snapshot()),/NaN|Infinity/);
 }
});


test('public defaults are eleven rounds, twenty starting gold and ten gold to every participant without kill/win gold',()=>{
 const {g,p,q}=setup();assert.equal(WARLOCK_REFERENCE.rounds,11);assert.equal(g.warlock.maxRounds,11);assert.equal(WARLOCK_REFERENCE.goldPerRound,10);assert.equal(WARLOCK_REFERENCE.killGold,0);assert.equal(WARLOCK_REFERENCE.winGold,0);
 battle(g);q.hp=1;g.command('p',{type:'wlCast',skill:'S000',x:12,z:0});advance(g,.45);assert.equal(p.kills,1);assert.equal(p.gold,30);assert.equal(q.gold,30);assert.equal(p.score,1);
});

test('original mastery research prices grow per rank and combined research is atomic at individual caps',()=>{
 const {g,p}=setup();p.gold=1000;assert.deepEqual(Object.values(WARLOCK_MASTERIES).map(m=>m.rawId),['R00I','R00Y','R00D','R01E']);
 assert.equal(wlMasteryPrice(p,'duration'),4);assert.equal(wlMasteryPrice(p,'range'),5);assert.equal(wlMasteryPrice(p,'lifesteal'),6);assert.equal(wlMasteryPrice(p,'jack'),13);
 assert.equal(g.command('p',{type:'wlBuy',mastery:'jack'}),true);assert.equal(p.gold,987);assert.deepEqual(p.masteries,{duration:1,range:1,lifesteal:1});assert.equal(wlMasteryPrice(p,'jack'),16);assert.equal(wlMasteryPrice(p,'duration'),5);assert.equal(p.inventory.length,0);
 for(let i=0;i<5;i++)assert.equal(g.command('p',{type:'wlBuy',mastery:'duration'}),true);assert.equal(wlMasteryLevel(p,'duration'),6);
 const before=JSON.stringify(p.masteries),gold=p.gold;assert.equal(g.command('p',{type:'wlBuy',mastery:'duration'}),false);assert.equal(g.command('p',{type:'wlBuy',mastery:'jack'}),false);assert.equal(g.command('p',{type:'wlBuy',mastery:'__proto__'}),false);assert.equal(JSON.stringify(p.masteries),before);assert.equal(p.gold,gold);
 battle(g);assert.equal(g.command('p',{type:'wlBuy',mastery:'range'}),false);assert.equal(p.gold,gold);
});

test('masteries combine additively with helmet range penalties and multiply regeneration and knockback reduction',()=>{
 const {g,p}=setup();p.gold=100;g.command('p',{type:'wlBuy',item:'cape'});g.command('p',{type:'wlBuy',item:'helmet'});g.command('p',{type:'wlBuy',mastery:'jack'});
 near(p.wlRangeMultiplier,1);near(p.wlDurationMultiplier,1.08);near(p.wlRegen,.7*1.15);near(p.wlKnockbackMultiplier,.84*.925);
 g.command('p',{type:'wlBuy',mastery:'range'});near(p.wlRangeMultiplier,1.12);const stats={...p.masteries};g.command('p',{type:'wlSell',slot:1});near(p.wlRangeMultiplier,1.24);assert.deepEqual(p.masteries,stats);
 assert.equal(p.attributePoints,0);assert.equal(p.skillPoints,0);
});

test('range and duration mastery change actual spells, while lifesteal heals and recovers damage points on impact',()=>{
 const {g,p}=setup();p.gold=100;for(const mastery of ['range','duration','lifesteal'])assert.equal(g.command('p',{type:'wlBuy',mastery}),true);g.command('p',{type:'wlBuy',skill:'S002'});g.command('p',{type:'wlBuy',skill:'S005'});
 const {q}=battle(g);q.x=9.3;assert.equal(g.command('p',{type:'wlCast',skill:'S005'}),true);near(p.wlShieldUntil-g.time,2.8*1.08);
 p.hp=60;p.damagePoints=20;assert.equal(g.command('p',{type:'wlCast',skill:'S002',x:20,z:0}),true);near(q.hp,93);near(p.hp,60.7);near(p.damagePoints,19.65);
 // Teleport and Meteor have fixed native cast ranges, not projectile mastery range.
 const other=setup();other.p.gold=100;other.g.command('p',{type:'wlBuy',mastery:'range'});other.g.command('p',{type:'wlBuy',skill:'S011'});battle(other.g);other.g.command('p',{type:'wlCast',skill:'S011',x:29,z:0});near(other.p.x,770/64);
});
