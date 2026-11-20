import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {KODO_HUNT_RULES as H} from '../shared/kodo-tag.js';
import {KODO_TAG_UNITS as U,KODO_TAG_RULES as R} from '../shared/kodo-tag-catalog.js';

function setup(){const g=new Game(28,{mode:'kodotag'});g.addPlayer('p','runner');g.addPlayer('q','runner');g.initKodoTag();const k=g.kodoTag;Object.assign(k,{released:true,escalationIndex:R.escalation.length,obstacles:[],mines:[],trees:[],map:{...k.map,minX:-78,maxX:78,minZ:-78,maxZ:78}});g.player('q').kodoTagCaptured=true;const p=g.player('p');Object.assign(p,{x:6,z:0});const d=U.oC06,hunter={...d,id:g.id(),unitKey:'oC06',owner:'kodos',team:2,x:0,z:0,maxHp:d.hp,hp:d.hp,maxMana:0,mana:0,alive:true,kodoTagUnit:true,kodoTagKodo:true,cd:0,stun:0,order:'auto'};g.units.push(hunter);k.navigationRevision++;return{g,k,p,hunter};}
function step(g,t){for(let i=0;i<Math.round(t*20);i++)g.tick(.05);}
function wall(g,x,z,w,d,extra={}){const b={id:g.id(),x,z,w,d,owner:'p',team:1,alive:true,kodoTagStructure:true,hp:1000,maxHp:1000,armor:0,workRemaining:0,type:'wall',cd:0,productionQueue:[],trainRemaining:0,...extra};g.kodoTag.buildings.push(b);g.kodoTag.navigationRevision++;return b;}

test('native release keeps physical collision and exact speed/range instead of inflating them with model size',()=>{
 const g=new Game(28,{mode:'kodotag'});g.addPlayer('p','runner');g.addPlayer('q','runner');g.initKodoTag();g.player('p').x=g.player('q').x=50;step(g,R.releaseDelay+.1);for(const u of g.units.filter(u=>u.kodoTagKodo)){assert.equal(u.collisionRadius,U[u.unitKey].collisionRadius);assert.equal(u.speed,305/128);assert.equal(u.range,60/128);}assert.equal(U.oC06.speed/U.uC13.speed,305/300);assert.equal(U.oC22.speed/U.uC13.speed,280/300);
 const {g:h,p,hunter}=setup();p.x=.8;h.tick(.05);assert.equal(p.kodoTagCaptured,false,'the old model-derived melee reach captured at this distance');step(h,.4);assert.equal(p.kodoTagCaptured,true,'native melee still works after walking into range');
});

test('runners outside sight are not acquired globally, and cliffs and trees hide nearby runners',()=>{
 for(const kind of ['distance','cliff','tree','building']){const {g,k,p,hunter}=setup();if(kind==='distance')p.x=H.sightRadius+1;else if(kind==='building')wall(g,3,0,1,12);else{k[kind==='tree'?'trees':'obstacles'].push({id:'opaque',x:3,z:0,w:1,d:12,alive:true,type:kind});k.navigationRevision++;}g.tick(.05);assert.equal(hunter.kodoTagHuntTarget,null,kind);assert.equal(hunter.kodoTagHuntState,'patrolling',kind);}
});

test('after losing sight, different hidden player paths produce identical hunters and finite investigation',()=>{
 const a=setup(),b=setup();a.g.tick(.05);b.g.tick(.05);assert.equal(a.hunter.kodoTagHuntTarget,a.p.id);a.p.x=b.p.x=65;a.p.z=65;b.p.z=-65;
 for(let i=0;i<160;i++){a.g.tick(.05);b.g.tick(.05);assert.equal(a.hunter.x,b.hunter.x);assert.equal(a.hunter.z,b.hunter.z);assert.equal(a.hunter.target,null,'never attack an unseen live unit by ID');}assert.equal(a.hunter.kodoTagHuntTarget,null);assert.equal(a.hunter.kodoTagHuntState,'patrolling');assert.equal(a.p.kodoTagCaptured,false);
});

test('default sixty-second patrol explores multiple sectors without needing global player coordinates',()=>{
 const {g,p,hunter}=setup();Object.assign(p,{x:70,z:70});let travelled=0,maxDistance=0,previous={x:hunter.x,z:hunter.z};const sectors=new Set();for(let i=0;i<1200;i++){g.tick(.05);travelled+=Math.hypot(hunter.x-previous.x,hunter.z-previous.z);previous={x:hunter.x,z:hunter.z};maxDistance=Math.max(maxDistance,Math.hypot(hunter.x,hunter.z));sectors.add(Math.floor(hunter.x/5)+','+Math.floor(hunter.z/5));assert.equal(hunter.kodoTagHuntTarget,null);}assert.ok(travelled>100,'patrol must keep moving while there is no visible Runner');assert.ok(maxDistance>12,'patrol must leave its starting area');assert.ok(sectors.size>=10,'patrol must visit multiple map sectors');assert.equal(hunter.kodoTagHuntState,'patrolling');
});

test('visible players are reacquired, an unseen decoy cannot steal pursuit, and captured targets are forgotten',()=>{
 const {g,p,hunter}=setup();g.tick(.05);Object.assign(p,{x:65,z:65});step(g,7);assert.equal(hunter.kodoTagHuntTarget,null);Object.assign(p,{x:hunter.x+4,z:hunter.z});g.tick(.05);assert.equal(hunter.kodoTagHuntState,'chasing');assert.equal(hunter.kodoTagHuntTarget,p.id);p.kodoTagCaptured=true;g.tick(.05);assert.equal(hunter.kodoTagHuntTarget,null);
});

test('a wall added after detection is breached only when it seals the remembered route',()=>{
 const {g,p,hunter}=setup();Object.assign(p,{x:4,z:0});Object.assign(hunter,{x:-4,z:0});g.tick(.05);const west=wall(g,1,0,1,8),east=wall(g,7,0,1,8),north=wall(g,4,-4,5,1),south=wall(g,4,4,5,1),decoy=wall(g,-4,3,1,1);step(g,3);assert.ok(west.hp<1000);assert.equal(hunter.kodoTagBreachTarget,west.id);for(const b of [east,north,south,decoy])assert.equal(b.hp,1000);Object.assign(p,{x:65,z:65});step(g,H.memorySeconds+.2);assert.equal(hunter.kodoTagBreachTarget,null,'expired memories cannot order indefinite demolition');
});

test('an open maze route is respected while pursuing a known player instead of demolishing a shortcut',()=>{
 const {g,p,hunter}=setup();Object.assign(p,{x:8,z:0});Object.assign(hunter,{x:-8,z:0,kodoTagSightRadius:30,speed:4});const barrier=wall(g,0,0,1,12,{blocksSight:false}),decoy=wall(g,-8,3,1,1);for(let i=0;i<240&&!p.kodoTagCaptured;i++)g.tick(.05);assert.equal(p.kodoTagCaptured,true);assert.equal(barrier.hp,1000);assert.equal(decoy.hp,1000);
});
