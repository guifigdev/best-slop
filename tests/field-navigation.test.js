import {ARENA_BOUNDS} from '../shared/arena-size.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {moveUnit,navigation,navigationInfo} from '../shared/field.js';
import {unitRadius,unitSolidBlocked,unitSegmentClear,resolveUnitCollisions} from '../shared/unit-collision.js';
import {SCENERY_ASSETS,sceneryObstacles} from '../shared/scenery.js';

const actor=(id,x,z,extra={})=>({id,x,z,size:1,speed:3,alive:true,...extra});
function world(u,obstacles=[]){return{time:0,bounds:ARENA_BOUNDS,options:{mode:'tower'},units:[u],obstacles,obstacleRevision:1,seed:59};}
function walk(g,u,target,seconds=20){const trace=[];for(let i=0;i<seconds*20;i++){g.time+=.05;const next=navigation(g,u,target),d=Math.hypot(next.x-u.x,next.z-u.z),step=Math.min(d,u.speed*.05);if(d>1e-8)moveUnit(g,u,{x:u.x+(next.x-u.x)/d*step,z:u.z+(next.z-u.z)/d*step});else moveUnit(g,u,u);resolveUnitCollisions(g,.05);assert.equal(unitSolidBlocked(g,u,u),false);trace.push({x:u.x,z:u.z});if(Math.hypot(u.x-target.x,u.z-target.z)<.18)break;}return trace;}
function forestU(){const points=[];for(let z=-3;z<=3.01;z+=.65)for(const x of [-3,3])points.push({id:`side-${x}-${z}`,kind:'pine',x,z,scale:1,rotation:0});for(let x=-3;x<=3.01;x+=.65)points.push({id:`base-${x}`,kind:'pine',x,z:-3,scale:1,rotation:0});return sceneryObstacles(points);}

test('a large hunter exits a U of tree trunks and reaches the free destination without moving in place',()=>{const u=actor(1,0,0,{size:2.3}),g=world(u,forestU()),goal={x:0,z:-8},seed=g.seed,trace=walk(g,u,goal,30);assert.ok(Math.hypot(u.x-goal.x,u.z-goal.z)<.2);assert.ok(trace.some(p=>p.z>4.3),'must exit through the U opening');assert.ok(trace.some(p=>Math.abs(p.x)>4.3),'must go around the inflated side');assert.equal(g.seed,seed);assert.ok(navigationInfo(u).searches>0);assert.ok(navigationInfo(u).expanded<=18000);});

test('direct paths use the real body radius rather than the old 0.4 padding',()=>{const u=actor(1,-5,0,{collisionRadius:1.1}),g=world(u,[{x:0,z:1.2,w:.6,d:.6,type:'scenery',map:true}]),goal={x:5,z:0};assert.equal(unitSegmentClear(g,u,u,goal),false);walk(g,u,goal);assert.ok(Math.hypot(u.x-goal.x,u.z-goal.z)<.2);assert.equal(unitSolidBlocked(g,u,u),false);});

test('clicking an occupied trunk center approaches a reachable edge and settles rather than looping',()=>{const u=actor(1,-5,0),g=world(u,[{x:0,z:0,w:1,d:1,map:true}]),goal={x:0,z:0};walk(g,u,goal,8);assert.equal(navigationInfo(u).status,'arrived');assert.equal(u.moving,false);assert.equal(unitSolidBlocked(g,u,u),false);assert.ok(Math.hypot(u.x,u.z)<1.8);const settled={x:u.x,z:u.z};walk(g,u,goal,3);assert.ok(Math.hypot(u.x-settled.x,u.z-settled.z)<.01);});

test('a thin divider blocks sweeps and separation even when a large frame has free endpoints',()=>{const a=actor(1,-2,0),b=actor(2,-2,.1),g=world(a,[{x:0,z:0,w:.04,d:40}]);g.units.push(b);moveUnit(g,a,{x:2,z:0});assert.ok(a.x<0);assert.equal(unitSegmentClear(g,a,{x:-2,z:0},{x:2,z:0}),false);resolveUnitCollisions(g,.05);assert.ok(g.units.every(u=>u.x<0));assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>=unitRadius(a)+unitRadius(b)-.001);});

test('unreachable orders stop the walking animation and expose a bounded no-route diagnostic',()=>{const u=actor(1,-3,0),g=world(u,[{x:0,z:0,w:.04,d:40}]);for(let i=0;i<10;i++){g.time+=.05;const p=navigation(g,u,{x:3,z:0});u.moving=true;moveUnit(g,u,p);resolveUnitCollisions(g,.05);assert.equal(u.moving,false);}assert.equal(navigationInfo(u).status,'blocked');assert.equal(navigationInfo(u).reason,'no-route');assert.equal(u.x,-3);});

test('route clearance respects private far-away cells and shared teammates still collide',()=>{const cell={x:112,z:0,r:16},a=actor(1,107,0,{cell}),b=actor(2,107,.1,{cell:{...cell}}),g=world(a,[{x:112,z:0,w:2,d:5}]);g.bounds=140;g.options.mode='campaign';g.units.push(b);walk(g,a,{x:117,z:0},15);assert.ok(a.x>116.5);assert.ok(g.units.every(u=>u.x>=96+unitRadius(u)&&u.x<=128-unitRadius(u)));assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>=unitRadius(a)+unitRadius(b)-.001);});

test('terrain callbacks are consulted along every A* edge and movement segment',()=>{const u=actor(1,-5,0),g=world(u);g.options.mode='linewars';g.unitTerrainBlocked=(_u,p,r)=>Math.abs(p.x)<1+r&&Math.abs(p.z)<3+r;walk(g,u,{x:5,z:0},15);assert.ok(u.x>4.8);assert.equal(unitSolidBlocked(g,u,u),false);});

test('flight deliberately ignores map trees but continues respecting non-map ice walls and boundaries',()=>{const u=actor(1,-5,0,{flying:true}),g=world(u,[{x:0,z:0,w:4,d:8,map:true},{x:4,z:0,w:.2,d:8,type:'icewall'}]);assert.equal(unitSegmentClear(g,u,u,{x:2,z:0}),true);assert.equal(unitSegmentClear(g,u,{x:2,z:0},{x:6,z:0}),false);walk(g,u,{x:8,z:0},15);assert.ok(u.x>7.8);moveUnit(g,u,{x:999,z:999});assert.ok(Math.hypot(u.x,u.z)<=ARENA_BOUNDS+2.5-unitRadius(u)+.001);});

test('a revised obstacle invalidates the path and a newly free route resumes deterministically',()=>{const u=actor(1,-4,0),g=world(u,[{x:0,z:0,w:.1,d:40}]);walk(g,u,{x:4,z:0},1);assert.equal(u.x,-4);g.obstacles=[];g.obstacleRevision++;walk(g,u,{x:4,z:0},5);assert.ok(u.x>3.8);assert.equal(g.seed,59);});

test('copas start above an ordinary actor while only the narrow trunk blocks the ground',()=>{for(const kind of ['pine','birch']){const asset=SCENERY_ASSETS[kind],leaves=asset.parts.filter(p=>p[3]>1.15);assert.ok(leaves.every(p=>(p[1]-p[4]/2)*.82>=3));assert.ok(asset.collider.w<.8);assert.ok(asset.parts.every(p=>p[1]+p[4]/2<=asset.collider.h+.01));const obstacles=sceneryObstacles([{id:kind,kind,x:0,z:0,scale:1,rotation:0}]),u=actor(1,1,0),g=world(u,obstacles);assert.equal(unitSolidBlocked(g,u,u),false,'standing underneath overhanging leaves is allowed');assert.equal(unitSolidBlocked(g,u,{x:0,z:0}),true);}});

test('real simulation marks a monster as stationary when an unreachable hero is across a wall',()=>{const g=new Game(21,{mode:'tower'});g.addPlayer('a');g.spawnWave();g.units=g.heroes();const hero=g.player('a');hero.x=4;hero.z=0;hero.order='hold';hero.skills=[];const monster=g.spawnEnemy('rhino',-4,0,{hp:100000,damage:0,skills:[],speed:3});g.obstacles=[{x:0,z:0,w:.05,d:40}];g.obstacleRevision++;for(let i=0;i<20;i++){g.tick(.05);assert.equal(monster.moving,false);}assert.ok(monster.x<0);assert.equal(unitSolidBlocked(g,monster,monster),false);});

test('a hunter detours around a stationary allied body instead of pushing forever toward its center',()=>{const u=actor(1,-5,0),ally=actor(2,0,0,{collisionRadius:1.1,hero:'knight'}),g=world(u);g.units.push(ally);const trace=walk(g,u,{x:5,z:0},15);assert.ok(u.x>4.8);assert.ok(trace.some(p=>Math.abs(p.z)>.9));assert.ok(Math.hypot(u.x-ally.x,u.z-ally.z)>=unitRadius(u)+unitRadius(ally)-.001);assert.ok(Math.hypot(ally.x,ally.z)<.15);});

test('a validated straight route reuses clearance while each actual step still sweeps terrain',()=>{const u=actor(1,-12,0),g=world(u);g.options.mode='linewars';let samples=0;g.unitTerrainBlocked=()=>{samples++;return false;};const goal={x:12,z:0};g.time=.05;navigation(g,u,goal);const initial=samples;moveUnit(g,u,{x:-11.85,z:0});samples=0;g.time+=.05;navigation(g,u,goal);assert.ok(samples<initial/10,'do not rescan a long unchanged route on every frame');moveUnit(g,u,{x:-11.7,z:0});assert.ok(samples>0,'movement still validates every local step');g.obstacles=[{x:0,z:0,w:.1,d:40}];g.obstacleRevision++;assert.deepEqual(navigation(g,u,goal),{x:u.x,z:u.z});assert.equal(navigationInfo(u).reason,'no-route');});
