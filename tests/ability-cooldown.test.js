import test from 'node:test';
import assert from 'node:assert/strict';
import {warlockAbilitiesMarkup} from '../src/warlock-skill-ui.js';
import {roSkillDockMarkup} from '../src/ro-skill-dock.js';
import {tagUnitCommandCard} from '../src/tag-unit-commands.js';

const timer=(html,value)=>assert.ok(html.includes('class="ability-cooldown" aria-hidden="true">'+value+'</span>'));
test('Warlock recast number occupies its own overlay while the rank and column remain available',()=>{
 const state={options:{mode:'warlock'},warlock:{phase:'battle'}},unit={id:1,warlockCharacter:'warlock',alive:true,gold:20,skills:['S002'],skillLevels:{S002:3},cooldowns:{S002:4.2}},before=structuredClone(unit);
 const cooling=warlockAbilitiesMarkup(state,unit);assert.match(cooling,/class="ability cooling/);timer(cooling,5);assert.match(cooling,/<em>N3<\/em>/);assert.match(cooling,/data-legacy-cast="S002"/);assert.match(cooling,/<small>D<\/small>/);assert.deepEqual(unit,before);
 unit.cooldowns.S002=0;const ready=warlockAbilitiesMarkup(state,unit);assert.doesNotMatch(ready,/class="ability cooling/);timer(ready,'');assert.match(ready,/<em>N3<\/em>/);
});

test('Ragnarok shared timer retains real cooldown and subsecond cast locks without changing the skill slot or AUTO',()=>{
 const weapon={key:'rollingcutter',name:'Rolling Cutter',skill:'cleave',level:3,manaCost:6,auto:false,ready:false,cooldown:2,cooldownRemaining:1.25},before=structuredClone(weapon),cooling=roSkillDockMarkup([weapon]);
 assert.match(cooling,/class="ro-skill-cast cooling"/);assert.match(cooling,/class="ro-skill-timer ability-cooldown" aria-hidden="true">2<\/em>/);assert.match(cooling,/class="ro-skill-rank" aria-hidden="true">3<\/em>/);assert.match(cooling,/data-bk-cast="rollingcutter" disabled/);assert.match(cooling,/data-bk-auto="rollingcutter" aria-pressed="false"/);assert.deepEqual(weapon,before);
 const locked=roSkillDockMarkup([{...weapon,cooldownRemaining:0,afterCastRemaining:.4,afterCast:1}]);assert.match(locked,/class="ro-skill-timer ability-cooldown" aria-hidden="true">0.4<\/em>/);
 const ready=roSkillDockMarkup([{...weapon,cooldownRemaining:0,ready:true}]);assert.doesNotMatch(ready,/class="ro-skill-cast cooling"/);assert.match(ready,/class="ro-skill-timer ability-cooldown" aria-hidden="true"><\/em>/);
});

test('Tree Tag gives learned spells the timer overlay and retains level captions while Kodo orders keep labels',()=>{
 const hero={id:1,owner:'p',alive:true,treeTagCharacter:'ent',treeTagRole:'ent',skills:['trueSight'],skillLevels:{trueSight:1},cooldowns:{},mana:200},worker={id:2,owner:'p',alive:true,treeTagTrained:true,treeTagWorker:true,workerType:'e002',rawId:'e002',treeTagRole:'ent',skills:['regrow'],skillLevels:{regrow:2},cooldowns:{regrow:3.2},mana:200},state={options:{mode:'treetag'},phase:'wave',units:[hero,worker]},before=structuredClone(worker);
 const cooling=tagUnitCommandCard(state,hero,[worker]);timer(cooling,4);assert.match(cooling,/data-legacy-cast="regrow"/);assert.match(cooling,/cooling/);assert.deepEqual(worker,before);worker.cooldowns.regrow=0;const ready=tagUnitCommandCard(state,hero,[worker]);assert.doesNotMatch(ready,/ability-cooldown/);assert.match(ready,/N2/);
 const runner={id:1,owner:'p',alive:true,kodoTagCharacter:'runner'},commands=tagUnitCommandCard({options:{mode:'kodotag'},phase:'wave'},runner,[runner]);assert.doesNotMatch(commands,/ability-cooldown|tag-command-state/);assert.match(commands,/<em>Construir<\/em>/);
});
