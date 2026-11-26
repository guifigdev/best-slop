import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';import {bonkStats} from '../shared/bonk.js';
import {roSkillStatus} from '../shared/ro-skill-controls.js';import {syncRoMount,roMountedKind} from '../shared/ro-mounts.js';
test('Worg can dismount during automatic attack animation and stays a pet until mounted again',()=>{
 const g=new Game(29,{mode:'bonk',bonkLineage:'windhawk'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p');u.bonkBuild.weapons.ra_wugrider=1;u.bonkSkillSlots=['basic','ra_wugrider'];syncRoMount(u);assert.equal(roMountedKind(u),'worg');
 u.roAfterCastUntil=g.bonk.elapsed+5;u.roSkillActionUntil=g.bonk.elapsed+5;u.mana=0;
 assert.equal(roSkillStatus(g,u,'ra_wugrider',bonkStats(u)).ready,true);assert.ok(g.command('p',{type:'bkCast',key:'ra_wugrider'}));syncRoMount(u);assert.equal(roMountedKind(u),null);assert.equal(u.bonkBuild.weapons.ra_wugrider,1);
 assert.ok(g.command('p',{type:'bkCast',key:'ra_wugrider'}));assert.equal(roMountedKind(u),'worg');g.paused=true;assert.equal(g.command('p',{type:'bkCast',key:'ra_wugrider'}),false);
});
