import {roWorldAtlasMarkup} from '../src/ro-world-atlas.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {bonkStats} from '../shared/bonk.js';
import {RO_SKILLS,RO_LINEAGES,roBasicAttack} from '../shared/ragnarok-jobs.js';
import {roSkillOfferPool,drawRoSkillOffers} from '../shared/ro-skill-offers.js';
import {createRoEquipment,roEquip,RO_LOOT_RATES,rollRoLoot} from '../shared/ragnarok-equipment.js';
import {castRoUtilitySkill,applyRoSkillHit} from '../shared/ro-skill-mechanics.js';
import {roAttackProfile} from '../shared/ro-attack-catalog.js';
import {createRoCheckpoint,validateRoCheckpoint} from '../shared/ragnarok-save.js';
import {roSurvivorEnemyBudget} from '../shared/ro-survivor-balance.js';
import {RO_WORLD_ROUTE,roWorldRegion,roWorldGates} from '../shared/ro-world-route.js';
import {roExpansionSceneryParts} from '../src/ro-expansion-scenery.js';
const make=(options={})=>{const g=new Game(81,{mode:'bonk',bonkWorld:'dominion',...options});g.addPlayer('p','knight');return{g,u:g.player('p')};};
test('Ragnabonk critical chance belongs to equipped gear, bound enchantments and cards, never naked attributes or buffs',()=>{
 const {g,u}=make();u.attributes.luk=99;u.bonkBuild.relics.luckybell=20;u.roSkillBuffs=[{key:'test',until:100,modifiers:{crit:.25}}];assert.equal(bonkStats(u).crit,0);u.bonkBuild.tomes.crit=8;assert.equal(bonkStats(u).crit,.4);assert.deepEqual(u.bonkBuild.tomes,{});
 const ring=createRoEquipment('criticalring','crit-ring');u.roInventory.push(ring);assert.ok(roEquip(u,ring.id,'accessory'));assert.equal(bonkStats(u).crit,.45);
 u.roInventory[0].cards.push({id:'crit-card',key:'lunatic'});assert.ok(bonkStats(u).crit>.45);u.roEquipment.accessory=null;u.roEquipment.weapon=null;assert.equal(bonkStats(u).crit,0);
 assert.ok(roSkillOfferPool(u).some(o=>o.kind==='tome'&&o.key==='crit'&&o.itemId===u.roEquipment.armor));
});
test('normal equipment drops are more present and include critical gear without replacing monster-specific cards',()=>{
 let gear=0,crit=0;for(let i=0;i<10000;i++){const sequence=[(i+.5)/10000,(i%26+.5)/26];const drop=rollRoLoot(()=>sequence.shift()??.5,'poring');if(drop?.kind==='equipment'){gear++;if(['criticalring','katar'].includes(drop.key))crit++;}}
 assert.equal(gear,600);assert.ok(crit>20);assert.equal(RO_LOOT_RATES.card,.00015);assert.equal(RO_LOOT_RATES.bossCard,.0015);
 assert.deepEqual(rollRoLoot(()=>0,'poring'),{kind:'card',key:'poring'});
});
test('class-only offers cover every lineage and the authoritative chooser rejects skills outside the current offer',()=>{
 for(const key of Object.keys(RO_LINEAGES)){const {u}=make({bonkLineage:key,bonkSkillMode:'class'}),pool=roSkillOfferPool({...u,roTier:3}).filter(o=>o.kind==='weapon'&&o.key!=='basic');assert.ok(pool.length>20,key);assert.ok(pool.every(o=>RO_LINEAGES[key].skills.includes(o.key)));}
 const {g,u}=make({bonkSkillMode:'class'});g.command('p',{type:'bkReady'});u.bonkPendingLevels=1;g.bonk.stage='levelup';g.bonk.offer={choices:[]};assert.equal(g.command('p',{type:'bkChooseSkill',key:'stormgust'}),false);assert.equal(g.command('p',{type:'bkChooseSkill',key:'sm_magnum'}),false,'cannot select an eligible skill outside the drawn choices');g.bonk.offer.choices=[{...roSkillOfferPool(u).find(o=>o.kind==='weapon'&&o.key==='sm_magnum'),id:'drawn-magnum'}];assert.ok(g.command('p',{type:'bkChooseSkill',key:'sm_magnum'}));
 const mixed=make({bonkSkillMode:'mixed'});assert.equal(roSkillOfferPool(mixed.u).some(o=>o.key==='stormgust'),false);mixed.u.roTier=1;assert.ok(roSkillOfferPool(mixed.u).some(o=>o.key==='stormgust'));assert.equal(g.snapshotBonk().skillCatalog.some(s=>s.key==='stormgust'),false);
});
test('offers omit repetitive generic damage buffs while retaining elemental enchants, active areas, summons and support',()=>{
 const {u}=make();u.roTier=3;const pool=roSkillOfferPool(u),keys=new Set(pool.map(o=>o.key));for(const key of ['tr_pron_march','so_striking','sc_enervation'])assert.equal(keys.has(key),false,key);
 for(const key of ['sa_flamelauncher','as_enchantpoison','sm_magnum','am_cannibalize','mg_firewall','al_blessing'])assert.ok(keys.has(key),key);
 for(const key of ['bash','coldbolt','cartrevolution','am_cannibalize','tr_pron_march'])assert.notEqual(RO_SKILLS[key].name,RO_SKILLS[key].originalName);
});
test('eight-metre interaction radius agrees with the HUD and still rejects distant chests',()=>{
 const {g,u}=make();g.command('p',{type:'bkReady'});g.bonk.objects=[{id:'reach',type:'chest',x:u.x+7.9,z:u.z,cost:0,used:false}];assert.equal(g.snapshotBonk().nearestObject,'reach');assert.ok(g.command('p',{type:'bkInteract',object:'reach'}));g.bonk.objects=[{id:'far',type:'chest',x:u.x+8.1,z:u.z,cost:0,used:false}];assert.equal(g.command('p',{type:'bkInteract',object:'far'}),false);
});
test('axe basic is a delayed overhead ground strike with short real knockback and boss resistance',()=>{
 const {g,u}=make({bonkLineage:'meister'});g.command('p',{type:'bkReady'});g.units=[u];g.bonk.spawnAt=1e9;g.bonk.map.obstacles=[];u.x=0;u.z=0;u.bonkBuild.weapons={basic:1};u.bonkSkillAuto={basic:false};
 const enemy={id:g.id(),bonkEnemy:true,alive:true,hp:1000,maxHp:1000,x:0,z:3,armor:0,damage:0,speed:0,size:.8,collisionRadius:.4,bonkNextSpecial:1e9,bonkNextAttack:1e9};g.units.push(enemy);g.random=()=>.1;
 assert.ok(g.command('p',{type:'bkCast',key:'basic'}));assert.equal(enemy.hp,1000);for(let i=0;i<8;i++)g.tick(.05);assert.ok(enemy.hp<1000);assert.ok(enemy.z>4.5);assert.equal(roAttackProfile({type:'roAttack',skillKey:'basic',roLineage:'meister',roJob:'merchant'}).motion,'axeSlam');
 const boss={...enemy,bonkBoss:true,z:3};applyRoSkillHit(g,u,boss,roBasicAttack(u),1,{move:()=>assert.fail('bosses must resist axe displacement')});
});
test('new regions preserve the twelve saved indexes and their seeded entrances are reciprocal and reproducible',()=>{
 assert.equal(RO_WORLD_ROUTE.length,22);assert.equal(RO_WORLD_ROUTE[11].key,'valhalla');for(const key of ['lutie','toy-factory','clock-tower','thanatos-tower'])assert.ok(roWorldRegion(key));
 const a=roWorldRegion('payon-cave',51),b=roWorldRegion('payon-cave',52);assert.notDeepEqual(a.gates.map(g=>[g.x,g.z]),b.gates.map(g=>[g.x,g.z]));assert.deepEqual(a,roWorldRegion('payon-cave',51));
 for(const region of RO_WORLD_ROUTE)for(const gate of roWorldGates(region,[],[],51)){const back=roWorldRegion(gate.nextKey,51).gates.find(g=>g.nextKey===region.key);assert.ok(back);assert.equal(gate.axis==='x'?gate.z:gate.x,back.axis==='x'?back.z:back.x);}
 for(const style of ['snow-village','toy-factory','clockwork','thanatos']){const parts=roExpansionSceneryParts(style,{stone:1,wood:2,dark:3,glow:4});assert.ok(parts.length>60&&parts.length<=180);assert.ok(parts.every(p=>p.slice(0,8).every(Number.isFinite)));}
});
test('MVP budgets withstand more than ordinary enemies and remain independent of equipment or player DPS',()=>{
 for(const level of [1,25,60,100]){const common=roSurvivorEnemyBudget({key:'poring',level}),boss=roSurvivorEnemyBudget({key:'mistress',level,boss:true});assert.ok(boss.hp>common.hp*30);assert.ok(boss.damage>common.damage*3);assert.deepEqual(boss,roSurvivorEnemyBudget({key:'mistress',level,boss:true,dps:1e9}));}
});

test('Blessing supports nearby party members without stacking duplicate buffs or affecting distant players',()=>{
 const {g,u}=make(),ally={...u,id:999,x:u.x+3,roSkillBuffs:[]},far={...u,id:1000,x:u.x+30,roSkillBuffs:[]};g.units.push(ally,far);const skill=RO_SKILLS.al_blessing;
 assert.ok(castRoUtilitySkill(g,u,skill,1,{},{}));assert.ok(ally.roSkillBuffs.some(b=>b.key===skill.key));assert.equal(far.roSkillBuffs.length,0);assert.equal(castRoUtilitySkill(g,u,skill,1,{},{}),false);assert.equal(ally.roSkillBuffs.length,1);
});
test('old critical tome ranks migrate onto equipment without refund or lost progress and the atlas names all new regions',()=>{
 const {g,u}=make();g.command('p',{type:'bkReady'});u.bonkBuild.tomes.crit=3;const cp=createRoCheckpoint(g),restored=make();assert.ok(restored.g.command('p',{type:'bkRestore',checkpoint:cp}));assert.equal(restored.u.bonkBuild.tomes.crit,undefined);assert.equal(restored.u.bonkPendingLevels,0);assert.ok(Math.abs(bonkStats(restored.u).crit-.15)<1e-12);
 const html=roWorldAtlasMarkup({route:roWorldRegion('lutie'),clearedStages:[],visitedStages:[]});for(const text of ['Lutie','Fábrica de Brinquedos','Torre do Relógio','Torre de Thanatos','22 selos'])assert.ok(html.includes(text));assert.ok(!html.includes('undefined'));
});

test('one upgrade offer favours different combat roles instead of several equivalent physical projectiles',()=>{
 const {u}=make({bonkLineage:'meister',bonkSkillMode:'class'});for(let seed=0;seed<100;seed++){let n=seed;const cards=drawRoSkillOffers(u,()=>((n=Math.imul(n,1664525)+1013904223)>>>0)/4294967296),identities=cards.filter(c=>c.kind==='weapon').map(c=>{const d=c.key==='basic'?roBasicAttack(u):RO_SKILLS[c.key];return [d.kind,d.element,d.role||'attack'].join(':');});assert.equal(new Set(identities).size,identities.length);}
});
