import {qualifiedRoTestHero} from './ro-qualified-fixture.js';
import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';import {createRoCheckpoint,validateRoCheckpoint} from '../shared/ragnarok-save.js';
import {createRoEquipment,roReceiveEquipment,roEquip,roCompactInventory} from '../shared/ragnarok-equipment.js';
import {applyRoEnchant,roEnchantLevels} from '../shared/ro-equipment-enchants.js';
test('three equipment enchants persist through save, restore, ground drop, pickup and replacement with no passive bonus while stored',()=>{
 const g=new Game(22,{mode:'bonk'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=qualifiedRoTestHero(g.player('p'),{}),id=u.roEquipment.weapon;for(const key of ['crit','area','magnet'])assert.ok(applyRoEnchant(u,key,id));assert.equal(applyRoEnchant(u,'damage',id),false);assert.equal(roEnchantLevels(u).crit,1);
 const cp=createRoCheckpoint(g);assert.ok(cp);assert.deepEqual(cp.hero.roInventory.find(i=>i.id===id).enchants,{crit:1,area:1,magnet:1});const next=new Game(23,{mode:'bonk'});next.addPlayer('p','knight');assert.ok(next.command('p',{type:'bkRestore',checkpoint:cp}));const v=next.player('p');assert.deepEqual(roEnchantLevels(v),{crit:1,area:1,magnet:1});assert.ok(next.command('p',{type:'bkDrop',itemId:id}));assert.equal(roEnchantLevels(v).crit,undefined);const p=next.bonk.pickups.find(p=>p.item?.id===id);assert.deepEqual(p.item.enchants,{crit:1,area:1,magnet:1});assert.ok(next.command('p',{type:'bkPickup',pickup:p.id}));assert.equal(roEnchantLevels(v).crit,undefined);assert.ok(next.command('p',{type:'bkEquip',itemId:id,slot:'weapon'}));assert.equal(roEnchantLevels(v).crit,1);
 const bad=structuredClone(cp);bad.hero.roInventory.find(i=>i.id===id).enchants.damage=1;assert.equal(validateRoCheckpoint(bad),null);for(const invalid of [{crit:9},{crit:0},{unknown:1},{crit:1.5}]){const forged=structuredClone(cp);forged.hero.roInventory[0].enchants=invalid;assert.equal(validateRoCheckpoint(forged),null);}
});
test('compaction never merges enchanted and plain gear or different enchantments',()=>{
 const u={roInventory:[{...createRoEquipment('knife','enchanted'),enchants:{crit:2}},createRoEquipment('knife','plain'),{...createRoEquipment('knife','other'),enchants:{area:2}}],roEquipment:{}};roCompactInventory(u);assert.equal(u.roInventory.length,3);roReceiveEquipment(u,{...createRoEquipment('knife','fourth'),enchants:{magnet:2}},{stack:true});assert.equal(u.roInventory.length,4);
});
