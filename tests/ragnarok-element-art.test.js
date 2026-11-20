import test from 'node:test';
import assert from 'node:assert/strict';
import {ragnarokElementSpec as spec} from '../src/ragnarok-element-art.js';
const pieces=s=>[...s.parts,...s.legs.map(p=>[p.x,p.y,p.z,p.w,p.h,p.d,p.color]),...s.wings.flatMap(w=>w.parts.map(p=>[p[0]+w.pivot[0],p[1]+w.pivot[1],p[2]+w.pivot[2],...p.slice(3)]))];
const bounds=s=>pieces(s).reduce((b,p)=>({minX:Math.min(b.minX,p[0]-p[3]/2),maxX:Math.max(b.maxX,p[0]+p[3]/2),minZ:Math.min(b.minZ,p[2]-p[5]/2),maxZ:Math.max(b.maxZ,p[2]+p[5]/2),height:Math.max(b.height,p[1]+p[4]/2)}),{minX:0,maxX:0,minZ:0,maxZ:0,height:0});
test('elemental sprite reconstructions retain bounded cached immutable complete geometry',()=>{
 for(const key of ['icetitan','kasa','salamander','poring','marin']){
  const s=spec(key),all=pieces(s);assert.equal(spec(key),s);assert.ok(Object.isFrozen(s)&&Object.isFrozen(s.parts[0]));assert.ok(all.length>100&&all.length<500);assert.ok(all.every(p=>p.slice(0,7).every(Number.isFinite)&&p.slice(3,6).every(n=>n>0)));assert.ok(bounds(s).height<=s.height+.01);assert.ok(s.eyeLine>0&&s.eyeLine<s.height);
 }
 assert.equal(spec('unknown'),null);
});
test('the titan, flame-winged Kasa, low Salamander and round Poring have distinct anatomical signatures',()=>{
 const titan=spec('icetitan'),kasa=spec('kasa'),salamander=spec('salamander'),poring=spec('poring');
 assert.equal(titan.legs.length,2);assert.ok(titan.parts.some(p=>Math.abs(p[0])>1.2&&p[1]<1),'long lowered arms');assert.ok(titan.parts.some(p=>p[6]===0xc23e55),'sprite red pin eyes');
 assert.equal(kasa.wings.length,2);assert.ok(kasa.wings.every(w=>w.parts.length>30));assert.ok(kasa.flames.length>=3);assert.equal(kasa.motion,'fly');
 assert.equal(salamander.legs.length,4);assert.ok(bounds(salamander).maxZ-bounds(salamander).minZ>4);assert.ok(salamander.flames.length>=5);
 assert.equal(poring.legs.length,0);assert.equal(poring.wings.length,0);assert.ok(bounds(poring).maxX-bounds(poring).minX>1.5);assert.ok(poring.parts.some(p=>p[6]===0xffecd4),'white crescent');assert.ok(poring.parts.some(p=>p[6]===0x342a39),'tiny dark eyes');
 assert.deepEqual(spec('marin').parts.map(p=>p.slice(0,6)),poring.parts.map(p=>p.slice(0,6)));assert.notEqual(spec('marin').fur,poring.fur);
});
