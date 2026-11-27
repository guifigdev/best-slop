import {validateRoCheckpoint} from '../shared/ragnarok-save.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {createRoCheckpoint} from '../shared/ragnarok-save.js';
import {saveRoCharacter} from '../src/ragnarok-account-ui.js';
import {consumeRoAccountCard,reconcileRoAccountSockets,roMigrateAccountCards,roAttachAccountSocket} from '../shared/ro-card-inventory.js';
import {roKafraTransfer} from '../shared/ro-kafra.js';
import {roReceiveEquipment,roEquip,roEquipmentBonuses} from '../shared/ragnarok-equipment.js';
const make=()=>{const g=new Game(17,{mode:'bonk'});g.addPlayer('p','knight');const cp=createRoCheckpoint(g);return{g,cp,state:{id:'account-a',cards:['poring'],progress:saveRoCharacter({version:1,characters:[]},{id:'hero-a',name:'A',lineage:'dragonknight',checkpoint:cp,updatedAt:1})}};};
test('migration gives one copy per old discovery, a stack socket consumes one physical copy, and operations are replay-safe',()=>{
 const{state}=make();roMigrateAccountCards(state);assert.equal(state.cardStock.poring,1);const hero=state.progress.characters[0].checkpoint.hero,armor=hero.roInventory.find(i=>i.key==='adventurersuit');armor.quantity=3;
 const input={characterId:'hero-a',itemId:armor.id,key:'poring',operation:'one-operation'},r=consumeRoAccountCard(state,input,{id:(()=>{let i=0;return()=>String(++i);})()});assert.equal(r.ok,true);assert.equal(state.cardStock.poring,undefined);assert.notEqual(r.socket.itemId,armor.id);assert.equal(hero.roInventory.find(i=>i.id===armor.id).quantity,3,'the authoritative hero replacement does not mutate an old snapshot');
 const next=state.progress.characters[0].checkpoint.hero;assert.equal(next.roInventory.find(i=>i.id===armor.id).quantity,2);assert.equal(next.roInventory.find(i=>i.id===r.socket.itemId).cards.length,1);assert.equal(consumeRoAccountCard(state,input).socket.id,r.socket.id);assert.equal(consumeRoAccountCard(state,{...input,operation:'another-operation'}).ok,false);
});
test('carded pieces retain their consumed copy through Kafra and another character, while another account cannot equip or receive them',()=>{
 const{state,cp}=make(),itemId=state.progress.characters[0].checkpoint.hero.roEquipment.armor,result=consumeRoAccountCard(state,{characterId:'hero-a',itemId,key:'poring',operation:'transfer-operation'});assert.equal(result.ok,true);
 const a=structuredClone(state.progress.characters[0].checkpoint.hero);a.roAccountId=state.id;a.roEquipment.armor=null;a.roWarehouse={version:1,revision:0,items:[]};assert.equal(roKafraTransfer(a,'deposit',itemId,{id:()=> 'shared-gear'}).ok,true);
 const b={...structuredClone(cp.hero),roAccountId:state.id,roWarehouse:a.roWarehouse};assert.equal(roKafraTransfer(b,'withdraw','kafra:shared-gear').ok,true);assert.equal(roEquip(b,'kafra:shared-gear','armor'),true);assert.ok(roEquipmentBonuses(b).luk>=2);
 state.progress.warehouse=b.roWarehouse;state.progress.characters[0].checkpoint.hero=a;state.progress=saveRoCharacter(state.progress,{id:'hero-b',name:'B',lineage:'dragonknight',checkpoint:{...cp,hero:b},updatedAt:2});reconcileRoAccountSockets(state.progress,state.cardSockets);
 const worn=state.progress.characters.find(c=>c.id==='hero-b').checkpoint.hero.roInventory.find(i=>i.id==='kafra:shared-gear');assert.equal(worn.cards[0].id,result.socket.id);assert.equal(state.cardStock.poring,undefined);
 const stranger={roAccountId:'other-account',roInventory:[],roEquipment:{}};assert.equal(roReceiveEquipment(stranger,structuredClone(worn)),null);stranger.roInventory.push(structuredClone(worn));assert.equal(roEquip(stranger,worn.id,'armor'),false);
});
test('an old starter item ID in a different character never recreates a consumed card after its real piece is lost',()=>{
 const{state,cp}=make(),itemId=state.progress.characters[0].checkpoint.hero.roEquipment.armor,result=consumeRoAccountCard(state,{characterId:'hero-a',itemId,key:'poring',operation:'lost-card-operation'});assert.equal(result.ok,true);
 const a=state.progress.characters[0].checkpoint.hero;a.roInventory=a.roInventory.filter(i=>i.id!==itemId);a.roEquipment.armor=null;state.progress=saveRoCharacter(state.progress,{id:'hero-b',name:'B',lineage:'dragonknight',checkpoint:cp,updatedAt:2});reconcileRoAccountSockets(state.progress,state.cardSockets);
 const b=state.progress.characters.find(c=>c.id==='hero-b').checkpoint.hero;assert.deepEqual(b.roInventory.find(i=>i.id===itemId).cards,[]);assert.equal(state.cardStock.poring,undefined);
 assert.equal(roAttachAccountSocket({...b,roAccountId:'other'},result.socket),false);
});

test('an account-bound socket survives repeated checkpoint validation without unequipping the piece',()=>{
 const{state}=make(),character=state.progress.characters[0],itemId=character.checkpoint.hero.roEquipment.armor;
 assert.ok(consumeRoAccountCard(state,{characterId:character.id,itemId,key:'poring',operation:'save-bound-card'}).ok);
 const first=validateRoCheckpoint(character.checkpoint),second=validateRoCheckpoint(first);assert.ok(first&&second);assert.equal(second.hero.roEquipment.armor,itemId);assert.equal(second.hero.roInventory.find(i=>i.id===itemId).cards[0].accountId,state.id);
});
