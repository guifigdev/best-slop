import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {blocked} from '../shared/field.js';
import {sceneState} from '../src/scene-state.js';
import {ARENA_BOUNDS} from '../shared/arena-size.js';
import {ARENAS} from '../shared/arenas.js';
import {unitRadius} from '../shared/unit-collision.js';
test('Survival grows modestly and gives isolated competitors equal collidable scenery',()=>{
 const g=new Game(7381,{mode:'campaign'});g.addPlayer('a');g.addPlayer('b','mage');g.spawnWave();assert.equal(ARENA_BOUNDS,18);const a=sceneState(g.snapshot(),'a').state,b=sceneState(g.snapshot(),'b').state,props=s=>s.obstacles.filter(o=>o.type==='scenery').map(o=>({x:Number(o.x.toFixed(4)),z:o.z,kind:o.kind,w:o.w,d:o.d}));assert.ok(props(a).length>0);assert.deepEqual(props(a),props(b));for(const u of g.units.filter(u=>u.alive))assert.equal(blocked(u,g.obstacles,.1),false);assert.ok(props(a).some(o=>Math.hypot(o.x,o.z)<9));
});

test('spread props never spawn on heroes or monsters across arena themes and changing waves',()=>{
 for(const arena of Object.keys(ARENAS))for(let seed=1;seed<=12;seed++){
  const g=new Game(seed,{mode:'campaign'});g.startingArena=arena;g.addPlayer('a');g.addPlayer('b','mage');g.spawnWave();
  for(const u of g.units.filter(u=>u.alive))assert.equal(blocked(u,g.obstacles.filter(o=>o.type==='scenery'),unitRadius(u)),false,`${arena}/${seed}/${u.id}`);
  const before=g.obstacles.filter(o=>o.type==='scenery').map(o=>[o.x,o.z,o.kind]);g.spawnWave();assert.notDeepEqual(g.obstacles.filter(o=>o.type==='scenery').map(o=>[o.x,o.z,o.kind]),before);
 }
});

test('PvP entry preserves each final hero spawn while the shared arena gets a scattered layout',()=>{
 const g=new Game(73,{mode:'best'});for(const owner of ['a','b','c','d'])g.addPlayer(owner);g.wave=10;g.startCompetitionClash();const props=g.obstacles.filter(o=>o.type==='scenery');assert.equal(props.length,10);for(const h of g.heroes())assert.equal(blocked(h,props,unitRadius(h)),false);
});
