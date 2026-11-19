import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {CASTLE_ITEMS,CASTLE_BUILDINGS} from '../shared/castle-catalog.js';
import {castleInventoryMarkup} from '../src/castle-inventory-ui.js';
import {castleCatalogCard} from '../src/castle-ui.js';
import {castleUnitVisual} from '../src/castle-unit-art.js';
function setup(){const g=new Game(114,{mode:'castlefight'});g.addPlayer('p','knight');g.addPlayer('q','knight');g.initCastleFight();const p=g.player('p');p.x=p.z=0;p.gold=p.lumber=100000;g.castleFight.elapsed=1000;return{g,p};}

test('Castle purchases put six real slots on the HUD and equipped auras retain their authoritative effects',()=>{
 const {g,p}=setup();assert.equal(g.command('p',{type:'cfItem',item:'blast_staff',store:true}),true);assert.equal(p.inventory.length,1);assert.equal(p.inventory[0].passive,true);assert.ok(g.castleFight.players.p.items.blast_staff);
 const html=castleInventoryMarkup(p,g.castleFight.players.p,g.castleFight.elapsed);assert.equal((html.match(/data-cf-inventory=/g)||[]).length,6);assert.match(html,/Blast Staff/);assert.match(html,/AURA/);
});

test('stored consumables spend gold once on purchase and activate later away from the tower without consuming extra shop stock',()=>{
 const {g,p}=setup(),cf=g.castleFight,price=CASTLE_ITEMS.cheese.cost,before=p.gold;assert.equal(g.command('p',{type:'cfItem',item:'cheese',store:true}),true);assert.equal(p.gold,before-price);assert.equal(cf.players.p.legendarySlots,1);assert.equal(p.inventory[0].key,'cheese');const stock=cf.shop.stock.cheese;
 p.x=-30;assert.equal(g.command('p',{type:'cfUseItem',slot:0}),true);assert.equal(cf.players.p.legendarySlots,2);assert.equal(p.gold,before-price);assert.equal(cf.shop.stock.cheese,stock);assert.equal(p.inventory[0],null);assert.equal(g.command('p',{type:'cfUseItem',slot:0}),false);
});

test('full inventories, missing slots and forged inventory flags cannot bypass cost or atomic item validation',()=>{
 const {g,p}=setup();p.inventory=Array.from({length:6},()=>({key:'stone_scroll',charges:1}));let gold=p.gold;assert.equal(g.command('p',{type:'cfItem',item:'cheese',store:true}),false);assert.equal(p.gold,gold);assert.match(g.commandFailureReason,/mochila/);
 for(const slot of [-1,6,NaN,'0'])assert.equal(g.command('p',{type:'cfUseItem',slot}),false);p.inventory=[];p.gold=0;assert.equal(g.command('p',{type:'cfItem',item:'cheese',fromInventory:true}),false);
});

test('the compact construction catalogue exposes an inspect action while keeping detailed stats out of every thumbnail',()=>{
 const {g,p}=setup(),b=CASTLE_BUILDINGS.human_h003,html=castleCatalogCard(b.key,b,p.gold,{state:g,hero:p});assert.match(html,/data-cf-inspect/);assert.doesNotMatch(html,/data-cf-build|HP 270|Forte contra/);assert.match(html,/Sniper/);
 assert.equal(castleUnitVisual('hrif').weapon,'sniper-rifle');assert.equal(castleUnitVisual('n022').weapon,'bow');assert.equal(castleUnitVisual('hrif').projectileKind,'bullet');assert.equal(castleUnitVisual('n022').projectileKind,'arrow');
});
