import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Game} from '../shared/simulation.js';
import {WARLOCK_LAVA_FEEDBACK_INTERVAL} from '../shared/warlock.js';
import {combatLabelHeight} from '../src/combat-label-position.js';
import {combatStatuses} from '../src/combat-status.js';
import {createStatusEffects} from '../src/status-effects.js';

const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
function setup(){
 const g=new Game(102,{mode:'warlock'});g.addPlayer('p','warlock');g.addPlayer('q','heretic');g.initWarlock();g.startWarlockRound();const p=g.player('p'),q=g.player('q');Object.assign(p,{x:25,z:0,wlRegen:0});Object.assign(q,{x:0,z:0,wlRegen:0});const events=[],fx=g.fx.bind(g);g.fx=(type,x,z,extra)=>{fx(type,x,z,extra);events.push(g.effects.at(-1));};return{g,p,q,events};
}
function advance(g,seconds,hz){for(let left=seconds;left>1e-8;left-=1/hz)g.tick(Math.min(left,1/hz));}

test('lava still deals exactly nine HP per second at 30/60/120 Hz with fewer than two damage events per second',()=>{
 for(const hz of [30,60,120]){const {g,p,events}=setup();advance(g,6,hz);near(p.hp,46);near(p.damagePoints,54);near(p.wlVx,0);near(p.wlVz,0);const damage=events.filter(e=>e.type==='damage');assert.ok(damage.length>=8&&damage.length<=10,`${hz} Hz generated ${damage.length} numbers`);assert.ok(damage.every(e=>e.warlockLava&&e.element==='fire'&&e.amount>=5.3));for(let i=1;i<damage.length;i++)assert.ok(damage[i].time-damage[i-1].time>=WARLOCK_LAVA_FEEDBACK_INTERVAL-1e-6);assert.ok(Math.abs(damage.reduce((sum,e)=>sum+e.amount,0)+(p.wlLavaDamagePending||0)-54)<=damage.length*.05+1e-6,'rounded labels account for the applied damage');assert.ok(combatStatuses(p,g.time).some(s=>s.key==='fire'));}
});

test('a brief lava contact flushes once on its timer after leaving, and a later contact starts a fresh window',()=>{
 const {g,p,events}=setup();advance(g,.2,60);near(p.hp,98.2);assert.equal(events.filter(e=>e.type==='damage').length,0);p.x=0;advance(g,.5,60);const first=events.filter(e=>e.type==='damage');assert.equal(first.length,1);near(first[0].amount,1.8);advance(g,2,60);assert.equal(events.filter(e=>e.type==='damage').length,1);p.x=25;advance(g,.2,60);assert.equal(events.filter(e=>e.type==='damage').length,1);p.x=0;advance(g,.5,60);const all=events.filter(e=>e.type==='damage');assert.equal(all.length,2);near(all[1].amount,1.8);near(p.hp,96.4);
});

test('fatal lava damage and round end flush the remaining amount exactly once without leaking to the next round',()=>{
 const fatal=setup();fatal.p.hp=1;advance(fatal.g,.2,120);assert.equal(fatal.p.alive,false);const damage=fatal.events.filter(e=>e.warlockLava);assert.equal(damage.length,1);near(damage[0].amount,1);near(fatal.p.wlLavaDamagePending,0);
 const {g,p,q,events}=setup();advance(g,.2,60);p.x=0;q.alive=false;g.finishWarlockRound();const last=events.filter(e=>e.warlockLava);assert.equal(last.length,1);near(last[0].amount,1.8);near(p.wlLavaDamagePending,0);g.command('p',{type:'wlReady'});g.command('q',{type:'wlReady'});advance(g,3.01,60);assert.equal(g.warlock.phase,'battle');advance(g,.7,60);assert.equal(events.filter(e=>e.warlockLava).length,1);
});

test('ordinary spell impacts keep their own immediate damage numbers while lava is buffered',()=>{
 const {g,p,q,events}=setup();advance(g,.1,60);p.x=5;p.z=0;q.x=0;q.z=0;assert.ok(g.command('q',{type:'wlCast',skill:'S000',x:12,z:0}));advance(g,.45,60);const impact=events.filter(e=>e.type==='damage'&&!e.warlockLava);assert.equal(impact.length,1);near(impact[0].amount,7);assert.equal(impact[0].source,q.id);assert.equal(impact[0].target,p.id);
});

test('lava keeps the same persistent body flame and raises its number above the actual scaled model',()=>{
 const {g,p}=setup(),root=new T.Group(),status=createStatusEffects(root);try{advance(g,.1,60);status.update(p,g.time);const effects=root.getObjectByName('persistent-status-effects'),fire=effects.children[0];assert.equal(fire.visible,true);near(fire.scale.y,1.2);advance(g,.6,60);status.update(p,g.time);assert.equal(effects.children[0],fire);assert.equal(fire.visible,true);p.x=0;advance(g,.3,60);status.update(p,g.time);assert.equal(fire.visible,false);}finally{status.dispose();}
 const actor={modelHeight:4.5,root:{position:{y:2},scale:{y:1.5}}};near(combatLabelHeight({warlockLava:true},actor,0),9.65);near(combatLabelHeight({warlock:true},actor,0),4.7);assert.ok(combatLabelHeight({warlockLava:true},actor,0)>actor.root.position.y+actor.modelHeight*actor.root.scale.y);near(combatLabelHeight({warlockLava:true},null,0),3.73);
});
