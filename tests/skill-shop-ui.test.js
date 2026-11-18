import test from 'node:test';
import assert from 'node:assert/strict';
import {skillShopMarkup} from '../src/skill-shop-ui.js';
import {lootMarkup} from '../src/loot-ui.js';
import {SHARED_STARTERS} from '../shared/skill-ownership.js';

const hero=extra=>({owner:'self',hero:'knight',name:'Bjorn',alive:true,level:1,skills:['stomp'],skillLevels:{stomp:1},skillPoints:1,essence:3,inventory:[],...extra});
function buttons(html){return [...html.matchAll(/<button\b([^>]*)>/g)].map(([,source])=>{const attributes={};for(const [,key,value]of source.matchAll(/([:\w-]+)(?:\s*=\s*"([^"]*)")?/g))attributes[key]=value??true;return attributes;});}
function action(html,attributes){const result=buttons(html).find(button=>Object.entries(attributes).every(([key,value])=>button[key]===String(value)));assert.ok(result,'Action exists: '+JSON.stringify(attributes));return result;}
const catalogButton=(html,key)=>action(html,{'data-buy':key});

test('catalog gives exclusive ownership priority and safely identifies the actual holder',()=>{
 const p=hero({skillPoints:0}),state={phase:'wave',skillOwners:{blizzard:{owner:'rival',name:'<img src=x onerror=evil> "Rival"'}},units:[{owner:'rival',hero:'mage'}]};
 const markup=skillShopMarkup(p,state),button=catalogButton(markup,'blizzard');assert.equal(button['data-access'],'occupied');assert.equal(button.disabled,true);assert.ok(markup.includes('&lt;img src=x onerror=evil&gt; &quot;Rival&quot;'));assert.equal(markup.includes('<img src=x'),false);assert.ok(markup.includes('skill-owner-avatar'));assert.ok(markup.includes('viewBox="0 0 120 120"'),'holder has the real animal portrait');
});
test('all six starter techniques remain shared even when a legacy snapshot reserves them to rivals',()=>{
 assert.equal(SHARED_STARTERS.length,6);const p=hero({skills:[],skillLevels:{}}),skillOwners=Object.fromEntries(SHARED_STARTERS.map(key=>[key,{owner:'rival',name:'Antigo dono'}])),markup=skillShopMarkup(p,{phase:'wave',skillOwners,units:[{owner:'rival',hero:'mage'}]});
 for(const key of SHARED_STARTERS){const button=catalogButton(markup,key);assert.equal(button.disabled,undefined,key);assert.equal(button['data-access'],'available',key);assert.ok(button['aria-label'].includes('compartilhada'),key);}
 assert.equal(markup.includes('Antigo dono'),false);assert.ok(markup.includes('Inicial compartilhada · 1 cópia por herói'));
 const learned=hero({skills:['critical'],skillLevels:{critical:1}}),upgraded=catalogButton(skillShopMarkup(learned,{phase:'wave',skillOwners}),'critical');assert.equal(upgraded['data-access'],'upgrade');assert.equal(upgraded.disabled,undefined);
});
test('ultimate acquisition and later upgrades unlock at their distinct hero levels',()=>{
 assert.equal(catalogButton(skillShopMarkup(hero({level:9}),{phase:'wave'}),'blizzard').disabled,true);
 assert.equal(catalogButton(skillShopMarkup(hero({level:10}),{phase:'wave'}),'blizzard').disabled,undefined);
 const trained=hero({level:14,skills:['blizzard'],skillLevels:{blizzard:1}});assert.equal(catalogButton(skillShopMarkup(trained,{phase:'wave'}),'blizzard')['data-access'],'level');
 trained.level=15;const upgraded=catalogButton(skillShopMarkup(trained,{phase:'wave'}),'blizzard');assert.equal(upgraded.disabled,undefined);assert.equal(upgraded['data-access'],'upgrade');
});
test('a full build permits existing upgrades while preventing an eighth technique',()=>{
 const p=hero({level:40,skills:['stomp','heal','chain','critical','shield','cleave','poison'],skillLevels:{stomp:5,heal:1,chain:1,critical:1,shield:1,cleave:1,poison:1}}),markup=skillShopMarkup(p,{phase:'wave'});
 assert.equal(catalogButton(markup,'heal').disabled,undefined);assert.equal(catalogButton(markup,'heal')['data-access'],'upgrade');assert.equal(catalogButton(markup,'blink')['data-access'],'slots');assert.equal(catalogButton(markup,'blink').disabled,true);assert.equal(catalogButton(markup,'stomp')['data-access'],'max');
});
test('no points, maximum rank and drop-only acquisition have separate actionable states',()=>{
 const noPoints=skillShopMarkup(hero({skillPoints:0}),{phase:'wave'});assert.equal(catalogButton(noPoints,'critical')['data-access'],'points');assert.ok(noPoints.includes('Golpe crítico'),'critical remains discoverable by its familiar name');
 const sourceOnly=skillShopMarkup(hero({level:40}),{phase:'wave'});assert.equal(catalogButton(sourceOnly,'flamebreath')['data-access'],'drop');assert.equal(catalogButton(sourceOnly,'flamebreath').disabled,true);
 const learned=hero({skills:['flamebreath'],skillLevels:{flamebreath:1}});assert.equal(catalogButton(skillShopMarkup(learned,{phase:'wave'}),'flamebreath').disabled,undefined);
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
test('essence offers validate the inherited rank of each slot and cannot steal a reserved technique',()=>{
 const p=hero({level:10,skills:['stomp','heal','chain','critical','shield','cleave','poison'],skillLevels:{stomp:5,heal:1,chain:1,critical:1,shield:1,cleave:1,poison:1},techniqueOffers:['gungnir']}),markup=lootMarkup(p,[],1);
 assert.equal(action(markup,{'data-technique-choose':'gungnir','data-replace-slot':0}).disabled,true);assert.equal(action(markup,{'data-technique-choose':'gungnir','data-replace-slot':1}).disabled,undefined);
 const reserved=lootMarkup(p,[],1,{skillOwners:{gungnir:{owner:'rival',name:'Runa'}}});assert.equal(buttons(reserved).some(button=>button['data-technique-choose']==='gungnir'),false);assert.ok(reserved.includes('Runa'));
});
test('rendering access information does not mutate authoritative player or room state',()=>{
 const p=hero(),state={phase:'wave',skillOwners:{},units:[]},before=JSON.stringify({p,state});skillShopMarkup(p,state);lootMarkup(p,[],1,state);assert.equal(JSON.stringify({p,state}),before);
});
