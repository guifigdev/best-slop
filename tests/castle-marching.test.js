import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {CASTLE_BUILDINGS} from '../shared/castle-catalog.js';
import {advanceCastleRoute} from '../shared/castle-marching.js';
import {unitsPhysicallyCollide} from '../shared/unit-footprint.js';
import {castlePassable,castleNavigationRadius} from '../shared/castle-navigation.js';
const serpent=Object.keys(CASTLE_BUILDINGS).find(k=>CASTLE_BUILDINGS[k].unit==='n00H');
function setup(){const g=new Game(94,{mode:'castlefight'});g.addPlayer('a');g.addPlayer('b');g.initCastleFight();g.castleDefenseTick=()=>{};return g;}

test('sixty slow flying serpents traverse either lane in either direction instead of orbiting its exact waypoint',()=>{
 for(const team of [1,2])for(const lane of [0,1]){
  const g=setup(),cf=g.castleFight,direction=team===1?1:-1,b={id:999,key:serpent,team,owner:team===1?'a':'b',lane,spawnCount:0,x:team===1?-32:32,z:lane===0?-9:9,w:2,d:2};
  for(let i=0;i<60;i++){const u=g.castleSpawn(b);assert.ok(u);u.x=direction*(20-(i%6)*.5);u.z=cf.map.lanes[lane].z+Math.floor(i/6)*.4;u.baseDamage=u.damage=0;}
  for(let i=0;i<1800;i++)g.tick(1/30);
  assert.equal(cf.units.length,60);assert.ok(cf.units.every(u=>u.pathIndex===u.route.length-1),`team ${team}/lane ${lane}: every troop clears the gate`);
  assert.ok(cf.units.every(u=>direction*u.x>34),'army proceeds into the opposing base');
  assert.equal(unitsPhysicallyCollide(cf.units[0],cf.units[1]),false,'allied formations may share space');
  assert.ok(cf.units.every(u=>castlePassable(cf,u,castleNavigationRadius(u),{flying:true})),'flying armies remain inside physical map bounds');
 }
});

test('ground troops retain collision-safe pathing through the lane gate',()=>{
 const g=setup(),cf=g.castleFight,b={id:999,key:'human_h000',team:1,owner:'a',lane:1,spawnCount:0,x:-32,z:9,w:2,d:2};
 for(let i=0;i<30;i++){const u=g.castleSpawn(b);assert.ok(u);u.x=-20+(i%6)*.5;u.z=9+Math.floor(i/6)*.4;u.baseDamage=u.damage=0;}
 for(let i=0;i<1500;i++)g.tick(1/30);
 assert.ok(cf.units.every(u=>u.pathIndex===u.route.length-1));assert.ok(cf.units.every(u=>castlePassable(cf,u,castleNavigationRadius(u))));
});

test('hostile flying armies still separate at their actual footprints',()=>{
 const g=setup(),cf=g.castleFight,units=[1,2].map(team=>g.castleSpawn({id:900+team,key:serpent,team,owner:team===1?'a':'b',lane:0,spawnCount:0,x:team===1?-32:32,z:-9,w:2,d:2}));
 units.forEach((u,i)=>Object.assign(u,{x:i*.1,z:0,damage:0,baseDamage:0}));g.tick(1/30);
 assert.equal(unitsPhysicallyCollide(units[0],units[1]),true);assert.ok(Math.hypot(units[0].x-units[1].x,units[0].z-units[1].z)>=castleNavigationRadius(units[0])+castleNavigationRadius(units[1])-.001);
});

test('a gate does not skip the corridor from the wrong side, the other lane or a distant corner',()=>{
 const g=setup(),cf=g.castleFight,unit={team:2,lane:1,size:1,pathIndex:0,route:[{x:-23,z:9},{x:-40,z:0}],x:-20,z:9};
 assert.equal(advanceCastleRoute(cf,unit),false);unit.x=-24;unit.z=-9;assert.equal(advanceCastleRoute(cf,unit),false);
 unit.z=25;assert.equal(advanceCastleRoute(cf,unit),false);unit.z=11;assert.equal(advanceCastleRoute(cf,unit),true);assert.equal(unit.pathIndex,1);
 unit.x=-20;assert.equal(advanceCastleRoute(cf,unit),false);assert.equal(unit.pathIndex,1,'combat and separation cannot regress a completed gate');
});

test('after a real off-lane skirmish inside the enemy base, troops continue to the castle instead of returning to the old entry',()=>{
 for(const team of [1,2])for(const key of ['human_h000',serpent]){
  const g=setup(),cf=g.castleFight,d=team===1?1:-1,lane=team===1?1:0;
  const a=g.castleSpawn({id:901,key,team,owner:team===1?'a':'b',lane,spawnCount:0,x:team===1?-32:32,z:lane===0?-9:9,w:2,d:2}),b=g.castleSpawn({id:902,key,team:team===1?2:1,owner:team===1?'b':'a',lane,spawnCount:0,x:team===1?32:-32,z:lane===0?-9:9,w:2,d:2});
  Object.assign(a,{x:d*26,z:0});Object.assign(b,{x:d*27,z:0,hp:1,cd:9999});
  g.tick(.1);assert.equal(b.alive,false);assert.equal(a.pathIndex,a.route.length-1);const x=a.x;
  for(let i=0;i<30;i++)g.tick(1/30);
  assert.ok(d*(a.x-x)>0,'resumed movement heads further into the enemy base');assert.equal(a.pathIndex,a.route.length-1);assert.ok(Math.abs(a.z)<.1,'does not return sideways to its old lane gate');
 }
});
