import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Game} from '../shared/simulation.js';
import {PHASE_KILLER_MAP as MAP} from '../shared/phase-killer-catalog.js';
import {migratePhaseKillerScale} from '../shared/phase-killer-scale.js';
import {phaseKillerWorldObstacles,phaseKillerForestObstacles} from '../shared/phase-killer-world.js';
import {phaseKillerNavigation} from '../shared/phase-killer-navigation.js';
import {createPhaseKillerWorld} from '../src/phase-killer-world.js';

test('active legacy Phase saves migrate spatial points once while retaining combat, inventory, deadlines and destroyed scenery',()=>{
 const game=new Game(7,{mode:'phasekiller'});game.addPlayer('a','townsperson');game.addPlayer('b','townsperson');game.initPhaseKiller();const u=game.player('a'),p=game.phaseKiller,building=phaseKillerWorldObstacles().find(b=>b.phaseProp==='house'),tree=phaseKillerForestObstacles('normal').find(o=>o.phaseProp==='tree');
 game.phaseWorldScale=1;p.worldScale=1;game.time=9;game.obstacleRevision=12;
 const goal={x:18,z:-7};Object.assign(u,{x:15,z:-7,hp:173,mana:31,damage:26,range:1.4,speed:1.72,collisionRadius:.3,destination:goal,pkPending:{goal},inventory:[{key:'I01N',charges:2}],pkShield:{radius:2,duration:5},cooldowns:{A000:54}});
 p.fields=[{id:700,family:'barricades',dimension:'normal',x:17,z:-6,w:1,d:1,radius:2.5,hp:80,until:42,destination:goal}];p.loot=[{id:701,key:'I01N',charges:2,x:3,z:-4,dimension:'normal'}];p.corpses=[{id:702,owner:'b',x:7,z:-5,dimension:'normal',skeletonAt:18}];p.routes=new Map([['escape',[{x:1,z:2},[3,4],[5,.5,6]]]]);
 p.buildings=[{...building,x:building.x/2,z:building.z/2,w:2.7,d:2.05,alive:false,destroyed:true,hp:0}];p.forest=[{...tree,x:tree.x/2,z:tree.z/2,alive:false,destroyed:true}];game.obstacles=p.forest;
 game.effects=[{id:703,type:'arrow',x:2,z:3,tx:4,tz:5,tX:6,tZ:7,radius:1.1,duration:2}];p.assignAt=180;p.nextAmbientAt=34;p.resurrections=[{owner:'b',at:20}];
 const beforeNav=phaseKillerNavigation(game,'normal');assert.ok(beforeNav.obstacles.some(o=>o.id===tree.id));
 assert.equal(game.migratePhaseKillerScale(),true);assert.equal(game.phaseWorldScale,2);assert.equal(p.worldScale,2);assert.equal(game.obstacleRevision,13);assert.equal(game.bounds,MAP.bounds);
 assert.deepEqual([u.x,u.z,u.destination.x,u.destination.z],[30,-14,36,-14]);assert.equal(u.pkPending.goal,u.destination);assert.deepEqual([p.fields[0].x,p.fields[0].z,p.fields[0].w,p.fields[0].radius,p.fields[0].until],[34,-12,1,2.5,42]);
 assert.deepEqual([u.hp,u.mana,u.damage,u.range,u.speed,u.collisionRadius,u.inventory[0].charges,u.cooldowns.A000],[173,31,26,1.4,1.72,.3,2,54]);assert.deepEqual(u.pkShield,{radius:2,duration:5});
 assert.deepEqual([p.loot[0].x,p.loot[0].z,p.corpses[0].x,p.corpses[0].z],[6,-8,14,-10]);assert.equal(p.corpses[0].skeletonAt,18);assert.equal(p.assignAt,180);assert.equal(p.nextAmbientAt,34);assert.equal(p.resurrections[0].at,20);
 assert.deepEqual(p.routes.get('escape'),[{x:2,z:4},[6,8],[10,.5,12]]);assert.deepEqual(game.effects[0],{id:703,type:'arrow',x:4,z:6,tx:8,tz:10,tX:12,tZ:14,radius:1.1,duration:2});
 const savedHouse=p.buildings.find(b=>b.id===building.id);assert.equal(savedHouse.alive,false);assert.equal(savedHouse.hp,0);assert.equal(savedHouse.w,building.w);assert.equal(savedHouse.x,building.x);assert.ok(p.destroyedSceneryIds.includes(tree.id));assert.equal(p.forest.length,1);
 const afterNav=phaseKillerNavigation(game,'normal');assert.notEqual(afterNav,beforeNav);assert.ok(!afterNav.obstacles.some(o=>o.id===tree.id));assert.ok(!afterNav.buildings.some(o=>o.id===building.id));
 const world=createPhaseKillerWorld({scene:new T.Scene()});try{world.update(game.snapshotFor('a'),game.time,'a');assert.equal(world.root.getObjectByName('phase-trunks').count,phaseKillerForestObstacles('normal').filter(o=>o.phaseProp==='tree').length-1);}finally{world.dispose();}
 const saved=JSON.stringify(game);assert.equal(migratePhaseKillerScale(game),false);assert.equal(JSON.stringify(game),saved);
});

test('legacy preparation lobbies move their arrival cluster without doubling avatar spacing and new lobbies never migrate again',()=>{
 const game=new Game(8,{mode:'phasekiller'});game.addPlayer('a','townsperson');game.addPlayer('b','townsperson');assert.equal(game.phaseWorldScale,2);assert.equal(game.migratePhaseKillerScale(),false);
 delete game.phaseWorldScale;const native=MAP.nativeReference.spawn,a=game.player('a'),b=game.player('b');Object.assign(a,{x:native.x-1.35,z:native.z,destination:{x:native.x+2,z:native.z+1},hp:200});Object.assign(b,{x:native.x-.45,z:native.z});game.time=17;game.timer=90;const separation=b.x-a.x,revision=game.obstacleRevision;
 assert.equal(game.phaseKiller,undefined);assert.equal(game.migratePhaseKillerScale(),true);assert.equal(a.x,MAP.spawn.x-1.35);assert.equal(a.z,MAP.spawn.z);assert.ok(Math.abs(b.x-a.x-separation)<1e-8);assert.equal(a.destination.x,MAP.spawn.x+2);assert.equal(a.destination.z,MAP.spawn.z+1);assert.equal(a.hp,200);assert.equal(game.time,17);assert.equal(game.timer,90);assert.equal(game.phase,'preparation');assert.equal(game.obstacleRevision,revision+1);
 const saved=JSON.stringify(game);assert.equal(game.migratePhaseKillerScale(),false);assert.equal(JSON.stringify(game),saved);game.initPhaseKiller();assert.equal(game.phaseKiller.worldScale,2);assert.equal(game.migratePhaseKillerScale(),false);
});
