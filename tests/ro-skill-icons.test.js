import test from 'node:test';
import assert from 'node:assert/strict';
import {RO_SKILLS} from '../shared/ragnarok-jobs.js';
import {roOriginalSkillIcon,RO_SKILL_ICON_ASSETS} from '../src/ro-skill-icon-assets.js';
import {roSkillIcon,RO_CUSTOM_SKILL_ICONS} from '../src/ro-skill-icons.js';
import {roSkillLibraryMarkup} from '../src/ro-skill-library.js';
import {roSkillDockMarkup} from '../src/ro-skill-dock.js';
import {bonkUpgradeMarkup} from '../src/bonk-ui.js';
test('every Ragnarok skill has its own original or explicitly authored pixel icon',()=>{
 for(const [key,d] of Object.entries(RO_SKILLS)){assert.ok(RO_SKILL_ICON_ASSETS[key]||RO_CUSTOM_SKILL_ICONS[key],key);assert.match(roSkillIcon({...d,key}),new RegExp('data-ro-skill-icon="'+key+'"'));}
 const mage=['mg_sight','mg_napalmbeat','mg_safetywall','mg_soulstrike','coldbolt','firebolt','fireball','mg_firewall','mg_frostdiver','mg_thunderstorm','mg_lightningbolt'];
 assert.equal(new Set(mage.map(roOriginalSkillIcon)).size,mage.length);
});
test('dock, library, offers and stored skills identify the skill, not a reused generic effect',()=>{
 const entries=['mg_sight','firebolt','fireball','coldbolt','mg_soulstrike'].map(key=>({...RO_SKILLS[key],key,level:1})),data={weapons:[{key:'basic',level:1},...entries],learnedSkills:entries,skillCatalog:entries};
 const html=[roSkillDockMarkup(data.weapons),roSkillLibraryMarkup(data,{}),bonkUpgradeMarkup({choices:entries.map((e,i)=>({...e,id:String(i),kind:'weapon'}))})];
 for(const s of html)for(const e of entries)assert.ok(s.includes('data-ro-skill-icon="'+e.key+'"'),e.key);
});
