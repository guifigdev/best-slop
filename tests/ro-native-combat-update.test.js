import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {RO_SKILLS} from '../shared/ragnarok-jobs.js';
import {roSkillRatio,roSkillDamageBudget,roNativeZonePlan,roSkillElement} from '../shared/ro-damage-formulas.js';
import {roSkillCooldown,roSkillAfterCast,roSkillAuto} from '../shared/ro-skill-controls.js';
import {castRoUtilitySkill} from '../shared/ro-skill-mechanics.js';
import {roMonsterProperties,roMonsterDamageMultiplier,roArmorPropertyMultiplier} from '../shared/ro-monster-properties.js';
import {RO_EQUIPMENT,createRoEquipment,roEquipmentBonuses,RO_LOOT_RATES} from '../shared/ragnarok-equipment.js';
import {bonkStats} from '../shared/bonk.js';
import {roMvpEnrageThreshold,roMvpReinforcementKeys,roNativeEnemySkills,tickRoNativeEnemyBehavior} from '../shared/ro-native-enemy-behavior.js';
import {roSurvivorEnemyBudget} from '../shared/ro-survivor-balance.js';
import {roMvpPatterns} from '../shared/ro-mvp-encounters.js';

test('LATAM equations use native rank, total attributes and base level without the previous generic rank multiplier',()=>{
 assert.equal(roSkillRatio(RO_SKILLS.bash,1),1.3);
 assert.equal(roSkillRatio(RO_SKILLS.bash,8),3.4);
 const meteor=RO_SKILLS.asc_meteorassault;
 assert.equal(roSkillRatio(meteor,3,{level:100},{attributes:{str:50}}),8.1);
 assert.equal(roSkillRatio(meteor,3,{level:150},{attributes:{str:50}}),12.15);
 assert.equal(roSkillDamageBudget(meteor,3,{level:100},{attributes:{str:50}}),243);
 assert.equal(roSkillDamageBudget(RO_SKILLS.tf_backsliding,8),0);
 assert.equal(roSkillDamageBudget(RO_SKILLS.hammerfall,8),0,'Hammer Fall is a stun, not an invented damage attack');
});
test('persistent fields preserve actual per-wave damage instead of dividing one native hit across an entire field',()=>{
 assert.deepEqual(roNativeZonePlan(RO_SKILLS.severerainstorm,5),{ticks:12,interval:.3,duration:3.6});
 assert.equal(roSkillDamageBudget(RO_SKILLS.stormgust,1,{level:100}),360);
 const psychic=roSkillDamageBudget(RO_SKILLS.psychicwave,3,{level:100},{attributes:{int:60},weaponType:'staff'});
 assert.equal(psychic,1170);
 assert.equal(roSkillDamageBudget(RO_SKILLS.psychicwave,3,{level:100},{attributes:{int:60},weaponType:'dagger'}),585);
 assert.equal(roSkillDamageBudget(RO_SKILLS.wz_meteor,3,{level:100}),225);
});
test('monster properties and weapon size penalties follow the LATAM record and armor properties carry real tradeoffs',()=>{
 const poring={ragnarokVisual:'poring'},d=roMonsterProperties(poring);assert.equal(d.size,'medium');assert.equal(d.element,'water');assert.equal(d.elementLevel,1);
 assert.equal(roMonsterDamageMultiplier(poring,'fire'),.9);assert.equal(roMonsterDamageMultiplier(poring,'lightning'),1.5);
 assert.equal(roMonsterDamageMultiplier(poring,'physical',{physical:true,weaponType:'dagger'}),.75);
 assert.equal(roArmorPropertyMultiplier('fire','fire'),.25);assert.equal(roArmorPropertyMultiplier('fire','water'),1.5);
 assert.equal(roSkillElement(RO_SKILLS.psychicwave),'physical','Psychic Wave starts neutral despite being magical');
 assert.equal(roSkillElement(RO_SKILLS.bash,{weaponElement:'water'}),'ice');
 assert.equal(roSkillElement(RO_SKILLS.tf_sprinklesand,{weaponElement:'fire'}),'earth');
});
test('zero-cooldown Back Slide moves without a target and cannot damage, proc or draw a fake attack',()=>{
 const u={id:1,alive:true,bonkHero:true,x:0,z:0,facing:0,bonkBuild:{weapons:{tf_backsliding:1}}},g={units:[u],bonk:{elapsed:5,stage:'playing'}},events=[];let hits=0;
 assert.equal(roSkillCooldown(RO_SKILLS.tf_backsliding,1,{haste:1}),0);
 assert.equal(roSkillAfterCast(RO_SKILLS.tf_backsliding,1),0);
 assert.equal(roSkillAuto(u,'tf_backsliding'),false,'a utility retreat must not constantly autocast with no enemies');
 assert.equal(castRoUtilitySkill(g,u,RO_SKILLS.tf_backsliding,1,{}, {damage:()=>hits++,effect:(type)=>events.push(type)}),true);
 assert.ok(u.z< -4);assert.equal(hits,0);assert.deepEqual(events,['sprint']);
});
test('skill bonuses, elemental resistance and refinement compose across several pieces; unequipping removes their contribution',()=>{
 const items=['build_19482','build_2115','build_470017'].map((key,i)=>createRoEquipment(key,'gear'+i)),u={roInventory:items,roEquipment:{head:'gear0',offhand:'gear1',shoes:'gear2'}};
 let stats=roEquipmentBonuses(u);assert.equal(stats.skillBonuses.WL_CHAINLIGHTNING.damage,0);assert.equal(stats.elementalResistance.fire,.2);assert.equal(stats.elementalPower.water,0);assert.equal(stats.fixedCastSeconds,0);
 items[0].refine=10;stats=roEquipmentBonuses(u);assert.equal(stats.skillBonuses.WL_CHAINLIGHTNING.damage,.6,'only the actual refinement activates its native bonus');
 delete u.roEquipment.head;stats=roEquipmentBonuses(u);assert.equal(stats.skillBonuses,undefined);assert.deepEqual(stats.elementalPower,{all:.05});assert.equal(stats.elementalResistance.fire,.2);
});
test('MVP rage samples once inside 20–40 percent and cannot stack reinforcements over a living wave',()=>{
 assert.equal(roMvpEnrageThreshold(()=>0),.2);assert.ok(roMvpEnrageThreshold(()=>1)<.4);
 const boss={id:1,bonkBoss:true,bonkEnemy:true,alive:true,bonkEnraged:true},g={bonk:{elapsed:20,encounter:{species:['poring','lunatic']}},units:[boss]};
 assert.deepEqual(roMvpReinforcementKeys(g,boss),Array.from({length:24},(_,i)=>i%2?'lunatic':'poring'));g.units.push({id:2,bonkEnemy:true,alive:true});assert.deepEqual(roMvpReinforcementKeys(g,boss),[]);g.units[1].alive=false;boss.roReinforceReadyAt=21;assert.deepEqual(roMvpReinforcementKeys(g,boss),[]);
 boss.roReinforceReadyAt=0;boss.ragnarokMvp='ifrit';g.bonk.encounter={species:[],habitat:'firecave'};const adds=roMvpReinforcementKeys(g,boss);assert.equal(adds.length,24);assert.ok(adds.every(k=>k!=='poring'&&k!=='lunatic'),'a boss-only floor summons its own natural habitat, not unrelated starter monsters');
});
test('native enemy skills belong to their actual monster and drive visible agility behavior',()=>{
 const beetle={id:2,roSourceId:1051,x:2,z:0,alive:true,bonkEnemy:true},u={id:1,x:0,z:0,alive:true},g={time:30,bonk:{elapsed:3},units:[u,beetle]};assert.ok(roNativeEnemySkills(beetle).includes('NPC_AGIUP'));assert.ok(!roNativeEnemySkills(beetle).includes('AL_DECAGI'));
 tickRoNativeEnemyBehavior(g,beetle,[u]);assert.equal(beetle.roNativeAgilityUntil,10);assert.equal(beetle.roNativeAgilityVisualUntil,37);
 const mvp={id:3,roSourceId:1086,ragnarokMvp:'goldenthiefbug',x:0,z:0,damage:100};const pattern=roMvpPatterns(mvp,u,0,10)[0];assert.equal(pattern.sourceAegis,'SM_MAGNUM');assert.equal(pattern.knockback,4.2);
});
test('encounters have fixed difficulty requirements and fewer monsters, rather than scaling against the player level or DPS',()=>{
 const low=roSurvivorEnemyBudget({key:'poring',activity:'tower',level:1}),high=roSurvivorEnemyBudget({key:'poring',activity:'tower',level:150,damage:1e9});assert.deepEqual(low,high);assert.ok(low.damage>30);assert.ok(roSurvivorEnemyBudget({key:'poring',activity:'tower',progress:50}).hp>low.hp*4);assert.deepEqual(RO_LOOT_RATES,{card:.005,bossCard:.005,equipment:.06});
});
test('magic never borrows physical critical chance after equipment and source category resolution',()=>{
 const g=new Game(17,{mode:'bonk',bonkLineage:'archmage'});g.addPlayer('p','mage');g.command('p',{type:'bkReady'});const u=g.player('p');g.units=[u];g.bonk.spawnAt=Infinity;g.bonk.objectives=[];g.bonk.bossSpawned=true;u.bonkBuild={weapons:{firebolt:1},tomes:{},relics:{}};u.bonkSkillSlots=['basic','firebolt'];u.bonkSkillAuto={firebolt:false};u.attributes.dex=99;u.attributes.int=99;u.mana=u.maxMana=1000;u.roInventory.push(createRoEquipment('build_21003','critical'));u.roEquipment.weapon='critical';g.random=()=>0;const e={id:999,alive:true,bonkEnemy:true,x:u.x+2,z:u.z,hp:99999,maxHp:99999,speed:0,damage:0,armor:0,bonkNextAttack:Infinity,bonkNextSpecial:Infinity};g.units.push(e);assert.ok(g.command('p',{type:'bkCast',key:'firebolt'}));for(let i=0;i<80;i++)g.tick(.05);const hits=g.effects.filter(f=>f.type==='damage'&&f.target===e.id);assert.ok(e.hp<99999);assert.ok(hits.every(f=>!f.critical));assert.ok(Number.isFinite(bonkStats(u).damage));
});

test('jumping evades airborne MVP attacks; the same telegraph damages a grounded player',()=>{
 for(const jumping of [false,true]){const g=new Game(17,{mode:'bonk'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p');g.bonk.spawnAt=Infinity;g.bonk.objectives=[];g.bonk.bossSpawned=true;u.bonkBuild.weapons={};u.bonkInvulnerableUntil=0;u.bonkJumpHeight=jumping?1.5:0;u.bonkJumpVelocity=jumping?3:0;g.random=()=>.99;const e={id:999,alive:true,bonkEnemy:true,x:u.x+20,z:u.z,hp:1000,maxHp:1000,speed:0,damage:0,bonkNextAttack:Infinity,bonkNextSpecial:Infinity};g.units=[u,e];g.bonk.warnings=[{id:900,source:e.id,x:u.x,z:u.z,shape:'circle',radius:5,damage:40,element:'fire',fireAt:0,airborneAvoidable:true,groundedOnly:false}];const hp=u.hp;g.tick(.05);assert.equal(u.hp<hp,!jumping);assert.equal(g.bonk.warnings.length,0);}
});


test('dodge never explodes or damages nearby enemies, including with Travelers Boots',()=>{
 const g=new Game(17,{mode:'bonk'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p');u.bonkBuild.relics.travelersboots=1;u.bonkDashReady=0;const e=g.units.find(e=>e.bonkEnemy);Object.assign(e,{x:u.x+1,z:u.z});const hp=e.hp;g.effects=[];assert.ok(g.command('p',{type:'bkDash'}));assert.equal(e.hp,hp);assert.deepEqual(g.effects.map(e=>e.type),['sprint']);assert.ok(!g.effects.some(e=>e.type==='fireball'||e.type==='abilityPulse'));assert.equal(u.bonkLastProc?.key,undefined);
});
