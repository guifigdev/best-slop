import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {roMonsterHitFlash,roHitReactionPose} from '../src/ro-hit-reaction.js';
import {roGroundAreas} from '../src/ro-ground-area-art.js';

test('ordinary successful hits flash the actual monster mesh briefly, while misses, zero damage, death and expiry do not flash',()=>{
 const g=new Game(617,{mode:'bonk',bonkLineage:'shadowcross'});g.addPlayer('p','raccoon');g.command('p',{type:'bkReady'});const u=g.player('p'),e={id:900,alive:true,bonkEnemy:true,x:u.x,z:u.z+1,team:100,hp:10000,maxHp:10000,collisionRadius:.3,armor:0};g.units=[u,e];g.bonk.map.obstacles=[];g.obstacles=[];g.random=()=>0;assert.ok(g.command('p',{type:'bkCast',key:'basic'}));const hit=g.effects.find(e=>e.type==='damage');assert.ok(hit.amount>0&&!hit.critical);assert.ok(e.roHitReaction);assert.equal(roMonsterHitFlash(e,g.time+.02).color,0xffffff);assert.ok(roMonsterHitFlash(e,g.time+.1).strength<1);assert.equal(roMonsterHitFlash(e,g.time+.2),null);assert.equal(roMonsterHitFlash({...e,alive:false},g.time+.02),null);assert.equal(roMonsterHitFlash({bonkEnemy:true,alive:true},g.time),null);
 const large={...e,size:3,roHitReaction:{at:g.time,dx:1,dz:0}};assert.ok(Math.abs(roHitReactionPose(large,g.time+.07).x*3)<.08,'reaction never creates a large visual gap from the real hitbox');
});
test('per-victim status echoes create no blue/red ground circles, while real area attacks keep their area indication',()=>{
 const state={options:{mode:'bonk'},bonk:{elapsed:1,warnings:[],roSkillZones:[]},effects:[{id:1,type:'abilityPulse',bonk:true,target:9,source:1,x:0,z:0,time:1,radius:1.5,element:'ice',skillKey:'envenom'}]};assert.equal(roGroundAreas(state,1.1).length,0);delete state.effects[0].target;state.effects[0].radius=2;assert.equal(roGroundAreas(state,1.1).length,1);
});
