import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Game} from '../shared/simulation.js';
import {RO_SKILLS,advanceRoJob} from '../shared/ragnarok-jobs.js';
import {RO_EQUIPMENT,createRoEquipment,roEquip,roEquipmentBonuses,roMigrateBag} from '../shared/ragnarok-equipment.js';
import {roEquipmentRequiredLevel} from '../shared/ro-equipment-requirements.js';
import {roSkillIsAvailable} from '../shared/ro-skill-policy.js';
import {roSkillOfferPool} from '../shared/ro-skill-offers.js';
import {roBuildEquipmentPool} from '../shared/ro-build-loot.js';
import {roRollingCutterPose} from '../shared/ro-rolling-cutter.js';
import {createRoRollingCutterArt} from '../src/ro-rolling-cutter-art.js';
import {applyRoSkillHit} from '../shared/ro-skill-mechanics.js';
import {roFireImpacts} from '../src/ro-fire-impact-art.js';

test('database equipment levels block both hands and bonuses, preserve old items, and progression cannot bypass the level in drop pools',()=>{
 const item=createRoEquipment('build_13027','scalpel'),u={level:54,roLineage:'shadowcross',roTier:2,roInventory:[item],roEquipment:{},bonkBuild:{weapons:{}},roBagVersion:1};assert.equal(roEquipmentRequiredLevel(RO_EQUIPMENT[item.key]),55);assert.equal(roEquip(u,item.id,'weapon'),false);assert.equal(roEquip(u,item.id,'offhand'),false);u.roEquipment.weapon=item.id;assert.equal(roEquipmentBonuses(u).attack,0);roMigrateBag(u);assert.equal(u.roEquipment.weapon,null);assert.equal(u.roInventory[0].id,item.id);u.level=55;assert.ok(roEquip(u,item.id,'offhand'));assert.ok(roEquipmentBonuses(u).attack>0);
 for(const level of [1,20,55,100])for(const entry of roBuildEquipmentPool({level,roLineage:'shadowcross'},99))assert.ok(roEquipmentRequiredLevel(RO_EQUIPMENT[entry.key])<=level);
});
test('new skill learning obeys expedition base/job levels even on an early-evolved save',()=>{
 const u={bonkHero:true,roTier:2,roLineage:'shadowcross',roSkillMode:'class',level:31,roJobLevel:70,bonkBuild:{weapons:{basic:1}}};assert.equal(roSkillIsAvailable(u,RO_SKILLS.rollingcutter),false);assert.equal(roSkillOfferPool(u).some(e=>e.key==='rollingcutter'),false);u.level=99;assert.ok(roSkillIsAvailable(u,RO_SKILLS.rollingcutter));u.roTier=0;u.level=5;u.roJobLevel=1;assert.equal(roSkillIsAvailable(u,RO_SKILLS.envenom,2),false);u.roJobLevel=2;assert.ok(roSkillIsAvailable(u,RO_SKILLS.envenom,2));
});
test('Hammer Fall causes no damage or displacement, rolls the original stun chance and bosses resist it',()=>{
 const g=new Game(617,{mode:'bonk',bonkLineage:'meister'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p');advanceRoJob(u,1);u.level=50;u.bonkBuild.weapons={basic:1,hammerfall:5};u.mana=1000;g.bonk.map.obstacles=[];g.obstacles=[];g.random=()=>0;
 const e={id:900,bonkEnemy:true,alive:true,x:u.x,z:u.z+1.5,team:100,hp:10000,maxHp:10000,collisionRadius:.3};g.units=[u,e];assert.ok(g.command('p',{type:'bkCast',key:'hammerfall'}));assert.equal(e.hp,10000);assert.equal(e.z,u.z+1.5);assert.ok(e.roSkillStunUntil>=g.bonk.elapsed+4.5);assert.equal(g.effects.filter(e=>e.type==='damage').length,0);
 const boss={...e,bonkBoss:true,roSkillStunUntil:0};assert.equal(applyRoSkillHit(g,u,boss,RO_SKILLS.hammerfall,5),false);assert.equal(boss.roSkillStunUntil,0);const noProc={...e,roSkillStunUntil:0};g.random=()=>.99;assert.equal(applyRoSkillHit(g,u,noProc,RO_SKILLS.hammerfall,5),false);
});
test('Magnum Break shares its compact radius with visuals, excludes distant enemies and pushes gradually',()=>{
 const g=new Game(617,{mode:'bonk',bonkLineage:'dragonknight'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p');u.bonkBuild.weapons={basic:1,sm_magnum:1};u.mana=1000;g.bonk.map.obstacles=[];g.obstacles=[];g.random=()=>0;const enemy=(id,z)=>({id,bonkEnemy:true,alive:true,x:u.x,z:u.z+z,team:100,hp:10000,maxHp:10000,collisionRadius:.3,damage:0,speed:0,bonkNextAttack:Infinity,bonkNextSpecial:Infinity}),near=enemy(900,1.8),far=enemy(901,3);g.units=[u,near,far];assert.ok(g.command('p',{type:'bkCast',key:'sm_magnum'}));assert.ok(near.hp<10000);assert.equal(near.z,u.z+1.8);assert.ok(near.roImpactPush);assert.equal(far.hp,10000);const area=roFireImpacts({effects:g.effects,time:g.time},g.time).find(e=>e.type==='abilityPulse'&&e.source===u.id&&e.target==null);assert.equal(area.radius,2);
});
test('Axe Tornado spins the hero and physical weapon with wind for a full second and no returning projectile',()=>{
 const e={id:1,type:'roAttack',source:1,skillKey:'axetornado',time:1,spinStart:1,radius:2,range:2},u={id:1,bonkHero:true,alive:true,x:0,z:0,facing:0};const a=roRollingCutterPose(u,[e],1.2),b=roRollingCutterPose(u,[e],1.6);assert.equal(a.spinKind,'axe');assert.ok(b.turn>a.turn);assert.ok(roRollingCutterPose(u,[e],1.9));assert.equal(roRollingCutterPose(u,[e],2.1),null);assert.equal(RO_SKILLS.axetornado.kind,'pulse');assert.equal(RO_SKILLS.axetornado.returning,undefined);
 const scene=new T.Scene(),art=createRoRollingCutterArt({scene});try{art.update({units:[u],effects:[e]},1.3);assert.ok(art.stats().instances>48);assert.equal(art.stats().drawCalls,1);assert.equal(art.stats().planes,0);}finally{art.dispose();}
});

test('library unlocks refresh at the actual base-level threshold without changing the learned build or slots',()=>{
 const g=new Game(617,{mode:'bonk',bonkLineage:'shadowcross',bonkSkillMode:'class'});g.addPlayer('p','raccoon');g.command('p',{type:'bkReady'});const u=g.player('p');advanceRoJob(u,2);u.level=98;u.roJobLevel=10;u.bonkBuild.weapons={basic:1};assert.ok(!g.snapshotBonk('p').skillCatalog.some(s=>s.key==='rollingcutter'));u.level=99;assert.ok(g.snapshotBonk('p').skillCatalog.some(s=>s.key==='rollingcutter'));
});
