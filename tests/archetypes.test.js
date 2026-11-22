import test from 'node:test';
import assert from 'node:assert/strict';
import {HEROES,SKILLS,skillAt} from '../shared/catalog.js';
import {ARCHETYPES,heroArchetype,skillCompatibility,canUseSkill} from '../shared/archetypes.js';
import {canLearnSkill,skillRequirement} from '../shared/skill-access.js';
import {Game} from '../shared/simulation.js';
import {canDistillSkillPoints} from '../shared/technique-system.js';
import {physicalSkillDamage} from '../shared/ability-rules.js';

const hero=(type,level=60)=>({hero:type,level});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
function setup(type='knight',mode='tower'){const g=new Game(17,{mode});assert.equal(g.addPlayer('p',type),true);const p=g.player('p');p.level=60;p.skillPoints=100;p.essence=100;return{g,p};}

test('all catalog skills retain descriptive damage metadata and seven canonical attack profiles',()=>{
 assert.equal(Object.keys(SKILLS).length,74);assert.equal(Object.keys(HEROES).length,7);assert.deepEqual(Object.keys(ARCHETYPES).sort(),['magic','physical_melee','physical_ranged']);
 for(const [key,h]of Object.entries(HEROES)){assert.equal(heroArchetype(hero(key)),h.archetype);assert.ok(ARCHETYPES[h.archetype]);assert.equal(h.attackType,h.archetype==='magic'?'magic':'physical');assert.ok(h.combatRole);assert.equal(canLearnSkill(hero(key,1),h.skill),true);}
 for(const [key,s]of Object.entries(SKILLS)){assert.ok(['physical','magic','utility'].includes(s.skillStyle),key);assert.equal(new Set(s.allowedArchetypes).size,s.allowedArchetypes.length);assert.ok(s.allowedArchetypes.every(a=>ARCHETYPES[a]),key);assert.ok(s.compatibilityLabel);assert.deepEqual(skillAt(key).allowedArchetypes,s.allowedArchetypes);for(const type of Object.keys(HEROES))assert.equal(canUseSkill(hero(type),key),s.allowedArchetypes.includes(HEROES[type].archetype),`${type}/${key}`);}
});

test('only cleave needs a melee weapon; multishot and bounce accept archers and casters',()=>{
 for(const type of ['knight','turtle','raccoon']){assert.equal(canUseSkill(hero(type),'cleave'),true);assert.equal(canUseSkill(hero(type),'multishot'),false);assert.equal(canUseSkill(hero(type),'bounce'),false);}
 for(const type of ['ranger','mage','owl']){for(const key of ['multishot','bounce'])assert.equal(canUseSkill(hero(type),key),true,`${type}/${key}`);assert.equal(canUseSkill(hero(type),'cleave'),false);}
 assert.equal(SKILLS.cleave.weaponRequirement,'melee');assert.equal(SKILLS.multishot.weaponRequirement,'ranged');assert.equal(SKILLS.bounce.weaponRequirement,'ranged');
});

test('every other technique allows physical, magical and tank hybrids without changing its damage scaling',()=>{
 for(const key of Object.keys(SKILLS).filter(key=>!['cleave','multishot','bounce'].includes(key)))for(const type of Object.keys(HEROES))assert.equal(canUseSkill(hero(type),key),true,`${type}/${key}`);
 for(const key of ['stomp','shockwave']){assert.equal(SKILLS[key].damageType,'physical');assert.equal(SKILLS[key].compatibilityLabel,'Dano físico');for(const rank of SKILLS[key].levels){assert.ok(rank.atkCoefficient>0);assert.equal(rank.matkCoefficient,undefined);}}
 for(const key of ['blink','fireball','shield','summon','gravity'])assert.equal(SKILLS[key].weaponRequirement,null);
});

test('forged range or role does not bypass weapon identity; levels and ultimate ranks remain required',()=>{
 const mage={...hero('mage'),range:1,archetype:'physical_melee'},knight={...hero('knight'),range:99,archetype:'magic'};assert.equal(canUseSkill(mage,'bounce'),true);assert.equal(canUseSkill(mage,'cleave'),false);assert.equal(canUseSkill(knight,'cleave'),true);assert.equal(canUseSkill(knight,'multishot'),false);assert.equal(canUseSkill(knight,'bolt'),true);
 for(const [key,s]of Object.entries(SKILLS)){const type=Object.keys(HEROES).find(type=>s.allowedArchetypes.includes(HEROES[type].archetype));for(let rank=1;rank<=5;rank++){const level=skillRequirement(key,rank);assert.equal(canLearnSkill(hero(type,level),key,rank),true);assert.equal(canLearnSkill(hero(type,level-1),key,rank),false);assert.equal(canUseSkill(hero(type,1),key),true);}}
 const info=skillCompatibility(knight,'multishot');assert.equal(info.allowed,false);assert.match(info.reason,/requer ataques à distância/);assert.equal(info.weaponRequirement,'ranged');info.allowedArchetypes.push('physical_melee');assert.deepEqual(SKILLS.multishot.allowedArchetypes,['physical_ranged','magic']);assert.equal(skillCompatibility(knight,'bolt').reason,null);
 assert.equal(canUseSkill(null,'bolt'),false);assert.equal(canUseSkill({hero:'unknown'},'bolt'),false);assert.equal(canUseSkill(mage,'__proto__'),false);assert.equal(canUseSkill(mage,'missing'),false);
});

test('native monster and summon loadouts remain exempt from hero weapon requirements',()=>{
 for(const unit of [{kind:'lion',level:1,range:1},{summon:true,level:1,range:10}])for(const key of Object.keys(SKILLS)){assert.equal(canUseSkill(unit,key),true);assert.equal(canUseSkill({...unit,range:0},key),true);}assert.equal(canUseSkill({kind:'lion'},'__proto__'),false);
});

test('all competition modes allow every hero to buy mixed offensive, support and tank techniques',()=>{
 for(const mode of ['campaign','tower','best','war','linewars'])for(const type of Object.keys(HEROES)){const{g,p}=setup(type,mode);for(const key of ['blink','fireball','vampiric','stomp']){assert.equal(g.command('p',{type:'buy',skill:key}),true,`${mode}/${type}/${key}`);assert.ok(p.skillLevels[key]>=1);}}
});

test('incompatible weapon loot, forged upgrades and replacement offers reject atomically',()=>{
 for(const [type,key]of [['knight','multishot'],['mage','cleave'],['ranger','cleave']]){const{g,p}=setup(type);g.drops=[{id:700,owner:'p',skill:key,rarity:'heroic',expires:90}];const before=JSON.stringify({skills:p.skills,levels:p.skillLevels,cooldowns:p.cooldowns});assert.equal(g.command('p',{type:'claimLoot',dropId:700,slot:0}),false);assert.equal(g.drops.length,1);assert.equal(JSON.stringify({skills:p.skills,levels:p.skillLevels,cooldowns:p.cooldowns}),before);p.techniqueOffers=[key];assert.equal(g.command('p',{type:'chooseTechnique',skill:key,slot:0}),false);assert.deepEqual(p.techniqueOffers,[key]);assert.equal(g.swapTechniqueSlot(p,key,0,5),false);p.skills.push(key);p.skillLevels[key]=1;const points=p.skillPoints;assert.equal(g.command('p',{type:'buy',skill:key}),false);assert.equal(p.skillPoints,points);assert.equal(g.command('p',{type:'claimLoot',dropId:700}),false);assert.equal(p.skillLevels[key],1);}
});

test('discovery includes legal hybrid skills and distillation accepts hybrid maximum-rank builds',()=>{
 for(const type of Object.keys(HEROES)){const{g,p}=setup(type);assert.equal(g.command('p',{type:'rollTechniques'}),true);assert.equal(p.techniqueOffers.length,3);assert.ok(p.techniqueOffers.every(key=>canLearnSkill(p,key)));}
 const{g,p}=setup('knight');p.skills=['stomp','bash','dash','hornrush','critical','avatar','bolt'];p.skillLevels=Object.fromEntries(p.skills.map(k=>[k,5]));assert.equal(canDistillSkillPoints(p),true);const points=p.skillPoints,essence=p.essence;assert.equal(g.command('p',{type:'distillSkillPoint'}),true);assert.equal(p.skillPoints,points-1);assert.equal(p.essence,essence+1);p.skills[6]='bounce';p.skillLevels.bounce=5;assert.equal(canDistillSkillPoints(p),false);assert.equal(g.command('p',{type:'distillSkillPoint'}),false);assert.equal(p.skillPoints,points-1);assert.equal(p.essence,essence+1);
});

test('a knight learns blink and fireball, pays mana and deals magical damage against MDEF rather than armor',()=>{
 const{g,p}=setup('knight');assert.equal(g.command('p',{type:'buy',skill:'blink'}),true);assert.equal(g.command('p',{type:'buy',skill:'fireball'}),true);g.phase='wave';g.wave=1;g.obstacles=[];p.x=0;p.z=0;g.refresh(p);p.mana=p.maxMana;const mana=p.mana,blink=skillAt('blink',1);assert.equal(g.cast(p,{slot:p.skills.indexOf('blink'),x:1,z:0}),true);near(p.mana,mana-blink.mana);near(p.x,1);
 const target=g.spawnEnemy('frog',1,4,{hp:100000,damage:0,skills:[]});target.armor=1000;target.magicDefense=30;target.evasion=target.perfectEvasion=1;const s=skillAt('fireball',1),raw=g.spellDamage(p,s.damage,'fire','fireball'),hp=target.hp,manaBefore=p.mana;assert.equal(g.cast(p,{slot:p.skills.indexOf('fireball'),x:target.x,z:target.z}),true);near(hp-target.hp,raw/1.9);near(p.mana,manaBefore-s.mana);assert.equal(p.attackType,'physical');assert.ok(g.effects.some(e=>e.type==='damage'&&e.magic&&e.source===p.id));
});

test('a caster learns physical skills whose ATK scaling and armor mitigation remain physical',()=>{
 const{g,p}=setup('mage');for(const key of ['shockwave','multishot'])assert.equal(g.command('p',{type:'buy',skill:key}),true);g.phase='wave';g.wave=1;g.obstacles=[];p.x=0;p.z=0;g.refresh(p);p.damage=100;p.magicAttack=99999;p.magicPower=50;p.mana=9999;const target=g.spawnEnemy('frog',0,4,{hp:100000,damage:0,skills:[]});target.armor=10;target.magicDefense=1000;target.evasion=target.perfectEvasion=1;
 for(const key of ['shockwave','multishot']){const s=skillAt(key,1),hp=target.hp;assert.equal(g.cast(p,{slot:p.skills.indexOf(key),x:target.x,z:target.z}),true);near(hp-target.hp,physicalSkillDamage(p,s.damage,s.atkCoefficient)/1.6);}assert.equal(p.attackType,'magic');assert.ok(g.effects.filter(e=>e.type==='damage'&&e.source===p.id).every(e=>!e.magic));
});
