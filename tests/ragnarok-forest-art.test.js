import test from 'node:test';
import assert from 'node:assert/strict';
import {RAGNAROK_FOREST_KINDS,ragnarokForestSpec as spec} from '../src/ragnarok-forest-art.js';
const all=s=>[...s.parts,...s.legs.map(p=>[p.x,p.y,p.z,p.w,p.h,p.d,p.color])];
test('four forest sprite sculptures have finite bounded immutable cached geometry',()=>{
 const silhouettes=new Set();for(const key of RAGNAROK_FOREST_KINDS){const s=spec(key),p=all(s);assert.equal(spec(key),s);assert.ok(Object.isFrozen(s)&&Object.isFrozen(s.parts)&&Object.isFrozen(s.parts[0]));assert.ok(p.length>100&&p.length<=500,key+': '+p.length);assert.ok(p.every(v=>v.length===7&&v.every(Number.isFinite)&&v.slice(3,6).every(n=>n>0)),key);assert.ok(Math.max(...p.map(v=>v[1]+v[4]/2))<=s.height+.01,key);assert.ok(s.eyeLine>0&&s.eyeLine<s.height);silhouettes.add(JSON.stringify(p));}assert.equal(silhouettes.size,4);assert.equal(spec('__proto__'),null);assert.equal(spec('unknown'),null);
});
test('mushroom gills, tangled mandrake roots and carved stump faces retain their sprite anatomy',()=>{
 const spore=spec('spore'),mandrake=spec('mandragora'),willow=spec('willow'),elder=spec('elderwillow');
 assert.equal(spore.legs.length,2);assert.ok(spore.parts.some(p=>Math.abs(p[0])>.9&&p[1]>1.4),'broad red cap');assert.ok(spore.parts.filter(p=>p[6]===0xf2d3a1).length>=20,'cream cap rim');
 assert.ok(mandrake.parts.some(p=>Math.abs(p[0])>1),'extended red root tips');assert.ok(mandrake.parts.some(p=>p[1]>2.1),'separate upper head/root crown');
 for(const s of [willow,elder]){assert.equal(s.legs.length,2);assert.equal(s.wings.length,0);assert.ok(s.parts.some(p=>p[1]>2.4),'splintered uneven crown');assert.ok(s.parts.some(p=>p[6]===0x567154),'green vine');assert.ok(s.parts.some(p=>p[2]<.3&&p[4]>.4),'inset hollow face');}
 assert.notEqual(willow.fur,elder.fur);assert.equal(willow.flames.length,0);assert.equal(elder.flames.length,2);assert.deepEqual(willow.parts.slice(0,30).map(p=>p.slice(0,6)),elder.parts.slice(0,30).map(p=>p.slice(0,6)));
});
