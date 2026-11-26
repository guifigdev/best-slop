import {qualifiedRoTestHero} from './ro-qualified-fixture.js';
import test from 'node:test';import assert from 'node:assert/strict';
import {RO_LINEAGES,RO_SKILLS,roSkillTier} from '../shared/ragnarok-jobs.js';
import {roSkillOfferPool} from '../shared/ro-skill-offers.js';
import {roSkillIsAvailable} from '../shared/ro-skill-policy.js';
import {Game} from '../shared/simulation.js';
test('offers and the authoritative four-choice selection respect the current class stage in class and mixed modes',()=>{
 for(const roSkillMode of ['class','mixed'])for(const p of Object.values(RO_LINEAGES))for(let roTier=0;roTier<4;roTier++){
  const u={roLineage:p.key,roTier,roSkillMode,bonkBuild:{weapons:{basic:1},tomes:{},relics:{}}};for(const offer of roSkillOfferPool(u).filter(c=>c.kind==='weapon'&&c.key!=='basic')){const d=RO_SKILLS[offer.key];assert.ok((roSkillMode==='class'?roSkillTier(p.key,d.key):d.tier)<=roTier,offer.key);if(roSkillMode==='class')assert.ok(p.skills.includes(d.key));}
 }
 const g=new Game(71,{mode:'bonk',bonkLineage:'archmage'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=qualifiedRoTestHero(g.player('p'),{level:150,jobLevel:70});g.bonk.stage='levelup';g.bonk.offer={choices:[]};u.bonkPendingLevels=1;assert.equal(roSkillIsAvailable(u,RO_SKILLS.rk_sonicwave),false);assert.equal(g.command('p',{type:'bkChooseSkill',key:'rk_sonicwave'}),false);u.roTier=2;assert.equal(g.command('p',{type:'bkChooseSkill',key:'rk_sonicwave'}),false,'being eligible does not bypass the drawn offer');const offered=roSkillOfferPool(u).find(o=>o.kind==='weapon'&&o.key==='rk_sonicwave');assert.ok(offered);g.bonk.offer.choices=[{...offered,id:'drawn-wave'}];assert.ok(g.command('p',{type:'bkChooseSkill',key:'rk_sonicwave'}));
});
