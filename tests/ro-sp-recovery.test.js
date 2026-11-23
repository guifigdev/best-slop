import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';import {bonkStats} from '../shared/bonk.js';
import {createRoEquipment,roEquip} from '../shared/ragnarok-equipment.js';
test('INT thresholds increase actual SP recovery per second, including intelligence from equipment',()=>{
 const g=new Game(13,{mode:'bonk',bonkLineage:'archmage'});g.addPlayer('p','mage');g.command('p',{type:'bkReady'});const u=g.player('p');g.units=[u];g.bonk.spawnAt=Infinity;g.bonk.ambientSeeded=true;u.bonkBuild.weapons={};u.roJobLevel=1;
 for(const [int,regen]of [[5,2],[6,2.8],[11,2.8],[12,3.6],[30,6]]){u.attributes.int=int;u.mana=0;assert.equal(bonkStats(u).manaRegen,regen);for(let i=0;i<20;i++)g.tick(.05);assert.ok(Math.abs(u.mana-regen)<1e-8,`${int} INT: ${u.mana} SP after one second`);}
 u.attributes.int=11;u.roInventory.push(createRoEquipment('staff','qa-staff'));assert.ok(roEquip(u,'qa-staff','weapon'));assert.equal(bonkStats(u).attributes.int,12);assert.equal(bonkStats(u).manaRegen,3.6);
});
