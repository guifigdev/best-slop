import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {CASTLE_UNITS,CASTLE_BUILDINGS} from '../shared/castle-catalog.js';
import {castleCombatProfile,castleCombatRange,castleFlightHeight} from '../shared/castle-spatial.js';
import {castleWeaponFor} from '../shared/castle-weapons.js';
import {castleBuildingCard} from '../src/castle-ui.js';
import {castleUnitInfo} from '../src/castle-unit-info.js';

function setup(){const g=new Game(114,{mode:'castlefight'});g.addPlayer('p','knight');g.addPlayer('q','knight');g.initCastleFight();g.castleDefenseTick=()=>{};return g;}
function spawn(g,key,owner='p'){
 const def=Object.values(CASTLE_BUILDINGS).find(b=>b.unit===key),builder=g.player(owner),b={id:g.id(),key:def.key,owner,team:builder.team,lane:1,x:owner==='p'?-34:34,z:18,w:def.footprint.w,d:def.footprint.d,alive:true,nextSpawn:null,spawnCount:0};
 g.castleFight.buildings.push(b);g.castleFight.navigationRevision++;return g.castleSpawn(b);
}

test('voxel combat conversion preserves original data, short reach, weapon roles and ratios without double scaling',()=>{
 const original=JSON.stringify(CASTLE_UNITS);
 for(const u of Object.values(CASTLE_UNITS)){
  const runtime=castleCombatProfile(u);assert.equal(runtime.range,castleCombatRange(u.range));assert.equal(castleCombatProfile(runtime),runtime);
  assert.equal(runtime.damage,u.damage);assert.equal(runtime.interval,u.interval);assert.equal(runtime.speed,u.speed);
  for(let i=0;i<u.weapons.length;i++){assert.equal(runtime.weapons[i].range,castleCombatRange(u.weapons[i].range));assert.deepEqual(runtime.weapons[i].targets,u.weapons[i].targets);assert.equal(runtime.weapons[i].damage,u.weapons[i].damage);}
 }
 assert.equal(JSON.stringify(CASTLE_UNITS),original);assert.equal(castleCombatProfile(CASTLE_UNITS.hfoo).range,.55);
 assert.equal(castleCombatProfile(CASTLE_UNITS.hrif).range,500/256*3);assert.equal(castleCombatProfile(CASTLE_UNITS.hmtm).range,1000/256*3);
 const marksman=castleCombatProfile(CASTLE_UNITS.h05C);assert.equal(castleWeaponFor(marksman,{flying:false}),null);assert.equal(castleWeaponFor(marksman,{flying:true}).range,800/256*3);assert.equal(castleWeaponFor(marksman,{castleStructure:true}).range,500/256*3);
});

test('Sniper fires at five world units and Mortar acquires and fires beyond the old nine-unit acquisition ceiling',()=>{
 for(const [key,distance]of [['hrif',5],['hmtm',10.5]]){
  const g=setup(),u=spawn(g,key),enemy=spawn(g,'hfoo','q');assert.ok(u&&enemy);
  Object.assign(u,{x:0,z:9,cd:0});Object.assign(enemy,{x:distance,z:9,speed:0,damage:0,cd:999,hp:10000,maxHp:10000});const x=u.x,hp=enemy.hp;
  g.tick(.05);assert.equal(u.x,x);assert.ok(enemy.hp<hp);assert.equal(u.target,enemy.id);
 }
 const g=setup(),u=spawn(g,'hrif'),enemy=spawn(g,'hfoo','q');Object.assign(u,{x:0,z:9});Object.assign(enemy,{x:7,z:9,speed:0,damage:0,cd:999,hp:10000,maxHp:10000});g.tick(.05);assert.equal(enemy.hp,10000);assert.ok(u.x>0);
});

test('all native flyers spawn above the ground army with matching snapshot altitudes, while terrestrial units remain grounded',()=>{
 for(const u of Object.values(CASTLE_UNITS).filter(u=>u.flying)){
  const g=setup(),flyer=spawn(g,u.key);assert.ok(flyer,u.key);assert.ok(flyer.altitude>=4.4);assert.equal(flyer.altitude,castleFlightHeight(u));
  assert.equal(g.snapshot().units.find(x=>x.id===flyer.id).altitude,flyer.altitude);
 }
 const g=setup();assert.equal(spawn(g,'hrif').altitude,0);assert.equal(castleFlightHeight({flying:false}),0);
});

test('purchase and inspection UI display the same adapted range as the actual spawned unit',()=>{
 const g=setup(),u=spawn(g,'hrif'),b=CASTLE_BUILDINGS.human_h003;
 assert.match(castleBuildingCard(b.key,b,10000),/alcance 5,9m/);assert.match(castleUnitInfo(u),/5,86 m/);assert.match(castleUnitInfo(CASTLE_UNITS.hrif),/5,86 m/);
});
