import test from 'node:test';
import assert from 'node:assert/strict';
import {RO_EQUIPMENT,RO_CARDS,RO_LOOT_RATES,createRoEquipment,initializeRoInventory,roEquipmentBonuses,roEquip,roSocket,roDrop,rollRoLoot} from '../shared/ragnarok-equipment.js';
import {RAGNAROK_MVPS} from '../shared/ragnarok-mvp-catalog.js';
import {RO_BUILD_EQUIPMENT} from '../shared/ro-build-equipment.js';
import {RO_TOWER_CARDS,RO_TOWER_MVP_GEAR} from '../shared/ragnarok-tower-drops.js';
const make=(lineage='dragonknight')=>{const u={id:10,roTier:1,bonkAttack:'fixed-class-attack'};initializeRoInventory(u,lineage);return u;};
const add=(u,key,id=key)=>{const item=createRoEquipment(key,id);u.roInventory.push(item);return item;};
test('RO equipment catalogs are immutable, sourced, valid and create independent inventories',()=>{
 assert.equal(Object.keys(RO_EQUIPMENT).length,28+Object.keys(RO_TOWER_MVP_GEAR).length+Object.keys(RO_BUILD_EQUIPMENT).length);assert.equal(Object.keys(RO_CARDS).length,28+Object.keys(RO_TOWER_CARDS).length);assert.ok(Object.values(RO_CARDS).filter(c=>c.mvp).length>=16);
 for(const catalog of [RO_EQUIPMENT,RO_CARDS])for(const item of Object.values(catalog)){assert.equal(item.source,`https://www.divine-pride.net/database/item/${item.sourceId}`);assert.ok(Object.isFrozen(item.stats));}
 const a=make(),b=make();a.roInventory[0].cards.push({id:1,key:'fabre'});assert.equal(b.roInventory[0].cards.length,0);const ids=a.roInventory.map(i=>i.id);initializeRoInventory(a,'dragonknight');assert.deepEqual(a.roInventory.map(i=>i.id),ids);
 assert.equal(createRoEquipment('__proto__',1),null);assert.equal(createRoEquipment('constructor',1),null);assert.equal(createRoEquipment('knife',undefined),null);
});
test('Every class can equip any main weapon without changing class attacks; dual wield is Shadow Cross only',()=>{
 for(const lineage of ['dragonknight','imperialguard','archmage','elementalmaster','windhawk','troubadour','cardinal','inquisitor','meister','biolo','shadowcross','abysschaser']){
  const u=make(lineage),axe=add(u,'battleaxe'),dagger=add(u,'maingauche');assert.ok(roEquip(u,axe.id,'weapon'));assert.equal(u.bonkAttack,'fixed-class-attack');assert.equal(u.roEquipment.offhand,null);assert.equal(roEquip(u,dagger.id,'offhand'),false);
  assert.ok(roEquip(u,dagger.id,'weapon'));const second=add(u,'knife','second');assert.equal(roEquip(u,second.id,'offhand'),lineage==='shadowcross');
 }
});
test('Shield, dual wield and two-handed swaps preserve bag contents and cannot duplicate a weapon',()=>{
 const u=make('shadowcross'),shield=add(u,'buckler'),bow=add(u,'bow'),knife=u.roInventory[0];assert.ok(roEquip(u,shield.id,'offhand'));assert.ok(roEquip(u,bow.id,'weapon'));assert.equal(u.roEquipment.offhand,null);assert.equal(roEquip(u,shield.id,'offhand'),false);
 assert.ok(roEquip(u,knife.id,'weapon'));assert.ok(roEquip(u,shield.id,'offhand'));assert.ok(roEquip(u,knife.id,'offhand'));assert.equal(u.roEquipment.weapon,null);assert.equal(u.roEquipment.offhand,knife.id);assert.equal(u.roInventory.length,5);
});
test('Sockets consume a loose card once, respect slot and capacity, and stay permanently with dropped items',()=>{
 const u=make(),weapon=u.roInventory[0],armor=u.roInventory[1];u.roCards=[{id:'fabre1',key:'fabre'},{id:'poring1',key:'poring'},{id:'poring2',key:'poring'}];
 assert.equal(roSocket(u,'poring1',weapon.id),false);assert.equal(roSocket(u,'fabre1',armor.id),false);assert.ok(roSocket(u,'fabre1',weapon.id));assert.equal(roSocket(u,'fabre1',weapon.id),false);assert.ok(roSocket(u,'poring1',armor.id));assert.equal(roSocket(u,'poring2',armor.id),false);
 const stats=roEquipmentBonuses(u);assert.equal(stats.vit,1);assert.equal(stats.maxHp,10);assert.equal(stats.luk,2);
 assert.ok(roDrop(u,weapon.id));assert.equal(u.roEquipment.weapon,null);assert.deepEqual(weapon.cards,[{id:'fabre1',key:'fabre'}]);assert.equal(roEquipmentBonuses(u).vit,0);assert.ok(roDrop(u,'poring2'));assert.equal(roDrop(u,'missing'),false);
});
test('Injected item stats, invalid slots, duplicate pointers and excess cards cannot inflate bonuses',()=>{
 const u=make(),weapon=u.roInventory[0],armor=u.roInventory[1];weapon.stats={attack:1e9};weapon.cards=Array.from({length:20},(_,id)=>({id,key:'fabre'}));armor.cards=[{id:90,key:'constructor'}];u.roEquipment.offhand=weapon.id;u.roEquipment.accessory=weapon.id;
 const stats=roEquipmentBonuses(u);assert.equal(stats.attack,RO_EQUIPMENT[weapon.key].stats.attack);assert.equal(stats.vit,3);assert.equal(stats.maxHp,30);assert.equal(stats.armor,RO_EQUIPMENT[armor.key].stats.armor);
 assert.equal(roEquip(u,weapon.id,'__proto__'),false);assert.equal(roEquip(u,weapon.id,'armor'),false);
});
test('Rare card drops are monster-specific with exact normal and boss probability boundaries',()=>{
 const fixed=v=>()=>v;
 assert.deepEqual(rollRoLoot(fixed(0),'poring'),{kind:'card',key:'poring'});assert.equal(rollRoLoot(fixed(0),'unknown'),null);
 assert.deepEqual(rollRoLoot(fixed(RO_LOOT_RATES.card-.0000001),'fabre'),{kind:'card',key:'fabre'});
 assert.equal(rollRoLoot(fixed(.0005),'poring',{boss:true}).kind,'card');assert.equal(rollRoLoot(fixed(.005),'poring').kind,'equipment');
 assert.equal(rollRoLoot(fixed(RO_LOOT_RATES.card+RO_LOOT_RATES.equipment),'poring'),null);assert.equal(rollRoLoot(fixed(NaN),'poring'),null);assert.equal(rollRoLoot(fixed(1),'poring'),null);
 for(const mvp of RAGNAROK_MVPS){const drop=rollRoLoot(fixed(.0005),mvp.key,{boss:true});assert.equal(drop?.kind,'card');assert.ok(RO_CARDS[drop.key].mvp);assert.ok(RO_CARDS[drop.key].monsters.includes(mvp.key));}
});
