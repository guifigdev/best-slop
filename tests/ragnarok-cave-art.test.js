import test from 'node:test';
import assert from 'node:assert/strict';
import {RAGNAROK_CAVE_KINDS,ragnarokCaveSpec} from '../src/ragnarok-cave-art.js';

test('four recognizable cave sprite reconstructions are finite immutable and stay within their actor budget',()=>{
 const silhouettes=new Set();
 for(const key of RAGNAROK_CAVE_KINDS){
  const s=ragnarokCaveSpec(key),all=[...s.parts,...s.legs.map(p=>[p.x,p.y,p.z,p.w,p.h,p.d,p.color]),...s.wings.flatMap(w=>w.parts)];
  assert.equal(ragnarokCaveSpec(key),s);assert.ok(Object.isFrozen(s)&&Object.isFrozen(s.parts));assert.ok(all.length>80&&all.length<=400,key+': '+all.length);
  for(const p of all){assert.equal(p.length,7);assert.ok(p.every(Number.isFinite));assert.ok(p.slice(3,6).every(n=>n>0));assert.ok(Number.isInteger(p[6])&&p[6]>=0&&p[6]<=0xffffff);}
  silhouettes.add(JSON.stringify(s.parts));
 }
 assert.equal(silhouettes.size,4);assert.equal(ragnarokCaveSpec('missing'),null);assert.equal(ragnarokCaveSpec('__proto__'),null);
});
test('the reconstructions preserve bat wings, six beetle legs, white Tarou coat and the skeleton equipment',()=>{
 const bat=ragnarokCaveSpec('familiar'),bug=ragnarokCaveSpec('thiefbug'),rat=ragnarokCaveSpec('tarou'),archer=ragnarokCaveSpec('archerskeleton');
 assert.equal(bat.wings.length,2);assert.ok(bat.wings.every(w=>w.parts.length>=50));assert.equal(bug.legs.length,6);assert.equal(rat.legs.length,4);assert.equal(archer.legs.length,2);
 assert.ok(rat.parts.some(p=>p[6]===0xf8ece0));assert.ok(archer.parts.some(p=>p[6]===0xa85039));assert.ok(archer.parts.some(p=>p[0]<-.8&&p[1]>1.4));
});
