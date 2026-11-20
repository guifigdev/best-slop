import test from 'node:test';
import assert from 'node:assert/strict';
import {RAGNAROK_CAVERN_KINDS,ragnarokCavernSpec} from '../src/ragnarok-cavern-art.js';
test('four cavern reconstructions have distinct immutable bounded geometry and safe unknown-key handling',()=>{
 const signatures=new Set();for(const key of RAGNAROK_CAVERN_KINDS){const s=ragnarokCavernSpec(key),all=[...s.parts,...s.legs.map(l=>[l.x,l.y,l.z,l.w,l.h,l.d,l.color])];assert.equal(ragnarokCavernSpec(key),s);assert.ok(Object.isFrozen(s)&&Object.isFrozen(s.parts)&&Object.isFrozen(s.legs));assert.ok(all.length>100&&all.length<=500,key+': '+all.length);for(const p of all){assert.equal(p.length,7);assert.ok(p.every(Number.isFinite));assert.ok(p.slice(3,6).every(v=>v>0));assert.ok(Number.isInteger(p[6])&&p[6]>=0&&p[6]<=0xffffff);assert.ok(Math.abs(p[0])+p[3]/2<2&&Math.abs(p[2])+p[5]/2<2.1);assert.ok(p[1]+p[4]/2<s.height+.15);}signatures.add(JSON.stringify(s.parts));}assert.equal(signatures.size,4);assert.equal(ragnarokCavernSpec('__proto__'),null);assert.equal(ragnarokCavernSpec('missing'),null);
});
test('arthropods have independent legs, Hode rises from sand with a round mouth, and the rock giant has oversized fists',()=>{
 const scorpion=ragnarokCavernSpec('scorpion'),ant=ragnarokCavernSpec('andre'),worm=ragnarokCavernSpec('hode'),golem=ragnarokCavernSpec('golem');assert.equal(scorpion.legs.length,8);assert.equal(ant.legs.length,6);assert.equal(worm.legs.length,0);assert.equal(golem.legs.length,2);assert.equal(worm.motion,'slither');assert.equal(golem.motion,'heavy');assert.ok(scorpion.parts.some(p=>p[1]>2&&p[6]===0xb294cf));assert.ok(worm.parts.some(p=>p[6]===0xffde9b));assert.ok(worm.parts.filter(p=>p[2]>.58&&p[1]>1.8).length>=16);assert.ok(golem.parts.some(p=>Math.abs(p[0])>.95&&p[3]>.4));
});
