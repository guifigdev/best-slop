import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {RO_EQUIPMENT,createRoEquipment,roReceiveEquipment,roEquipmentQuantity,roInventoryItemCount,roCompactInventory,roEquip,roEquipmentBonuses,initializeRoInventory} from '../shared/ragnarok-equipment.js';
import {createRoCheckpoint,validateRoCheckpoint} from '../shared/ragnarok-save.js';
import {validateRoAccountProgress} from '../server/ro-accounts.js';
import {roEquipmentBagMarkup,roEquipmentComparisonMarkup} from '../src/ro-equipment-bag-ui.js';
import {roLootCueMarkup} from '../src/ro-loot-cue.js';
const setup=()=>{const g=new Game(29,{mode:'bonk'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});g.units=[g.player('p')];g.bonk.spawnAt=Infinity;return{g,u:g.player('p')};};
test('thousands of equipment copies take one reusable stack and never multiply equipped bonuses',()=>{
 const u={roInventory:[],roEquipment:{}};for(let i=0;i<2000;i++)assert.ok(roReceiveEquipment(u,createRoEquipment('criticalring','drop-'+i)));assert.equal(u.roInventory.length,1);assert.equal(roInventoryItemCount(u),2000);assert.ok(roEquip(u,u.roInventory[0].id,'accessory'));assert.equal(roEquipmentBonuses(u).crit,RO_EQUIPMENT.criticalring.stats.crit);assert.equal(roReceiveEquipment(u,u.roInventory[0]),u.roInventory[0]);assert.equal(roInventoryItemCount(u),2000);
});
test('equipping newly found gear replaces the equipped item and leaves the old one stored, including two-hand rules',()=>{
 const{g,u}=setup(),old=u.roEquipment.weapon;const item=createRoEquipment('katana','new-katana');roReceiveEquipment(u,item);u.roInventory.push(createRoEquipment('guard','shield'));assert.ok(g.command('p',{type:'bkEquip',itemId:'shield',slot:'offhand'}));assert.ok(g.command('p',{type:'bkEquip',itemId:item.id,slot:'weapon'}));assert.equal(u.roEquipment.weapon,item.id);assert.equal(u.roEquipment.offhand,null);assert.ok(u.roInventory.some(i=>i.id===old));assert.equal(g.command('p',{type:'bkEquip',itemId:'someone-elses-gear',slot:'weapon'}),false);
 const html=roEquipmentBagMarkup(u,{selectedId:old});assert.match(html,/Substituir Katana/);assert.match(html,/Comparar com o equipado/);assert.doesNotMatch(html,/\/48|aguardando espaço/);assert.match(roEquipmentComparisonMarkup(u,item),/A anterior continua guardada/);
});
test('claiming old 48/128 bags compacts all copies without losing equipped identities or permanent card loadouts',()=>{
 const{g,u}=setup();u.roInventory=Array.from({length:48},(_,i)=>createRoEquipment('knife','bag-'+i));u.roUnclaimed=Array.from({length:128},(_,i)=>createRoEquipment('knife','pending-'+i));u.roEquipment={weapon:'bag-0',offhand:'bag-1'};u.roCardLoadout={weapon:'fabre'};const before=structuredClone(u.roCardLoadout);assert.ok(g.command('p',{type:'bkClaimAll'}));assert.equal(roInventoryItemCount(u),176);assert.equal(u.roUnclaimed.length,0);assert.equal(u.roInventory.length,2);assert.equal(u.roEquipment.weapon,'bag-0');assert.equal(u.roEquipment.offhand,'bag-1');assert.deepEqual(u.roCardLoadout,before);assert.ok(g.command('p',{type:'bkClaimAll'}));assert.equal(roInventoryItemCount(u),176);
 const cp=createRoCheckpoint(g);assert.ok(cp);assert.equal(cp.hero.roInventory.reduce((n,i)=>n+roEquipmentQuantity(i),0),176);assert.ok(validateRoAccountProgress({version:1,characters:[{id:'kept',lineage:u.roLineage,name:'Herói',checkpoint:cp,updatedAt:1}],selectedCharacter:'kept'}));
 const restored=new Game(30,{mode:'bonk'});restored.addPlayer('p','knight');assert.ok(restored.command('p',{type:'bkRestore',checkpoint:cp}));assert.equal(roInventoryItemCount(restored.player('p')),176);
});
test('every distinct equipment fits the bag and its cloud checkpoint, and quantities reject corrupt values',()=>{
 const{g,u}=setup();u.roInventory=[];u.roEquipment={};for(const key of Object.keys(RO_EQUIPMENT))roReceiveEquipment(u,createRoEquipment(key,'all-'+key));assert.ok(u.roInventory.length>48);const cp=createRoCheckpoint(g);assert.ok(cp);assert.equal(cp.hero.roInventory.length,Object.keys(RO_EQUIPMENT).length);for(const invalid of [-1,0,1.5,Infinity,Number.MAX_SAFE_INTEGER+1]){const forged=structuredClone(cp);forged.hero.roInventory[0].quantity=invalid;assert.equal(validateRoCheckpoint(forged),null);}const grouped=structuredClone(cp);grouped.hero.roInventory[0].quantity=100000;assert.equal(validateRoCheckpoint(grouped).hero.roInventory[0].quantity,100000);
});
test('an assassin uses two real copies from a stack without duplicating equipment or spawning copies on repeated clicks',()=>{
 const u={id:7,roTier:1};initializeRoInventory(u,'shadowcross');const main=u.roInventory.find(i=>i.id===u.roEquipment.weapon);roReceiveEquipment(u,createRoEquipment('knife','another'));const count=roInventoryItemCount(u);assert.ok(roEquip(u,main.id,'offhand'));const off=u.roEquipment.offhand;assert.notEqual(off,main.id);assert.equal(u.roEquipment.weapon,main.id);assert.equal(roInventoryItemCount(u),count);const entries=u.roInventory.length;for(let i=0;i<20;i++)assert.ok(roEquip(u,main.id,'offhand'));assert.equal(u.roEquipment.weapon,main.id);assert.equal(u.roEquipment.offhand,off);assert.equal(u.roInventory.length,entries);assert.equal(roInventoryItemCount(u),count);roCompactInventory(u);assert.ok(u.roInventory.some(i=>i.id===off));
});
test('the new-loot receipt opens comparison using the owned stack id and escapes names',()=>{
 const html=roLootCueMarkup({id:'receipt',at:0,kind:'equipment',equipment:[{id:'bag-owned',name:'<Novo>',key:'katana'}]},1);assert.match(html,/data-bk-inspect-loot="bag-owned"/);assert.match(html,/Comparar e equipar/);assert.match(html,/&lt;Novo&gt;/);assert.doesNotMatch(html,/<Novo>/);
});
