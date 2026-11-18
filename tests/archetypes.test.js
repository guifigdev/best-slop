import test from 'node:test';
import assert from 'node:assert/strict';
import {HEROES,SKILLS,skillAt} from '../shared/catalog.js';
import {ARCHETYPES,heroArchetype,skillCompatibility,canUseSkill} from '../shared/archetypes.js';
import {canLearnSkill,skillRequirement} from '../shared/skill-access.js';
import {Game} from '../shared/simulation.js';
import {canDistillSkillPoints} from '../shared/technique-system.js';

const hero=(type,level=60)=>({hero:type,level});
function setup(type='knight',mode='tower'){const g=new Game(17,{mode});assert.equal(g.addPlayer('p',type),true);const p=g.player('p');p.level=60;p.skillPoints=100;p.essence=100;return{g,p};}

test('all fifty-two skills and six heroes have explicit valid archetype metadata',()=>{
 assert.equal(Object.keys(SKILLS).length,52);assert.equal(Object.keys(HEROES).length,6);assert.deepEqual(Object.keys(ARCHETYPES).sort(),['magic','physical_melee','physical_ranged']);
 for(const [key,h]of Object.entries(HEROES)){assert.equal(heroArchetype(hero(key)),h.archetype);assert.ok(ARCHETYPES[h.archetype]);assert.equal(h.attackType,h.archetype==='magic'?'magic':'physical');assert.ok(h.combatRole);assert.equal(canLearnSkill(hero(key,1),h.skill),true);}
 for(const [key,s]of Object.entries(SKILLS)){assert.ok(['physical','magic','utility'].includes(s.skillStyle),key);assert.ok(s.allowedArchetypes.length>0,key);assert.equal(new Set(s.allowedArchetypes).size,s.allowedArchetypes.length);assert.ok(s.allowedArchetypes.every(a=>ARCHETYPES[a]),key);assert.ok(s.compatibilityLabel);assert.deepEqual(skillAt(key).allowedArchetypes,s.allowedArchetypes);for(const type of Object.keys(HEROES))assert.equal(canUseSkill(hero(type),key),s.allowedArchetypes.includes(HEROES[type].archetype),`${type}/${key}`);}
});

test('melee cleave and physical ranged multishot or bounce never cross styles or reach mages',()=>{
 for(const type of ['knight','turtle','raccoon']){assert.equal(canUseSkill(hero(type),'cleave'),true);assert.equal(canUseSkill(hero(type),'multishot'),false);assert.equal(canUseSkill(hero(type),'bounce'),false);}
 for(const key of ['multishot','bounce'])assert.equal(canUseSkill(hero('ranger'),key),true);assert.equal(canUseSkill(hero('ranger'),'cleave'),false);
 for(const type of ['mage','owl'])for(const key of ['cleave','multishot','bounce','bash','stomp','shockwave','dash','hornrush','critical','avatar','rage','battlecry'])assert.equal(canUseSkill(hero(type),key),false,`${type}/${key}`);
});

test('every offensive magical, summoning and magical support skill is exclusive to spellcasters',()=>{
 const commons=['vampiric','endurance','devotion','evasion','thorns','stonehide'];assert.deepEqual(Object.keys(SKILLS).filter(k=>SKILLS[k].allowedArchetypes.length===3).sort(),commons.sort());
 for(const key of Object.keys(SKILLS).filter(k=>SKILLS[k].skillStyle==='magic')){for(const type of ['knight','turtle','raccoon','ranger'])assert.equal(canUseSkill(hero(type),key),false,`${type}/${key}`);for(const type of ['mage','owl'])assert.equal(canUseSkill(hero(type),key),true);}
 for(const key of ['heal','freyjasgrace','shield','brilliance','blink','swap','icewall','summon','odinsravens','thorsgoats','freyjascat','helguard','warlockfire','warlockfrost'])assert.deepEqual(SKILLS[key].allowedArchetypes,['magic']);
 for(const type of Object.keys(HEROES))for(const key of commons)assert.equal(canUseSkill(hero(type),key),true);
 for(const key of ['stomp','shockwave']){assert.equal(SKILLS[key].damageType,'physical');for(const rank of SKILLS[key].levels){assert.ok(rank.atkCoefficient>0);assert.equal(rank.matkCoefficient,undefined);}}
});

test('compatibility ignores range and forged metadata but acquisition still respects every rank requirement',()=>{
 const mage={...hero('mage'),range:1,archetype:'physical_melee'},knight={...hero('knight'),range:99,archetype:'magic'};assert.equal(canUseSkill(mage,'bounce'),false);assert.equal(canUseSkill(mage,'bolt'),true);assert.equal(canUseSkill(knight,'cleave'),true);assert.equal(canUseSkill(knight,'bolt'),false);
 for(const [key,s]of Object.entries(SKILLS)){const type=Object.keys(HEROES).find(type=>s.allowedArchetypes.includes(HEROES[type].archetype));for(let rank=1;rank<=5;rank++){const level=skillRequirement(key,rank);assert.equal(canLearnSkill(hero(type,level),key,rank),true);assert.equal(canLearnSkill(hero(type,level-1),key,rank),false);assert.equal(canUseSkill(hero(type,1),key),true);}}
 const info=skillCompatibility(knight,'bolt');assert.equal(info.code,'incompatible-archetype');assert.ok(info.reason.includes('físico'));assert.equal(info.label,'Mágico');info.allowedArchetypes.push('physical_melee');assert.deepEqual(SKILLS.bolt.allowedArchetypes,['magic']);
 assert.equal(canUseSkill(null,'bolt'),false);assert.equal(canUseSkill({hero:'unknown'},'bolt'),false);assert.equal(canUseSkill(mage,'__proto__'),false);assert.equal(canUseSkill(mage,'missing'),false);
});

test('native monster and summon loadouts remain exempt from hero style restrictions',()=>{
 for(const unit of [{kind:'lion',level:1,range:1},{summon:true,level:1,range:10}])for(const key of Object.keys(SKILLS)){assert.equal(canUseSkill(unit,key),true);assert.equal(canUseSkill({...unit,range:0},key),true);}assert.equal(canUseSkill({kind:'lion'},'__proto__'),false);
});

test('every competition mode enforces skill purchases and permits lifesteal on both attack families',()=>{
 for(const mode of ['campaign','tower','best','war','linewars'])for(const type of Object.keys(HEROES)){const{g,p}=setup(type,mode),blocked=type==='mage'||type==='owl'?'multishot':'bolt',points=p.skillPoints,before=[...p.skills];assert.equal(g.command('p',{type:'buy',skill:blocked}),false,`${mode}/${type}`);assert.equal(p.skillPoints,points);assert.deepEqual(p.skills,before);assert.equal(g.command('p',{type:'buy',skill:'vampiric'}),true,`${mode}/${type}/vampiric`);assert.equal(p.skillLevels.vampiric,1);}
});

test('incompatible loot, forged upgrades and technique replacements reject atomically',()=>{
 for(const type of ['knight','mage','ranger']){const{g,p}=setup(type),key=type==='mage'?'cleave':'fireball';g.drops=[{id:700,owner:'p',skill:key,rarity:'heroic',expires:90}];const before=JSON.stringify({skills:p.skills,levels:p.skillLevels,cooldowns:p.cooldowns});assert.equal(g.command('p',{type:'claimLoot',dropId:700,slot:0}),false);assert.equal(g.drops.length,1);assert.equal(JSON.stringify({skills:p.skills,levels:p.skillLevels,cooldowns:p.cooldowns}),before);p.techniqueOffers=[key];assert.equal(g.command('p',{type:'chooseTechnique',skill:key,slot:0}),false);assert.deepEqual(p.techniqueOffers,[key]);assert.equal(g.swapTechniqueSlot(p,key,0,5),false);assert.equal(JSON.stringify({skills:p.skills,levels:p.skillLevels,cooldowns:p.cooldowns}),before);p.skills.push(key);p.skillLevels[key]=1;const points=p.skillPoints;assert.equal(g.command('p',{type:'buy',skill:key}),false);assert.equal(p.skillPoints,points);assert.equal(g.command('p',{type:'claimLoot',dropId:700}),false);assert.equal(p.skillLevels[key],1);}
});

test('discovery rolls and skill-point distillation cannot use incompatible forged loadouts',()=>{
 for(const type of Object.keys(HEROES)){const{g,p}=setup(type);assert.equal(g.command('p',{type:'rollTechniques'}),true);assert.equal(p.techniqueOffers.length,3);assert.ok(p.techniqueOffers.every(key=>canLearnSkill(p,key)));}
 const{g,p}=setup('knight');p.skills=['stomp','bash','dash','hornrush','critical','avatar','bolt'];p.skillLevels=Object.fromEntries(p.skills.map(k=>[k,5]));assert.equal(canDistillSkillPoints(p),false);const points=p.skillPoints,essence=p.essence;assert.equal(g.command('p',{type:'distillSkillPoint'}),false);assert.equal(p.skillPoints,points);assert.equal(p.essence,essence);
});
