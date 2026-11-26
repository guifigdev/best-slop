import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';import {bonkStats} from '../shared/bonk.js';
import {castRoSkill,finishRoSkillCast} from '../shared/ro-skill-controls.js';
function setup(key){const g=new Game(30,{mode:'bonk'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p');g.units=[u,{id:999,bonkEnemy:true,alive:true,x:u.x+1,z:u.z}];u.bonkOffer=null;g.bonk.offer=null;g.bonk.stage='playing';u.bonkBuild.weapons[key]=1;u.bonkSkillSlots=['basic',key];u.bonkWeaponAt={};u.mana=1000;u.roSkillActionUntil=0;u.roAfterCastUntil=0;return{g,u,stats:bonkStats(u)};}

test('release feedback is recorded exactly after a successful cast, never during charging or cancellation',()=>{
 const {g,u,stats}=setup('asc_meteorassault');let releases=0;const attack=()=>{releases++;return true;};g.time=10;const result=castRoSkill(g,u,'asc_meteorassault',stats,attack);assert.equal(result.reasonCode,'casting');assert.equal(releases,0);assert.equal(u.roSkillRelease,undefined);assert.equal(finishRoSkillCast(g,u,stats,attack),false);g.bonk.elapsed=u.roCasting.finishAt;g.time=11;assert.equal(finishRoSkillCast(g,u,stats,attack),true);assert.equal(releases,1);assert.equal(u.roSkillRelease.time,11);assert.equal(u.roSkillRelease.key,'asc_meteorassault');assert.equal(finishRoSkillCast(g,u,stats,attack),false);
 const second=setup('asc_meteorassault');castRoSkill(second.g,second.u,'asc_meteorassault',second.stats,attack);second.g.command('p',{type:'bkCancelCast'});second.g.bonk.elapsed+=5;assert.equal(finishRoSkillCast(second.g,second.u,second.stats,attack),false);assert.equal(second.u.roSkillRelease,undefined);
});

test('instant utility release is visible and a rejected action never produces false feedback',()=>{
 const {g,u,stats}=setup('mg_sight');assert.equal(castRoSkill(g,u,'mg_sight',stats,()=>false).ok,false);assert.equal(u.roSkillRelease,undefined);g.time=3;assert.equal(castRoSkill(g,u,'mg_sight',stats,()=>true).ok,true);assert.deepEqual(u.roSkillRelease,{time:3,key:'mg_sight',element:'fire',kind:'buff'});assert.equal(g.snapshotFor('p').units.find(v=>v.id===u.id).roSkillRelease.key,'mg_sight');
});
