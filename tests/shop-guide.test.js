import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {merchantPosition} from '../shared/instances.js';
import {firstShopStep,shopCountdown,openShopSkillTutorial} from '../src/shop-guide.js';
import {skillCategoryOf,skillLibraryMarkup} from '../src/skill-categories.js';
import {SKILLS} from '../shared/catalog.js';

test('first shop guide follows real equipment, tome, XP and skill purchases without granting free resources',()=>{
 const g=new Game(31,{mode:'campaign'});g.addPlayer('p','knight');const u=g.player('p'),step=()=>firstShopStep(g.snapshot(),u),initialGold=u.gold;
 assert.equal(step().index,0);
 Object.assign(u,(({x,z})=>({x,z}))(merchantPosition(u,'equipment')));assert.equal(g.command('p',{type:'interact',npc:'equipment'}),true);
 assert.equal(g.command('p',{type:'item',item:step().item}),true);assert.ok(u.gold<initialGold);assert.equal(step().index,1);
 Object.assign(u,(({x,z})=>({x,z}))(merchantPosition(u,'books')));assert.equal(g.command('p',{type:'interact',npc:'books'}),true);
 assert.equal(g.command('p',{type:'item',item:'xpbook'}),true);assert.equal(step().index,2);assert.equal(u.level,1);
 assert.equal(g.command('p',{type:'use',slot:step().slot}),true);assert.equal(u.level,2);assert.equal(u.skillPoints,1);assert.equal(step().index,3);
 assert.equal(g.command('p',{type:'buy',skill:step().skill}),true);assert.equal(u.skillPoints,0);assert.equal(step().done,true);
 g.wave=1;assert.equal(step(),null);
});

test('shop clock uses the authoritative timer and clearly distinguishes an unstarted online lobby',()=>{
 const state={options:{mode:'campaign'},phase:'preparation',timer:65.2};assert.equal(shopCountdown(state).text,'1:06');
 state.timer=9.1;assert.equal(shopCountdown(state).urgent,true);assert.equal(shopCountdown(state).seconds,10);
 state.onlineRoom={started:false};state.timer=3600;assert.equal(shopCountdown(state).lobby,true);assert.doesNotMatch(shopCountdown(state).text,/60:00/);
 state.onlineRoom.started=true;assert.equal(shopCountdown(state).lobby,undefined);
 state.phase='wave';assert.equal(shopCountdown(state),null);
 state.phase='preparation';state.options.mode='castlefight';assert.equal(shopCountdown(state),null);
});

test('shop guide waits for the selected character and stays out of unrelated modes',()=>{
 const state={options:{mode:'campaign'},phase:'preparation',wave:0,onlineRoom:{players:[{id:'p',heroChosen:false}]}},u={owner:'p',hero:'mage',level:1,inventory:[],skills:[]};
 assert.equal(firstShopStep(state,u),null);state.onlineRoom.players[0].heroChosen=true;assert.equal(firstShopStep(state,u).item,'staff');
 state.options.mode='bonk';assert.equal(firstShopStep(state,u),null);
});

test('show my ability opens techniques before selecting the learned skill and its upgrade details',()=>{
 const g=new Game(31,{mode:'campaign'});g.addPlayer('p','knight');const u=g.player('p');u.level=2;u.skillPoints=1;u.inventory=[{key:'blade',level:1}];const step=firstShopStep(g.snapshot(),u),calls=[];let open=false,html='';
 assert.equal(step.skills,true);assert.ok(step.skill);
 openShopSkillTutorial(step.skill,{openSkills(){open=true;calls.push('open');},showSkill(key){assert.equal(open,true);calls.push(key);html=skillLibraryMarkup(u,g.snapshot(),{category:skillCategoryOf(SKILLS[key]),skill:key});}});
 assert.deepEqual(calls,['open',step.skill]);assert.ok(html.includes(`data-skill-detail="${step.skill}"`));assert.ok(html.includes(`data-buy="${step.skill}"`));
});
test('the skill tutorial still opens the techniques library when no starting skill exists',()=>{
 const u={owner:'p',hero:'knight',level:2,inventory:[{key:'blade'}],skills:[]},state={options:{mode:'campaign'},phase:'preparation',wave:0},step=firstShopStep(state,u),calls=[];
 assert.equal(step.skills,true);openShopSkillTutorial(step.skill,{openSkills:()=>calls.push('open'),showSkill:()=>calls.push('select')});assert.deepEqual(calls,['open']);
});
