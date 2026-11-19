import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {CASTLE_BUILDINGS} from '../shared/castle-catalog.js';
import {advanceCastleRoute} from '../shared/castle-marching.js';
import {castlePassable,castleNavigationRadius} from '../shared/castle-navigation.js';
const serpent=Object.keys(CASTLE_BUILDINGS).find(k=>CASTLE_BUILDINGS[k].unit==='n00H');
function setup(){const g=new Game(94,{mode:'castlefight'});g.addPlayer('a');g.addPlayer('b');g.initCastleFight();g.castleDefenseTick=()=>{};return g;}

test('sixty slow flying serpents traverse either lane in either direction instead of orbiting its exact waypoint',()=>{
 for(const team of [1,2])for(const lane of [0,1]){
  const g=setup(),cf=g.castleFight,direction=team===1?1:-1,b={id:999,key:serpent,team,owner:team===1?'a':'b',lane,spawnCount:0};
  for(let i=0;i<60;i++){const u=g.castleSpawn(b);assert.ok(u);u.x=direction*(20-(i%6)*.5);u.z=cf.map.lanes[lane].z+Math.floor(i/6)*.4;u.baseDamage=u.damage=0;}
  for(let i=0;i<1800;i++)g.tick(1/30);
  assert.equal(cf.units.length,60);assert.ok(cf.units.every(u=>u.pathIndex===1),`team ${team}/lane ${lane}: every troop clears the gate`);
  assert.ok(cf.units.every(u=>direction*u.x>34),'army proceeds into the opposing base');
  for(let i=0;i<cf.units.length;i++)for(let j=i+1;j<cf.units.length;j++)assert.ok(Math.hypot(cf.units[i].x-cf.units[j].x,cf.units[i].z-cf.units[j].z)>=.85,'bodies remain separated');
 }
});

test('ground troops retain collision-safe pathing through the lane gate',()=>{
 const g=setup(),cf=g.castleFight,b={id:999,key:'human_h000',team:1,owner:'a',lane:1,spawnCount:0};
 for(let i=0;i<30;i++){const u=g.castleSpawn(b);assert.ok(u);u.baseDamage=u.damage=0;}
 for(let i=0;i<1500;i++)g.tick(1/30);
 assert.ok(cf.units.every(u=>u.pathIndex===1));assert.ok(cf.units.every(u=>castlePassable(cf,u,castleNavigationRadius(u))));
});

test('a gate does not skip the corridor from the wrong side, the other lane or a distant corner',()=>{
 const g=setup(),cf=g.castleFight,unit={team:2,lane:1,size:1,pathIndex:0,route:[{x:-23,z:9},{x:-40,z:0}],x:-20,z:9};
 assert.equal(advanceCastleRoute(cf,unit),false);unit.x=-24;unit.z=-9;assert.equal(advanceCastleRoute(cf,unit),false);
 unit.z=25;assert.equal(advanceCastleRoute(cf,unit),false);unit.z=11;assert.equal(advanceCastleRoute(cf,unit),true);assert.equal(unit.pathIndex,1);
 unit.x=-20;assert.equal(advanceCastleRoute(cf,unit),false);assert.equal(unit.pathIndex,1,'combat and separation cannot regress a completed gate');
});
