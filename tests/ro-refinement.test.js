import test from 'node:test';
import assert from 'node:assert/strict';
import {roRefinePlan,roRefineEquipment,roBlessingCost} from '../shared/ro-refinement.js';
import {createRoEquipment,initializeRoInventory,roInventoryItemCount} from '../shared/ragnarok-equipment.js';
import {RO_KAFRA_CAPACITY,roKafraTransfer,validateRoWarehouse,roWarehouseUsage} from '../shared/ro-kafra.js';
import {roLoseBagOnDeath} from '../shared/ro-death-inventory.js';
import {createRoCheckpoint,validateRoCheckpoint} from '../shared/ragnarok-save.js';
import {Game} from '../shared/simulation.js';
const fixture=(key='adventurersuit',rank=4)=>{const item={...createRoEquipment(key,'refine'),refine:rank},u={id:1,roInventory:[item],roEquipment:{[key==='adventurersuit'?'armor':'weapon']:item.id},gold:5000,roBlacksmithBlessings:4};let next=20;const game={worldSeed:17,id:()=>next++,random:()=>.99};return{item,u,game};};
test('normal iRO ore rates distinguish weapon levels, armor, safe limits and +10 chances',()=>{
 const armor=rank=>roRefinePlan({...createRoEquipment('adventurersuit','a'),refine:rank}),knife=rank=>roRefinePlan({...createRoEquipment('knife','k'),refine:rank}),katar=rank=>roRefinePlan({...createRoEquipment('build_1266','i'),refine:rank});
 assert.equal(armor(3).chance,1);assert.equal(armor(4).chance,.6);assert.equal(armor(5).chance,.4);assert.equal(armor(6).chance,.4);assert.equal(armor(7).chance,.2);assert.equal(armor(8).chance,.2);assert.equal(armor(9).chance,.09);assert.equal(knife(6).chance,1);assert.equal(knife(7).chance,.6);assert.equal(knife(8).chance,.4);assert.equal(knife(9).chance,.19);assert.equal(katar(4).chance,.6);assert.equal(katar(9).chance,.09);assert.equal(roRefinePlan(createRoEquipment('clip','c')),null);assert.equal(armor(10),null);assert.deepEqual([7,8,9].map(roBlessingCost),[1,2,4]);
});
test('failing an unprotected refine destroys one copy and clears its hand/armor pointer without destroying the stack',()=>{
 const {item,u,game}=fixture();item.quantity=3;item.cards=[{id:'c',key:'poring'}];item.enchants={damage:2};game.random=()=>.6;assert.ok(roRefineEquipment(game,u,item.id));assert.equal(u.roRefineResult.outcome,'broken');assert.equal(u.roEquipment.armor,null);assert.ok(!u.roInventory.some(i=>i.id===item.id));assert.equal(roInventoryItemCount(u),2);assert.equal(u.gold,4700);assert.equal(u.roBlacksmithBlessings,4);
});
test('Blacksmith Blessings are consumed on success and failure, preserve the rank on a failed protected attempt and reject insufficient stock atomically',()=>{
 for(const roll of [0,.99]){const {item,u,game}=fixture('build_1266',7);game.random=()=>roll;assert.ok(roRefineEquipment(game,u,item.id,{protect:true}));assert.equal(u.roBlacksmithBlessings,3);assert.equal(item.refine,roll?7:8);assert.equal(u.roRefineResult.outcome,roll?'protected':'success');assert.equal(u.gold,4520);}
 const {item,u,game}=fixture('build_1266',9);u.roBlacksmithBlessings=3;const before=JSON.stringify(u);assert.equal(roRefineEquipment(game,u,item.id,{protect:true}),false);assert.equal(JSON.stringify(u),before);
});
test('Kafra has 300 physical slots, can store Blessings for another run and stored materials survive death',()=>{
 assert.equal(RO_KAFRA_CAPACITY,300);const u={roInventory:[],roEquipment:{},roBlacksmithBlessings:2};assert.ok(roKafraTransfer(u,'depositBlessing').ok);assert.equal(u.roBlacksmithBlessings,1);assert.equal(u.roWarehouse.blessings,1);assert.equal(roWarehouseUsage(u.roWarehouse),1);roLoseBagOnDeath(u);assert.equal(u.roBlacksmithBlessings,0);assert.equal(u.roWarehouse.blessings,1);assert.ok(roKafraTransfer(u,'withdrawBlessing').ok);assert.equal(u.roBlacksmithBlessings,1);assert.equal(u.roWarehouse.blessings,0);assert.equal(u.roWarehouse.revision,2);
 const full={version:1,revision:1,items:Array.from({length:300},(_,i)=>createRoEquipment('knife','slot-'+i))};assert.ok(validateRoWarehouse(full));assert.equal(validateRoWarehouse({...full,blessings:1}),null);assert.equal(validateRoWarehouse({...full,items:[...full.items,createRoEquipment('knife','extra')]}),null);
});
test('a real MVP defeat awards one Blessing to the party, and the character checkpoint preserves it',()=>{
 const g=new Game(617,{mode:'bonk'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p'),e=g.units.find(e=>e.bonkEnemy);Object.assign(e,{hp:1,bonkBoss:true,roSourceId:999999,x:u.x+.5,z:u.z});g.units=[u,e];g.effects=[];g.random=()=>0;g.command('p',{type:'bkCast',key:'basic'});assert.equal(e.alive,false);assert.equal(u.roBlacksmithBlessings,1);assert.equal(u.roBlessingDropId,e.id);const cp=createRoCheckpoint(g);assert.equal(cp.hero.roBlacksmithBlessings,1);assert.equal(validateRoCheckpoint({...cp,hero:{...cp.hero,roBlacksmithBlessings:-1}}),null);
});
