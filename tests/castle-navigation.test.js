import test from 'node:test';
import assert from 'node:assert/strict';
import {castlePassable,castleSegmentClear,castleSpawnPoint,moveCastleUnit,castleNavigationInfo,castleNavigationRadius} from '../shared/castle-navigation.js';

function field(map={}){return{map:{width:104,depth:56,minX:-52,maxX:52,minZ:-28,maxZ:28,...map},units:[],buildings:[],teams:[],obstacles:[],elapsed:0,navigationRevision:0};}
function troop(cf,options={}){const u={id:cf.units.length+1,x:-23,z:0,size:1,speed:3,alive:true,...options};cf.units.push(u);return u;}
function advance(cf,u,target,seconds=40,dt=.05){const points=[];let reached=false;for(let i=0;i<seconds/dt;i++){cf.elapsed+=dt;reached=moveCastleUnit(cf,u,target,dt);points.push({x:u.x,z:u.z});assert.ok(castlePassable(cf,u,castleNavigationRadius(u),{flying:u.flying}),`body blocked at ${u.x},${u.z}`);if(reached)break;}return{points,reached};}

test('a large rhino routes around a dense central forest within the full 104×56 battlefield',()=>{const cf=field();for(let x=-18;x<=18;x+=1)for(let z=-5;z<=5;z+=1)cf.obstacles.push({id:`tree-${x}-${z}`,x,z,w:.82,d:.82});const u=troop(cf,{collisionRadius:1.1}),target={x:23,z:0},result=advance(cf,u,target);assert.equal(result.reached,true);assert.ok(Math.hypot(u.x-target.x,u.z-target.z)<.2);assert.ok(result.points.some(p=>Math.abs(p.z)>6.4),'the rhino must actually go around the inflated forest');const info=castleNavigationInfo(cf);assert.ok(info.searches>0);assert.ok(info.expanded<16000);assert.ok(info.cachedPaths>0);});

test('a gap narrower than the unit body is impassable, whereas a smaller troop crosses it',()=>{const cf=field({width:30,depth:6,minX:-15,maxX:15,minZ:-3,maxZ:3});cf.obstacles=[{x:0,z:2,w:20,d:2},{x:0,z:-2,w:20,d:2}];const large=troop(cf,{x:-12,collisionRadius:1.1});advance(cf,large,{x:12,z:0},3);assert.ok(large.x< -10);assert.equal(large.castleNavigationBlocked,true);const small=troop(cf,{x:-12,collisionRadius:.4});assert.equal(advance(cf,small,{x:12,z:0},12).reached,true);});

test('a huge movement step cannot tunnel through a thin full-height divider or its corners',()=>{const cf=field();cf.obstacles=[{x:0,z:0,w:.08,d:56}];const u=troop(cf,{x:-5,speed:100});cf.elapsed=.1;assert.equal(moveCastleUnit(cf,u,{x:5,z:0},10),false);assert.equal(u.x,-5);assert.equal(u.z,0);assert.ok(castlePassable(cf,u,.45));});

test('separation guards reject crossing a thin collider even when both endpoints are individually free',()=>{const cf=field();cf.obstacles=[{x:0,z:0,w:.08,d:4}];const a={x:-1,z:0},b={x:1,z:0};assert.equal(castlePassable(cf,a,.4),true);assert.equal(castlePassable(cf,b,.4),true);assert.equal(castleSegmentClear(cf,a,b,.4),false);assert.equal(castleSegmentClear(cf,a,b,.4,{flying:true}),true);});

test('flying bypasses trees, castles and construction but still keeps its entire body within rectangular bounds',()=>{const cf=field();cf.obstacles=[{x:0,z:0,w:30,d:50}];cf.buildings=[{x:10,z:0,w:5,d:5,alive:true}];cf.teams=[{x:20,z:0,w:4,d:6,alive:true}];const u=troop(cf,{flying:true,speed:100});assert.equal(moveCastleUnit(cf,u,{x:30,z:0},1),true);assert.equal(u.x,30);assert.equal(u.z,0);assert.equal(moveCastleUnit(cf,u,{x:999,z:999},10),true);const r=castleNavigationRadius(u);assert.ok(u.x<=52-r);assert.ok(u.z<=28-r);assert.equal(castlePassable(cf,{x:0,z:0},r),false);assert.equal(castlePassable(cf,{x:0,z:0},r,{flying:true}),true);});

test('occupied structure centers produce a reachable approach point instead of endless pushing into the castle',()=>{const cf=field();cf.teams=[{id:40,x:43,z:0,w:3,d:5,alive:true}];const u=troop(cf,{x:23,z:0}),result=advance(cf,u,cf.teams[0],20);assert.equal(result.reached,true);assert.ok(u.x<43);assert.ok(castlePassable(cf,u,castleNavigationRadius(u)));assert.ok(Math.hypot(u.x-43,u.z)<4);});

test('build, movement and demolition invalidate cached geometry; dead structures stop blocking',()=>{const cf=field(),u=troop(cf,{x:-12,z:0});moveCastleUnit(cf,u,{x:12,z:0},.1);const first=castleNavigationInfo(cf).rebuilds;cf.buildings.push({id:90,x:0,z:0,w:2,d:12,alive:true});cf.navigationRevision++;assert.equal(castlePassable(cf,{x:0,z:0},.4),false);advance(cf,u,{x:12,z:0},20);assert.ok(u.x>10);assert.ok(castleNavigationInfo(cf).rebuilds>first);cf.buildings[0].alive=false;cf.navigationRevision++;assert.equal(castlePassable(cf,{x:0,z:0},.4),true);u.x=-12;u.z=0;assert.equal(advance(cf,u,{x:12,z:0},12).reached,true);});

test('geometry validation also sees same-length building replacement and movement',()=>{const cf=field();cf.buildings=[{id:1,x:0,z:0,w:3,d:3,alive:true}];assert.equal(castlePassable(cf,{x:0,z:0},.4),false);cf.buildings[0].x=5;assert.equal(castlePassable(cf,{x:0,z:0},.4),true);assert.equal(castlePassable(cf,{x:5,z:0},.4),false);cf.buildings[0]={id:2,x:-5,z:0,w:3,d:3,alive:true};assert.equal(castlePassable(cf,{x:5,z:0},.4),true);assert.equal(castlePassable(cf,{x:-5,z:0},.4),false);});

test('same-frame geometry edits invalidate size, life, castle and bounds without depending on elapsed or revision',()=>{
 const cf=field(),building={id:1,x:0,z:0,w:2,d:2,alive:true};cf.buildings.push(building);
 assert.equal(castlePassable(cf,{x:2,z:0},.4),true);building.w=4;assert.equal(castlePassable(cf,{x:2,z:0},.4),false);
 building.alive=false;assert.equal(castlePassable(cf,{x:0,z:0},.4),true);
 cf.teams.push({id:2,x:5,z:0,w:2,d:2,alive:true});assert.equal(castlePassable(cf,{x:5,z:0},.4),false);cf.teams[0].z=5;assert.equal(castlePassable(cf,{x:5,z:0},.4),true);
 cf.map.maxX=10;assert.equal(castlePassable(cf,{x:11,z:0},.4),false);assert.equal(cf.elapsed,0);assert.equal(cf.navigationRevision,0);
});

test('replacing a collider with identical geometry stops retaining the detached old object',()=>{
 const cf=field(),old={id:1,x:0,z:0,w:2,d:2,alive:true};cf.buildings.push(old);assert.equal(castlePassable(cf,{x:0,z:0},.4),false);
 cf.buildings[0]={...old};assert.equal(castlePassable(cf,{x:0,z:0},.4),false);
 old.x=20;assert.equal(castlePassable(cf,{x:0,z:0},.4),false);assert.equal(castlePassable(cf,{x:20,z:0},.4),true);
 const builds=castleNavigationInfo(cf).rebuilds;for(let i=0;i<100;i++)castlePassable(cf,{x:10,z:10},.4);assert.equal(castleNavigationInfo(cf).rebuilds,builds);
});

test('spawn recovery chooses a nearby free body position and refuses a point buried deep inside a large structure',()=>{const cf=field();cf.obstacles=[{x:0,z:0,w:.7,d:.7}];const point=castleSpawnPoint(cf,{x:0,z:0},.4);assert.ok(point);assert.ok(Math.hypot(point.x,point.z)<=1.01);assert.ok(castlePassable(cf,point,.4));cf.buildings=[{x:10,z:0,w:12,d:12,alive:true}];assert.equal(castleSpawnPoint(cf,{x:10,z:0},.4),null);const u=troop(cf,{x:10,z:0});assert.equal(moveCastleUnit(cf,u,{x:25,z:0},.1),false);assert.equal(u.x,10);assert.equal(u.z,0);});

test('a slightly embedded source recovers to its original side and cannot teleport across a full-height barrier',()=>{const cf=field();cf.obstacles=[{x:0,z:0,w:.2,d:56}];const u=troop(cf,{x:-.3,z:0,collisionRadius:.45});assert.equal(castlePassable(cf,u,.45),false);assert.equal(moveCastleUnit(cf,u,{x:5,z:0},.1),false);assert.ok(u.x<-.54);assert.ok(Math.hypot(u.x+.3,u.z)<=.91);assert.ok(castlePassable(cf,u,.45));});

test('collision guards can include live units, ignore the source id and keep air/ground layers distinct',()=>{const cf=field(),u=troop(cf,{x:0,z:0});assert.equal(castlePassable(cf,{x:0,z:0},.4),true);assert.equal(castlePassable(cf,{x:0,z:0},.4,{ignoreUnits:false}),false);assert.equal(castlePassable(cf,{x:0,z:0},.4,{ignoreUnits:false,ignoreId:u.id}),true);assert.equal(castlePassable(cf,{x:0,z:0},.4,{ignoreUnits:false,flying:true}),true);u.alive=false;assert.equal(castlePassable(cf,{x:0,z:0},.4,{ignoreUnits:false}),true);});

test('following a cached multi-corner route does not walk backward after a large but valid frame',()=>{const cf=field();cf.obstacles=[{x:-8,z:-15,w:2,d:24},{x:8,z:15,w:2,d:24}];const u=troop(cf,{x:-20,z:0,speed:4}),target={x:20,z:0};let reached=false;for(let i=0;i<35;i++){cf.elapsed+=.75;reached=moveCastleUnit(cf,u,target,.75);assert.ok(castlePassable(cf,u,castleNavigationRadius(u)));if(reached)break;}assert.equal(reached,true);assert.ok(hypotForTest(u,target)<.2);});
const hypotForTest=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);

test('path calculation is bounded, deterministic, cached and independent of game randomness or snapshots',()=>{const run=()=>{const cf=field();cf.obstacles=[{x:0,z:0,w:12,d:14}];const u=troop(cf);advance(cf,u,{x:23,z:0},25);assert.ok(castleNavigationInfo(cf).searches<=2);assert.ok(!Object.keys(u).some(key=>key.includes('path')||key.includes('Path')));return{x:u.x,z:u.z,facing:u.facing,moving:u.moving};};assert.deepEqual(run(),run());const original=Math.random;try{Math.random=()=>{throw Error('navigation must not use game RNG');};run();}finally{Math.random=original;}});
