import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {RO_EQUIPMENT_SLOTS,createRoEquipment,initializeRoInventory,roReceiveEquipment,roEquipmentQuantity,roInventoryItemCount,roEquip,roEquipmentBonuses,roBagUsage,roBagPieces,roMigrateBag,roUnequip,roSocket} from '../shared/ragnarok-equipment.js';
import {roEquipGroundItem,roClaimLegacyItem,roDropOne} from '../shared/ro-ground-loot.js';
import {createRoCheckpoint,validateRoCheckpoint} from '../shared/ragnarok-save.js';
const setup=()=>{const g=new Game(29,{mode:'bonk'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p');g.units=[u];g.bonk.spawnAt=Infinity;u.bonkBuild.weapons={};return{g,u};};
const fill=u=>{while(roBagUsage(u)<30)assert.ok(roReceiveEquipment(u,createRoEquipment('knife','bag-'+u.roInventory.length)));};

test('30 physical bag spaces exclude worn pieces; duplicates use separate cells and bonuses do not multiply',()=>{
 const {u}=setup();assert.equal(roBagUsage(u),0);fill(u);assert.equal(roBagPieces(u).length,30);assert.equal(roInventoryItemCount(u),32);assert.equal(roReceiveEquipment(u,createRoEquipment('knife','overflow')),null);assert.equal(roUnequip(u,'weapon'),false);assert.equal(roBagUsage(u),30);
 const item=u.roInventory.at(-1);assert.ok(roEquip(u,item.id,'weapon'));assert.equal(roBagUsage(u),30);assert.equal(roEquipmentBonuses(u).attack,17);
});
test('two accessories and three distinct head positions equip and socket independently',()=>{
 const {u}=setup();assert.equal(RO_EQUIPMENT_SLOTS.length,10);for(const [key,slot] of [['clip','accessory'],['ring','accessory2'],['cap','head'],['sunglasses','headMid'],['flumask','headLow']]){roReceiveEquipment(u,createRoEquipment(key,key));assert.ok(roEquip(u,key,slot));}assert.equal(roBagUsage(u),0);assert.equal(roEquip(u,'cap','headMid'),false);assert.equal(roEquipmentBonuses(u).str,2);u.roCards=[{id:'elder',key:'elderwillow'}];assert.ok(roSocket(u,'elder','sunglasses'));assert.equal(roEquipmentBonuses(u).int,2);
});
test('manual equipment pickup stays fixed underfoot, validates distance and is collected once',()=>{
 const {g,u}=setup(),p={id:g.id(),type:'equipment',item:createRoEquipment('coat','ground'),x:u.x,z:u.z,age:0};g.bonk.pickups=[p];for(let i=0;i<20;i++)g.tick(.05);assert.equal(g.bonk.pickups.length,1);assert.equal(roBagUsage(u),0);assert.equal(p.x,u.x);assert.equal(g.snapshotBonk().nearbyEquipment.id,p.id);
 p.x+=30;assert.equal(g.command('p',{type:'bkPickup',pickup:p.id}),false);p.x=u.x;assert.ok(g.command('p',{type:'bkPickup',pickup:p.id}));assert.equal(g.command('p',{type:'bkPickup',pickup:p.id}),false);assert.equal(roBagUsage(u),1);assert.equal(g.bonk.pickups.length,0);
});
test('full bag keeps loot on ground; direct equip drops displaced gear atomically, preserving all copies',()=>{
 const {g,u}=setup();fill(u);const old=u.roEquipment.weapon,p={id:g.id(),type:'equipment',item:createRoEquipment('katana','new'),x:u.x,z:u.z,age:0};g.bonk.pickups=[p];const before=roInventoryItemCount(u);assert.equal(g.command('p',{type:'bkPickup',pickup:p.id}),false);assert.equal(g.bonk.pickups[0],p);assert.ok(g.command('p',{type:'bkPickupEquip',pickup:p.id,slot:'weapon'}));assert.equal(u.roEquipment.weapon,'new');assert.equal(roBagUsage(u),30);assert.equal(roInventoryItemCount(u),before);assert.ok(g.bonk.pickups.some(p=>p.item.id===old));assert.equal(u.roUnclaimed?.length||0,0);
});
test('ground two-handed swap drops both displaced hands if needed; incompatible swaps leave state untouched',()=>{
 const {u}=setup();roReceiveEquipment(u,createRoEquipment('guard','shield'));assert.ok(roEquip(u,'shield','offhand'));fill(u);let n=0;const replacement=createRoEquipment('katana','twohand'),before=JSON.stringify(u);assert.equal(roEquipGroundItem(u,replacement,'head',()=>String(++n)),null);assert.equal(JSON.stringify(u),before);const result=roEquipGroundItem(u,replacement,'weapon',()=>String(++n));assert.equal(result.dropped.length,2);assert.equal(u.roEquipment.offhand,null);assert.equal(roBagUsage(u),30);
});
test('old 48+128 copies survive migration, cloud round-trip and claims without exceeding 30 spaces',()=>{
 const {g,u}=setup();u.roInventory=Array.from({length:48},(_,i)=>createRoEquipment('knife','old-'+i));u.roEquipment={weapon:'old-0'};u.roUnclaimed=Array.from({length:128},(_,i)=>createRoEquipment('boots','pending-'+i));delete u.roBagVersion;roMigrateBag(u);const total=()=>roInventoryItemCount(u)+u.roUnclaimed.reduce((n,i)=>n+roEquipmentQuantity(i),0);assert.equal(total(),176);assert.equal(roBagUsage(u),30);assert.equal(u.roEquipment.weapon,'old-0');assert.equal(u.roUnclaimed.length,145);roMigrateBag(u);assert.equal(total(),176);
 const cp=createRoCheckpoint(g);assert.ok(cp);assert.ok(validateRoCheckpoint(cp));const restored=new Game(30,{mode:'bonk'});restored.addPlayer('p','knight');assert.ok(restored.command('p',{type:'bkRestore',checkpoint:cp}));const v=restored.player('p');assert.equal(roBagUsage(v),30);assert.equal(v.roUnclaimed.length,145);assert.equal(roClaimLegacyItem(v,v.roUnclaimed[0].id,()=> 'claim'),false);roDropOne(v,'old-1',()=> 'drop');assert.ok(roClaimLegacyItem(v,v.roUnclaimed[0].id,()=> 'claim'));assert.equal(roBagUsage(v),30);
});
test('legacy grouped quantities migrate without huge UI allocation or item loss; new saves reject overflow',()=>{
 const {g,u}=setup();u.roInventory=[{id:'bulk',key:'knife',quantity:100000,cards:[]}];u.roEquipment={weapon:'bulk'};delete u.roBagVersion;roMigrateBag(u);assert.equal(roBagUsage(u),30);assert.equal(roBagPieces(u).length,30);assert.equal(u.roUnclaimed[0].quantity,99969);const cp=createRoCheckpoint(g);assert.ok(cp);const bad=structuredClone(cp);bad.hero.roInventory[0].quantity=100000;assert.equal(validateRoCheckpoint(bad),null);for(const quantity of [0,-1,1.5,Infinity]){const bad=structuredClone(cp);bad.hero.roInventory[0].quantity=quantity;assert.equal(validateRoCheckpoint(bad),null);}
});
test('dropping a grouped legacy item removes only one physical copy and keeps worn copy in place',()=>{
 const u={id:'legacy',roTier:1};initializeRoInventory(u,'shadowcross');const item=u.roInventory[0];item.quantity=3;const old=u.roEquipment.weapon,dropped=roDropOne(u,item.id,()=> 'copy');assert.equal(dropped.quantity,1);assert.equal(dropped.id,'copy');assert.equal(item.quantity,2);assert.equal(u.roEquipment.weapon,old);assert.equal(roInventoryItemCount(u),4);
});
