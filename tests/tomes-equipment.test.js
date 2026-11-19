import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {ITEMS,ATTRIBUTES,itemAt} from '../shared/catalog.js';
import {attributeCost} from '../shared/progression.js';
import {canEnchant,enchantAt,isEnchantable} from '../shared/enchantments.js';
import {transact} from './shop-fixture.js';
import {npcShopMarkup} from '../src/npc-shop-ui.js';
import {enchantingMarkup} from '../src/enchanting-ui.js';
import {lootMarkup} from '../src/loot-ui.js';

const setup=(mode='campaign')=>{const g=new Game(22,{mode});g.addPlayer('a');g.addPlayer('b');const p=g.player('a');p.gold=1e6;return{g,p};};

test('all eighteen tomes permanently add their exact stat and leave invested points, costs and potion cooldown intact',()=>{
 for(const attribute of Object.keys(ATTRIBUTES))for(const amount of [1,5,10]){
  const {g,p}=setup(),key=`tome_${attribute}_${amount}`,before={...p.totalAttributes},base={...p.attributes},points=p.attributePoints;
  assert.equal(transact(g,'a',{type:'item',item:key}),true);assert.deepEqual(p.totalAttributes,before,'buying does not consume the tome');
  p.potionUntil=999;assert.equal(g.command('a',{type:'use',slot:0}),true);
  for(const stat of Object.keys(ATTRIBUTES))assert.equal(p.totalAttributes[stat],before[stat]+(stat===attribute?amount:0));
  assert.deepEqual(p.attributes,base);assert.equal(attributeCost(p.attributes[attribute]),attributeCost(base[attribute]));assert.equal(p.attributePoints,points);assert.equal(p.potionUntil,999);assert.equal(p.inventory[0],null);
  g.restoreHeroes();assert.equal(p.totalAttributes[attribute],before[attribute]+amount);assert.equal(g.snapshot().units.find(u=>u.id===p.id).tomeAttributes[attribute],amount);
 }
});

test('tomes stack to three and cannot be consumed during Survival combat or enchant/upgrade as equipment',()=>{
 const {g,p}=setup();for(let i=0;i<3;i++)assert.ok(transact(g,'a',{type:'item',item:'tome_vit_1'}));assert.equal(p.inventory[0].charges,3);
 assert.equal(transact(g,'a',{type:'upgradeItem',slot:0}),false);assert.equal(transact(g,'a',{type:'enchantItem',slot:0,enchantment:'fire'}),false);
 g.spawnWave();assert.equal(g.command('a',{type:'use',slot:0}),false);assert.equal(p.inventory[0].charges,3);
});

test('every new and existing weapon accepts attack enchants while armor accepts only elemental protection',()=>{
 for(const [key,item]of Object.entries(ITEMS).filter(([,v])=>v.slotType==='weapon')){
  const {g,p}=setup();assert.ok(transact(g,'a',{type:'item',item:key}));assert.ok(isEnchantable(key));assert.ok(transact(g,'a',{type:'enchantItem',slot:0,enchantment:'fire'}));assert.equal(p.enchantments.fire,1);assert.equal(canEnchant(key,'fireward'),false);
 }
 const {g,p}=setup();transact(g,'a',{type:'item',item:'runemail'});assert.equal(transact(g,'a',{type:'enchantItem',slot:0,enchantment:'fire'}),false);
 assert.ok(transact(g,'a',{type:'enchantItem',slot:0,enchantment:'fireward'}));assert.deepEqual(p.enchantments,{});assert.equal(p.wardResistances.fire,.15);
 assert.ok(transact(g,'a',{type:'upgradeItem',slot:0}));assert.equal(p.wardResistances.fire,enchantAt('fireward',2).resistance);
});

test('wards reduce direct, periodic and environmental elemental damage once, do not protect physical hits, and do not stack',()=>{
 const {g,p}=setup();p.inventory=[{key:'runemail',level:1,enchantment:'fireward'},{key:'shell',level:1,enchantment:'fireward'}];g.refresh(p);
 assert.equal(g.elementDamage(p,100,'fire'),85);assert.equal(g.elementDamage(p,100,'ice'),100);assert.equal(g.elementDamage(p,100,null),100);
 const hp=p.hp;g.hit(p,100,null,true,false,false,true,'fire','dot');assert.equal(hp-p.hp,85);
 p.inventory[0].enchantment='venomward';g.refresh(p);assert.equal(g.elementDamage(p,100,'poison'),85);assert.equal(g.elementDamage(p,100,'fire'),85);
 transact(g,'a',{type:'sell',slot:1});assert.equal(g.elementDamage(p,100,'fire'),100);
});

test('boss waves roll one owned weapon independently from skill loot; others, summons and repeated deaths cannot drop it',()=>{
 const {g,p}=setup();g.phase='wave';g.wave=10;g.random=()=>0;
 const boss=g.spawnEnemy('frog',p.x,p.z,{hp:10,damage:0,boss:'boss',skills:[],skillLevels:{},challenge:p.challenge});
 g.hit(boss,10000,p,true);const drop=g.drops.find(d=>d.item);assert.ok(drop);assert.equal(drop.owner,'a');assert.equal(drop.level,1);assert.ok(canEnchant(drop.item,'fire'));
 assert.equal(g.command('b',{type:'claimLoot',dropId:drop.id}),false);g.monsterLoot(boss,p);assert.equal(g.drops.filter(d=>d.item).length,1);
 p.inventory=Array.from({length:6},()=>({key:'armor',level:1}));assert.equal(g.command('a',{type:'claimLoot',dropId:drop.id}),false);assert.ok(g.drops.includes(drop));p.inventory[2]=null;
 assert.ok(g.command('a',{type:'claimLoot',dropId:drop.id}));assert.equal(p.inventory[2].key,drop.item);assert.equal(g.command('a',{type:'claimLoot',dropId:drop.id}),false);
 for(const [wave,boss,summon,roll]of [[9,'boss',false,0],[10,'miniboss',false,0],[10,null,false,0],[10,'boss',true,0],[10,'boss',false,.99]]){g.wave=wave;g.random=()=>roll;const t=g.spawnEnemy('frog',p.x,p.z,{hp:10,damage:0,boss,summon,skills:[],challenge:p.challenge});g.hit(t,10000,p,true);assert.equal(g.drops.filter(d=>d.item).length,0);}
});

test('Hugin shows all eighteen tomes, Freya exposes owned equipment directly, and boss rewards are claimable in the loot panel',()=>{
 const {g,p}=setup();let html=npcShopMarkup(p,'books',g.snapshot());assert.equal((html.match(/data-npc-buy="tome_/g)||[]).length,18);
 p.shopInteraction='enchanter';p.inventory=[{key:'solar',level:1},{key:'runemail',level:1}];html=npcShopMarkup(p,'enchanter',g.snapshot());assert.match(html,/data-service-slot="0"/);assert.match(html,/data-service-slot="1"/);
 const weapon=enchantingMarkup(p,0,g.snapshot()),armor=enchantingMarkup(p,1,g.snapshot());assert.match(weapon,/data-enchant="fire"/);assert.doesNotMatch(weapon,/data-enchant="fireward"/);assert.match(armor,/data-enchant="fireward"/);assert.doesNotMatch(armor,/data-enchant="fire"/);assert.doesNotMatch(armor,/NaN|undefined/);
 html=lootMarkup(p,[{id:1,item:'runesword',owner:'a',level:2,rarity:'epic',expires:90}],0,g.snapshot());assert.match(html,/Armas dos chefes/);assert.match(html,/data-claim="1"/);assert.match(html,new RegExp(itemAt('runesword',2).name));
});
