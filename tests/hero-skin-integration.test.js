import {customHeroAttackEffect} from '../src/hero-cosmetics.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {HEROES} from '../shared/catalog.js';
import {CUSTOM_HERO_IDENTITIES} from '../shared/hero-identities.js';
import {portrait,animalPortrait} from '../src/art.js';
import {nordicHeroPortrait} from '../src/nordic-hero-art.js';
import {Game} from '../shared/simulation.js';

const fields=['hp','mana','damage','armor','range','speed','interval','skill','focus','archetype','combatRole','attackType'];
const before={knight:[950,280,34,5,1.7,4.3,1.1,'stomp','str','physical_melee','guardian','physical'],mage:[650,520,28,1,7,4.1,1.35,'bolt','int','magic','arcanist','magic'],ranger:[740,340,30,2,8,4.9,.85,'multishot','dex','physical_ranged','archer','physical'],turtle:[1100,300,29,7,1.8,3.8,1.3,'thorns','vit','physical_melee','tank','physical'],owl:[690,560,26,2,7,4.4,1.4,'chain','int','magic','controller','magic'],raccoon:[800,320,32,3,1.8,4.8,.9,'critical','luk','physical_melee','assassin','physical']};
test('Nordic presentation preserves every existing base stat, archetype, initial skill and stable save key in both Custom Hero games',()=>{
 assert.deepEqual(Object.keys(HEROES).filter(key=>key!=='fenrir'),Object.keys(before));
 for(const [key,values]of Object.entries(before)){assert.deepEqual(fields.map(f=>HEROES[key][f]),values);assert.equal(HEROES[key].name,CUSTOM_HERO_IDENTITIES[key].name);for(const mode of ['campaign','linewars']){const g=new Game(1,{mode});assert.equal(g.addPlayer('p',key,HEROES[key].name),true);const p=g.player('p');assert.equal(p.hero,key);assert.equal(p.name,CUSTOM_HERO_IDENTITIES[key].name);assert.ok(p.skills.includes(HEROES[key].skill));}}
});
test('playable avatars use the exact new model projection and animal NPC portraits remain available independently',()=>{
 for(const key of Object.keys(HEROES)){assert.equal(portrait(key),nordicHeroPortrait(key));assert.notEqual(portrait(key),animalPortrait(key));assert.doesNotMatch(animalPortrait(key),/nordic-hero-portrait/);assert.doesNotMatch(portrait(key),/undefined|NaN/);}
 assert.match(animalPortrait('owl'),/#a68a65/);
});


test('new hero weapons project matching basic effects without changing authoritative events or native games',()=>{
 const event={type:'arrow',basicAttack:true,projectileKind:'scrap',source:4,amount:27,time:10,tx:3,tz:4},before=JSON.stringify(event);
 for(const hero of ['knight','turtle','raccoon']){const e=customHeroAttackEffect(event,{hero,range:1.8});assert.equal(e.type,'slash');assert.equal(e.amount,27);assert.equal(e.time,10);}
 assert.equal(customHeroAttackEffect(event,{hero:'mage',range:7}).projectileKind,'arcane');assert.equal(customHeroAttackEffect(event,{hero:'owl',range:7}).projectileKind,'arcane');assert.equal(customHeroAttackEffect(event,{hero:'ranger',range:8}).projectileKind,'arrow');assert.equal(JSON.stringify(event),before);
 for(const source of [{hero:'owl',castleBuilderKey:'north'},{hero:'mage',warlockCharacter:'heretic'},{hero:'knight',treeTagCharacter:'ent'},{hero:'knight',kodoTagCharacter:'runner'},{kind:'duck'}])assert.equal(customHeroAttackEffect(event,source),event);
 const skill={...event,basicAttack:false,skill:'poison'};assert.equal(customHeroAttackEffect(skill,{hero:'raccoon',range:1.8}),skill);
});
