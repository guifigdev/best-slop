import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {modeOptions} from '../shared/modes.js';
import {RO_DIFFICULTIES,setRoDifficulty,roDifficulty} from '../shared/ro-difficulty.js';
import {roSurvivorEnemyBudget} from '../shared/ro-survivor-balance.js';
import {roomSettingsMarkup} from '../src/room-settings-ui.js';

function arena(difficulty){const g=new Game(17,{mode:'bonk',bonkDifficulty:difficulty});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p'),e=g.units.find(e=>e.bonkEnemy);g.units=[u,e];g.bonk.spawnAt=Infinity;g.bonk.bossUnlocked=false;g.bonk.objectives.forEach(o=>o.started=true);g.bonk.map.obstacles=[];g.random=()=>.99;u.bonkInvulnerableUntil=0;u.bonkSkillAuto={};for(const key of Object.keys(u.bonkBuild.weapons))u.bonkSkillAuto[key]=false;Object.assign(e,{x:u.x+.3,z:u.z,speed:0,damage:100,hp:1e6,maxHp:1e6,bonkNextAttack:1e9,bonkNextSpecial:1e9});return{g,u,e};}

test('presets default to the gentler Normal and retain the previous challenge as Hard',()=>{
 assert.equal(modeOptions({mode:'bonk'}).bonkDifficulty,'normal');assert.equal(modeOptions({mode:'bonk',bonkDifficulty:'forged'}).bonkDifficulty,'normal');assert.equal(roDifficulty('hard').incoming,1);
 const budgets=Object.keys(RO_DIFFICULTIES).map(difficulty=>roSurvivorEnemyBudget({key:'poring',difficulty}));assert.ok(budgets[0].hp<budgets[1].hp&&budgets[1].hp<budgets[2].hp);
 const loss=[];for(const key of Object.keys(RO_DIFFICULTIES)){const{g,u}=arena(key),hp=u.hp;g.tick(.05);loss.push(hp-u.hp);assert.ok(u.roHitReaction,'contact still visibly hurts');}assert.ok(loss[0]>0&&loss[0]<loss[1]&&loss[1]<loss[2]);
});
test('changing a preset updates existing enemies without healing, spawning monsters or altering rewards',()=>{
 const{g,u,e}=arena('hard');e.hp=e.maxHp*.4;const before={hero:u.hp,count:g.units.length,xp:u.xp,gold:u.gold};assert.ok(g.command('p',{type:'bkDifficulty',difficulty:'easy'}));assert.equal(g.options.bonkDifficulty,'easy');assert.equal(e.maxHp,720000);assert.equal(e.hp/e.maxHp,.4);assert.equal(g.units.length,before.count);assert.equal(u.hp,before.hero);assert.equal(u.xp,before.xp);assert.equal(u.gold,before.gold);assert.equal(g.command('p',{type:'bkDifficulty',difficulty:'cheat'}),false);assert.ok(setRoDifficulty(g,'hard'));assert.equal(e.maxHp,1000000);assert.equal(e.hp/e.maxHp,.4);
 const html=roomSettingsMarkup({options:g.options,isHost:true,stage:'waiting',players:[]});for(const key of Object.keys(RO_DIFFICULTIES))assert.ok(html.includes(`data-lobby-value="${key}"`));
});
