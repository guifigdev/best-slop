import test from 'node:test';
import assert from 'node:assert/strict';
import {SKILLS} from '../shared/catalog.js';
import {RAGNAROK_NATURE_EXPANSION} from '../shared/ragnarok-nature-expansion.js';
import {RAGNAROK_DARK_EXPANSION} from '../shared/ragnarok-dark-expansion.js';
import {RAGNAROK_MVPS} from '../shared/ragnarok-mvp-catalog.js';
const RAGNAROK_EXPANSION=[...RAGNAROK_NATURE_EXPANSION,...RAGNAROK_DARK_EXPANSION,...RAGNAROK_MVPS];
import {RAGNAROK_CENTENNIAL as refs} from '../shared/ragnarok-centennial.js';
import {ragnarokCentennialSpec as spec,RAGNAROK_CENTENNIAL_KINDS as kinds} from '../src/ragnarok-centennial-art.js';

const boxes=m=>[...m.parts,...m.legs.map(p=>[p.x,p.y,p.z,p.w,p.h,p.d,p.color]),...m.wings.flatMap(w=>w.parts.map(p=>[p[0]+w.pivot[0],p[1]+w.pivot[1],p[2]+w.pivot[2],...p.slice(3)]))];
const deepFrozen=v=>{if(v&&typeof v==='object'){assert.ok(Object.isFrozen(v));Object.values(v).forEach(deepFrozen);}};

test('100 additional sprite identities are unique, adapted and compatible with the combat catalog',()=>{
 assert.equal(refs.length,100);assert.equal(kinds.length,100);assert.equal(new Set(kinds).size,100);assert.equal(new Set(refs.map(r=>r.id)).size,100);
 const priorIds=new Set([1005,1051,1175,1016,1788,1833,1831,1002,1242,1014,1020,1010,1033,1001,1095,1127,1040,1041,1179,1776,1778,...RAGNAROK_EXPANSION.map(r=>r.id)]);
 const priorKeys=new Set(RAGNAROK_EXPANSION.map(r=>r.key));
 for(const r of refs){
  assert.ok(!priorIds.has(r.id),'existing sprite reused: '+r.key);assert.ok(!priorKeys.has(r.key));
  assert.ok(Number.isInteger(r.id)&&r.id>=1000);assert.ok(r.sourceName&&r.name&&r.name!==r.sourceName);
  assert.ok(!r.name.includes('?'),'damaged UTF-8: '+r.key);assert.ok(SKILLS[r.skill],r.key+': '+r.skill);
  assert.ok(['swarm','skirmisher','ranged','heavy','caster','flyer'].includes(r.role));assert.ok(r.unlockWave>=2&&r.unlockWave<=40);
  assert.ok(r.biomes.length&&r.biomes.every(b=>['forest','cavern','crypt','frost','forge','void'].includes(b)));
  deepFrozen(r);
 }
});

test('all100 sculptures are finite, deeply immutable, cached and below500 parts including moving appendages',()=>{
 const geometry=new Set();
 for(const key of kinds){
  const m=spec(key),all=boxes(m);assert.equal(m,spec(key));assert.equal(m.key,key);deepFrozen(m);
  assert.ok(all.length>=35&&all.length<=500,key+': '+all.length);assert.ok(m.height>.5&&m.height<4);assert.ok(m.eyeLine>0&&m.eyeLine<=m.height,key);
  assert.ok(Number.isInteger(m.fur));for(const w of m.wings){assert.ok(w.pivot.length===3&&w.pivot.every(Number.isFinite));assert.ok([-1,1].includes(w.side));}
  for(const p of all){assert.equal(p.length,7);assert.ok(p.every(Number.isFinite),key);assert.ok(p.slice(3,6).every(v=>v>0),key);assert.ok(Number.isInteger(p[6])&&p[6]>=0&&p[6]<=0xffffff);}
  // Exclude color: recolors alone cannot count as another sculpture.
  geometry.add(JSON.stringify(all.map(p=>p.slice(0,6).map(v=>Math.round(v*1e6)/1e6))));
 }
 assert.equal(geometry.size,100);for(const bad of ['__proto__','constructor','poring',null,undefined,123])assert.equal(spec(bad),null);
});

test('regional monsters preserve anatomy and recognizable equipment rather than palette-only variants',()=>{
 for(const k of ['solider','permeter','freezer','heater','assaulter'])assert.equal(spec(k).legs.length,4,k);
 for(const k of ['zipperbear','teddybear','anubis','alice','firelock','shinobi'])assert.equal(spec(k).legs.length,2,k);
 assert.equal(spec('argos').legs.length,8);assert.equal(spec('kukre').legs.length,6);
 for(const k of ['isis','medusa','hydra','marina','dragonegg'])assert.equal(spec(k).legs.length,0,k);
 for(const k of ['angeling','deviling','arcangeling','anopheles','bloodybutterfly','gryphon','drainliar','acidus'])assert.equal(spec(k).wings.length,2,k);
 assert.ok(spec('solider').height>spec('heater').height+.3,'soldier carries a tall turret shell');
 assert.ok(spec('freezer').parts.filter(p=>p[1]>1.6).length>=18,'ice turtle has a field of tapered crystals');
 assert.ok(spec('heater').flames.length===2,'fire turtle exposes two native fire anchors');
 assert.ok(spec('mimic').parts.some(p=>p[6]===0xf0d7a8),'mimic teeth remain visible');
 assert.ok(spec('rideword').parts.some(p=>p[6]===0xd9c6aa),'living book has a visible page block');
 assert.ok(spec('firelock').parts.some(p=>p[2]>.4&&p[6]===0x878582),'firelock has a long barrel');
 assert.ok(!spec('dullahan').parts.some(p=>p[6]===0x302836),'Dullahan has no living eyes in its empty neck');
 assert.equal(spec('mineral').motion,'walk');assert.equal(spec('ghostring').motion,'float');
});
