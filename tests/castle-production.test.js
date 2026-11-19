import {createCastleUI} from '../src/castle-ui.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {CASTLE_BUILDINGS,CASTLE_UNITS} from '../shared/castle-catalog.js';
import {castleProducerSpawn} from '../shared/castle-production.js';
import {castlePassable,castleNavigationRadius,castleRouteAvailable} from '../shared/castle-navigation.js';
import {castleUnitInfo,castleMatchups} from '../src/castle-unit-info.js';

function setup(hero='knight'){const g=new Game(87,{mode:'castlefight'});g.addPlayer('a',hero);g.addPlayer('b',hero);g.initCastleFight();g.castleDefenseTick=()=>{};return g;}
function build(g,team,key,x,z){const p=g.player(team===1?'a':'b');p.gold=p.lumber=100000;assert.equal(g.command(p.owner,{type:'cfBuild',building:key,x,z}),true);return g.castleFight.buildings.at(-1);}

test('troops are born next to their own producer, then walk through their own entry and across the selected lane',()=>{
 for(const team of [1,2])for(const z of [-18,18]){const g=setup(),cf=g.castleFight,d=team===1?1:-1,b=build(g,team,'human_h000',-d*40,z),u=g.castleSpawn(b),entry=team===1?cf.map.lanes[b.lane].left:cf.map.lanes[b.lane].right;b.nextSpawn=Infinity;
  assert.ok(u);assert.ok(Math.hypot(u.x-b.x,u.z-b.z)<3);assert.ok(Math.hypot(u.x-entry.x,u.z-entry.z)>10);assert.equal(u.building,b.id);assert.equal(u.route.length,3);assert.deepEqual(u.route[0],{...entry,stage:'entry'});assert.equal(u.pathIndex,0);assert.ok(castlePassable(cf,u,castleNavigationRadius(u)));
  const born={x:u.x,z:u.z};g.tick(.1);assert.ok(Math.hypot(u.x-born.x,u.z-born.z)<=u.speed*.1+.001,'first movement cannot teleport to the lane');
  const visited=new Set([u.pathIndex]);for(let i=0;i<900&&u.pathIndex<2;i++){g.tick(.1);visited.add(u.pathIndex);}assert.ok(visited.has(1));assert.equal(u.pathIndex,2);assert.ok(d*u.x>22,'reaches the far end by walking');
 }
});

test('a blocked producer holds production without serial, spawn count or remote-lane fallback, then resumes when cleared',()=>{
 const g=setup(),cf=g.castleFight,b=build(g,1,'human_h000',-40,18);b.workRemaining=0;b.readyAt=0;b.hp=b.maxHp;g.castleCompleteBuildings();b.nextSpawn=b.spawnInterval;cf.elapsed=b.nextSpawn;const original=cf.obstacles;cf.obstacles=[...original,{id:'sealed-producer',x:b.x,z:b.z,w:9,d:9}];cf.navigationRevision++;const serial=g.serial,count=b.spawnCount,due=b.nextSpawn;
 assert.equal(g.castleSpawn(b),null);assert.equal(g.serial,serial);assert.equal(b.spawnCount,count);g.tick(.1);assert.equal(cf.units.length,0);assert.equal(b.nextSpawn,due);
 cf.obstacles=original;cf.navigationRevision++;g.tick(.1);assert.equal(cf.units.length,1);assert.ok(Math.hypot(cf.units[0].x-b.x,cf.units[0].z-b.z)<3);assert.equal(b.spawnCount,count+1);assert.ok(b.nextSpawn>cf.elapsed);
});

test('ground births choose a reachable side when the front is blocked and do not appear inside an enclosed pocket',()=>{
 const g=setup(),cf=g.castleFight,b=build(g,1,'human_h000',-40,18),entry={x:-23,z:9},unit={size:1,flying:false};
 cf.obstacles.push({id:'front-block',x:-36.5,z:18,w:2.5,d:4});cf.navigationRevision++;let p=castleProducerSpawn(cf,b,unit,entry);assert.ok(p);assert.ok(Math.abs(p.z-b.z)>1);assert.ok(castleRouteAvailable(cf,p,entry,.45));
 cf.obstacles.push(...[{x:-44,z:18,w:.5,d:10},{x:-36,z:18,w:.5,d:10},{x:-40,z:14,w:10,d:.5},{x:-40,z:22,w:10,d:.5}].map((o,i)=>({...o,id:'wall-'+i})));cf.navigationRevision++;
 assert.equal(castleProducerSpawn(cf,b,unit,entry),null);
});

test('large bodies and flying births both clear the producer roof and occupied ground footprint',()=>{
 const g=setup(),cf=g.castleFight,b=build(g,1,'human_h000',-40,18),entry={x:-23,z:9};
 for(const unit of [{size:2.4,collisionRadius:1.1,flying:false},{size:1,flying:true}]){const p=castleProducerSpawn(cf,b,unit,entry);assert.ok(p);assert.ok(castlePassable(cf,p,castleNavigationRadius(unit),{flying:false}));assert.ok(Math.hypot(p.x-b.x,p.z-b.z)<4);}
});

test('roles reserve different footprints and an expanding upgrade reserves its new area immediately',()=>{
 const tower=CASTLE_BUILDINGS.human_h006,warrior=CASTLE_BUILDINGS.human_h000,giant=Object.values(CASTLE_BUILDINGS).find(b=>b.visualProfile.role==='giant');assert.ok(tower.footprint.w<warrior.footprint.w);assert.ok(giant.footprint.w>warrior.footprint.w);assert.equal(warrior.visualProfile.variant,'sword');assert.equal(CASTLE_BUILDINGS.human_h003.visualProfile.variant,'rifle');
 const g=setup('turtle'),b=build(g,1,'naga_h00F',-40,18);b.workRemaining=0;b.readyAt=g.castleFight.elapsed;g.castleCompleteBuildings();assert.equal(g.command('a',{type:'cfUpgrade',buildingId:b.id,building:'naga_h032'}),true);assert.equal(b.w,4);assert.equal(b.d,3.5);
 assert.equal(g.command('a',{type:'cfBuild',building:'naga_h00H',x:-37,z:18}),false,'reserved growth prevents a neighbor from occupying it');b.workRemaining=0;b.readyAt=g.castleFight.elapsed;g.castleCompleteBuildings();assert.equal(b.w,4);assert.equal(b.key,'naga_h032');
});

test('Sniper fires outside melee reach with a bullet effect and its factual reference range is retained',()=>{
 const g=setup(),cf=g.castleFight,b=build(g,1,'human_h003',-40,18),enemy=build(g,2,'human_h000',40,18),u=g.castleSpawn(b),target=g.castleSpawn(enemy);b.nextSpawn=enemy.nextSpawn=Infinity;Object.assign(u,{x:0,z:9});Object.assign(target,{x:2.3,z:9,cd:9999,hp:10000,maxHp:10000});const before=target.hp;
 g.tick(.05);assert.ok(target.hp<before);assert.ok(Math.hypot(u.x-target.x,u.z-target.z)>1.5);assert.equal(u.range,CASTLE_UNITS.hrif.sourceStats.range/256);assert.equal(u.ranged,true);assert.ok(g.effects.some(e=>e.type==='arrow'&&e.source===u.id&&e.projectileKind==='bullet'));assert.ok(!g.effects.some(e=>e.type==='slash'&&e.source===u.id));
 const m=castleMatchups(u);assert.ok(m.weak.some(x=>x.type==='normal'&&x.multiplier===1.75));assert.ok(m.resistant.some(x=>x.type==='magic'&&x.multiplier===.7));const html=castleUnitInfo(u);assert.match(html,/Alcance/);assert.match(html,/Vulnerável a/);assert.match(html,/Armadura média/);assert.doesNotMatch(html,/extraído|implementa|escala espacial|nativo/);
});

test('clicking a troop prioritizes its visible model over a building behind it',()=>{
 const selected=[],inspected=[],g=setup(),b=build(g,1,'human_h003',-40,18),unit=g.castleSpawn(b),view={setCastleBuild:()=>{},setCastleSelection:ids=>selected.push(ids),setInspected:id=>inspected.push(id)};
 const ui=createCastleUI({view,send:()=>true,getState:()=>g.snapshot(),getOwner:()=> 'a',toast:()=>{},portrait:()=>'',onEnd:()=>{}});
 ui.point({point:{x:unit.x,z:unit.z},unit,button:0,building:b.id});assert.deepEqual(selected,[[unit.id]]);assert.deepEqual(inspected,[unit.id]);
});
