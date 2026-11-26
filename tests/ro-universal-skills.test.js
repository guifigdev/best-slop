import {qualifiedRoTestHero} from './ro-qualified-fixture.js';
import {roSkillIsCurated} from '../shared/ro-skill-policy.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {RO_LINEAGES,RO_SKILLS} from '../shared/ragnarok-jobs.js';
import {roSkillOfferPool} from '../shared/ro-skill-offers.js';
import {roSkillLibraryEntries,roSkillLibraryMarkup} from '../src/ro-skill-library.js';
test('each lineage learns current and earlier class skills, unlocking the complete curated catalog after evolution',()=>{
 for(const lineage of Object.keys(RO_LINEAGES)){
  const u={roLineage:lineage,roTier:0,bonkBuild:{weapons:{basic:1},tomes:{},relics:{}}};
  const keys=new Set(roSkillOfferPool(u).filter(c=>c.kind==='weapon').map(c=>c.key));
  for(const key of Object.keys(RO_SKILLS).filter(k=>roSkillIsCurated(RO_SKILLS[k])&&RO_SKILLS[k].tier<=u.roTier))assert.ok(keys.has(key),lineage+':'+key);
 }
});
test('an evolved mage can learn an offered cross-class skill and equip it without a free catalog choice',()=>{
 const g=new Game(157,{mode:'bonk',bonkLineage:'archmage'});g.addPlayer('p','mage');g.command('p',{type:'bkReady'});const u=qualifiedRoTestHero(g.player('p'),{level:150,jobLevel:70});
 u.bonkPendingLevels=1;g.bonk.stage='levelup';g.bonk.offer={id:1,choices:[]};
 assert.equal(g.command('p',{type:'bkChooseSkill',key:'rollingcutter'}),false);u.roTier=2;assert.equal(g.command('p',{type:'bkChooseSkill',key:'rollingcutter'}),false,'eligible but absent from the current four choices');g.bonk.offer.choices=[{...roSkillOfferPool(u).find(o=>o.kind==='weapon'&&o.key==='rollingcutter'),id:'drawn-cutter'}];assert.equal(g.command('p',{type:'bkChooseSkill',key:'rollingcutter'}),true);assert.equal(u.bonkBuild.weapons.rollingcutter,1);assert.equal(u.roTier,2);
 assert.equal(g.command('p',{type:'bkEquipSkill',key:'rollingcutter',slot:2}),true);
 const b=g.snapshotFor('p').bonk;assert.equal(b.weapons[2].key,'rollingcutter');assert.equal(b.skillCatalog.length,Object.values(RO_SKILLS).filter(s=>roSkillIsCurated(s)&&s.tier<=2).length);
 assert.ok(b.skillCatalog.every(s=>s.available));
 const entries=roSkillLibraryEntries(b,u);assert.equal(entries.length,Object.values(RO_SKILLS).filter(s=>roSkillIsCurated(s)&&s.tier<=2).length);
 const html=roSkillLibraryMarkup(b,u);assert.equal((html.match(/data-ro-library-skill=/g)||[]).length,60);assert.match(html,/data-bk-skill-more/);
 const filtered=roSkillLibraryMarkup(b,u,{query:'Rolling Cutter'});assert.match(filtered,/rollingcutter/);assert.doesNotMatch(filtered,/data-bk-skill-more/);
});
