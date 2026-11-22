import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {RO_LINEAGES,RO_SKILLS} from '../shared/ragnarok-jobs.js';
import {roSkillOfferPool} from '../shared/ro-skill-offers.js';
import {roSkillLibraryEntries,roSkillLibraryMarkup} from '../src/ro-skill-library.js';
test('every starting lineage can choose the entire survivor skill catalogue, including fourth jobs',()=>{
 for(const lineage of Object.keys(RO_LINEAGES)){
  const u={roLineage:lineage,roTier:0,bonkBuild:{weapons:{basic:1},tomes:{},relics:{}}};
  const keys=new Set(roSkillOfferPool(u).filter(c=>c.kind==='weapon').map(c=>c.key));
  for(const key of Object.keys(RO_SKILLS))assert.ok(keys.has(key),lineage+':'+key);
 }
});
test('a starting mage learns and equips Rolling Cutter through the actual improvement command',()=>{
 const g=new Game(157,{mode:'bonk',bonkLineage:'archmage'});g.addPlayer('p','mage');g.command('p',{type:'bkReady'});const u=g.player('p');
 u.bonkPendingLevels=1;g.bonk.stage='levelup';g.bonk.offer={id:1,choices:[]};
 assert.equal(g.command('p',{type:'bkChooseSkill',key:'rollingcutter'}),true);assert.equal(u.bonkBuild.weapons.rollingcutter,1);assert.equal(u.roTier,0);
 assert.equal(g.command('p',{type:'bkEquipSkill',key:'rollingcutter',slot:2}),true);
 const b=g.snapshotFor('p').bonk;assert.equal(b.weapons[2].key,'rollingcutter');assert.equal(b.skillCatalog.length,Object.keys(RO_SKILLS).length);
 assert.ok(b.skillCatalog.every(s=>s.available));
 const entries=roSkillLibraryEntries(b,u);assert.equal(entries.length,Object.keys(RO_SKILLS).length);
 const html=roSkillLibraryMarkup(b,u);assert.equal((html.match(/data-ro-library-skill=/g)||[]).length,60);assert.match(html,/data-bk-skill-more/);
 const filtered=roSkillLibraryMarkup(b,u,{query:'Rolling Cutter'});assert.match(filtered,/rollingcutter/);assert.doesNotMatch(filtered,/data-bk-skill-more/);
});
