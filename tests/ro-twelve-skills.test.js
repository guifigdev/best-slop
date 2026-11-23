import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {RO_SKILLS} from '../shared/ragnarok-jobs.js';
import {RO_ACTIVE_SLOT_COUNT,RO_EQUIPPED_SKILL_COUNT,roSkillSlots,roActiveSkillKeys,roEquipSkill} from '../shared/ro-skill-loadout.js';
import {createRoCheckpoint,validateRoCheckpoint} from '../shared/ragnarok-save.js';
import {roSkillDockMarkup} from '../src/ro-skill-dock.js';
import {roSkillLibraryMarkup} from '../src/ro-skill-library.js';
test('twelve equipped skills plus native attack have distinct slots, reserves and passives',()=>{
 const g=new Game(31,{mode:'bonk'});g.addPlayer('p','knight');const u=g.player('p'),keys=Object.keys(RO_SKILLS).filter(k=>RO_SKILLS[k].kind!=='passive').slice(0,14);u.bonkBuild.weapons={basic:1,...Object.fromEntries(keys.map(k=>[k,1]))};delete u.bonkSkillSlots;
 assert.equal(RO_EQUIPPED_SKILL_COUNT,12);assert.equal(RO_ACTIVE_SLOT_COUNT,13);assert.equal(roActiveSkillKeys(u).length,13);assert.equal(roSkillSlots(u)[0],'basic');assert.ok(roEquipSkill(u,keys[13],12));assert.equal(roSkillSlots(u)[12],keys[13]);assert.equal(roEquipSkill(u,keys[12],13),false);assert.equal(roEquipSkill(u,keys[12],0),false);
 const cp=createRoCheckpoint(g);assert.ok(cp);assert.equal(cp.hero.bonkSkillSlots.length,13);assert.ok(validateRoCheckpoint(cp));for(const length of [4,8]){const old=structuredClone(cp);old.hero.bonkSkillSlots=old.hero.bonkSkillSlots.slice(0,length);const restored=validateRoCheckpoint(old);assert.equal(restored.hero.bonkSkillSlots.length,13);assert.deepEqual(restored.hero.bonkSkillSlots.slice(0,length),old.hero.bonkSkillSlots);}
 const b=g.snapshotBonk(),html=roSkillDockMarkup(b.weapons,{mobilePage:2});assert.equal((html.match(/data-basic="false"/g)||[]).length,12);assert.equal((html.match(/data-basic="true"/g)||[]).length,1);assert.match(html,/data-mobile-page="2"/);assert.match(html,/9–12/);assert.match(html,/data-bk-cast="basic"/);assert.match(html,/<kbd>=<\/kbd>/);assert.match(roSkillLibraryMarkup(b,u),/até 12 habilidades/);
});
