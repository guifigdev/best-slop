import {qualifiedRoTestHero} from './ro-qualified-fixture.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {roLoseBagOnDeath} from '../shared/ro-death-inventory.js';
import {initializeRoInventory,createRoEquipment,roEquip} from '../shared/ragnarok-equipment.js';
import {Game} from '../shared/simulation.js';
import {createRoCheckpoint} from '../shared/ragnarok-save.js';

test('death destroys all bag copies and pending items, preserving equipped pieces, cards, enchants and account warehouse',()=>{
 const u={id:1,roTier:1};initializeRoInventory(u,'shadowcross');const sword=createRoEquipment('sword','sword');sword.quantity=4;sword.cards=[{id:'c',key:'fabre'}];sword.enchants={crit:3};u.roInventory.push(sword);roEquip(u,sword.id,'weapon');u.roInventory.push(createRoEquipment('bow','bag'));u.roUnclaimed=[createRoEquipment('rod','pending')];u.roCards=[{id:'loose',key:'poring'}];u.roWarehouse={version:1,revision:2,items:[createRoEquipment('mace','warehouse')]};const warehouse=structuredClone(u.roWarehouse),equipped=u.roEquipment.weapon;
 const lost=roLoseBagOnDeath(u);assert.ok(lost>=5);assert.ok(u.roInventory.every(i=>Object.values(u.roEquipment).includes(i.id)));assert.equal(u.roInventory.find(i=>i.id===equipped).quantity,undefined);assert.deepEqual(u.roInventory.find(i=>i.id===equipped).cards,sword.cards);assert.deepEqual(u.roInventory.find(i=>i.id===equipped).enchants,sword.enchants);assert.deepEqual(u.roWarehouse,warehouse);assert.deepEqual(u.roUnclaimed,[]);assert.deepEqual(u.roCards,[]);assert.deepEqual(u.consumables,[null,null]);
});
test('a lethal authoritative monster contact empties the bag before the death checkpoint is saved',()=>{
 const g=new Game(617,{mode:'bonk'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=qualifiedRoTestHero(g.player('p'),{}),enemy=g.units.find(e=>e.bonkEnemy),bag=createRoEquipment('knife','lose-on-death');u.roInventory.push(bag);Object.assign(u,{hp:1,bonkInvulnerableUntil:0});Object.assign(enemy,{x:u.x+.2,z:u.z,damage:10000,speed:0,bonkNextAttack:Infinity,bonkNextSpecial:Infinity,collisionRadius:.32});g.units=[u,enemy];g.random=()=>.99;g.tick(.05);assert.equal(u.alive,false);assert.equal(u.roDeathCount,1);assert.ok(!u.roInventory.some(i=>i.id===bag.id));const checkpoint=createRoCheckpoint(g);assert.ok(checkpoint);assert.ok(!checkpoint.hero.roInventory.some(i=>i.id===bag.id));assert.equal(checkpoint.hero.roInventory.length,2);
});
