import test from 'node:test';
import assert from 'node:assert/strict';
import {LOOT_RARITIES,rarityRoll,rarityWeights,lootDropChance,rarityMastery} from '../shared/rarity.js';
import {PERMANENT_ENCHANTS,permanentMethods,permanentStats,permanentEntries,permanentEnchantAt,permanentEnchantPrice,rollPermanentEnchant} from '../shared/permanent-enchants.js';

const rune=(key,id,level=1)=>({key,level,charges:1,permanentEnchant:{id,rarity:PERMANENT_ENCHANTS[id]?.rarity,seed:42,roll:99}});
function harness(){
 const hero={id:1,owner:'a',hero:'knight',team:1,instance:'A',alive:true,x:0,z:0,hp:1000,maxHp:1000,mana:100,maxMana:100,gold:10000,inventory:[],moving:false};
 const game={time:0,wave:1,phase:'wave',arena:'forest',options:{mode:'campaign'},serial:100,units:[hero],events:[],hits:[],refreshes:0,
  random:()=>0,id(){return++this.serial;},heroes(){return this.units.filter(u=>u.hero);},
  atShop(u,id){return u.shopInteraction===id&&u.alive&&(this.phase==='preparation'||this.options.mode==='linewars'&&this.phase==='wave')&&Math.hypot(u.x,u.z)<=2.7;},
  refresh(){this.refreshes++;},fx(type,x,z,data={}){this.events.push({type,x,z,...data});},
  canTarget(u,t){return !!(t?.alive&&t.id!==u.id&&t.team!==u.team&&t.instance===u.instance);},
  hit(t,amount,source,magic,reflect,critical,environment,element){if(!t.alive)return 0;const actual=Math.min(t.hp,Math.max(0,amount));t.hp-=actual;if(t.hp<=0)t.alive=false;this.hits.push({target:t.id,amount:actual,source:source?.id,magic,reflect,critical,environment,element});return actual;},
  heal(u,amount){const actual=Math.min(u.maxHp-u.hp,amount);u.hp+=actual;return actual;},
  applyDot(u,key,damage,duration,source){u.dots||={};const old=u.dots[key];u.dots[key]={damage:Math.max(old?.damage||0,damage),until:Math.max(old?.until||0,this.time+duration),next:old?.next??this.time+1,source:source.id};}
 };
 Object.assign(game,permanentMethods);
 const enemy=(id,x=1,extra={})=>{const target={id,team:2,instance:'A',alive:true,x,z:0,hp:1000,maxHp:1000,...extra};game.units.push(target);return target;};
 const step=dt=>{game.time+=dt;game.permanentTick(dt);};return{game,hero,enemy,step};
}

test('rarity base weights, loot rewards and mastery are explicit and deterministic',()=>{
 assert.deepEqual(rarityWeights(),{common:60,rare:25,epic:10,legendary:4,heroic:1});
 assert.deepEqual([0,.599,.6,.849,.85,.949,.95,.989,.99,1].map(r=>rarityRoll(()=>r)),['common','common','rare','rare','epic','epic','legendary','legendary','heroic','heroic']);
 assert.deepEqual(Object.values(LOOT_RARITIES).map(r=>r.essence),[1,2,3,5,8]);assert.deepEqual(Object.values(LOOT_RARITIES).map(r=>r.xp),[40,70,110,180,280]);
 assert.deepEqual(Object.keys(LOOT_RARITIES).map(rarityMastery),[1,1.05,1.1,1.15,1.2]);assert.equal(rarityMastery('unknown'),1);
});

test('late waves and bosses improve rarity distribution without removing any rarity',()=>{
 for(const boss of [false,'miniboss','boss'])for(const wave of [1,10,25,50,100]){const weights=rarityWeights({wave,boss});assert.ok(Object.values(weights).every(n=>n>0));assert.ok(Math.abs(Object.values(weights).reduce((a,b)=>a+b,0)-100)<.001);}
 assert.ok(rarityWeights({wave:50}).heroic>rarityWeights({wave:1}).heroic);assert.ok(rarityWeights({boss:'boss'}).heroic>rarityWeights().heroic);
 assert.equal(lootDropChance({wave:50}),.17);assert.equal(lootDropChance({wave:50,boss:'miniboss'}),.6);assert.equal(lootDropChance({wave:1,boss:'boss'}),1);
});

test('all permanent definitions are reachable and boot trails stay restricted to boots',()=>{
 assert.ok(Object.keys(PERMANENT_ENCHANTS).length>=15);const seen=new Set(),rolls={common:.1,rare:.7,epic:.9,legendary:.97,heroic:.995};
 for(const [rarity,r]of Object.entries(rolls)){const pool=Object.values(PERMANENT_ENCHANTS).filter(d=>d.rarity===rarity);for(let i=0;i<pool.length;i++){const values=[r,(i+.5)/pool.length];const result=rollPermanentEnchant('boots',()=>values.shift());assert.equal(result.rarity,rarity);seen.add(result.id);}}
 assert.equal(seen.size,Object.keys(PERMANENT_ENCHANTS).length);assert.equal(permanentEnchantAt('worldfire_steps','blade'),null);assert.ok(permanentEnchantAt('worldfire_steps','boots'));
 assert.equal(rollPermanentEnchant('potion',()=>0),null);assert.equal(permanentEnchantAt('__proto__'),null);
});

test('permanent forging charges once, preserves the elemental enchantment and records the authoritative roll',()=>{
 const {game,hero}=harness();game.phase='preparation';hero.shopInteraction='runemaster';hero.inventory=[{key:'blade',level:3,charges:1,enchantment:'fire',invested:700}];
 assert.equal(game.enchantPermanent(hero,{slot:0}),true);assert.equal(hero.gold,9200);assert.equal(hero.inventory[0].invested,1500);assert.equal(hero.inventory[0].enchantment,'fire');
 const record=hero.inventory[0].permanentEnchant;assert.ok(PERMANENT_ENCHANTS[record.id]);assert.equal(record.rarity,PERMANENT_ENCHANTS[record.id].rarity);assert.ok(Number.isInteger(record.seed));assert.ok(Number.isInteger(record.roll));assert.equal(game.refreshes,1);
 assert.equal(game.enchantPermanent(hero,{slot:0}),true);assert.equal(hero.gold,8400);assert.notEqual(hero.inventory[0].permanentEnchant,record);
 assert.deepEqual([1,2,3,4,5].map(permanentEnchantPrice),[500,650,800,950,1100]);
});

test('invalid phase, NPC, distance, slot, consumable or funds cannot spend gold or reroll',()=>{
 for(const reason of ['phase','npc','distance','slot','consumable','funds','dead']){const {game,hero}=harness();game.phase='preparation';hero.shopInteraction='runemaster';hero.inventory=[{key:'blade',level:1}];let slot=0,rolls=0;game.random=()=>{rolls++;return 0;};
  if(reason==='phase')game.phase='wave';if(reason==='npc')hero.shopInteraction='smith';if(reason==='distance')hero.x=10;if(reason==='slot')slot=-1;if(reason==='consumable')hero.inventory[0].key='potion';if(reason==='funds')hero.gold=499;if(reason==='dead')hero.alive=false;
  const gold=hero.gold;assert.equal(game.enchantPermanent(hero,{slot}),false,reason);assert.equal(hero.gold,gold);assert.equal(rolls,0);assert.equal(hero.inventory[0].permanentEnchant,undefined);
 }
});

test('Line Wars permits permanent forging only through the authoritative NPC check',()=>{
 const {game,hero}=harness();game.options.mode='linewars';hero.shopInteraction='runemaster';hero.inventory=[{key:'armor',level:1}];assert.equal(game.enchantPermanent(hero,{slot:0}),true);hero.x=9;assert.equal(game.enchantPermanent(hero,{slot:0}),false);
});

test('permanent stat aggregation is pure, ignores consumables and does not stack duplicate affixes',()=>{
 const {hero}=harness();hero.damage=100;hero.inventory=[rune('blade','keen_edge'),rune('armor','keen_edge'),rune('potion','god_hunger'),rune('unknown','god_hunger')];
 assert.equal(permanentEntries(hero).length,1);assert.equal(permanentStats(hero).damageFlat,8);assert.equal(permanentStats(hero).damageMultiplier,0);assert.equal(hero.damage,100);
 hero.inventory.push(rune('boots','god_hunger'));assert.equal(permanentStats(hero).damageMultiplier,4);assert.equal(permanentStats(hero).damageTaken,1);assert.equal(permanentStats(hero).moveSpeed,-.3);
});

test('incoming damage curses affect enemy attacks but not the wearer, allies or environment',()=>{
 const {game,hero,enemy}=harness();hero.inventory=[rune('blade','god_hunger')];assert.equal(game.permanentModifyDamage(hero,100,enemy(2)),200);assert.equal(game.permanentModifyDamage(hero,100,null),100);assert.equal(game.permanentModifyDamage(hero,100,hero),100);assert.equal(game.permanentModifyDamage(hero,100,{id:9,team:1}),100);
});

test('chain procs cap at three unique targets, respect instances and use weather instead of INT',()=>{
 const {game,hero,enemy}=harness();hero.magicPower=99;hero.inventory=[rune('blade','spark_thread')];game.arena='tempest';const first=enemy(2),second=enemy(3,2),third=enemy(4,3);enemy(5,1,{instance:'B'});enemy(6,4);
 game.permanentAttack(hero,first,20);assert.deepEqual(game.hits.map(h=>h.target),[first.id,second.id,third.id]);assert.ok(Math.abs(game.hits[0].amount-36)<1e-8);assert.ok(Math.abs(game.hits[1].amount-28.8)<1e-8);assert.ok(game.hits.every(h=>h.element==='lightning'&&!h.critical));
});

test('only the strongest chain category procs once; a slain primary can still anchor the jumps',()=>{
 const {game,hero,enemy}=harness();hero.inventory=[rune('blade','spark_thread'),rune('armor','sky_tyrant')];const first=enemy(2),second=enemy(3,2),third=enemy(4,3);first.alive=false;
 game.permanentAttack(hero,first,100);assert.deepEqual(game.hits.map(h=>h.target),[second.id,third.id]);assert.equal(game.hits[0].amount,90*.85);assert.equal(game.events.filter(e=>e.type==='bolt').length,3);
});

test('misses, zero effective damage and inactive phases cannot trigger a permanent attack effect',()=>{
 const {game,hero,enemy}=harness();hero.inventory=[rune('blade','spark_thread')];const target=enemy(2);game.permanentAttack(hero,target,0);assert.equal(game.hits.length,0);game.phase='preparation';game.permanentAttack(hero,target,10);assert.equal(game.hits.length,0);game.phase='wave';hero.alive=false;game.permanentAttack(hero,target,10);assert.equal(game.hits.length,0);
});

test('frost damage respects cold equipment resistance and Avatar prevents its slow',()=>{
 const {game,hero,enemy}=harness();hero.inventory=[rune('blade','winter_mark')];hero.magicPower=50;const target=enemy(2,1,{coldResist:.5});game.permanentAttack(hero,target,20);assert.equal(game.hits[0].amount,14);assert.equal(target.frostUntil,1.1);target.frostUntil=0;target.avatar=10;const hits=game.hits.length;game.permanentAttack(hero,target,20);assert.equal(game.hits.length,hits);assert.equal(target.frostUntil,0);
});

test('poison refreshes the existing effect without stacking or postponing the next pulse',()=>{
 const {game,hero,enemy}=harness();hero.inventory=[rune('blade','venom_rune')];const target=enemy(2);game.permanentAttack(hero,target,20);assert.equal(target.dots.poison.damage,6);assert.equal(target.dots.poison.next,1);game.time=.5;game.permanentAttack(hero,target,20);assert.equal(target.dots.poison.damage,6);assert.equal(target.dots.poison.next,1);assert.equal(target.dots.poison.until,4.5);
});

test('heal procs restore a fixed amount instead of multiplying by magic power',()=>{
 const {game,hero,enemy}=harness();hero.inventory=[rune('blade','life_pulse')];hero.hp=100;hero.magicPower=40;game.permanentAttack(hero,enemy(2),20);assert.equal(hero.hp,145);
});

test('life and mana curses pulse during combat and cannot damage in preparation',()=>{
 const {game,hero,step}=harness();hero.inventory=[rune('blade','god_hunger')];for(let i=0;i<10;i++)step(.1);assert.equal(hero.hp,970);assert.equal(hero.mana,90);assert.ok(game.hits[0].environment);assert.equal(game.hits[0].source,undefined);
 game.phase='preparation';step(2);assert.equal(hero.hp,970);assert.equal(hero.mana,90);assert.equal(game.permanentTrails.length,0);
});

test('boot trails hit ground enemies only and stop affecting a wearer’s previous instance',()=>{
 const {game,hero,enemy,step}=harness();hero.inventory=[rune('boots','ember_tracks')];hero.moving=true;const land=enemy(2,.5),air=enemy(3,.5,{flying:true}),other=enemy(4,.5,{instance:'B'});step(.1);assert.equal(land.hp,996);assert.equal(air.hp,1000);assert.equal(other.hp,1000);
 hero.moving=false;hero.instance='B';step(.5);assert.equal(other.hp,1000);assert.equal(land.hp,996);game.wave++;step(.5);assert.equal(game.permanentTrails.length,0);
});

test('overlapping trails use the strongest damage per team rather than multiplying patches',()=>{
 const {game,hero,enemy,step}=harness();hero.inventory=[rune('boots','ember_tracks')];hero.moving=true;game.units.push({...hero,id:10,inventory:[rune('boots','worldfire_steps')]});const target=enemy(2,.5);step(.1);assert.equal(target.hp,990);assert.equal(game.hits.filter(h=>h.target===target.id).length,1);
});

test('permanent trails are bounded per wearer and globally',()=>{
 const {game,hero,step}=harness();hero.inventory=[rune('boots','ember_tracks')];hero.moving=true;for(let i=0;i<24;i++)game.units.push({...hero,id:i+10,inventory:[rune('boots','ember_tracks')]});for(let i=0;i<15;i++)step(.7);assert.ok(game.permanentTrails.length<=60);for(const u of game.heroes())assert.ok(game.permanentTrails.filter(p=>p.source===u.id).length<=6);
});
