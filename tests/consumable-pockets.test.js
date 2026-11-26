import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {addConsumable,consumePouch,validateConsumables,RO_CONSUMABLE_SLOTS} from '../shared/consumables.js';
import {createRoCheckpoint,validateRoCheckpoint} from '../shared/ragnarok-save.js';
import {consumableDockMarkup} from '../src/consumable-dock.js';
test('two potion pockets enforce their own capacity, shared cooldown and real health or mana restoration',()=>{
 const u={alive:true,hp:10,maxHp:100,mana:0,maxMana:200,inventory:Array(6).fill({key:'sword'}),consumables:[null,null]};assert.ok(addConsumable(u,'potion'));assert.ok(addConsumable(u,'manapot'));assert.ok(addConsumable(u,'potion'));assert.ok(addConsumable(u,'potion'));assert.equal(addConsumable(u,'potion'),false);assert.equal(u.inventory.length,6);
 assert.equal(consumePouch(u,0,0,{survivor:true}).hp,30);assert.equal(u.hp,40);assert.equal(consumePouch(u,1,1),null);assert.equal(consumePouch(u,1,10,{survivor:true}).mana,70);assert.equal(u.consumables[1],null);assert.equal(consumePouch(u,-1,20),null);assert.equal(validateConsumables([{key:'potion',charges:100},null]),null);
});
test('Ragnarok potion pockets persist, reject invalid saves and stay outside equipment slots',()=>{
 const g=new Game(1,{mode:'bonk'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p');u.hp=1;const bag=structuredClone(u.roInventory);assert.ok(g.command('p',{type:'bkConsumable',slot:0}));assert.deepEqual(u.roInventory,bag);assert.ok(u.hp>1);assert.equal(g.command('p',{type:'bkConsumable',slot:1}),false);
 const cp=createRoCheckpoint(g);assert.deepEqual(cp.hero.consumables,u.consumables);cp.hero.consumables.push(null);assert.equal(validateRoCheckpoint(cp),null);assert.match(consumableDockMarkup(u,g.time,{survivor:true}),/data-consumable="1"/);
});
test('classic shop buys potions into the two pockets even with a full equipment inventory',()=>{
 const g=new Game(8,{mode:'campaign'});g.addPlayer('p','knight');const u=g.player('p');g.atShop=()=>true;g.stockFor=()=>({potion:99,manapot:99});u.inventory=Array.from({length:6},()=>({key:'sword',level:1,charges:1}));assert.ok(g.command('p',{type:'item',item:'potion'}));assert.ok(g.command('p',{type:'item',item:'manapot'}));assert.equal(u.inventory.length,6);assert.equal(u.consumables[0].key,'potion');u.hp=10;assert.ok(g.command('p',{type:'useConsumable',slot:0}));assert.equal(u.hp,310);
});

test('Ragnarok has six independent ten-charge stacks, migrated saves and a fruit that heals both HP and SP',()=>{
 const g=new Game(1,{mode:'bonk'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p');u.consumables=Array(RO_CONSUMABLE_SLOTS).fill(null);
 for(let i=0;i<60;i++)assert.ok(addConsumable(u,'yggberry'));assert.equal(addConsumable(u,'yggberry'),false);assert.equal(u.consumables[5].charges,10);
 u.hp=u.maxHp;u.mana=0;const used=consumePouch(u,5,10,{survivor:true});assert.ok(used);assert.equal(used.hp,0);assert.equal(u.mana,u.maxMana);assert.equal(u.consumables[5].charges,9);
 u.hp=1;assert.ok(consumePouch(u,5,20,{survivor:true}));assert.equal(u.hp,u.maxHp);assert.equal(consumePouch(u,5,30,{survivor:true}),null,'a full character cannot waste a fruit');
 const cp=createRoCheckpoint(g);assert.equal(cp.hero.consumables.length,6);assert.equal(validateRoCheckpoint(cp).hero.consumables[5].charges,8);cp.hero.consumables=[{key:'potion',charges:3},null];assert.equal(validateRoCheckpoint(cp).hero.consumables.length,6);
 assert.match(consumableDockMarkup(u,40,{survivor:true}),/data-consumable="5"/);assert.match(consumableDockMarkup(u,40,{survivor:true}),/Fruto de Yggdrasil/);
});
