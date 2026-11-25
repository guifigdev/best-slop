import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {roEnemyTouchesHero,roRecordHitReaction} from '../shared/ro-contact-combat.js';
import {roHitReactionPose} from '../src/ro-hit-reaction.js';

function setup(online=false){
 const g=new Game(617,{mode:'bonk',bonkWorld:'dominion',online});g.addPlayer('p','knight');if(online)g.addPlayer('q','mage');g.command('p',{type:'bkReady'});g.units=g.units.filter(u=>u.bonkHero);Object.assign(g.bonk,{spawnAt:Infinity,bossSpawned:true,objectives:[],pickups:[],routeVersion:0,bossUnlocked:false});
 for(const u of g.units){u.bonkInvulnerableUntil=0;u.bonkSkillAuto=Object.fromEntries(Object.keys(u.bonkBuild.weapons).map(k=>[k,false]));}
 const u=g.player('p'),e={id:g.id(),bonkEnemy:true,alive:true,x:u.x+.3,z:u.z,team:100,hp:9999,maxHp:9999,damage:25,speed:0,interval:1.3,bonkNextAttack:Infinity,bonkNextSpecial:Infinity,collisionRadius:.32,dungeonSpecies:'poring',stun:0};g.units.push(e);g.random=()=>.99;return{g,u,e};
}
const step=(g,n)=>{for(let i=0;i<n;i++)g.tick(.05);};

test('inner contact circles exclude decorative size, dead units and grounded jump evasions',()=>{
 const e={bonkEnemy:true,alive:true,x:0,z:0,collisionRadius:.32,size:8},u={bonkHero:true,alive:true,x:.7,z:0,collisionRadius:.45};assert.equal(roEnemyTouchesHero(e,u),true);u.x=.9;assert.equal(roEnemyTouchesHero(e,u),false);u.x=.3;u.bonkJumpHeight=1.1;assert.equal(roEnemyTouchesHero(e,u),false);e.flying=true;assert.equal(roEnemyTouchesHero(e,u),true);e.alive=false;assert.equal(roEnemyTouchesHero(e,u),false);
});
test('touching a monster damages immediately, records a directional reaction and limits crowds to one contact per interval',()=>{
 const{g,u,e}=setup();g.units.push({...e,id:g.id(),x:u.x-.3});const hp=u.hp;step(g,1);assert.ok(u.hp<hp);assert.equal(g.effects.filter(f=>f.type==='damage'&&f.target===u.id).length,1);assert.ok(u.roHitReaction.dx<0);const first=u.hp;step(g,8);assert.ok(u.hp>=first,'contact cannot drain health every frame');step(g,9);assert.ok(u.hp<first,'continued overlap hurts again after the cooldown');
});
test('contact checks every overlapping party member rather than only the monster nearest target',()=>{
 const{g,u}=setup(true),q=g.player('q');Object.assign(q,{x:u.x,z:u.z+.2});const hp=[u.hp,q.hp];step(g,1);assert.ok(u.hp<hp[0]);assert.ok(q.hp<hp[1]);assert.ok(g.snapshotFor('q').units.find(v=>v.id===q.id).roHitReaction);
});
test('stunned monsters and jumps do not cause grounded contact damage; leaving stops it',()=>{
 const{g,u,e}=setup();e.roSkillStunUntil=2;const hp=u.hp;step(g,2);assert.equal(u.hp,hp);e.roSkillStunUntil=0;u.bonkJumpHeight=2;u.bonkJumpVelocity=3;step(g,1);assert.equal(u.hp,hp);u.bonkJumpHeight=0;u.bonkJumpVelocity=0;e.x=u.x+4;step(g,20);assert.equal(u.hp,hp);
});
test('hit recoil is visible, transient and transforms source direction without moving the collision body',()=>{
 const u={alive:true,x:2,z:3,facing:Math.PI/2};roRecordHitReaction(u,{x:1,z:3},10);const p=roHitReactionPose(u,10.07);assert.ok(p.z>.1);assert.ok(p.flash>.5);assert.ok(p.scaleY<1);assert.deepEqual([u.x,u.z],[2,3]);assert.equal(roHitReactionPose(u,10.43),null);assert.equal(roHitReactionPose({...u,alive:false},10.07),null);
});
