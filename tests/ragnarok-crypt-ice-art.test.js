import test from 'node:test';
import assert from 'node:assert/strict';
import {RAGNAROK_CRYPT_ICE_KINDS as kinds,ragnarokCryptIceSpec as spec} from '../src/ragnarok-crypt-ice-art.js';
const all=s=>[...s.parts,...s.legs.map(p=>[p.x,p.y,p.z,p.w,p.h,p.d,p.color])];
test('crypt and ice sprite reconstructions are distinct, immutable, finite and below the sculpture budget',()=>{
 const shapes=new Set();for(const key of kinds){const s=spec(key),parts=all(s);assert.equal(spec(key),s);assert.ok(Object.isFrozen(s)&&Object.isFrozen(s.parts[0]));assert.ok(parts.length>80&&parts.length<=500,key+': '+parts.length);assert.ok(parts.every(p=>p.length===7&&p.every(Number.isFinite)&&p.slice(3,6).every(v=>v>0)));assert.ok(s.eyeLine>0&&s.eyeLine<s.height);assert.ok(parts.every(p=>p[1]+p[4]/2<s.height+.001));assert.ok(parts.every(p=>Math.abs(p[0])+p[3]/2<1.5&&Math.abs(p[2])+p[5]/2<1.5));shapes.add(JSON.stringify(parts.map(p=>p.slice(0,6))));}assert.equal(shapes.size,4);assert.equal(spec('unknown'),null);assert.equal(spec('__proto__'),null);
});
test('bandages, draped ghost, shaggy Siroma and floating Gazeti retain their reference anatomy',()=>{
 const mummy=spec('mummy'),ghost=spec('whisper'),siroma=spec('siroma'),gazeti=spec('gazeti');
 assert.equal(mummy.legs.length,2);assert.ok(mummy.parts.filter(p=>p[4]<.09&&p[3]>.4).length>10,'overlapping cloth wraps');
 assert.equal(ghost.legs.length,0);assert.equal(ghost.wings.length,0);assert.equal(ghost.motion,'float');assert.ok(ghost.parts.some(p=>p[0]>.65),'ragged trailing hem');
 assert.equal(siroma.legs.length,4);assert.ok(siroma.parts.some(p=>p[6]===0xf4f0b6),'cream forehead');assert.ok(siroma.parts.some(p=>p[6]===0x444052),'open mouth');
 assert.equal(gazeti.legs.length,0);assert.equal(gazeti.wings.length,0);assert.equal(gazeti.motion,'float');assert.ok(gazeti.height>2.8);assert.ok(gazeti.parts.some(p=>Math.abs(p[0])>=1),'orbiting shards');assert.ok(gazeti.parts.filter(p=>p[6]===0xd8e7ef).length>10,'white crystal facets and teeth');
});
