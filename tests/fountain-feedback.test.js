import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {overlayPausesGame,fountainRecoveryText} from '../src/overlay-policy.js';

test('Line Wars shops keep the battle and fountain healing running while preparation and guide overlays retain pause',()=>{
 const g=new Game(81,{mode:'linewars'});g.addPlayer('a');g.addPlayer('b');g.initLineWars();const hero=g.player('a'),f=g.lineWars.lanes[0].fountain;
 Object.assign(hero,{x:f.x,z:f.z,hp:100,mana:0});const before={hp:hero.hp,mana:hero.mana};
 assert.equal(overlayPausesGame(g.snapshot(),{shop:true}),false);g.tick(1);assert.ok(hero.hp>before.hp);assert.ok(hero.mana>before.mana);assert.match(fountainRecoveryText(hero),/Fonte recuperando/);assert.match(fountainRecoveryText(hero),/Vida/);
 assert.equal(overlayPausesGame(g.snapshot()),true);assert.equal(overlayPausesGame({options:{mode:'linewars'},phase:'preparation'},{shop:true}),true);assert.equal(overlayPausesGame({options:{mode:'survival'},phase:'wave'},{shop:true}),true);
 hero.hp=hero.maxHp;hero.mana=hero.maxMana;hero.fountainHealing=hero.fountainMana=false;assert.match(fountainRecoveryText(hero),/Vida e mana recuperadas/);
});
