import {HEROES} from '../shared/catalog.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {skillShopMarkup} from '../src/skill-shop-ui.js';
import {lootMarkup} from '../src/loot-ui.js';
import {SHARED_STARTERS} from '../shared/skill-ownership.js';

const hero=extra=>({owner:'self',hero:'knight',name:'Bjorn',alive:true,level:1,skills:['stomp'],skillLevels:{stomp:1},skillPoints:1,essence:3,inventory:[],...extra});
function buttons(html){return [...html.matchAll(/<button\b([^>]*)>/g)].map(([,source])=>{const attributes={};for(const [,key,value]of source.matchAll(/([:\w-]+)(?:\s*=\s*"([^"]*)")?/g))attributes[key]=value??true;return attributes;});}
function action(html,attributes){const result=buttons(html).find(button=>Object.entries(attributes).every(([key,value])=>button[key]===String(value)));assert.ok(result,'Action exists: '+JSON.stringify(attributes));return result;}
const catalogButton=(html,key)=>action(html,{'data-buy':key});

test('catalog reservations show the rival safely and block learning, while an already-owned loot copy can upgrade',()=>{
 const p=hero({hero:'mage',level:40,skills:['bolt'],skillLevels:{bolt:1}}),state={phase:'wave',skillOwners:{blizzard:{owner:'rival',name:'<img src=x onerror=evil> "Rival"'}},units:[{owner:'rival',hero:'mage'}]};
 const markup=skillShopMarkup(p,state),button=catalogButton(markup,'blizzard');assert.equal(button['data-access'],'occupied');assert.equal(button.disabled,true);assert.equal(markup.includes('<img src=x'),false);assert.ok(markup.includes('&lt;img src=x'));assert.ok(markup.includes('skill-owner-avatar'));
 p.skills.push('blizzard');p.skillLevels.blizzard=1;p.skillOrigins={blizzard:'loot'};assert.equal(catalogButton(skillShopMarkup(p,state),'blizzard')['data-access'],'upgrade');
 p.level=9;assert.equal(catalogButton(skillShopMarkup(p,state),'blizzard')['data-access'],'level');p.level=40;p.skillPoints=0;assert.equal(catalogButton(skillShopMarkup(p,state),'blizzard')['data-access'],'points');
});

test('all six starter techniques remain shared even when a legacy snapshot reserves them to rivals',()=>{
 assert.equal(SHARED_STARTERS.length,6);const p=hero({skills:[],skillLevels:{}}),skillOwners=Object.fromEntries(SHARED_STARTERS.map(key=>[key,{owner:'rival',name:'Antigo dono'}])),markup=skillShopMarkup(p,{phase:'wave',skillOwners,units:[{owner:'rival',hero:'mage'}]});
 for(const key of SHARED_STARTERS){const type=Object.keys(HEROES).find(h=>HEROES[h].skill===key);const button=catalogButton(skillShopMarkup({...p,hero:type},{phase:'wave',skillOwners}),key);assert.equal(button.disabled,undefined,key);assert.equal(button['data-access'],'available',key);assert.ok(button['aria-label'].includes('compartilhada'),key);}
 assert.equal(markup.includes('Antigo dono'),false);assert.ok(markup.includes('Inicial compartilhada · 1 cópia por herói'));
 const learned=hero({skills:['critical'],skillLevels:{critical:1}}),upgraded=catalogButton(skillShopMarkup(learned,{phase:'wave',skillOwners}),'critical');assert.equal(upgraded['data-access'],'upgrade');assert.equal(upgraded.disabled,undefined);
});
test('ultimate acquisition and later upgrades unlock at their distinct hero levels',()=>{
 assert.equal(catalogButton(skillShopMarkup(hero({hero:'mage',level:9}),{phase:'wave'}),'blizzard').disabled,true);
 assert.equal(catalogButton(skillShopMarkup(hero({hero:'mage',level:10}),{phase:'wave'}),'blizzard').disabled,undefined);
 const trained=hero({hero:'mage',level:14,skills:['blizzard'],skillLevels:{blizzard:1}});assert.equal(catalogButton(skillShopMarkup(trained,{phase:'wave'}),'blizzard')['data-access'],'level');
 trained.level=15;const upgraded=catalogButton(skillShopMarkup(trained,{phase:'wave'}),'blizzard');assert.equal(upgraded.disabled,undefined);assert.equal(upgraded['data-access'],'upgrade');
});
test('a full build permits existing upgrades while preventing an eighth technique',()=>{
 const p=hero({hero:'mage',level:40,skills:['bolt','heal','chain','blizzard','shield','frostnova','poison'],skillLevels:{bolt:5,heal:1,chain:1,blizzard:1,shield:1,frostnova:1,poison:1}}),markup=skillShopMarkup(p,{phase:'wave'});
 assert.equal(catalogButton(markup,'heal').disabled,undefined);assert.equal(catalogButton(markup,'heal')['data-access'],'upgrade');assert.equal(catalogButton(markup,'blink')['data-access'],'slots');assert.equal(catalogButton(markup,'blink').disabled,true);assert.equal(catalogButton(markup,'bolt')['data-access'],'max');
});
test('no points, maximum rank and drop-only acquisition have separate actionable states',()=>{
 const noPoints=skillShopMarkup(hero({skillPoints:0}),{phase:'wave'});assert.equal(catalogButton(noPoints,'critical')['data-access'],'points');assert.ok(noPoints.includes('Golpe crítico'),'critical remains discoverable by its familiar name');
 const sourceOnly=skillShopMarkup(hero({hero:'mage',level:40}),{phase:'wave'});assert.equal(catalogButton(sourceOnly,'flamebreath')['data-access'],'drop');assert.equal(catalogButton(sourceOnly,'flamebreath').disabled,true);
 const learned=hero({hero:'mage',skills:['flamebreath'],skillLevels:{flamebreath:1}});assert.equal(catalogButton(skillShopMarkup(learned,{phase:'wave'}),'flamebreath').disabled,undefined);
 learned.skillLevels.flamebreath=5;learned.skillPoints=0;assert.equal(catalogButton(skillShopMarkup(learned,{phase:'wave'}),'flamebreath')['data-access'],'max');
});
test('loot respects ultimate level requirements without blocking recycling or duplicate XP conversion',()=>{
 const p=hero({level:10,skills:['avatar'],skillLevels:{avatar:5},skillRarities:{avatar:'common'}}),drop={id:42,skill:'avatar',expires:90,rarity:'heroic',essence:8,xp:280},markup=lootMarkup(p,[drop],1);
 assert.equal(action(markup,{'data-claim':42}).disabled,true);assert.ok(markup.includes('Herói Nv. 32 necessário'));assert.equal(action(markup,{'data-loot-recycle':42}).disabled,undefined);assert.equal(action(markup,{'data-loot-xp':42}).disabled,undefined);
 p.level=32;assert.equal(action(lootMarkup(p,[drop],1),{'data-claim':42}).disabled,undefined);
});
test('a new ultimate fragment cannot bypass its first acquisition level',()=>{
 const p=hero({level:11}),drop={id:43,skill:'avatar',expires:90,rarity:'common'},locked=buttons(lootMarkup(p,[drop],1)).filter(button=>button['data-claim']==='43');assert.ok(locked.length>0);assert.ok(locked.every(button=>button.disabled===true));
 p.level=12;assert.ok(buttons(lootMarkup(p,[drop],1)).filter(button=>button['data-claim']==='43').every(button=>!button.disabled));
});
test('essence offers retain inherited-rank requirements and respect another catalog holder',()=>{
 const p=hero({hero:'mage',level:10,skills:['bolt','heal','chain','blizzard','shield','frostnova','poison'],skillLevels:{bolt:5,heal:1,chain:1,blizzard:1,shield:1,frostnova:1,poison:1},techniqueOffers:['gungnir']}),markup=lootMarkup(p,[],1);
 assert.equal(action(markup,{'data-technique-choose':'gungnir','data-replace-slot':0}).disabled,true);assert.equal(action(markup,{'data-technique-choose':'gungnir','data-replace-slot':1}).disabled,undefined);
 const reserved=lootMarkup(p,[],1,{skillOwners:{gungnir:{owner:'rival',name:'Reserva antiga de rival'}}});assert.doesNotMatch(reserved,/data-technique-choose="gungnir"/);assert.ok(reserved.includes('Reserva antiga de rival'));
});
test('rendering access information does not mutate authoritative player or room state',()=>{
 const p=hero(),state={phase:'wave',skillOwners:{},units:[]},before=JSON.stringify({p,state});skillShopMarkup(p,state);lootMarkup(p,[],1,state);assert.equal(JSON.stringify({p,state}),before);
});

test('hybrid builds allow either damage school while melee and ranged mechanics retain their actual requirements',()=>{for(const type of ['knight','mage','ranger']){const markup=skillShopMarkup(hero({hero:type,level:40}),{phase:'wave'});assert.equal(catalogButton(markup,'multishot')['data-access'],type==='knight'?'archetype':'available');assert.equal(catalogButton(markup,'cleave')['data-access'],type==='knight'?'available':'archetype');for(const key of ['shockwave','fireball','vampiric'])assert.equal(catalogButton(markup,key)['data-access'],'available');}assert.match(skillShopMarkup(hero(),{phase:'wave'}),/Requer outro tipo de ataque/);});

test('an incompatible fragment or forged offer cannot present a learn action, while recycling remains available',()=>{const p=hero({techniqueOffers:['multishot']}),markup=lootMarkup(p,[{id:55,skill:'multishot',expires:90,rarity:'epic'}],1);assert.equal(buttons(markup).some(b=>b['data-claim']==='55'),false);assert.equal(buttons(markup).some(b=>b['data-technique-choose']==='multishot'),false);assert.equal(action(markup,{'data-loot-recycle':55}).disabled,undefined);assert.match(markup,/incompatível/);});


test('a Vampiric fragment ignores another hero legacy reservation and remains a free learn or single-slot upgrade',()=>{const p=hero({hero:'mage',skills:['bolt'],skillLevels:{bolt:1},skillPoints:0}),drop={id:61,skill:'vampiric',expires:90,rarity:'common'},state={skillOwners:{vampiric:{owner:'rival',name:'Reserva antiga'}}};let markup=lootMarkup(p,[drop],1,state);assert.equal(action(markup,{'data-claim':61,'data-replace':1}).disabled,undefined);assert.equal(markup.includes('Reserva antiga'),false);p.skills.push('vampiric');p.skillLevels.vampiric=1;markup=lootMarkup(p,[drop],1,state);const upgrade=action(markup,{'data-claim':61});assert.equal(upgrade.disabled,undefined);assert.equal(upgrade['data-replace'],'1');assert.ok(markup.includes('Melhorar técnica · 1 → 2'));});
