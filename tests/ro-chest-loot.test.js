import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {RO_EQUIPMENT,RO_LOOT_RATES,createRoEquipment,roInventoryItemCount} from '../shared/ragnarok-equipment.js';
import {RO_TOWER_MVP_GEAR} from '../shared/ragnarok-tower-drops.js';
import {RO_CHEST_EQUIPMENT_KEYS,roChestEquipmentPool,awardRoChestEquipment} from '../shared/ro-chest-loot.js';
import {createRoCheckpoint} from '../shared/ragnarok-save.js';

const setup=options=>{const g=new Game(29,{mode:'bonk',...options});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p');g.units=[u];g.bonk.spawnAt=Infinity;u.bonkBuild.weapons={};return{g,u};};
const chest=(g,u,cost=25)=>{const o={id:'test-chest-'+g.id(),type:'chest',x:u.x,z:u.z,cost,used:false};g.bonk.objects.push(o);return o;};

test('every chest pool entry is a real normal RO item and level/progression favour stronger normal gear without granting cards',()=>{
 assert.ok(RO_CHEST_EQUIPMENT_KEYS.length>=73);for(const key of RO_CHEST_EQUIPMENT_KEYS){const d=RO_EQUIPMENT[key];assert.ok(d&&!Object.hasOwn(RO_TOWER_MVP_GEAR,key));assert.match(d.source,/divine-pride\.net\/database\/item\/\d+/);assert.ok(Number.isInteger(d.sourceId));}
 const high=new Set(Object.keys(RO_EQUIPMENT).filter(k=>RO_EQUIPMENT[k].grade>=3)),ratio=pool=>pool.filter(p=>high.has(p.key)).reduce((s,p)=>s+p.weight,0)/pool.reduce((s,p)=>s+p.weight,0);assert.ok(ratio(roChestEquipmentPool({level:50},8))>ratio(roChestEquipmentPool({level:1},0))+.4);
 const u={level:1,roInventory:[],roCards:[{id:'existing',key:'poring'}]};for(let i=0;i<24;i++){const award=awardRoChestEquipment(u,{random:()=>i/24,id:'item-'+i});assert.ok(award);assert.deepEqual(award.item.cards,[]);}assert.deepEqual(u.roCards,[{id:'existing',key:'poring'}]);assert.deepEqual(RO_LOOT_RATES,{card:.005,bossCard:.005,equipment:.06});
});

test('real adventure, tower and GM chests each grant exactly one equipment and one relic, once, with a serializable receipt',()=>{
 for(const options of [{bonkWorld:'dominion'},{bonkActivity:'tower'},{bonkWorld:'dominion',bonkDebug:true}]){const {g,u}=setup(options),o=chest(g,u),before=u.roInventory.length,gold=u.gold,relics=Object.values(u.bonkBuild.relics).reduce((s,n)=>s+n,0);assert.ok(g.command('p',{type:'bkInteract',object:o.id}));assert.equal(u.roInventory.length,before);assert.equal(u.gold,gold-25);assert.equal(Object.values(u.bonkBuild.relics).reduce((s,n)=>s+n,0),relics+1);const receipt=g.snapshotBonk().lastLoot;assert.equal(receipt.kind,'chest');assert.equal(receipt.equipment.length,1);assert.equal(receipt.equipment[0].name,RO_EQUIPMENT[g.bonk.pickups.find(p=>p.type==='equipment').item.key].name);assert.ok(receipt.relic.name);assert.equal(receipt.pending,false);assert.deepEqual(JSON.parse(JSON.stringify(receipt)),receipt);assert.equal(g.command('p',{type:'bkInteract',object:o.id}),false);assert.equal(u.roInventory.length,before);assert.equal(u.gold,gold-25);if(options.bonkDebug)assert.equal(createRoCheckpoint(g),null);}
});

test('distance and gold checks cannot debit gold, mark the chest used or grant either reward',()=>{
 for(const failure of ['distance','gold']){const {g,u}=setup(),o=chest(g,u);if(failure==='distance')o.x+=20;if(failure==='gold')u.gold=0;if(failure==='pending'){u.roInventory=Array.from({length:48},(_,i)=>createRoEquipment('knife','bag-'+i));u.roUnclaimed=Array.from({length:128},(_,i)=>createRoEquipment('knife','pending-'+i));}const before=JSON.stringify({gold:u.gold,inventory:u.roInventory,pending:u.roUnclaimed,relics:u.bonkBuild.relics});assert.equal(g.command('p',{type:'bkInteract',object:o.id}),false);assert.equal(o.used,false);assert.equal(JSON.stringify({gold:u.gold,inventory:u.roInventory,pending:u.roUnclaimed,relics:u.bonkBuild.relics}),before);}
});

test('full backpacks do not block opening a chest; its one equipment stays on the ground and is never queued',()=>{
 const {g,u}=setup();for(let i=0;i<30;i++)u.roInventory.push(createRoEquipment('knife','bag-'+i));const before=u.roInventory.length,o=chest(g,u,0);assert.ok(g.command('p',{type:'bkInteract',object:o.id}));assert.equal(u.roInventory.length,before);assert.equal(g.bonk.lastLoot.onGround,true);assert.equal(g.bonk.lastLoot.pending,false);assert.equal(g.bonk.pickups.filter(p=>p.type==='equipment').length,1);assert.equal(u.roUnclaimed?.length||0,0);assert.equal(g.command('p',{type:'bkInteract',object:o.id}),false);
});
