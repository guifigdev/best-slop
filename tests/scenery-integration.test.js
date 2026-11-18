import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {blocked} from '../shared/field.js';
import {sceneState} from '../src/scene-state.js';
import {ARENA_BOUNDS} from '../shared/arena-size.js';
test('Survival grows modestly and gives isolated competitors equal collidable scenery',()=>{
 const g=new Game(7381,{mode:'campaign'});g.addPlayer('a');g.addPlayer('b','mage');g.spawnWave();assert.equal(ARENA_BOUNDS,18);const a=sceneState(g.snapshot(),'a').state,b=sceneState(g.snapshot(),'b').state,props=s=>s.obstacles.filter(o=>o.type==='scenery').map(o=>({x:Number(o.x.toFixed(4)),z:o.z,kind:o.kind,w:o.w,d:o.d}));assert.ok(props(a).length>0);assert.deepEqual(props(a),props(b));for(const u of g.units.filter(u=>u.alive))assert.equal(blocked(u,g.obstacles,.1),false);assert.ok(props(a).some(o=>Math.hypot(o.x,o.z)<9));
});
