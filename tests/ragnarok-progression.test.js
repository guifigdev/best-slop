import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {RO_LINEAGES,roJob,roBasicAttack,advanceRoJob} from '../shared/ragnarok-jobs.js';
import {createRoCheckpoint,validateRoCheckpoint,validateRoProgress} from '../shared/ragnarok-save.js';
import {roAccountSelection,saveRoCharacter} from '../src/ragnarok-account-ui.js';
import {bonkStats} from '../shared/bonk.js';
import {RO_CARDS,RO_EQUIPMENT,createRoEquipment} from '../shared/ragnarok-equipment.js';
import {RO_ENDLESS_FLOORS,RO_ENDLESS_SOURCE_IDS} from '../shared/ragnarok-endless-tower.js';
import {planRoTowerFloor} from '../shared/ragnarok-tower.js';
import {bonkEquipmentMarkup} from '../src/bonk-ui.js';
function game(lineage='dragonknight',activity='adventure'){const p=RO_LINEAGES[lineage],g=new Game(557,{mode:'bonk',bonkLineage:lineage,bonkActivity:activity});g.addPlayer('p',p.hero);return {g,u:g.player('p')};}
function tick(g,n=1){for(let i=0;i<n;i++)g.tick(.05);}
test('all twelve lineages start with native jobs, meaningful fixed attacks and four valid evolution tiers',()=>{
 assert.equal(Object.keys(RO_LINEAGES).length,12);
 for(const p of Object.values(RO_LINEAGES)){const {g,u}=game(p.key);assert.equal(u.bonkJob,p.jobs[0]);assert.equal(u.name,p.names[0]);assert.equal(u.bonkBuild.weapons.basic,1);assert.equal(u.bonkBuild.weapons[p.skills[0]],1);const signature=roBasicAttack(u);assert.ok(signature.damage>0&&signature.range>0&&signature.cooldown>0);assert.ok(u.hp>250);for(let tier=0;tier<4;tier++){advanceRoJob(u,tier);assert.equal(u.bonkJob,p.jobs[tier]);assert.equal(roJob(p.key,tier).name,p.names[tier]);}assert.equal(g.options.mode,'bonk');}
});
test('equipment changes stats while attack identity stays fixed, and permanent loadout cards require compatible slotted equipment',()=>{
 const {g,u}=game('windhawk'),before=roBasicAttack(u),stats=bonkStats(u),staff=createRoEquipment('staff','staff-test');u.roInventory.push(staff);assert.ok(g.command('p',{type:'bkEquip',itemId:staff.id,slot:'weapon'}));assert.equal(roBasicAttack(u).kind,before.kind);assert.equal(roBasicAttack(u).range,before.range);assert.equal(roBasicAttack(u).element,before.element);assert.ok(bonkStats(u).magicAttack>stats.magicAttack);
 const card=Object.values(RO_CARDS).find(c=>c.slot==='armor'&&c.stats.maxHp>0),base=bonkStats(u).maxHp;assert.ok(g.command('p',{type:'bkCards',cards:{armor:card.key}}));assert.ok(bonkStats(u).maxHp>base);assert.ok(g.command('p',{type:'bkDrop',itemId:u.roEquipment.armor}));assert.equal(bonkStats(u).maxHp,base);assert.equal(u.roCardLoadout.armor,card.key,'permanent collection selection survives dropping its temporary item');
});
test('Ragnarok attributes spend the same increasing costs as Custom Hero and affect authoritative health, attack and cadence',()=>{
 const {g,u}=game(),before=bonkStats(u),points=u.attributePoints;assert.ok(g.command('p',{type:'attribute',attribute:'vit'}));assert.equal(u.attributePoints,points-1);assert.ok(bonkStats(u).maxHp>before.maxHp);assert.ok(g.command('p',{type:'bkAttribute',attribute:'agi'}));assert.ok(bonkStats(u).haste>before.haste);const count=u.attributePoints;assert.equal(g.command('p',{type:'bkAttribute',attribute:'__proto__'}),false);assert.equal(u.attributePoints,count);
});
test('100 tower rosters preserve source composition and bounded random draws instead of replacing monsters or spawning the entire pool',()=>{
 assert.equal(RO_ENDLESS_FLOORS.length,100);for(let floor=1;floor<=100;floor++){const plan=planRoTowerFloor(floor,()=>0);assert.ok(plan.length>0);assert.ok(plan.every(m=>m.key&&m.sourceId&&m.count>0));if(!RO_ENDLESS_FLOORS[floor-1].randomGroups)assert.deepEqual(plan,RO_ENDLESS_FLOORS[floor-1].monsters);}
 assert.equal(planRoTowerFloor(99,()=>0).length,7*RO_ENDLESS_FLOORS[98].randomGroups.pool[0].monsters.length);assert.equal(planRoTowerFloor(100,()=>0).reduce((n,m)=>n+m.count,0),28);assert.ok(RO_ENDLESS_SOURCE_IDS.includes(1957));
 const {g,u}=game('archmage','tower');advanceRoJob(u,2);g.command('p',{type:'bkReady'});tick(g);assert.equal(g.bonk.activity,'tower');assert.equal(g.bonk.floor,1);assert.equal(u.roTier,2,'tower keeps the developed character class');const total=planRoTowerFloor(1).reduce((n,m)=>n+m.count,0);assert.equal(g.bonk.floorTotal,total);assert.equal(g.units.filter(e=>e.bonkEnemy).length+g.bonk.towerQueue.length,total);assert.ok(g.bonk.towerQueue.every(e=>RO_ENDLESS_FLOORS[0].monsters.some(m=>m.sourceId===e.sourceId)));
});
test('tower cannot finish early while another queued or living monster remains',()=>{
 const {g,u}=game('dragonknight','tower');g.command('p',{type:'bkReady'});g.bonk.towerQueue=[];g.units=[u];tick(g);assert.equal(g.bonk.stage,'cleared');assert.equal(g.bonk.clearedStages.length,1);assert.ok(g.command('p',{type:'bkNext'}));assert.equal(g.bonk.floor,2);tick(g);assert.equal(g.bonk.stage,'playing');assert.ok(g.bonk.towerQueue.length+g.units.filter(e=>e.bonkEnemy&&e.alive).length>0);
});
test('checkpoint resumes at a valid entrance and separate activities share latest character development without losing either position',()=>{
 const {g,u}=game();g.command('p',{type:'bkReady'});u.level=17;u.attributes.str=25;advanceRoJob(u,2);const adventure=createRoCheckpoint(g);let progress=saveRoCharacter({version:1,characters:[],selectedCharacter:null},{id:'hero-one',name:'Teste',lineage:u.roLineage,checkpoint:adventure,updatedAt:1});
 const tower=structuredClone(adventure);tower.activity='tower';tower.floor=46;tower.clearedStages=Array(45).fill('grove');tower.hero.level=21;progress=saveRoCharacter(progress,{id:'hero-one',name:'Teste',lineage:u.roLineage,checkpoint:tower,updatedAt:2});assert.ok(validateRoProgress(progress));
 const a=roAccountSelection({progress},{activity:'adventure',characterId:'hero-one',resume:true}),t=roAccountSelection({progress},{activity:'tower',characterId:'hero-one',resume:true});assert.equal(a.checkpoint.floor,1);assert.equal(a.checkpoint.hero.level,21);assert.equal(t.checkpoint.floor,46);assert.ok(a.resume&&t.resume);
 const resumed=game();assert.ok(resumed.g.command('p',{type:'bkRestore',checkpoint:t.checkpoint,activity:'tower'}));assert.equal(resumed.g.bonk.floor,46);assert.equal(resumed.u.level,21);assert.equal(resumed.u.bonkJob,'runeknight');assert.equal(resumed.u.attributes.str,25);
 const corrupt=structuredClone(tower);corrupt.hero.attributes.str=Infinity;assert.equal(validateRoCheckpoint(corrupt),null);corrupt.hero.attributes.str=999;assert.equal(validateRoCheckpoint(corrupt),null);assert.equal(validateRoCheckpoint({...tower,floor:101}),null);
});
test('inventory markup escapes gear IDs and exposes usable equip, drop, attributes and database links',()=>{
 const {g,u}=game();const html=bonkEquipmentMarkup(g.snapshotBonk(),u);assert.match(html,/data-bk-equip/);assert.match(html,/data-bk-drop/);assert.match(html,/data-bk-attribute/);assert.match(html,/divine-pride/);assert.ok(Object.values(RO_EQUIPMENT).every(d=>Number.isInteger(d.sourceId)&&d.source.includes(String(d.sourceId))));
});
