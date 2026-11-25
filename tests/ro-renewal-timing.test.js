import test from 'node:test';
import assert from 'node:assert/strict';
import {RO_SKILLS} from '../shared/ragnarok-jobs.js';
import {roAttackTiming} from '../shared/ro-attack-timing.js';
import {roSkillCastTime,roSkillCooldown,roSkillAfterCast,castRoSkill} from '../shared/ro-skill-controls.js';
import {createRoEquipment,roEquipmentBonuses} from '../shared/ragnarok-equipment.js';
import {bonkStats} from '../shared/bonk.js';
import {Game} from '../shared/simulation.js';
import {roSkillDockMarkup} from '../src/ro-skill-dock.js';
test('Renewal timing keeps variable, fixed, cooldown, postcast and ASPD as independent channels',()=>{
 const meteor=RO_SKILLS.asc_meteorassault,plain={attributes:{dex:0,int:0}};assert.deepEqual(roSkillCastTime(meteor,1,plain),{variable:.25,fixed:.25,total:.5});assert.equal(roSkillCooldown(meteor,1,plain),.5);assert.equal(roSkillAfterCast(meteor,1,plain),0);
 assert.equal(roSkillCastTime(meteor,1,{...plain,variableCastReduction:1}).total,.25);assert.equal(roSkillCastTime(meteor,1,{...plain,fixedCastSeconds:.25}).total,.25);assert.equal(roSkillCastTime(meteor,1,{attributes:{dex:265,int:0}}).variable,0);assert.equal(roSkillCooldown(meteor,1,{haste:99}),.5);assert.equal(roSkillCooldown(meteor,1,{cooldownReduction:.5}),.25);assert.equal(roSkillCooldown(RO_SKILLS.tf_backsliding,1,{haste:99}),0);
});
test('weapon, shield, dual wield and AGI/DEX drive native ASPD with an explicit delay and cap',()=>{
 const u={bonkJob:'assassin',roTier:2,roInventory:[createRoEquipment('knife','r'),createRoEquipment('sword','l'),createRoEquipment('buckler','s')],roEquipment:{weapon:'r'}},s={attributes:{agi:50,dex:30}},one=roAttackTiming(u,s);assert.ok(one.attackDelay>0);assert.ok(Math.abs(one.aspd-(200-one.attackDelay*50))<1e-8);u.roEquipment.offhand='l';assert.ok(roAttackTiming(u,s).attackDelay>one.attackDelay);u.roEquipment.offhand='s';assert.ok(roAttackTiming(u,s).attackDelay>one.attackDelay);delete u.roEquipment.offhand;assert.ok(roAttackTiming(u,{attributes:{agi:130,dex:130}}).attackDelay<one.attackDelay);const fast=roAttackTiming(u,s,{haste:1},{haste:8});assert.equal(fast.aspd,193);assert.equal(fast.attackDelay,.14);assert.equal(fast.attackMotion,.07);
});
test('timing enchantments are bound to worn gear, independently reduce their channel and disappear on unequip',()=>{
 const g=new Game(1,{mode:'bonk'});g.addPlayer('p','knight');const u=g.player('p'),plain=bonkStats(u),gear=u.roInventory.find(i=>i.id===u.roEquipment.armor);gear.enchants={variableCast:3,fixedCast:2,afterCast:4};let s=bonkStats(u);assert.ok(Math.abs(s.variableCastReduction-.3)<1e-10);assert.equal(s.fixedCastSeconds,.1);assert.equal(s.afterCastReduction,.32);delete u.roEquipment.armor;s=bonkStats(u);assert.equal(s.variableCastReduction,plain.variableCastReduction);assert.equal(s.fixedCastSeconds,plain.fixedCastSeconds);assert.equal(s.afterCastReduction,plain.afterCastReduction);
});
test('a basic attack cannot clear a longer global post-cast delay',()=>{
 const g=new Game(2,{mode:'bonk'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p');g.units.push({id:999,bonkEnemy:true,alive:true,x:u.x+1,z:u.z});u.roAfterCastUntil=10;u.roSkillActionUntil=0;u.bonkWeaponAt={};u.bonkSkillSlots=['basic'];const s=bonkStats(u);assert.ok(castRoSkill(g,u,'basic',s,()=>true).ok);assert.equal(u.roAfterCastUntil,10);assert.ok(u.roSkillActionUntil>0);
});
test('the HUD shows a short post-cast block even when native skill cooldown is zero',()=>{
 const html=roSkillDockMarkup([{key:'basic',name:'Ataque',ready:false,cooldown:0,cooldownRemaining:0,afterCast:.3,afterCastRemaining:.2,readyReason:'Pós-conjuração'}]);assert.ok(html.includes('Pós-conjuração · 0.2 s'));assert.ok(html.includes('>0.2</em>'));assert.ok(html.includes('--ro-cooldown:0.667'));assert.ok(!html.includes('NaN'));
});
test('two native Berzebub cards reduce variable casting without touching fixed casting or recast',()=>{
 const gear=['a','b'].map(id=>({...createRoEquipment('clip',id),cards:[{id:'card-'+id,key:'towercard_4145'}]})),stats=roEquipmentBonuses({roInventory:gear,roEquipment:{accessory:'a',accessory2:'b'}});assert.equal(stats.variableCastReduction,.6);const cast=roSkillCastTime(RO_SKILLS.asc_meteorassault,1,{...stats,attributes:{int:0,dex:0}});assert.equal(cast.variable,.1);assert.equal(cast.fixed,.25);assert.equal(roSkillCooldown(RO_SKILLS.asc_meteorassault,1,stats),.5);
});
