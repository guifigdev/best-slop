import test from 'node:test';
import assert from 'node:assert/strict';
import {RO_WORLD_ROUTE,RO_WORLD_GEOGRAPHY,RO_WORLD_LINKS,roWorldNeighbors,roWorldRegion,roWorldGates,roRouteNext,roRouteGate} from '../shared/ro-world-route.js';

test('the supplied diorama becomes one connected Y with the volcano nexus and four additional regional branches',()=>{
 assert.equal(RO_WORLD_LINKS.length,24);assert.equal(Object.keys(RO_WORLD_GEOGRAPHY).length,25);const seenEdges=new Set();
 for(const link of RO_WORLD_LINKS){assert.ok(roWorldRegion(link.a)&&roWorldRegion(link.b));assert.notEqual(link.a,link.b);const id=[link.a,link.b].sort().join(':');assert.ok(!seenEdges.has(id));seenEdges.add(id);assert.ok(Object.isFrozen(link));}
 for(const region of RO_WORLD_ROUTE){const count=roWorldNeighbors(region).length;assert.ok(count>=1);assert.ok(count<=4);}assert.equal(roWorldNeighbors('thor-volcano').length,3);
 const reached=new Set(['prontera']),queue=['prontera'];while(queue.length)for(const key of roWorldNeighbors(queue.shift()))if(!reached.has(key)){reached.add(key);queue.push(key);}assert.equal(reached.size,25);
 const t=RO_WORLD_GEOGRAPHY['thor-volcano'];assert.ok(RO_WORLD_GEOGRAPHY.morroc.x<t.x&&RO_WORLD_GEOGRAPHY.prontera.x>t.x);assert.ok(RO_WORLD_GEOGRAPHY['ice-cavern'].z<RO_WORLD_GEOGRAPHY.juno.z&&RO_WORLD_GEOGRAPHY.juno.z<t.z);
});

test('every graph gate uses a distinct cardinal edge with a reciprocal entry and a central boss arena',()=>{
 for(const region of RO_WORLD_ROUTE){const world=roWorldRegion(region),gates=roWorldGates(region),ports=new Set();assert.equal(world.graph,true);assert.deepEqual(world.bossArena,{x:0,z:0,radius:28});assert.equal(gates.length,roWorldNeighbors(region).length);assert.equal(world.spokes.length,gates.length);assert.ok(Object.isFrozen(world));
  for(const gate of gates){const {x,z}=gate.direction;assert.equal(Math.abs(x)+Math.abs(z),1);assert.equal(gate.x,x*101);assert.equal(gate.z,z*101);assert.ok(!ports.has(x+':'+z));ports.add(x+':'+z);assert.equal(gate.axis,x?'x':'z');assert.equal(gate.w,x?4:18);assert.equal(gate.d,x?18:4);assert.equal(gate.width,18);assert.equal(gate.depth,4);assert.equal(gate.nextScene,roWorldRegion(gate.nextKey).scene);assert.equal(gate.nextRoute,roWorldRegion(gate.nextKey));const reverse=roWorldGates(gate.nextKey).find(g=>g.nextKey===region.key);assert.ok(reverse);assert.equal(reverse.direction.x,-x||0);assert.equal(reverse.direction.z,-z||0);assert.deepEqual(gate.nextEntry,{x:-x*90||0,z:-z*90||0});assert.doesNotThrow(()=>JSON.stringify(gate));}
 }
 assert.deepEqual(roWorldGates('thor-volcano').map(g=>g.direction),[{x:1,z:0},{x:-1,z:0},{x:0,z:-1}]);
});

test('defeating the local MVP opens all forward branches while visited regions remain reachable',()=>{
 const locked=roWorldGates('thor-volcano');assert.ok(locked.every(g=>!g.open&&g.lockedBy==='mvp'));
 const back=roWorldGates('thor-volcano',[],['glast-heim']);assert.equal(back.find(g=>g.nextKey==='glast-heim').open,true);assert.ok(back.filter(g=>g.nextKey!=='glast-heim').every(g=>g.lockedBy==='mvp'));
 const open=roWorldGates('thor-volcano',['thor-volcano'],[]);assert.ok(open.every(g=>g.open&&g.lockedBy===null));
 assert.deepEqual(roWorldGates('missing'),[]);assert.equal(roWorldRegion('__proto__'),null);assert.deepEqual(roWorldNeighbors('constructor'),[]);
});

test('the final sanctuary requires every other MVP seal even if a stale visit claims it was discovered',()=>{
 const all=RO_WORLD_ROUTE.filter(r=>r.key!=='valhalla').map(r=>r.key),gate=clears=>roWorldGates('ice-cavern',clears,['valhalla']).find(g=>g.nextKey==='valhalla');
 for(const missing of all){const locked=gate(all.filter(k=>k!==missing));assert.equal(locked.open,false);assert.equal(locked.lockedBy,'final');}
 const opened=gate(all);assert.equal(opened.open,true);assert.equal(opened.lockedBy,null);
 // V1 remains a linear migration source, never rewritten into the graph order.
 assert.equal(roRouteNext('payon-cave').key,'morroc');assert.equal(roRouteGate('thor-volcano').nextKey,'geffen');
});
