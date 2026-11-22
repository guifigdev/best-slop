import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {ITEMS} from '../shared/catalog.js';
import {SHOPS} from '../shared/shops.js';
import {merchantPosition} from '../shared/instances.js';
import {shopPurchasePlan} from '../shared/shop-purchase.js';
import {npcShopMarkup,npcProductState} from '../src/npc-shop-ui.js';
import {equipmentServiceMarkup,equipmentServiceSelection} from '../src/equipment-service-ui.js';

function setup(npc='books'){const g=new Game(22,{mode:'campaign'});g.addPlayer('a','knight');const p=g.player('a'),point=merchantPosition(p,SHOPS[npc]);p.gold=10000;p.inventory=Array.from({length:6},()=>({key:'armor',level:1,charges:1}));p.x=point.x;p.z=point.z+1.5;g.command('a',{type:'interact',npc});return {g,p};}
test('full inventory buys and consumes one XP book, spends exactly one cost and stock, without changing gear or potion cooldown',()=>{
 const {g,p}=setup(),inventory=structuredClone(p.inventory),cost=ITEMS.xpbook.cost,stock=g.stockFor(p).xpbook;p.potionUntil=123;const gold=p.gold;
 assert.equal(shopPurchasePlan(p,'xpbook',g.time).destination,'consume');assert.equal(g.command('a',{type:'item',item:'xpbook'}),true);assert.equal(p.gold,gold-cost);assert.equal(g.stockFor(p).xpbook,stock-1);assert.equal(p.level,2);assert.equal(p.xp,ITEMS.xpbook.xp-55);assert.equal(p.potionUntil,123);assert.deepEqual(p.inventory,inventory);
 assert.equal(g.effects.filter(e=>e.type==='bookRead').length,1);
});
test('full inventory tomes add the purchased exact stat, while stackable books still store normally',()=>{
 const {g,p}=setup(),before=p.totalAttributes.str,points=p.attributePoints;p.potionUntil=200;
 assert.equal(g.command('a',{type:'item',item:'tome_str_5'}),true);assert.equal(p.totalAttributes.str,before+5);assert.equal(p.attributePoints,points);assert.equal(p.potionUntil,200);
 p.inventory[2]={key:'xpbook',charges:1};const xp=p.xp;assert.equal(g.command('a',{type:'item',item:'xpbook'}),true);assert.equal(p.inventory[2].charges,2);assert.equal(p.xp,xp);
});
test('instant purchases validate physical shop, phase, gold and stock before any experience or attribute effect',()=>{
 for(const reject of [({p})=>p.gold=0,({g,p})=>g.stockFor(p).xpbook=0,({p})=>{p.x=0;p.z=0;},({g})=>g.phase='wave']){const ctx=setup();reject(ctx);const {g,p}=ctx,before={gold:p.gold,stock:g.stockFor(p).xpbook,level:p.level,xp:p.xp,inventory:structuredClone(p.inventory)};assert.equal(g.command('a',{type:'item',item:'xpbook'}),false);assert.deepEqual({gold:p.gold,stock:g.stockFor(p).xpbook,level:p.level,xp:p.xp,inventory:p.inventory},before);}
 const {g,p}=setup('equipment'),gold=p.gold,stock=g.stockFor(p).blade;assert.equal(g.command('a',{type:'item',item:'blade'}),false);assert.equal(p.gold,gold);assert.equal(g.stockFor(p).blade,stock);
});
test('full potion bags buy one useful immediate dose without consuming held charges, and reject cooldown/full recovery with no charge',()=>{
 const {g,p}=setup('consumables');p.consumables=[{key:'potion',charges:3},{key:'manapot',charges:3}];p.hp=10;const bags=structuredClone(p.consumables),gold=p.gold,stock=g.stockFor(p).potion;
 assert.equal(g.command('a',{type:'item',item:'potion'}),true);assert.equal(p.hp,310);assert.equal(p.gold,gold-ITEMS.potion.cost);assert.equal(g.stockFor(p).potion,stock-1);assert.deepEqual(p.consumables,bags);assert.equal(p.potionUntil,10);
 const paid=p.gold;assert.equal(g.command('a',{type:'item',item:'potion'}),false);assert.equal(p.gold,paid);assert.match(g.commandFailureReason,/recarga/);g.time=11;p.hp=p.maxHp;assert.equal(g.command('a',{type:'item',item:'potion'}),false);assert.equal(p.gold,paid);assert.match(g.commandFailureReason,/Vida cheia/);
});
test('shops open directly on equipment, keep stock purchase affordances and expose the immediate-use outcome',()=>{
 const {g,p}=setup('smith');const smith=npcShopMarkup(p,'smith',g.snapshot());assert.match(smith,/data-service-slot="0"/);assert.doesNotMatch(smith,/data-npc-service="forge"/);assert.match(smith,/npc-shop-heading/);assert.doesNotMatch(smith,/npc-dialogue/);
 const service=equipmentServiceMarkup(p,'forge',g.snapshot(),{selectedIndex:2});assert.equal(equipmentServiceSelection(p,'forge',2),2);assert.match(service,/aria-pressed="true"/);assert.match(service,/id="upgrade-equipment"/);assert.match(service,/equipment-service-layout/);
 const state=g.snapshot();p.shopInteraction='books';assert.equal(npcProductState(p,'xpbook',state).immediate,true);const books=npcShopMarkup(p,'books',state,{selectedKey:'xpbook'});assert.match(books,/Usar ao comprar/);assert.match(books,/data-npc-select="xpbook"/);assert.match(books,/data-npc-buy="xpbook"/);
});

test('inventory inspection preserves consumables and equipment services choose another eligible item after a sale',()=>{
 const {g,p}=setup('books');p.inventory=[{key:'xpbook',charges:1},{key:'blade',level:1},{key:'armor',level:1}];
 assert.equal(equipmentServiceSelection(p,'inspect',0),0);const inspected=equipmentServiceMarkup(p,'inspect',g.snapshot(),{selectedIndex:0});assert.match(inspected,/data-service-slot="0"/);assert.match(inspected,/Concede 80 experiência/);
 assert.equal(equipmentServiceSelection(p,'forge',0),1);p.inventory[1]=null;assert.equal(equipmentServiceSelection(p,'forge',1),2);p.inventory[2]=null;assert.equal(equipmentServiceSelection(p,'forge',2),null);const empty=equipmentServiceMarkup(p,'forge',g.snapshot(),{selectedIndex:2});assert.match(empty,/Nenhum item compatível/);assert.doesNotMatch(empty,/id="upgrade-equipment"/);
});
