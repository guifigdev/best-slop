import test from 'node:test';
import assert from 'node:assert/strict';
import {roSkillDockMarkup} from '../src/ro-skill-dock.js';
import {createBonkUI,bonkInteraction,BONK_HELP} from '../src/bonk-ui.js';

const weapons=[{key:'basic',name:'Adagas duplas',level:1,manaCost:0,auto:true,ready:true},{key:'rollingcutter',name:'Rolling Cutter',description:'Cortes <circulares>',level:3,manaCost:6,auto:false,ready:false,cooldownRemaining:1.25,cooldown:2,readyReason:'Recarregando'}];
test('twelve-skill compact dock exposes skill names, levels, SP, cooldown, manual keys and individual AUTO state',()=>{
 const before=JSON.stringify(weapons),html=roSkillDockMarkup(weapons);assert.equal((html.match(/<li[ >]/g)||[]).length,13);assert.equal((html.match(/data-bk-cast=/g)||[]).length,2);assert.equal((html.match(/data-bk-auto=/g)||[]).length,2);assert.match(html,/Adagas duplas/);assert.match(html,/Rolling Cutter/);assert.match(html,/N3 · 6 SP/);assert.match(html,/1\.3 s/);assert.match(html,/aria-pressed="true"/);assert.match(html,/aria-pressed="false"/);assert.match(html,/Cortes &lt;circulares&gt;/);assert.match(html,/<kbd>4<\/kbd>/);assert.equal(JSON.stringify(weapons),before);
 const paused=roSkillDockMarkup(weapons,{interactive:false,configurable:false,blockedReason:'Escolha uma melhoria'});assert.equal((paused.match(/data-bk-cast="[^"]+" disabled/g)||[]).length,2);assert.match(paused,/Escolha uma melhoria/);assert.doesNotMatch(paused,/animation:/);assert.match(roSkillDockMarkup(weapons,{obscured:true}),/data-ro-skill-dock[^>]* hidden/);
});
test('keyboard slots send learned skill keys and stay blocked by pause, preparation, offer and inventory',()=>{
 const sent=[],state={options:{mode:'bonk'},units:[{id:1}],players:{p:1},bonk:{stage:'playing',weapons}},ui=createBonkUI({getState:()=>state,getOwner:()=> 'p',send:c=>sent.push(c),isSuspended:()=>suspended});let suspended=false;
 ui.action('skill',0);ui.action('skill',1);assert.deepEqual(sent,[{type:'bkCast',key:'basic'},{type:'bkCast',key:'rollingcutter'}]);sent.length=0;for(const n of [-1,2,4,1.2,undefined])ui.action('skill',n);assert.equal(sent.length,0);suspended=true;ui.action('skill',0);suspended=false;state.bonk.stage='preparation';ui.action('skill',0);state.bonk.stage='playing';state.bonk.offer={choices:[]};ui.action('skill',0);delete state.bonk.offer;ui.action('build');ui.action('skill',0);ui.action('build');ui.action('map');ui.action('skill',0);assert.equal(sent.length,0);ui.action('map');ui.action('skill',0);assert.equal(sent.at(-1).key,'basic');assert.match(BONK_HELP,/Rolling Cutter/);assert.match(BONK_HELP,/AUTO/);
});
test('chest and altar descriptions distinguish actual equipment loot from a free altar upgrade',()=>{
 const b={objects:[{id:'chest',type:'chest'},{id:'altar',type:'shrine',cost:20}]};const chest=bonkInteraction({...b,nearestObject:'chest'},{gold:0}),altar=bonkInteraction({...b,nearestObject:'altar'},{gold:0});assert.equal(chest.description,'Um equipamento garantido e uma relíquia');assert.equal(altar.name,'Altar de melhorias');assert.equal(altar.description,'Aprenda uma habilidade grátis');assert.equal(altar.allowed,true);assert.equal(altar.cost,0);
});

test('the last active slot can be cast and its mobile page is exposed without removing learned skills',()=>{
 const sent=[],equipped=Array.from({length:13},(_,i)=>({key:i?'skill'+i:'basic',name:'Habilidade '+i,level:1})),state={options:{mode:'bonk'},units:[{id:1}],players:{p:1},bonk:{stage:'playing',weapons:equipped}},ui=createBonkUI({getState:()=>state,getOwner:()=> 'p',send:c=>sent.push(c)});
 ui.action('skill',12);assert.deepEqual(sent,[{type:'bkCast',key:'skill12'}]);assert.match(roSkillDockMarkup(equipped,{mobilePage:1}),/data-mobile-page="1"/);assert.match(roSkillDockMarkup(equipped,{mobilePage:1}),/data-bk-cast="skill12"/);
});
