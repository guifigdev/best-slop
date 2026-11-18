import test from 'node:test';
import assert from 'node:assert/strict';
import {unitRadius,unitBlocked,resolveUnitCollisions} from '../shared/unit-collision.js';
const unit=(id,x,z,extra={})=>({id,x,z,size:1,alive:true,...extra});
const game=units=>({time:1,bounds:16,obstacles:[],units});
function separated(units){for(let i=0;i<units.length;i++)for(let j=i+1;j<units.length;j++)assert.ok(Math.hypot(units[i].x-units[j].x,units[i].z-units[j].z)>=unitRadius(units[i])+unitRadius(units[j])-.0002,`overlap ${units[i].id}/${units[j].id}`);}

test('body radius follows visual size with bounded sensible limits',()=>{assert.equal(unitRadius({size:2}),unitRadius({size:1})*2);assert.ok(unitRadius({size:.5})<unitRadius({size:1}));assert.ok(unitRadius({size:99})<=1.6);assert.ok(unitRadius({size:0})>=.2);assert.equal(unitRadius({collisionRadius:.8,size:1}),.8);});

test('coincident ground units separate deterministically instead of remaining stacked',()=>{const units=Array.from({length:20},(_,i)=>unit(i+1,0,0)),a=game(structuredClone(units)),b=game(structuredClone(units));const result=resolveUnitCollisions(a,1/30);resolveUnitCollisions(b,1/30);assert.equal(result.unresolved,0);separated(a.units);assert.deepEqual(a.units,b.units);assert.ok(a.units.every(u=>Number.isFinite(u.x)&&Number.isFinite(u.z)));});

test('dense neighboring hash buckets separate without persistent overlap',()=>{const units=[];for(let x=0;x<8;x++)for(let z=0;z<8;z++)units.push(unit(units.length+1,x*.85-3,z*.85-3));const g=game(units),result=resolveUnitCollisions(g,1/30);assert.equal(result.unresolved,0);separated(g.units);const positions=g.units.map(u=>({x:u.x,z:u.z}));resolveUnitCollisions(g,1/30);assert.deepEqual(g.units.map(u=>({x:u.x,z:u.z})),positions);});

test('air and ground occupy separate layers but flying units still avoid each other',()=>{const ground=unit(1,0,0),air=unit(2,0,0,{flying:true}),other=unit(3,0,0,{flying:true}),g=game([ground,air,other]);resolveUnitCollisions(g,1/30);assert.equal(ground.x,0);assert.equal(ground.z,0);separated([air,other]);assert.equal(unitBlocked(game([ground]),air,{x:0,z:0}),false);});

test('logical instance coordinates rather than object identity control collision membership',()=>{const a=unit(1,0,0,{cell:{x:0,z:0,r:16,key:'a'}}),b=unit(2,0,0,{cell:{x:0,z:0,r:16,key:'a'}}),g=game([a,b]);resolveUnitCollisions(g,1/30);separated([a,b]);const first=unit(3,0,0,{lineLane:'a'}),second=unit(4,0,0,{lineLane:'b'});resolveUnitCollisions(game([first,second]),1/30);assert.deepEqual([first.x,first.z,second.x,second.z],[0,0,0,0]);});

test('pair correction slides away from a wall and keeps every body outside it',()=>{const a=unit(1,1,0),b=unit(2,1.1,0),g=game([a,b]);g.obstacles=[{x:0,z:0,w:1,d:6,h:3}];const result=resolveUnitCollisions(g,1/30);assert.equal(result.unresolved,0);separated(g.units);assert.ok(g.units.every(u=>u.x>=.5+unitRadius(u)-.0002));});

test('bodies stay fully inside arena borders, including a private far-away cell',()=>{const a=unit(1,15.9,0),b=unit(2,15.9,0),g=game([a,b]);resolveUnitCollisions(g,1/30);separated(g.units);assert.ok(g.units.every(u=>Math.abs(u.x)+unitRadius(u)<=16+.0001));const c=unit(3,71.9,0,{cell:{x:56,z:0,r:16}}),d=unit(4,71.9,0,{cell:{x:56,z:0,r:16}}),h={...game([c,d]),bounds:80};resolveUnitCollisions(h,1/30);separated(h.units);assert.ok(h.units.every(u=>Math.abs(u.x-56)+unitRadius(u)<=16+.0001));});

test('unitBlocked validates bodies, walls, boundaries, ignored swap targets and custom map terrain',()=>{const a=unit(1,0,0),b=unit(2,2,0),g=game([a,b]);assert.equal(unitBlocked(g,a,{x:2,z:0}),true);assert.equal(unitBlocked(g,a,{x:2,z:0},b.id),false);assert.equal(unitBlocked(g,a,{x:2,z:0},[b.id]),false);assert.equal(unitBlocked(g,a,{x:16,z:0}),true);g.obstacles=[{x:4,z:0,w:1,d:2}];assert.equal(unitBlocked(g,a,{x:3.3,z:0}),true);g.unitTerrainBlocked=(u,p,r)=>p.z>4-r;assert.equal(unitBlocked(g,a,{x:0,z:5}),true);assert.equal(unitBlocked(g,a,{x:0,z:3}),false);});

test('separation never tunnels through a solid divider or changes random game state',()=>{const a=unit(1,-.9,0),b=unit(2,-.95,0),g=game([a,b]);g.seed=99;g.random=()=>{throw Error('collision must not consume gameplay RNG');};g.obstacles=[{x:0,z:0,w:.6,d:12}];resolveUnitCollisions(g,1/30);separated(g.units);assert.ok(g.units.every(u=>u.x<=-.3-unitRadius(u)+.0002));assert.equal(g.seed,99);});

test('dead bodies do not block movement and invalid time steps do not mutate units',()=>{const a=unit(1,0,0),dead=unit(2,0,0,{alive:false}),g=game([a,dead]),before=structuredClone(g.units);assert.equal(unitBlocked(g,a,{x:0,z:0}),false);resolveUnitCollisions(g,0);assert.deepEqual(g.units,before);resolveUnitCollisions(g,1/30);assert.equal(a.x,0);assert.equal(a.z,0);});
