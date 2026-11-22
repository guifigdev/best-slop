import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCastleBuilderModel,castleBuilderPortrait,castleBuilderSpec} from '../src/castle-builder-art.js';
import {castleUnitModelKey} from '../src/castle-unit-art.js';
import {CASTLE_BUILDERS} from '../shared/castle-builders.js';

test('all ten faction builders have independent original voxel silhouettes and portraits from their actual geometry',()=>{
 const silhouettes=new Set(),portraits=new Set(),keys=new Set();
 for(const [key,profile]of Object.entries(CASTLE_BUILDERS)){
  const unit={hero:profile.hero,castleBuilderKey:key,castleBuilder:true},boxes=[],m=buildCastleBuilderModel(unit,{},(_body,...box)=>boxes.push(box));
  assert.equal(m,castleBuilderSpec(key));assert.ok(Object.isFrozen(m));assert.equal(m.theme,'castle-builder');assert.ok(m.height>2&&m.eyeLine>1&&m.eyeLine<m.height);assert.ok(boxes.length>20&&boxes.length<=330);assert.equal(m.legs.length,key==='turtle'?0:2);assert.equal(m.wings.length,0);assert.deepEqual(boxes,m.boxes);
  for(const box of boxes){assert.ok(box.every(Number.isFinite));assert.ok(box.slice(3,6).every(n=>n>0));assert.ok(box[6]>=0&&box[6]<=0xffffff);}
  for(const p of m.legs)assert.ok([p.x,p.y,p.z,p.w,p.h,p.d,p.color].every(Number.isFinite));
  silhouettes.add(JSON.stringify(boxes));const svg=castleBuilderPortrait(key);portraits.add(svg);assert.match(svg,/<svg/);assert.match(svg,/castle-builder-portrait/);assert.doesNotMatch(svg,/NaN|undefined|<image|<script|href=/);assert.equal(castleBuilderPortrait(key),svg);
  keys.add(castleUnitModelKey(unit));assert.notEqual(castleUnitModelKey(unit),castleUnitModelKey({hero:profile.hero}));
 }
 assert.equal(silhouettes.size,10);assert.equal(portraits.size,10);assert.equal(keys.size,10);
});

test('combat heroes without a Castle identity keep their own renderer and unknown builders never acquire a fallback faction',()=>{
 for(const key of [...Object.keys(CASTLE_BUILDERS),'unknown','__proto__']){const boxes=[];assert.equal(buildCastleBuilderModel({hero:key},null,(_body,...box)=>boxes.push(box)),null);assert.equal(boxes.length,0);}
 for(const key of ['unknown','__proto__','constructor',null,undefined]){assert.equal(castleBuilderSpec(key),null);assert.equal(castleBuilderPortrait(key,'original'),'original');}
 for(const key of Object.keys(CASTLE_BUILDERS))assert.notEqual(castleBuilderPortrait(key,'original'),'original');
});

test('faction descriptions identify humanoid, serpentine, undead and tree craftspeople instead of animal skins',()=>{
 for(const p of Object.values(CASTLE_BUILDERS))assert.doesNotMatch(p.description,/capivara|coelha|raposa|tartaruga|coruja|guaxinim|javali|corvo|leão|lobo/i);
 assert.match(CASTLE_BUILDERS.knight.description,/humano/);assert.match(CASTLE_BUILDERS.turtle.description,/naga/);assert.match(CASTLE_BUILDERS.raccoon.description,/goblin/);assert.match(CASTLE_BUILDERS.undead.description,/acólito/);assert.match(CASTLE_BUILDERS.corrupted.description,/ent/);
});
