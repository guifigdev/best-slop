import test from 'node:test';import assert from 'node:assert/strict';
import {RO_BUILD_EQUIPMENT,RO_BUILD_EQUIPMENT_LINEAGES} from '../shared/ro-build-equipment.js';
import {RO_EQUIPMENT,RO_EQUIPMENT_SLOTS,roEquipmentBonuses,createRoEquipment} from '../shared/ragnarok-equipment.js';
import {roChestEquipmentPool} from '../shared/ro-chest-loot.js';
import {roBuildEquipmentPool,roEquipmentGrade} from '../shared/ro-build-loot.js';
test('verified build catalog covers all twelve lineages with genuine source identities and scaled bonuses',()=>{
 assert.ok(Object.keys(RO_BUILD_EQUIPMENT).length>=135);const ids=new Set();for(const d of Object.values(RO_BUILD_EQUIPMENT)){assert.ok(!ids.has(d.sourceId));ids.add(d.sourceId);assert.equal(RO_EQUIPMENT[d.key],d);assert.ok(RO_EQUIPMENT_SLOTS.includes(d.slot));assert.match(d.identitySource,/rathena.*item_db_equip/);assert.ok(d.sockets>=0&&d.sockets<=4);assert.ok(Object.isFrozen(d.stats));assert.ok((d.stats.attack||0)<=32);assert.ok((d.stats.matk||0)<=30);}
 for(const lineage of RO_BUILD_EQUIPMENT_LINEAGES){assert.ok(Object.values(RO_BUILD_EQUIPMENT).filter(d=>d.slot==='weapon'&&d.lineages.includes(lineage)).length>=5);const first=roBuildEquipmentPool({level:1,roLineage:lineage}),late=roChestEquipmentPool({level:40,roLineage:lineage},8,{weaponOnly:true});assert.ok(first.length>0&&first.every(p=>RO_EQUIPMENT[p.key].minStage>=2));assert.ok(late.some(p=>RO_EQUIPMENT[p.key].grade===3));assert.ok(late.every(p=>!RO_EQUIPMENT[p.key].lineages||RO_EQUIPMENT[p.key].lineages.includes(lineage)));}assert.equal(roEquipmentGrade({level:1}),1);assert.equal(roEquipmentGrade({level:25}),3);
});


test('expanded build gear covers three head positions, both accessory spaces and genuinely different combat specializations',()=>{
 const pieces=Object.values(RO_BUILD_EQUIPMENT);for(const slot of ['head','headMid','headLow','weapon','offhand','armor','garment','shoes','accessory'])assert.ok(pieces.some(d=>d.slot===slot),slot);
 for(const [slot,position]of [['head','top'],['headMid','middle'],['headLow','lower']])assert.ok(pieces.filter(d=>d.slot===slot).every(d=>d.headPosition===position));
 const additions=pieces.filter(d=>d.statsAreIntrinsic);assert.ok(additions.length>=70);assert.ok(additions.filter(d=>d.slot==='offhand').length>=4);assert.ok(additions.filter(d=>d.slot==='accessory').length>=10);
 for(const tag of ['physical','magic','critical','cast','accuracy','attack-speed','shield','support','vitality'])assert.ok(additions.some(d=>d.buildTags.includes(tag)),tag);
 for(const d of additions){assert.ok(!d.refine&&!d.refinement&&!d.requiredRefinement,d.key);assert.ok(d.sourceBase&&[d.sourceBase.attack,d.sourceBase.matk,d.sourceBase.defense].every(Number.isFinite));assert.ok((d.stats.crit||0)<=.06);assert.ok(d.minStage>=2);}
});

test('strong critical and spellcaster equipment gives its complete adapted bonuses at refinement zero',()=>{
 for(const key of ['build_21003','build_2051','build_5864','build_15038','build_2701']){const definition=RO_BUILD_EQUIPMENT[key],item=createRoEquipment(key,'zero-'+key),u={roInventory:[item],roEquipment:{[definition.slot]:item.id}};assert.equal(item.refine,undefined);const bonuses=roEquipmentBonuses(u);for(const [stat,amount]of Object.entries(definition.stats))assert.equal(bonuses[stat],amount,key+'.'+stat);}
});
