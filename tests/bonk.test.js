import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Game} from '../shared/simulation.js';
import {BonkMethods,bonkStats} from '../shared/bonk.js';
import {BONK_RULES,BONK_STAGES,BONK_WEAPONS,BONK_TOMES,BONK_RELICS} from '../shared/bonk-catalog.js';
import {generateBonkLevel,bonkHeightAt,bonkBlocked} from '../shared/bonk-level.js';
import {createBonkWorld} from '../src/bonk-world.js';
Object.assign(Game.prototype,BonkMethods);
function setup(seed=111){const g=new Game(seed,{mode:'bonk'});assert.ok(g.addPlayer('p','knight'));const u=g.player('p');if(!u.bonkHero)g.setupBonkPlayer(u);assert.ok(g.command('p',{type:'bkReady'}));return{g,u};}
function step(g,seconds=.1){for(let i=0;i<seconds-1e-8;i+=.05)g.tick(Math.min(.05,seconds-i));}
function choose(g){while(g.bonk.offer)assert.ok(g.command('p',{type:'bkChoose',choiceId:g.bonk.offer.choices[0].id}));}

test('three large original kingdoms have deterministic coherent height fields, distinct themes and navigable objective avenues',()=>{
 for(const key of Object.keys(BONK_STAGES)){const m=generateBonkLevel(9,key);assert.deepEqual(m,generateBonkLevel(9,key));assert.equal(m.width,230);assert.equal(m.landmarks.length,3);assert.ok(m.obstacles.length>100);assert.ok(m.decorations.some(o=>o.type==='statue'));assert.ok(m.objects.some(o=>o.type==='chest'));assert.ok(m.objects.some(o=>o.type==='campfire'));let range=[];for(let x=-100;x<=100;x+=10)for(let z=-100;z<=100;z+=10)range.push(bonkHeightAt(m,x,z));assert.ok(Math.max(...range)-Math.min(...range)>2);for(const p of m.landmarks)for(let t=0;t<=1;t+=.05)assert.equal(bonkBlocked(m,{x:p.x*t,z:p.z*t},.6),false,'wide radial routes remain open');}
 assert.notDeepEqual(generateBonkLevel(9,'grove').decorations,generateBonkLevel(9,'forge').decorations);
});

test('movement commands are normalized, expire safely, jump and dash have authoritative cooldowns',()=>{
 const{g,u}=setup(),start={x:u.x,z:u.z};assert.equal(g.command('p',{type:'bkMove',dx:Infinity,dz:0}),false);assert.ok(g.command('p',{type:'bkMove',dx:100,dz:0}));step(g,.1);assert.ok(u.x-start.x<=bonkStats(u).speed*.11);assert.equal(u.z,start.z);step(g,1);const at=u.x;step(g,.2);assert.equal(u.x,at,'stale input stops instead of making the character run forever');assert.ok(g.command('p',{type:'bkJump'}));step(g,.15);assert.ok(u.bonkJumpHeight>.5);assert.equal(g.command('p',{type:'bkJump'}),false);assert.ok(g.command('p',{type:'bkDash'}));assert.equal(g.command('p',{type:'bkDash'}),false);assert.ok(g.snapshotBonk().dashRemaining>0);step(g,1);assert.equal(u.bonkJumpHeight,0);
});

test('weapons attack automatically, defeated hordes release physical XP and a real offer pauses simulation',()=>{
 const{g,u}=setup();g.units=g.units.filter(e=>!e.bonkEnemy);g.bonk.spawnAt=100;g.units.push({id:g.id(),bonkEnemy:true,dungeonSpecies:'rat',alive:true,team:100,x:u.x+2,z:u.z,hp:1,maxHp:1,damage:1,speed:0,size:.8,collisionRadius:.3,bonkNextAttack:100,bonkNextSpecial:100});step(g,.1);assert.equal(u.kills,1);assert.ok(g.bonk.pickups.length>=2);g.bonk.pickups.push({id:g.id(),x:u.x,z:u.z,type:'xp',value:40,age:0});step(g,.1);assert.equal(g.bonk.stage,'levelup');const elapsed=g.bonk.elapsed,pos={x:u.x,z:u.z},offer=g.bonk.offer;assert.equal(offer.choices.length,4);step(g,3);assert.equal(g.bonk.elapsed,elapsed);assert.deepEqual({x:u.x,z:u.z},pos);assert.equal(g.command('p',{type:'bkChoose',choiceId:'client-invented'}),false);assert.ok(g.command('p',{type:'bkChoose',choiceId:offer.choices[0].id}));assert.equal(g.command('p',{type:'bkChoose',choiceId:offer.choices[0].id}),false);
});

test('four weapons and four tomes constrain slots while relic copies stack and change real statistics',()=>{
 const{g,u}=setup();u.bonkBuild.weapons={basic:8,bash:8};u.bonkBuild.tomes={damage:8,haste:8,amount:8,crit:8};const before=bonkStats(u);for(let i=0;i<16;i++){const o={id:'test-chest-'+i,type:'chest',x:u.x,z:u.z,cost:0,used:false};g.bonk.objects.push(o);g.random=()=>0;assert.ok(g.command('p',{type:'bkInteract',object:o.id}));}assert.equal(u.bonkBuild.relics.emberseed,16);assert.equal(Object.keys(u.bonkBuild.weapons).length,2);u.bonkBuild.relics.glassrune=3;u.bonkBuild.relics.silvermirror=2;const after=bonkStats(u);assert.ok(after.damage>before.damage);assert.ok(after.amount>before.amount);assert.ok(after.maxHp<before.maxHp);g.bonk.pickups.push({id:g.id(),x:u.x,z:u.z,type:'xp',value:100,age:0});step(g,.1);assert.ok(g.bonk.offer.choices.some(c=>c.kind==='weapon'),'more class skills can be learned even with maxed tomes');assert.ok(g.bonk.offer.choices.every(c=>c.kind!=='tome'),'maxed tome slots remain bounded');
});

test('physical chests, shrines and pots enforce distance, cost and one-time use; campfires heal by proximity',()=>{
 const{g,u}=setup(),c=g.bonk.objects.find(o=>o.type==='chest'&&o.id!=='starting-chest');assert.equal(g.command('p',{type:'bkInteract',object:c.id}),false);Object.assign(u,{x:c.x,z:c.z,gold:0});assert.equal(g.command('p',{type:'bkInteract',object:c.id}),false);u.gold=1000;assert.ok(g.command('p',{type:'bkInteract',object:c.id}));assert.equal(g.command('p',{type:'bkInteract',object:c.id}),false);const fire=g.bonk.objects.find(o=>o.type==='campfire');Object.assign(u,{x:fire.x,z:fire.z,hp:90});g.units=g.units.filter(e=>!e.bonkEnemy);g.bonk.spawnAt=100;step(g,1);assert.ok(u.hp>90);assert.ok(fire.fuel<35);assert.notEqual(g.snapshotBonk().nearestObject,fire.id,'passive campfires never advertise E');
});

test('approaching three runes awakens distinct guardians and defeating them unlocks the central boss',()=>{
 const{g,u}=setup();u.bonkBuild.weapons={runeblade:8,ember:8,frost:8,storm:8};u.bonkBuild.tomes={damage:8,haste:8,amount:8,area:8};u.bonkBuild.relics={giantbone:12,glassrune:25};u.hp=bonkStats(u).maxHp;
 for(const o of g.bonk.objectives){Object.assign(u,{x:o.x+3,z:o.z});step(g,.1);assert.ok(o.started);const guard=g.units.find(e=>e.id===o.guardianId);assert.ok(o.completed||guard?.bonkGuardian!==undefined);for(let i=0;i<500&&!o.completed;i++){choose(g);step(g,.05);}assert.ok(o.completed,'real automatic weapons defeat the guard');}
 assert.equal(g.bonk.guardians,3);assert.equal(g.bonk.bossUnlocked,true);Object.assign(u,{x:3,z:0});step(g,.1);assert.equal(g.bonk.bossSpawned,true);for(let i=0;i<1000&&g.bonk.stage!=='cleared';i++){choose(g);step(g,.05);}assert.equal(g.bonk.stage,'cleared');const build=structuredClone(u.bonkBuild);assert.equal(g.command('p',{type:'bkNext',stageKey:'grove'}),false);assert.ok(g.command('p',{type:'bkNext',stageKey:'forge'}));assert.deepEqual(u.bonkBuild,build);assert.equal(g.bonk.map.stageKey,'forge');assert.equal(g.bonk.guardians,0);assert.equal(g.bonk.clearedStages.length,1);
});

test('world uses a bounded reusable detailed landscape with the exact shared height and cleans up resources',()=>{
 const{g}=setup();const scene=new T.Scene(),world=createBonkWorld({scene});try{const state={options:{mode:'bonk'},bonk:g.snapshotBonk()};world.update(state,1);assert.equal(world.root.visible,true);const floor=world.root.getObjectByName('bonk-organic-ground'),vertices=floor.geometry.attributes.position;assert.ok(vertices.count>20000);for(let i=0;i<vertices.count;i+=157)assert.ok(Math.abs(vertices.getY(i)-bonkHeightAt(state.bonk.map,vertices.getX(i),vertices.getZ(i)))<1e-4);assert.ok(world.root.getObjectByName('bonk-landscape').count>2000);const children=world.root.children.slice();for(let i=0;i<20;i++)world.update(state,1+i*.1);assert.deepEqual(world.root.children,children);assert.ok(world.root.children.length<=16);for(const child of world.root.children)if(child.isInstancedMesh)assert.ok(child.count<=child.instanceMatrix.count);const chest=state.bonk.objects.find(o=>o.type==='chest'&&!o.used);assert.deepEqual(world.pick(chest),{bonkObject:chest.id});world.update({options:{mode:'campaign'}},5);assert.equal(world.root.visible,false);}finally{world.dispose();}assert.equal(scene.children.length,0);
});


test('four defeated MVPs finish the expedition without reusing portal or timer progression',()=>{
 const{g,u}=setup(253);u.bonkBuild.weapons={runeblade:8,ember:8,frost:8,storm:8};u.bonkBuild.tomes={damage:8,haste:8,amount:8,vitality:8};u.bonkBuild.relics={giantbone:20,glassrune:20};u.hp=bonkStats(u).maxHp;
 for(const key of ['grove','forge','glacier','crypt']){if(g.bonk.map.stageKey!==key){assert.ok(g.command('p',{type:'bkNext',stageKey:key}));choose(g);}g.bonk.map.obstacles=[];for(const objective of g.bonk.objectives){Object.assign(u,{x:objective.x+2,z:objective.z});for(let i=0;i<500&&!objective.completed;i++){choose(g);step(g,.05);}assert.ok(objective.completed);}Object.assign(u,{x:3,z:0});for(let i=0;i<3600&&!['cleared','finished'].includes(g.bonk.stage);i++){u.hp=u.maxHp;choose(g);step(g,.05);}assert.ok(g.bonk.clearedStages.includes(key));}
 assert.equal(g.bonk.won,true);assert.equal(g.bonk.stage,'finished');assert.equal(g.phase,'victory');assert.deepEqual(g.winningOwners,['p']);assert.equal(g.bonk.clearedStages.length,4);
});

test('long horde simulation keeps units, physical rewards, effects and projectiles inside technical budgets',()=>{
 const{g,u}=setup(913);u.bonkBuild.weapons={};u.bonkBuild.tomes={amount:5,haste:6,area:4,vitality:7};u.bonkBuild.relics={giantbone:10};let highest=0;
 for(let i=0;i<2400;i++){if(i===1000)u.bonkBuild.weapons={runeblade:5,ember:6,frost:7,thorns:6};choose(g);u.hp=u.maxHp;g.command('p',{type:'bkMove',dx:Math.sin(i*.003),dz:Math.cos(i*.003)});g.tick(.05);highest=Math.max(highest,g.units.length);assert.ok(g.bonk.pickups.length<=BONK_RULES.pickupBudget);assert.ok(g.bonk.projectiles.length<=BONK_RULES.projectileBudget);assert.ok(g.units.filter(e=>e.bonkEnemy&&e.alive).length<=BONK_RULES.aliveBudget+4);assert.ok(g.effects.length<1000);}
 assert.ok(highest>25,'the actual horde accumulates during play');assert.ok(highest<400);assert.ok(u.kills>20);
});


test('fast dashes cannot tunnel through stone walls and jumps clear low obstacles rather than tall ruins',()=>{
 const{g,u}=setup(77);g.units=[u];g.bonk.spawnAt=100;g.bonk.map.obstacles=[{id:'thin-wall',x:2,z:23,w:.25,d:20,h:8,alive:true}];g.obstacles=g.bonk.map.obstacles;g.obstacleRevision++;Object.assign(u,{x:0,z:23});assert.ok(g.command('p',{type:'bkMove',dx:1,dz:0}));assert.ok(g.command('p',{type:'bkDash'}));step(g,.3);assert.ok(u.x<1.55,'substeps stop the fast dash before the wall');assert.ok(g.command('p',{type:'bkJump'}));for(let i=0;i<12;i++){g.command('p',{type:'bkMove',dx:1,dz:0});g.tick(.05);}assert.ok(u.x<1.55,'jump is too low to clear an eight metre wall');
 const m=generateBonkLevel(30);m.obstacles=[{id:'low-rock',x:0,z:0,w:2,d:2,h:.6}];assert.equal(bonkBlocked(m,{x:0,z:0},.4,0),true);assert.equal(bonkBlocked(m,{x:0,z:0},.4,1),false);assert.equal(bonkBlocked(m,{x:0,z:0},.4,.3),true);
});
