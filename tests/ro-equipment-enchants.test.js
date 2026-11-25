import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {bonkStats} from '../shared/bonk.js';
import {createRoCheckpoint} from '../shared/ragnarok-save.js';
import {RO_SKILLS} from '../shared/ragnarok-jobs.js';
import {RO_EQUIPMENT,createRoEquipment,initializeRoInventory,roUnequip,roEquip} from '../shared/ragnarok-equipment.js';
import {roSkillOfferPool} from '../shared/ro-skill-offers.js';
import {RO_ENCHANTMENTS as E,RO_ENCHANT_TYPES_PER_ITEM,validateRoEnchants,validateRoLegacyEnchants,roEnchantLevels,roEnchantOffers,applyRoEnchant,roMigrateEnchants,claimRoLegacyEnchant,roChaosRolls,roEnchantSnapshot} from '../shared/ro-equipment-enchants.js';
function unit(){const u={id:1,roTier:0,bonkBuild:{weapons:{basic:1},tomes:{},relics:{}}};initializeRoInventory(u,'dragonknight');return u;}
function game(lineage='dragonknight'){const g=new Game(81,{mode:'bonk',bonkLineage:lineage});g.addPlayer('p',lineage==='archmage'?'mage':'knight');g.command('p',{type:'bkReady'});const u=g.player('p');g.units=[u];g.bonk.spawnAt=Infinity;g.bonk.objectives=[];g.bonk.map.obstacles=[];g.obstacles=[];g.random=()=>0;return{g,u};}
const enemy=(g,u,extra={})=>({id:g.id(),bonkEnemy:true,dungeonSpecies:'rat',alive:true,team:100,x:u.x+2,z:u.z,hp:1000,maxHp:1000,damage:40,speed:0,armor:0,size:1,collisionRadius:.3,bonkNextAttack:Infinity,bonkNextSpecial:Infinity,...extra});
const wear=(u,enchants)=>{u.roInventory.find(i=>i.id===u.roEquipment.weapon).enchants={...enchants};};

test('equipment enchant catalog has twenty-six functional families, three independent types per piece and rejects forged payloads',()=>{
 assert.equal(Object.keys(E).length,26);assert.equal(RO_ENCHANT_TYPES_PER_ITEM,3);for(const key of ['damage','haste','amount','area','crit','magnet','vitality','speed'])assert.ok(E[key]);assert.ok(!E.silver);for(const definition of Object.values(E)){assert.ok(definition.name&&definition.description);assert.ok(Object.isFrozen(definition));}
 assert.deepEqual(validateRoEnchants(undefined),{});assert.deepEqual(validateRoEnchants({crit:8,magnet:1,area:2}),{crit:8,magnet:1,area:2});for(const invalid of [null,[],{damage:0},{damage:9},{damage:1.5},{silver:1},{damage:1,area:1,crit:1,speed:1},JSON.parse('{"__proto__":1}')])assert.equal(validateRoEnchants(invalid),null);assert.ok(validateRoLegacyEnchants({damage:8,area:8,crit:8,speed:8}));
});

test('only actual worn owned pieces contribute, duplicate slot references never multiply and repeated keys cap at rank eight',()=>{
 const u=unit(),weapon=u.roInventory[0],armor=u.roInventory[1];weapon.enchants={damage:6,crit:2};armor.enchants={damage:6};const spare=createRoEquipment('sword','spare');spare.enchants={haste:8};u.roInventory.push(spare);assert.deepEqual(roEnchantLevels(u),{damage:8,crit:2});u.roEquipment.offhand=weapon.id;assert.deepEqual(roEnchantLevels(u),{damage:8,crit:2});u.roEquipment.weapon='missing';assert.deepEqual(roEnchantLevels(u),{damage:6});assert.ok(!roEnchantOffers(u).some(o=>o.itemId==='spare'));u.roEquipment.weapon=spare.id;assert.equal(roEnchantLevels(u).haste,8);
});

test('apply and offers bind a real equipped target, allow upgrading three types and isolate a single physical copy',()=>{
 const u=unit(),weapon=u.roInventory[0];weapon.quantity=3;assert.equal(applyRoEnchant(u,'damage',weapon.id),true);assert.equal(weapon.quantity,undefined);assert.equal(u.roInventory.find(i=>i.id!==weapon.id&&i.key===weapon.key).quantity,2);assert.equal(u.roInventory.find(i=>i.id!==weapon.id&&i.key===weapon.key).enchants,undefined);assert.equal(applyRoEnchant(u,'haste',weapon.id),true);assert.equal(applyRoEnchant(u,'crit',weapon.id),true);assert.equal(applyRoEnchant(u,'area',weapon.id),false);assert.equal(applyRoEnchant(u,'damage',weapon.id),true);assert.equal(weapon.enchants.damage,2);const offers=roEnchantOffers(u);assert.ok(offers.every(o=>o.kind==='tome'&&o.itemName&&o.itemId));assert.ok(!offers.some(o=>o.itemId===weapon.id&&o.key==='area'));assert.equal(applyRoEnchant(u,'damage','missing'),false);roUnequip(u,'weapon');assert.equal(applyRoEnchant(u,'damage',weapon.id),false);
});

test('legacy tomes migrate once without refund or global bonus and excess ranks remain safely claimable',()=>{
 const u=unit();u.bonkBuild.tomes=Object.fromEntries(['damage','haste','amount','area','crit','magnet','vitality','speed'].map(k=>[k,8]));assert.equal(roMigrateEnchants(u),true);assert.deepEqual(u.bonkBuild.tomes,{});assert.equal(roEnchantSnapshot(u).length,6);assert.equal(Object.values(u.roLegacyEnchants).reduce((a,b)=>a+b,0),16);const before=JSON.stringify(u);assert.equal(roMigrateEnchants(u),false);assert.equal(JSON.stringify(u),before);const key=Object.keys(u.roLegacyEnchants)[0],piece=createRoEquipment('cap','rescue');u.roInventory.push(piece);roEquip(u,piece.id,'head');assert.equal(claimRoLegacyEnchant(u,key,piece.id),true);assert.equal(piece.enchants[key],8);assert.ok(!u.roLegacyEnchants[key]);assert.equal(claimRoLegacyEnchant(u,key,piece.id),false);
});

test('Chaos rolls always yield real combat stats, persist deterministically and stop contributing when the piece is removed',()=>{
 const seen=new Set();for(let id=0;id<200;id++)for(let rank=1;rank<=8;rank++){const item={id:'chaos:'+id,enchants:{chaos:rank}},rolls=roChaosRolls(item);assert.equal(rolls.length,rank);assert.deepEqual(rolls,roChaosRolls(JSON.parse(JSON.stringify(item))));for(const key of rolls){assert.ok(E[key],String(key));assert.ok(!['chaos','luck','xp','gold','magnet','curse'].includes(key));seen.add(key);}}assert.equal(seen.size,16);const u=unit();u.roInventory[0].enchants={chaos:8};assert.ok(Object.keys(roEnchantLevels(u)).length>1);roUnequip(u,'weapon');assert.deepEqual(roEnchantLevels(u),{});
});

test('a forged offhand cannot supply enchantments beside a two-handed weapon',()=>{
 const u=unit(),main=Object.values(RO_EQUIPMENT).find(i=>i.slot==='weapon'&&i.hands===2),off=Object.values(RO_EQUIPMENT).find(i=>i.slot==='offhand');assert.ok(main&&off);const a=createRoEquipment(main.key,'two-hands'),b=createRoEquipment(off.key,'forged-shield');a.enchants={damage:2};b.enchants={crit:8};u.roInventory.push(a,b);u.roEquipment.weapon=a.id;u.roEquipment.offhand=b.id;assert.deepEqual(roEnchantLevels(u),{damage:2});assert.ok(!roEnchantOffers(u).some(o=>o.itemId===b.id));assert.equal(applyRoEnchant(u,'area',b.id),false);
});

test('server choices use the offered item ID, reject a removed target and expose bound enchantments in snapshots',()=>{
 const {g,u}=game(),id=u.roEquipment.weapon,armor=u.roEquipment.armor;u.bonkPendingLevels=1;g.bonk.stage='levelup';g.bonk.offer={id:88,choices:[{id:'offered',kind:'tome',key:'crit',level:1,itemId:id}]};assert.equal(g.command('p',{type:'bkChoose',choiceId:'offered',itemId:armor}),true);assert.equal(u.roInventory.find(i=>i.id===id).enchants.crit,1);assert.ok(!u.roInventory.find(i=>i.id===armor).enchants);const snapshot=g.snapshotBonk();assert.deepEqual(snapshot.tomes,[]);assert.equal(snapshot.enchants[0].itemId,id);assert.equal(snapshot.enchants[0].level,1);assert.deepEqual(snapshot.build.tomes,{});
 u.bonkPendingLevels=1;g.bonk.stage='levelup';g.bonk.offer={id:89,choices:[{id:'stale',kind:'tome',key:'area',level:1,itemId:id}]};roUnequip(u,'weapon');assert.equal(g.command('p',{type:'bkChoose',choiceId:'stale'}),false);assert.equal(u.bonkPendingLevels,1);u.roSkillMode='class';assert.ok(roSkillOfferPool(u).filter(c=>c.kind==='weapon'&&c.key!=='basic').every(c=>RO_SKILLS[c.key]));
});

test('all stat families feed real survivor statistics and vanish with the enchanted equipment',()=>{
 const {u}=game(),id=u.roEquipment.weapon,base=bonkStats(u),checks={damage:'damage',haste:'haste',amount:'amount',area:'area',crit:'crit',magnet:'magnet',vitality:'maxHp',speed:'speed',xp:'xp',luck:'physicalAttack',armor:'armor',evasion:'evasion',lifesteal:'lifeSteal',shield:'shield',regen:'regen',duration:'duration',projectileSpeed:'projectileSpeed',knockback:'knockback',thorns:'thorns',gold:'gold',curse:'difficulty'};for(const [key,stat]of Object.entries(checks)){wear(u,{[key]:2});const current=bonkStats(u);assert.ok(current[stat]>base[stat],key+': '+stat);u.roEquipment.weapon=null;const removed=bonkStats(u);assert.equal(removed.enchantments[key],undefined);u.roEquipment.weapon=id;}wear(u,{});
});

test('projectile speed, lifesteal and knockback alter actual attacks and gold/XP alter actual pickups',()=>{
 const a=game('archmage'),target=enemy(a.g,a.u,{x:a.u.x+5});a.g.units.push(target);wear(a.u,{projectileSpeed:3});assert.ok(a.g.command('p',{type:'bkCast',key:'basic'}));assert.ok(a.g.bonk.projectiles[0].speed>15);const b=game();wear(b.u,{lifesteal:3,knockback:3});const victim=enemy(b.g,b.u);b.g.units.push(victim);b.u.hp=b.u.maxHp-30;const hp=b.u.hp,x=victim.x;assert.ok(b.g.command('p',{type:'bkCast',key:'basic'}));assert.ok(b.u.hp>hp);assert.ok(victim.x>x);
 const c=game();c.u.bonkBuild.weapons={};wear(c.u,{xp:2,gold:2});const gold=c.u.gold;c.g.bonk.pickups.push({id:c.g.id(),x:c.u.x,z:c.u.z,type:'gold',value:10,age:0},{id:c.g.id(),x:c.u.x,z:c.u.z,type:'xp',value:1,age:0});c.g.tick(.05);assert.ok(c.u.gold-gold>10);assert.ok(c.u.xp>1);
});

test('barriers absorb real attacks after regeneration and thorns harm the actual attacker',()=>{
 const {g,u}=game();u.bonkBuild.weapons={};wear(u,{shield:4,thorns:3});const target=enemy(g,u,{x:u.x+2,bonkNextAttack:Infinity});g.units.push(target);for(let i=0;i<105;i++)g.tick(.05);assert.ok(u.roEnchantShield>70);const hp=u.hp,enemyHp=target.hp;target.x=u.x+.6;target.bonkNextAttack=0;g.random=()=>.99;g.tick(.05);assert.equal(u.hp,hp);assert.ok(u.roEnchantShield<80);assert.ok(target.hp<enemyHp);roUnequip(u,'weapon');g.tick(.05);assert.equal(u.roEnchantShield,0);
});

test('enchants survive a real JSON checkpoint round trip bound to their physical piece',()=>{
 const {g,u}=game();wear(u,{crit:3,area:2,damage:1});u.roLegacyEnchants={haste:4};const saved=JSON.parse(JSON.stringify(createRoCheckpoint(g)));assert.ok(saved);const restored=game();restored.g.bonk.stage='preparation';assert.ok(restored.g.command('p',{type:'bkRestore',checkpoint:saved}));assert.deepEqual(roEnchantLevels(restored.u),{crit:3,area:2,damage:1});assert.deepEqual(restored.u.roLegacyEnchants,{haste:4});assert.equal(bonkStats(restored.u).crit,bonkStats(u).crit);
});

test('base level gains emit one aggregated angel event per XP packet with the updated real level',()=>{
 const {g,u}=game();u.bonkBuild.weapons={};g.effects=[];g.bonk.pickups.push({id:g.id(),x:u.x,z:u.z,type:'xp',value:100,age:0});g.tick(.05);assert.ok(u.level>2);const events=g.effects.filter(e=>e.type==='levelup'&&e.source===u.id);assert.equal(events.length,1);assert.equal(events[0].baseLevel,u.level);assert.equal(events[0].levels,u.level-1);assert.equal(events[0].duration,1.6);assert.ok(g.effects.filter(e=>e.type==='jobLevelup').length<=1);
});

test('duration extends a real defensive spell while Curse changes actual outgoing and incoming damage',()=>{
 const a=game();wear(a.u,{duration:3});a.u.bonkBuild.weapons.sm_endure=1;a.u.bonkSkillSlots=['basic','sm_endure',null,null,null,null,null,null];a.u.mana=1000;assert.ok(a.g.command('p',{type:'bkCast',key:'sm_endure'}));assert.ok(Math.abs(a.u.roSkillBuffs.find(b=>b.key==='sm_endure').until-a.g.bonk.elapsed-RO_SKILLS.sm_endure.mechanics.duration*1.3)<1e-10);
 function outgoing(cursed){const {g,u}=game();if(cursed)wear(u,{curse:3});const target=enemy(g,u);g.units.push(target);const hp=target.hp;assert.ok(g.command('p',{type:'bkCast',key:'basic'}));return hp-target.hp;}assert.ok(outgoing(true)<outgoing(false));
 function incoming(cursed){const {g,u}=game();u.bonkInvulnerableUntil=0;u.bonkBuild.weapons={};if(cursed)wear(u,{curse:3});const target=enemy(g,u,{x:u.x+.6,bonkNextAttack:0});g.units.push(target);g.random=()=>.99;const hp=u.hp;g.tick(.05);return hp-u.hp;}assert.ok(incoming(true)>incoming(false));
});

test('dropping and equipping a physical ground item removes and restores only its own enchantment bonuses',()=>{
 const {g,u}=game();wear(u,{crit:3,area:2});const id=u.roEquipment.weapon,crit=bonkStats(u).crit;assert.ok(crit>0);assert.ok(g.command('p',{type:'bkDrop',itemId:id}));assert.equal(bonkStats(u).crit,0);assert.equal(g.snapshotBonk().enchants.length,0);const dropped=g.bonk.pickups.find(p=>p.type==='equipment');assert.deepEqual(dropped.item.enchants,{crit:3,area:2});assert.ok(g.command('p',{type:'bkPickupEquip',pickup:dropped.id,slot:'weapon'}));assert.equal(bonkStats(u).crit,crit);assert.equal(g.snapshotBonk().enchants.length,2);
});
