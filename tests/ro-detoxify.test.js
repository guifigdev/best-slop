import test from 'node:test';
import assert from 'node:assert/strict';
import {RO_SKILLS} from '../shared/ragnarok-jobs.js';
import {roSkillMaxRank,roNormalizeSkillRanks} from '../shared/ro-skill-ranks.js';
import {roSkillOfferPool} from '../shared/ro-skill-offers.js';
import {castRoUtilitySkill,roUtilitySkillReadiness} from '../shared/ro-skill-mechanics.js';
import {roSkillManaCost} from '../shared/ro-skill-controls.js';
test('Detoxify is native level one, removes only poison and cannot heal or clear movement debuffs',()=>{
 const skill=RO_SKILLS.tf_detoxify,u={hp:40,maxHp:100,mana:20,maxMana:20,bonkPoisonUntil:15,bonkPoisonTicks:5,bonkWebUntil:20,webbedUntil:20,dots:{poison:{until:15}}},game={bonk:{elapsed:10,stage:'playing'},units:[u]};assert.equal(roSkillMaxRank(skill),1);assert.equal(roSkillManaCost(skill,1),10);assert.ok(castRoUtilitySkill(game,u,skill,1,{}));assert.equal(u.hp,40);assert.equal(u.bonkPoisonUntil,10);assert.equal(u.bonkPoisonTicks,0);assert.equal(u.bonkWebUntil,20);assert.equal(u.webbedUntil,20);assert.equal(u.dots.poison,undefined);assert.equal(roUtilitySkillReadiness(game,u,skill).ready,false,'hurt health and slow alone cannot autocast Detoxify');
});
test('old overlevelled Detoxify saves normalize to level one and it cannot appear as another upgrade',()=>{
 const u={roLineage:'shadowcross',roSkillMode:'class',roTier:0,bonkBuild:{weapons:{basic:1,tf_detoxify:8},tomes:{},relics:{}}};roNormalizeSkillRanks(u,RO_SKILLS);assert.equal(u.bonkBuild.weapons.tf_detoxify,1);assert.ok(!roSkillOfferPool(u).some(e=>e.key==='tf_detoxify'));assert.equal(roSkillMaxRank(RO_SKILLS.tf_sprinklesand),1);assert.equal(roSkillMaxRank(RO_SKILLS.tf_double),8);
});
