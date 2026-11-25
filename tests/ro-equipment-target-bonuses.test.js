import test from 'node:test';
import assert from 'node:assert/strict';
import {RO_EQUIPMENT,initializeRoInventory,createRoEquipment,roEquip,roEquipmentBonuses,roCompatibleSlots} from '../shared/ragnarok-equipment.js';
import {RO_MONSTER_PROPERTIES} from '../shared/ro-monster-properties-data.js';
import {roEquipmentTargetMultiplier,roEquipmentSourceResistance} from '../shared/ro-equipment-target-bonuses.js';
import {ragnarokJobSpec} from '../src/ragnarok-job-art.js';
import {roEquipmentComparisonMarkup} from '../src/ro-equipment-bag-ui.js';
import {Game} from '../shared/simulation.js';
import {bonkStats} from '../shared/bonk.js';
import {roMonsterDamageMultiplier,roDefenseDamage} from '../shared/ro-monster-properties.js';
const monster=predicate=>({roSourceId:Number(Object.keys(RO_MONSTER_PROPERTIES).find(id=>predicate(RO_MONSTER_PROPERTIES[id])))});
const human=monster(p=>p.race==='Humano'),plant=monster(p=>p.race==='Planta');
test('Infiltrator imports its native humanoid damage, DEF and dodge; physical and magical modifiers stay distinct',()=>{
 const d=RO_EQUIPMENT.build_1266;assert.deepEqual(d.raceDamage,{demihuman:.5,human:.5});assert.equal(d.stats.armor,3);assert.equal(d.stats.flee,5);assert.equal(d.stats.perfectEvasion,.02);
 assert.equal(roEquipmentTargetMultiplier(d,human),1.5);assert.equal(roEquipmentTargetMultiplier(d,human,'magic'),1);assert.equal(roEquipmentTargetMultiplier(d,plant),1);
 assert.ok(roEquipmentComparisonMarkup({roInventory:[],roEquipment:{}},{id:'x',key:'build_1266'}).includes('Dano físico contra Humanoide +50%'));
});
test('race, target property, size and elemental spell power remain independent groups, including negative bonuses',()=>{
 const e=monster(p=>p.race==='Planta'&&p.element==='water'),p=RO_MONSTER_PROPERTIES[e.roSourceId],d={raceDamage:{plant:.2,all:.05},targetElementDamage:{water:.3},sizeDamage:{[p.size]:.1},magicRaceDamage:{plant:.4},magicTargetElementDamage:{water:.2},elementalPower:{fire:9}};
 assert.equal(roEquipmentTargetMultiplier(d,e),1.25*1.3*1.1);assert.equal(roEquipmentTargetMultiplier(d,e,'magic'),1.4*1.2);assert.equal(roEquipmentTargetMultiplier(d,e,'misc'),1);
 assert.equal(roEquipmentTargetMultiplier({raceDamage:{plant:-.2}},e),.8);assert.equal(roEquipmentSourceResistance({raceResistance:{plant:.2},sizeResistance:{[p.size]:.1}},e),.8*.9);
 assert.equal(RO_EQUIPMENT.build_26151.magicTargetElementDamage.earth,.05);assert.equal(RO_EQUIPMENT.build_2051.magicSizeDamage.small,.15,'refine-gated numerical bonuses work at +0');
});
test('Mercenary evolutions equip two real weapons; all other branches equip one-handed weapon and shield',()=>{
 for(const lineage of ['shadowcross','dragonknight','archmage','windhawk','meister','abysschaser'])for(const tier of [0,1,2,3]){
  const u={id:'u',roTier:tier,bonkJob:lineage==='shadowcross'?'assassin':'knight'};initializeRoInventory(u,lineage);const sword=createRoEquipment('sword','right'),knife=createRoEquipment('knife','left'),shield=createRoEquipment('buckler','shield');u.roInventory.push(sword,knife,shield);assert.ok(roEquip(u,sword.id,'weapon'));assert.ok(roEquip(u,shield.id,'offhand'));assert.ok(ragnarokJobSpec(u).features.includes('left-shield'));
  const dual=lineage==='shadowcross'&&tier>=1;assert.equal(roCompatibleSlots(u,knife).includes('offhand'),dual);assert.equal(roEquip(u,knife.id,'offhand'),dual);
  if(dual){assert.equal(roEquipmentBonuses(u).attack,RO_EQUIPMENT.sword.stats.attack+RO_EQUIPMENT.knife.stats.attack);assert.ok(ragnarokJobSpec(u).features.includes('left-dagger'));}
  const bow=createRoEquipment('bow','bow');u.roInventory.push(bow);assert.ok(roEquip(u,bow.id,'weapon'));assert.equal(u.roEquipment.offhand,null);assert.equal(roEquip(u,shield.id,'offhand'),false);assert.ok(!ragnarokJobSpec(u).features.includes('left-shield'));
 }
});
test('authoritative physical hit includes the humanoid equipment multiplier before reporting damage',()=>{
 const g=new Game(17,{mode:'bonk'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p'),e=g.units.find(e=>e.bonkEnemy),weapon=createRoEquipment('build_1266','test-infiltrator');u.roInventory.push(weapon);assert.ok(roEquip(u,weapon.id,'weapon'));g.random=()=>0;
 Object.assign(e,{...human,hp:1e7,maxHp:1e7,armor:0,x:u.x+1,z:u.z});g.units=[u,e];g.effects=[];g.command('p',{type:'bkCast',key:'basic'});const withBonus=g.effects.find(f=>f.type==='damage'&&f.target===e.id)?.amount;assert.ok(withBonus>0);
 // Same attack against an unknown neutral body provides the unmodified budget.
 e.roSourceId=999999;u.bonkNextAttack=0;u.bonkAttackAt=0;u.bonkCooldowns={};g.bonk.elapsed+=10;g.time+=10;g.effects=[];g.command('p',{type:'bkCast',key:'basic'});const normal=g.effects.find(f=>f.type==='damage'&&f.target===e.id)?.amount;assert.ok(normal>0);
 const s=bonkStats(u),p=RO_MONSTER_PROPERTIES[human.roSourceId],factor=roDefenseDamage(1,p.defense)*roMonsterDamageMultiplier(human,'neutral',{physical:true,weaponType:'katar'})*1.5;assert.ok(Math.abs(withBonus-normal*factor)<2,JSON.stringify({withBonus,normal,factor,crit:s.crit}));
});
