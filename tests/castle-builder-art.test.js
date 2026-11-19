import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCastleBuilderModel,castleBuilderPortrait} from '../src/castle-builder-art.js';
import {castleUnitModelKey} from '../src/castle-unit-art.js';
import {CASTLE_BUILDERS} from '../shared/castle-builders.js';

test('new builders use distinct voxel silhouettes and finite geometry with corresponding HUD portraits',()=>{
 const silhouettes=new Set(),portraits=new Set(),keys=new Set();
 for(const key of ['orc','undead','chaos','corrupted']){
  const profile=CASTLE_BUILDERS[key],unit={hero:profile.hero,castleBuilderKey:key,castleBuilder:true},boxes=[];
  const m=buildCastleBuilderModel(unit,{},(_body,...box)=>boxes.push(box));
  assert.ok(m.height>2&&m.eyeLine>1);assert.ok(boxes.length>0);assert.ok(m.legs.length>=2);
  for(const box of boxes){assert.ok(box.every(Number.isFinite));assert.ok(box.slice(3,6).every(n=>n>0));}
  for(const p of m.legs)assert.ok([p.x,p.y,p.z,p.w,p.h,p.d,p.color].every(Number.isFinite));
  silhouettes.add(JSON.stringify(boxes));const svg=castleBuilderPortrait(key);portraits.add(svg);
  assert.match(svg,/<svg/);assert.doesNotMatch(svg,/NaN|undefined/);assert.equal(castleBuilderPortrait(key),svg);
  keys.add(castleUnitModelKey(unit));assert.notEqual(castleUnitModelKey(unit),castleUnitModelKey({hero:profile.hero}));
 }
 assert.equal(silhouettes.size,4);assert.equal(portraits.size,4);assert.equal(keys.size,4);
});

test('existing combat hero art remains the fallback and builder art refuses unsupported keys',()=>{
 for(const key of ['knight','mage','ranger','turtle','owl','raccoon','unknown','__proto__']){
  const boxes=[];assert.equal(buildCastleBuilderModel({hero:key},null,(_body,...box)=>boxes.push(box)),null);
  assert.equal(boxes.length,0);assert.equal(castleBuilderPortrait(key,'original'), 'original');
 }
});
