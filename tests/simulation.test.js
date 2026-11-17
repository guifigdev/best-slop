import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';

test('purchases debit server gold and reject duplicates, insufficient funds, full slots and combat purchases',()=>{
 const g=new Game();g.addPlayer('p');const p=g.player('p');assert.equal(g.command('p',{type:'buy',skill:'heal'}),true);assert.equal(p.gold,500);assert.equal(g.command('p',{type:'buy',skill:'heal'}),false);p.gold=0;assert.equal(g.command('p',{type:'buy',skill:'bolt'}),false);p.gold=9999;for(const skill of ['bolt','chain','blizzard','summon','avatar'])g.command('p',{type:'buy',skill});assert.equal(p.skills.length,7);assert.equal(g.command('p',{type:'buy',skill:'critical'}),false);g.spawnWave();assert.equal(g.command('p',{type:'item',item:'blade'}),false);
});
test('spell targeting, mana and cooldown are authoritative',()=>{
 const g=new Game();g.addPlayer('p','mage');g.spawnWave();const p=g.player('p'),e=g.enemies(p)[0];e.x=p.x+2;e.z=p.z;const hp=e.hp;assert.equal(g.command('p',{type:'cast',slot:0,target:e.id}),true);assert.equal(e.hp,hp-110>0?hp-110:0);assert.equal(p.mana,475);assert.equal(g.command('p',{type:'cast',slot:0,target:e.id}),false);p.cooldowns.bolt=0;p.mana=0;assert.equal(g.command('p',{type:'cast',slot:0,target:e.id}),false);
});
test('non-finite coordinates, enemy ownership and forged abilities are rejected',()=>{
 const g=new Game();g.addPlayer('a');g.addPlayer('b');const a=g.player('a'),b=g.player('b');assert.equal(g.command('a',{type:'move',x:Infinity,z:0}),false);assert.equal(g.command('a',{type:'attack',target:b.id}),false);assert.equal(g.command('a',{type:'buy',skill:'doesnotexist'}),false);assert.equal(g.command('a',{type:'cast',slot:999}),false);assert.equal(a.hp,a.maxHp);
});
test('same seed and commands produce identical simulation',()=>{
 const a=new Game(42),b=new Game(42);for(const g of [a,b]){g.addPlayer('p','ranger');g.spawnWave();for(let i=0;i<600;i++)g.tick(1/30);}assert.deepEqual(a.snapshot(),b.snapshot());
});
test('complete ten waves and two duels without an eleventh wave',()=>{
 const g=new Game();g.addPlayer('p');let guard=0;while(g.phase!=='victory'&&guard++<30){g.timer=0;g.tick(1/30);for(const u of g.units)if(u.team===2)u.alive=false;g.tick(1/30);}assert.equal(g.phase,'victory');assert.equal(g.wave,10);assert.equal(g.duels,2);
});
test('capacity and late joins are bounded',()=>{const g=new Game();for(let i=0;i<4;i++)assert.equal(g.addPlayer(String(i)),true);assert.equal(g.addPlayer('5'),false);g.spawnWave();assert.equal(g.addPlayer('late'),false);});
